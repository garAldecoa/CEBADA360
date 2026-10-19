"""Genera los JSON estáticos que lee el frontend a partir de los CSV OFICIALES del notebook.

No calcula cifras nuevas del modelo: solo copia columnas de los archivos oficiales (y suma/promedia para tarjetas
resumen, indicando el archivo de origen). Ejecutar desde backend/:

    python scripts/exportar_datos_frontend.py

Escribe en ../frontend/public/data/ y copia figuras oficiales a ../frontend/public/figs/.
"""
from __future__ import annotations

import json
import math
import re
import shutil
import sys
from pathlib import Path

import pandas as pd

RAIZ_BACK = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(RAIZ_BACK))
from cebada import datos  # noqa: E402
from cebada.ui import etiqueta_nivel  # noqa: E402

DEST = RAIZ_BACK.parent / "frontend" / "public" / "data"
FIGS = RAIZ_BACK.parent / "frontend" / "public" / "figs"


def n(v, d=4):
    if v is None or (isinstance(v, float) and math.isnan(v)) or pd.isna(v):
        return None
    return round(float(v), d)


def _sin_nan(v):
    if isinstance(v, dict):
        return {k: _sin_nan(x) for k, x in v.items()}
    if isinstance(v, list):
        return [_sin_nan(x) for x in v]
    if isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
        return None
    if hasattr(v, "item"):  # escalares de numpy
        return _sin_nan(v.item())
    return v


def escribir(nombre, obj):
    # allow_nan=False: si quedara un NaN, fallar aquí y no en el navegador
    texto = json.dumps(_sin_nan(obj), ensure_ascii=False, separators=(",", ":"), allow_nan=False)
    (DEST / nombre).write_text(texto, encoding="utf-8")
    print("escrito", nombre)


def main():
    assert datos.sha256(datos.ENTREGA) == datos.SHA_REFERENCIA, "La entrega no coincide con la huella oficial"
    v = datos.visor().set_index("ID_POLIGONO")
    det = datos.entrega_detalle().set_index("ID_POLIGONO")
    cre = datos.credito().set_index("ID_POLIGONO")
    entrega = datos.entrega()
    fac = datos.factores()
    flags = ["bq_doble_joroba", "bq_pico_en_borde", "bq_pocas_imagenes", "bq_hueco_largo",
             "bq_lejos_de_entrenamiento", "bq_ciclo_corto", "bq_rend_redondo", "bq_rend_atipico"]

    parcelas = {}
    for pid, r in v.sort_index().iterrows():
        estimada = r.CONJUNTO == "PREDICCION"
        f = fac[fac.ID_POLIGONO == pid]
        p = {
            "conjunto": r.CONJUNTO, "municipio": r.Municipio, "estado": r.Estado, "area_ha": n(r.area_ha, 2),
            "tipo": r.rend_tipo,                       # observado (138) | estimado (59)
            "rendimiento_t_ha": n(entrega[pid]) if estimada else n(r.rend_mostrado),
            "produccion_t": n(r.produccion_t, 3),
            "calidad": r.bq_revisar, "banderas": [b for b in flags if r[b] == 1],
            "dist_media_vecinas_km": n(r.bq_dist_media_vecinas_km, 2),
            "vegetacion": {"pl_ndvi_pico": n(r.pl_ndvi_pico, 3), "pl_evi_pico": n(r.pl_evi_pico, 3),
                           "s2_ndwi_media_veg": n(r.s2_ndwi_media_veg, 3), "cal_pl_n_obs": n(r.cal_pl_n_obs, 0),
                           "cal_pl_nub_media": n(r.cal_pl_nub_media, 2), "cal_pl_hueco_max_dias": n(r.cal_pl_hueco_max_dias, 0)},
            "factores": {"prediccion_modelo_final": n(f.prediccion_modelo_final.iloc[0]),
                         "tipo_explicacion": f.tipo_explicacion.iloc[0],
                         "items": [{"variable": x.variable, "etiqueta": x.etiqueta, "valor": n(x.valor),
                                    "contribucion": n(x.contribucion)} for x in f.itertuples()]},
        }
        if not estimada:
            p["y_pred_fuera_de_fold"] = n(r.y_pred)
        else:
            d, c = det.loc[pid], cre.loc[pid]
            p.update({
                "y_lo80": n(d.y_lo80), "y_hi80": n(d.y_hi80), "y_lo90": n(d.y_lo90), "y_hi90": n(d.y_hi90),
                "intervalo_credito": {"lo": n(r.lo), "hi": n(r.hi), "ancho": n(r.ancho, 2), "tipo": r.intervalo},
                "detalle": {"rend_vecinas_k12": n(d.rend_vecinas_k12), "rend_medio_municipio": n(d.rend_medio_municipio),
                            "comp_ridge": n(d.comp_ridge), "comp_municipio": n(d.comp_municipio),
                            "comp_espacial": n(d.comp_espacial), "sd_bootstrap": n(d.sd_bootstrap),
                            "dist_media_vecinas_km": n(d.dist_media_vecinas_km, 3),
                            "n_entrenamiento_municipio": int(d.n_entrenamiento_municipio), "nota": d.nota},
                "credito": {"ingreso_esperado": n(c.ingreso_esperado, 0), "credito_sugerido": n(c.credito_sugerido, 0),
                            "credito_cuota_fira": n(c.credito_cuota_fira, 0), "pct_de_cuota_fira": n(c.pct_de_cuota_fira, 3),
                            "prob_ingreso_insuficiente": n(c.prob_ingreso_insuficiente, 3),
                            "nivel": etiqueta_nivel(c.nivel_riesgo, c.motivo), "motivo": c.motivo},
                "alerta_dano_satelital": r.alerta_dano_satelital,
            })
        parcelas[pid] = p

    e = entrega
    sel = datos.metricas().query("familia == 'seleccionado'").iloc[0]
    est = v[v.CONJUNTO == "PREDICCION"]
    niveles = {}
    for pid in est.index:
        niv = parcelas[pid]["credito"]["nivel"]
        niveles[niv] = niveles.get(niv, 0) + 1
    # Importancia global = contribución media absoluta (misma lectura que figs/importancia_factores.png)
    imp = (fac.assign(a=fac.contribucion.abs()).groupby(["variable", "etiqueta"]).a.mean()
           .sort_values(ascending=False).reset_index())
    escribir("predicciones_cebada360.json", {
        "metadata": {
            "modelo": "ENSAMBLE CEBADA360 v1 · Ridge + promedio municipal + GP-RBF · pesos 1/3",
            "formula": "ŷ = (Ridge + promedio municipal + proceso gaussiano espacial) / 3",
            "sha256_entrega": datos.SHA_REFERENCIA,
            "media_entrenamiento": n(datos.base().y.mean()),
            "metricas": {"rmse": n(sel.RMSE), "rmse_sd": n(sel.RMSE_sd), "mae": n(sel.MAE), "r2": n(sel.R2)},
            "nota_metricas": "Validación cruzada 10×5 estratificada por municipio sobre las 138 parcelas con "
                             "rendimiento. No es el error de las 59.",
            "conteos": {"total": len(v), "observadas": int((v.CONJUNTO == "ENTRENAMIENTO").sum()), "estimadas": len(est)},
            "estimadas": {"media": n(e.mean()), "min": n(e.min()), "max": n(e.max()),
                          "produccion_total_t": n(est.produccion_t.sum(), 1),
                          "credito_sugerido_total": n(cre.loc[est.index, "credito_sugerido"].sum(), 0),
                          "niveles_credito": niveles},
            "importancia_global": [{"variable": r.variable, "etiqueta": r.etiqueta, "media_abs_t_ha": n(r.a)}
                                   for r in imp.itertuples()],
            "fuentes": ["resultados_I3/ENTREGA/predicciones_59_entrega.csv", "resultados_I3/ENTREGA/predicciones_59_detalle.csv",
                        "resultados_app/datos_visor.csv", "resultados_I3/factores.csv",
                        "resultados_I4/credito_por_parcela_intervalo_municipio.csv", "resultados_I3/metricas_modelos.csv"],
        },
        "parcelas": parcelas,
    })

    # Validación (gráfica real vs predicho, repetición 0) + tablas del modelo
    b = datos.base().set_index("ID_POLIGONO")
    pr = datos.predicciones()
    pr = pr[pr.CONJUNTO == "ENTRENAMIENTO"]
    # Métricas de los 138 puntos de la gráfica (repetición 0). Son distintas de las oficiales (10 repeticiones).
    import numpy as np
    y_obs = b.loc[pr.ID_POLIGONO, "y"].to_numpy(float)
    err = y_obs - pr.y_pred.to_numpy(float)
    rep0 = {"rmse": n(np.sqrt(np.mean(err ** 2))), "mae": n(np.mean(np.abs(err))),
            "r2": n(1 - np.sum(err ** 2) / np.sum((y_obs - y_obs.mean()) ** 2)), "n": int(len(err)),
            "sesgo": n(np.mean(err))}
    # Calificación esperada en las 59 (paso 19), leída del resumen oficial de la entrega
    txt = (datos.R3 / "ENTREGA" / "resumen_prediccion_final.txt").read_text(encoding="utf-8")
    m_rmse = re.search(r"RMSE ([\d.]+) – ([\d.]+) – ([\d.]+)", txt)
    m_mae = re.search(r"MAE ([\d.]+) – ([\d.]+) – ([\d.]+)", txt)
    m_r2 = re.search(r"R² ([\d.]+) – ([\d.]+) – ([\d.]+)", txt)
    m_cal = re.search(r"y = (-?[\d.]+) \+ ([\d.]+)·ŷ \(IC 95 % pendiente \[([\d.]+), ([\d.]+)\]\); sesgo (-?[\d.]+)", txt)
    assert m_rmse and m_mae and m_r2 and m_cal, "No se pudo leer resumen_prediccion_final.txt"
    trio = lambda m: {"p5": float(m.group(1)), "mediana": float(m.group(2)), "p95": float(m.group(3))}
    escribir("metodologia_validacion.json", {
        "metricas": {"rmse": n(sel.RMSE), "mae": n(sel.MAE), "r2": n(sel.R2), "rmse_sd": n(sel.RMSE_sd),
                     "n_errores": 1380, "esquema": "5 folds × 10 repeticiones, estratificada por municipio"},
        "metricas_grafica": rep0,
        "esperado_59": {"rmse": trio(m_rmse), "mae": trio(m_mae), "r2": trio(m_r2)},
        "calibracion": {"intercepto": float(m_cal.group(1)), "pendiente": float(m_cal.group(2)),
                        "ic95": [float(m_cal.group(3)), float(m_cal.group(4))], "sesgo": float(m_cal.group(5))},
        "puntos": [{"id": r.ID_POLIGONO, "real": n(b.loc[r.ID_POLIGONO, "y"], 2), "predicho": n(r.y_pred)} for r in pr.itertuples()],
        "modelos": [{k: (n(x) if isinstance(x, float) else x) for k, x in r.items()} for r in datos.metricas().to_dict("records")],
        "preguntas_guia": {
            "indices": pd.read_csv(datos.R3 / "preguntas_guia_1_indices.csv").head(5).to_dict("records"),
            "clima": pd.read_csv(datos.R3 / "preguntas_guia_2_clima.csv").head(5).to_dict("records"),
            "combinaciones": pd.read_csv(datos.R3 / "preguntas_guia_3_combinaciones.csv").to_dict("records"),
        },
        "validacion_espacial": pd.read_csv(datos.R3 / "validacion_espacial.csv").to_dict("records"),
        "nota": "Puntos: predicciones fuera de fold de la repetición 0 (resultados_I3/predicciones.csv); con ese archivo el "
                "RMSE da 0.503. Las métricas oficiales usan las 10 repeticiones (1,380 errores).",
    })
    escribir("supuestos_credito.json", {"supuestos": datos.supuestos_credito().to_dict("records"),
                                        "fuente": "resultados_I4/supuestos_credito.csv"})

    # El JSON provisional ya no se usa
    viejo = DEST / "predicciones_provisionales.json"
    if viejo.exists():
        viejo.unlink()
        print("eliminado predicciones_provisionales.json (modelo provisional k=12)")

    FIGS.mkdir(parents=True, exist_ok=True)
    for origen, destino in [(datos.R3 / "figs" / "importancia_factores.png", "importancia_factores.png"),
                            (datos.R3 / "figs" / "comparacion_modelos.png", "comparacion_modelos.png"),
                            (datos.R3 / "figs" / "preguntas_guia.png", "preguntas_guia.png"),
                            (datos.R4 / "credito_y_riesgo.png", "credito_y_riesgo.png")]:
        shutil.copyfile(origen, FIGS / destino)
    # Todas las figuras oficiales para la página «Resultados» (misma ruta relativa que en el paquete)
    ev = FIGS / "evidencia"
    if ev.exists():
        shutil.rmtree(ev)
    total = 0
    for carpeta in [datos.RAIZ / "figs", datos.R3 / "figs", datos.R4, datos.APP / "capturas"]:
        for png in sorted(carpeta.rglob("*.png")):
            rel = png.relative_to(datos.RAIZ)
            (ev / rel).parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(png, ev / rel)
            total += 1
    print(f"figuras copiadas a public/figs/ ({total} en evidencia/)")


if __name__ == "__main__":
    main()
