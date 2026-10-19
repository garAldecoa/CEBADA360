"""Ejecución del modelo congelado (manual I5, sección 6, paso 4).

No reescribe la fórmula: importa datos/resultados_I3/modelo_cebada360.py (exportado por el paso E del notebook)
y usa cargar_o_reentrenar(), que abre modelo.joblib o, si no abre con la versión de scikit-learn instalada,
reentrena con las 138 (determinista) y verifica las 59 contra la entrega antes de devolver nada.
"""
from __future__ import annotations

import sys
import time
from functools import lru_cache

import numpy as np
import pandas as pd

from . import datos

if str(datos.R3) not in sys.path:
    sys.path.insert(0, str(datos.R3))
import modelo_cebada360 as mc  # noqa: E402  (módulo exportado por el paso E del notebook)

VERSION_MODELO = "ENSAMBLE CEBADA360 v1 · Ridge + promedio municipal + GP-RBF · pesos 1/3"


@lru_cache(maxsize=1)
def modelo():
    """Se carga UNA sola vez por proceso (caché)."""
    b = datos.base()
    tr = b[b.CONJUNTO == "ENTRENAMIENTO"].reset_index(drop=True)
    pr = b[b.CONJUNTO == "PREDICCION"].reset_index(drop=True)
    t0 = time.perf_counter()
    m = mc.cargar_o_reentrenar(datos.R3 / "modelo.joblib", tr, pr, datos.entrega())
    m.segundos_carga_ = time.perf_counter() - t0
    return m


def predecir_existente(id_poligono: str) -> dict:
    """Ejecuta el predictor Python sobre una parcela de PREDICCION y devuelve la predicción, sus 3 componentes y el
    control contra la entrega oficial. Solo para parcelas del reto (con todas sus variables y su contexto espacial)."""
    b = datos.base()
    fila = b[b.ID_POLIGONO == id_poligono]
    if fila.empty:
        raise KeyError(f"{id_poligono} no existe")
    if fila.CONJUNTO.iloc[0] != "PREDICCION":
        raise ValueError(f"{id_poligono} es de ENTRENAMIENTO: su rendimiento es observado, no se predice")
    m = modelo()
    t0 = time.perf_counter()
    c = m.componentes(fila).iloc[0]
    y = float(np.round((c.ridge + c.municipio + c.espacial) / 3, 4))
    oficial = float(datos.entrega()[id_poligono])
    return {"id": id_poligono, "y_pred": y, "comp_ridge": float(c.ridge), "comp_municipio": float(c.municipio),
            "comp_espacial": float(c.espacial), "rend_vecinas_k12": float(c.vecinas), "oficial": oficial,
            "coincide": abs(y - oficial) < 1e-4, "ms_inferencia": round(1000 * (time.perf_counter() - t0), 1),
            "origen_modelo": m.origen_, "version": VERSION_MODELO}


def factores_parcela(id_poligono: str) -> pd.DataFrame:
    """Descomposición aditiva contable del modelo final (NO SHAP, NO causal)."""
    f = datos.factores()
    return f[f.ID_POLIGONO == id_poligono].reset_index(drop=True)


def estado() -> dict:
    import platform

    import sklearn

    m = modelo()
    return {"cargado": True, "origen": m.origen_, "segundos_carga": round(m.segundos_carga_, 3),
            "version": VERSION_MODELO, "python": platform.python_version(), "scikit_learn": sklearn.__version__,
            "media_entrenamiento": round(float(m.media_), 4)}
