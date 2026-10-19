"""
CEBADA360 · Modelo predictivo de rendimiento de cebada (t/ha) · Integrante 3

Ensamble de tres modelos con el mismo peso (1/3 cada uno; los pesos NO se ajustan con los datos, así no hay fuga):
  1. Ridge con: rendimiento de las 12 parcelas vecinas (ponderado por 1/distancia, sin la propia parcela)
     + lluvia en el crecimiento + amplitud térmica en el crecimiento.
  2. Promedio del municipio (de las parcelas de entrenamiento).
  3. Proceso gaussiano sobre las coordenadas (patrón espacial de la zona).

Uso:
    from modelo_cebada360 import ModeloCebada360, predecir
    m = ModeloCebada360().fit(df_entrenamiento)        # columnas: ID_POLIGONO, x_km, y_km, Municipio, y, VARS_CLIMA
    m.guardar("modelo.joblib")
    y_pred = predecir(df_nuevas, "modelo.joblib")      # mismas columnas menos y
    fac = m.factores(df_nuevas)                         # contribución aditiva de cada factor en t/ha (descomposición contable, no SHAP)
    m = cargar_o_reentrenar("modelo.joblib", df_entrenamiento, df_nuevas, referencia)   # app: robusto a la versión de scikit-learn
"""
import numpy as np
import pandas as pd
from scipy.spatial.distance import cdist
from sklearn.pipeline import make_pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import RidgeCV
from sklearn.gaussian_process import GaussianProcessRegressor
from sklearn.gaussian_process.kernels import RBF, WhiteKernel, ConstantKernel

VARS_CLIMA = ["clim_prec_vegetativa_2025", "clim_amplitud_vegetativa_2025"]
ETIQUETAS = {"vecinas": "Rendimiento de las parcelas vecinas",
             "municipio": "Promedio del municipio",
             "espacial": "Patrón espacial de la zona",
             "clim_prec_vegetativa_2025": "Lluvia en el crecimiento",
             "clim_amplitud_vegetativa_2025": "Amplitud térmica en el crecimiento"}


def idw_vecinas(XY_dest, XY_or, y_or, k=12, excluir=None):
    """Promedio del rendimiento de las k parcelas más cercanas, ponderado por 1/distancia.
    excluir: matriz booleana (dest × origen) de pares que no cuentan (la propia parcela)."""
    D = cdist(XY_dest, XY_or)
    if excluir is not None:
        D = np.where(excluir, np.inf, D)
    k = min(k, XY_or.shape[0] - 1 if excluir is not None else XY_or.shape[0])
    idx = np.argsort(D, 1)[:, :k]
    w = 1 / np.maximum(np.take_along_axis(D, idx, 1), .05)
    return (w * y_or[idx]).sum(1) / w.sum(1)


class ModeloCebada360:
    def __init__(self, k=12, vars_clima=VARS_CLIMA):
        self.k, self.vars_clima = k, list(vars_clima)

    # ------------------------------------------------------------ ajuste
    def fit(self, df):
        df = df.reset_index(drop=True)
        if df.y.isna().any():
            raise ValueError("fit() solo recibe parcelas con rendimiento (entrenamiento).")
        self.ids_ = np.asarray(df.ID_POLIGONO, dtype=str)
        self.XY_ = np.asarray(df[["x_km", "y_km"]], dtype=float)
        self.y_ = np.asarray(df.y, dtype=float)
        self.media_ = float(self.y_.mean())
        vec = self._vecinas(df)
        self.ridge_ = make_pipeline(SimpleImputer(strategy="median"), StandardScaler(), RidgeCV(alphas=np.logspace(-2, 3, 30)))
        self.ridge_.fit(np.c_[vec, np.asarray(df[self.vars_clima], dtype=float)], self.y_)
        self.mun_ = df.groupby("Municipio").y.mean().to_dict()
        kern = ConstantKernel(0.5) * RBF(length_scale=3.0, length_scale_bounds=(0.1, 50)) + WhiteKernel(0.2)
        self.gp_ = GaussianProcessRegressor(kern, normalize_y=True, random_state=0).fit(self.XY_, self.y_)
        return self

    def _vecinas(self, df):
        XY = np.asarray(df[["x_km", "y_km"]], dtype=float)
        mismo = np.asarray(df.ID_POLIGONO, dtype=str)[:, None] == self.ids_[None, :]   # nunca usar su propio rendimiento
        return idw_vecinas(XY, self.XY_, self.y_, self.k, excluir=mismo)

    # ------------------------------------------------------------ predicción
    def componentes(self, df):
        df = df.reset_index(drop=True)
        vec = self._vecinas(df)
        X = np.c_[vec, np.asarray(df[self.vars_clima], dtype=float)]
        return pd.DataFrame({
            "vecinas": vec,
            "ridge": self.ridge_.predict(X),
            "municipio": np.asarray(df.Municipio.map(self.mun_).fillna(self.media_), dtype=float),
            "espacial": self.gp_.predict(np.asarray(df[["x_km", "y_km"]], dtype=float))})

    def predict(self, df):
        c = self.componentes(df)
        return ((c.ridge + c.municipio + c.espacial) / 3).values

    # ------------------------------------------------------------ explicación
    def factores(self, df):
        """Contribución aditiva de cada factor a la predicción, en t/ha, respecto al promedio de entrenamiento.
        Es una descomposición CONTABLE exacta: media + suma de las 5 contribuciones = predicción (salvo redondeo).
          contribución_j (Ridge) = coef_j · (x_j − media_j) / desv_j / 3      (vecinas, lluvia, amplitud)
          contribución municipio = (promedio del municipio − media) / 3
          contribución espacial  = (predicción del GP − media) / 3
        Corrección del 14-oct (auditoría): NO es un valor SHAP exacto. Vecinas, municipio y GP dependen todos de la
        ubicación, así que no son variables independientes; tampoco es un efecto causal. Sirve para explicar en la app
        de dónde sale cada predicción."""
        df = df.reset_index(drop=True)
        c = self.componentes(df)
        imp, esc, rid = self.ridge_.named_steps.values()
        X = imp.transform(np.c_[c.vecinas.values, np.asarray(df[self.vars_clima], dtype=float)])
        z = (X - esc.mean_) / esc.scale_
        contrib_ridge = z * rid.coef_                    # cada columna suma 0 en promedio de entrenamiento
        filas = []
        nombres = ["vecinas"] + self.vars_clima
        for i, pid in enumerate(df.ID_POLIGONO):
            partes = {n: contrib_ridge[i, j] / 3 for j, n in enumerate(nombres)}
            partes["vecinas"] += (rid.intercept_ - self.media_) / 3           # ≈ 0
            partes["municipio"] = (c.municipio[i] - self.media_) / 3
            partes["espacial"] = (c.espacial[i] - self.media_) / 3
            valores = {"vecinas": c.vecinas[i], "municipio": c.municipio[i], "espacial": c.espacial[i],
                       **{v: df.loc[i, v] for v in self.vars_clima}}
            for n, contrib in partes.items():
                filas.append({"ID_POLIGONO": pid, "variable": n, "etiqueta": ETIQUETAS.get(n, n),
                              "valor": round(float(valores[n]), 4), "contribucion": round(float(contrib), 4)})
        return pd.DataFrame(filas)

    # ------------------------------------------------------------ guardar
    def guardar(self, ruta="modelo.joblib"):
        import joblib
        joblib.dump(self, ruta)


def cargar_o_reentrenar(ruta_joblib, df_entrenamiento, df_pred=None, referencia=None, tol=5e-4):
    """Carga modelo.joblib y, si no abre o no funciona con la versión instalada de scikit-learn (se guardó con la de
    VERSIONES.txt / requirements.txt), lo REENTRENA desde cero con las parcelas de entrenamiento: el ajuste es
    determinista y tarda menos de 1 s. Si se pasa `referencia` (Serie ID_POLIGONO -> rendimiento de la entrega) junto con
    df_pred, verifica que las predicciones coincidan a 4 decimales; si no, lanza un error en vez de mostrar algo distinto."""
    import joblib, warnings
    origen = "modelo.joblib"
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            m = joblib.load(ruta_joblib)
            m.predict(df_pred if df_pred is not None else df_entrenamiento.head(3))
    except Exception as e:
        m, origen = ModeloCebada360().fit(df_entrenamiento), f"reentrenado ({type(e).__name__} al abrir modelo.joblib)"
    if referencia is not None and df_pred is not None:
        p = pd.Series(np.round(m.predict(df_pred), 4), index=np.asarray(df_pred.ID_POLIGONO))
        dif = float((p - referencia.reindex(p.index)).abs().max())
        if not dif < tol and origen == "modelo.joblib":          # el joblib abrió pero da otra cosa: reentrenar
            m, origen = ModeloCebada360().fit(df_entrenamiento), "reentrenado (modelo.joblib no reproducía la entrega)"
            p = pd.Series(np.round(m.predict(df_pred), 4), index=np.asarray(df_pred.ID_POLIGONO))
            dif = float((p - referencia.reindex(p.index)).abs().max())
        if not dif < tol:
            raise ValueError(f"Las predicciones no coinciden con la entrega (diferencia máx {dif:.4f} t/ha)")
    m.origen_ = origen
    return m


def predecir(df, ruta="modelo.joblib", df_entrenamiento=None):
    """Predicción en t/ha (4 decimales) para filas con ID_POLIGONO, x_km, y_km, Municipio y las variables de clima.
    Robusta a la versión de scikit-learn (corrección del 14-oct): si modelo.joblib no abre o no funciona con la versión
    instalada y se pasa df_entrenamiento (las 138 con y), reentrena el modelo (determinista, <1 s). Sin df_entrenamiento,
    da un error que explica qué hacer. Para la app se recomienda cargar_o_reentrenar(), que además verifica las 59."""
    import joblib, warnings
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            return np.round(joblib.load(ruta).predict(df), 4)
    except Exception as e:
        if df_entrenamiento is None:
            raise RuntimeError(f"modelo.joblib no se pudo usar con scikit-learn instalado ({type(e).__name__}: {e}). Instala "
                               f"requirements.txt o llama predecir(df, ruta, df_entrenamiento) / cargar_o_reentrenar().") from e
        return np.round(ModeloCebada360().fit(df_entrenamiento).predict(df), 4)
