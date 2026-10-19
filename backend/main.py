"""CEBADA360 · API (manual I5, sección 18 · Plan B).

FastAPI que importa cebada/modelo.py y cebada/credito.py tal cual (no reescribe fórmulas) y que el frontend en
React solo consume. Ejecutar:  uvicorn main:app --reload --port 8000   (desde la carpeta backend/)
"""
from __future__ import annotations

import math
import os
import re
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from cebada import credito, datos, modelo
from cebada.ui import etiqueta_nivel

app = FastAPI(
    title="CEBADA360 API",
    description="Backend del sistema de predicción de rendimiento de cebada · modelo congelado del notebook",
    version="1.0.0",
)

ORIGENES = [o.strip() for o in os.getenv(
    "CEBADA360_CORS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173"
).split(",") if o.strip()]
app.add_middleware(CORSMiddleware, allow_origins=ORIGENES, allow_credentials=False,
                   allow_methods=["GET", "POST"], allow_headers=["*"])

NOTA_METRICAS = ("Validación cruzada 10×5 estratificada por municipio sobre las 138 parcelas con rendimiento. "
                 "No es el error de las 59.")
PATRON_ID = re.compile(r"AGC_\d{3}")


# ------------------------------------------------------------------ utilidades
def limpio(v: Any) -> Any:
    """Convierte tipos de numpy/pandas a JSON (NaN → None)."""
    if isinstance(v, dict):
        return {k: limpio(x) for k, x in v.items()}
    if isinstance(v, (list, tuple)):
        return [limpio(x) for x in v]
    if isinstance(v, (np.integer,)):
        return int(v)
    if isinstance(v, (np.floating, float)):
        f = float(v)
        return None if math.isnan(f) or math.isinf(f) else f
    if isinstance(v, np.bool_):
        return bool(v)
    if v is pd.NA or v is pd.NaT:
        return None
    return v


def normalizar_id(id_parcela: str) -> str:
    pid = id_parcela.strip().upper()
    if not PATRON_ID.fullmatch(pid):
        raise HTTPException(status_code=400, detail="ID inválido. Usa el formato AGC_042.")
    if pid not in set(datos.base().ID_POLIGONO):
        raise HTTPException(status_code=404, detail=f"No se encontró la parcela {pid}")
    return pid


@app.on_event("startup")
def precargar() -> None:
    # Carga el modelo una vez al arrancar (y verifica las 59 contra la entrega).
    modelo.modelo()


# ------------------------------------------------------------------ estado y metadatos
@app.get("/api")
def inicio():
    return {"aplicacion": "CEBADA360", "estado": "activo", "documentacion": "/docs"}


@app.get("/api/health")
def salud():
    e = modelo.estado()
    return {"status": "ok", "servicio": "CEBADA360 API", "modelo_cargado": True, **e}


@app.get("/api/modelo/estado")
def estado_modelo():
    e = modelo.estado()
    return {"disponible": True, "mensaje": f"Modelo cargado · origen: {e['origen']}", **e,
            "archivos": ["resultados_I3/modelo.joblib", "resultados_I3/modelo_cebada360.py"]}


@app.get("/api/metadata")
def metadata():
    m = datos.metricas()
    sel = m[m.familia == "seleccionado"].iloc[0]
    e = datos.entrega()
    b = datos.base()
    return limpio({
        "metricas": {"rmse": round(sel.RMSE, 4), "rmse_sd": round(sel.RMSE_sd, 4), "mae": round(sel.MAE, 4),
                     "r2": round(sel.R2, 4), "modelo": sel.modelo, "esquema": NOTA_METRICAS,
                     "fuente": "resultados_I3/metricas_modelos.csv"},
        "modelos": m.to_dict(orient="records"),
        "conteos": {"total": len(b), **b.CONJUNTO.value_counts().to_dict()},
        "entrega": {"archivo": "predicciones_59_entrega.csv", "sha256": datos.sha256(datos.ENTREGA),
                    "sha256_referencia": datos.SHA_REFERENCIA, "media": round(float(e.mean()), 4),
                    "min": round(float(e.min()), 4), "max": round(float(e.max()), 4)},
        "version_modelo": modelo.VERSION_MODELO,
        "advertencias": [NOTA_METRICAS,
                         "Descomposición aditiva del ensamble: no es SHAP ni efecto causal.",
                         "Intervalos empíricos de referencia (nominal 80 %), sin garantía de cobertura.",
                         "El crédito es una simulación educativa; no es probabilidad de incumplimiento."],
    })


@app.get("/api/transparencia")
def transparencia():
    controles = datos.integridad()
    controles.append({"control": "El modelo reproduce las 59 de la entrega", "ok": True,
                      "detalle": f"origen: {modelo.modelo().origen_} (verificado al cargar con cargar_o_reentrenar)"})
    return {"controles": controles, "todos_ok": all(c["ok"] for c in controles), "modelo": modelo.estado(),
            "verificacion_notebook": (datos.R3 / "VERIFICACION_FINAL.txt").read_text(encoding="utf-8"),
            "versiones": (datos.R3 / "VERSIONES.txt").read_text(encoding="utf-8")}


@app.get("/api/entrega/csv")
def descargar_entrega():
    return FileResponse(datos.ENTREGA, media_type="text/csv", filename="predicciones_59_entrega.csv")


# ------------------------------------------------------------------ parcelas
@app.get("/api/parcelas")
def listar_parcelas(municipio: str | None = None, conjunto: str | None = None):
    v = datos.visor()
    if municipio:
        v = v[v.Municipio == municipio]
    if conjunto:
        v = v[v.CONJUNTO == conjunto.upper()]
    filas = [{"id": r.ID_POLIGONO, "estado": r.Estado, "municipio": r.Municipio, "area_ha": r.area_ha,
              "conjunto": r.CONJUNTO, "rendimiento_t_ha": r.rend_mostrado, "tipo": r.rend_tipo}
             for r in v.sort_values("ID_POLIGONO").itertuples()]
    return limpio({"total": len(filas), "parcelas": filas})


BANDERAS = ["bq_doble_joroba", "bq_pico_en_borde", "bq_pocas_imagenes", "bq_hueco_largo",
            "bq_lejos_de_entrenamiento", "bq_ciclo_corto", "bq_rend_redondo", "bq_rend_atipico"]


@app.get("/api/parcelas/{id_parcela}")
def consultar_parcela(id_parcela: str):
    pid = normalizar_id(id_parcela)
    v = datos.visor().set_index("ID_POLIGONO").loc[pid]
    estimada = v.CONJUNTO == "PREDICCION"
    ficha: dict[str, Any] = {
        "id": pid, "estado": v.Estado, "municipio": v.Municipio, "area_ha": v.area_ha, "conjunto": v.CONJUNTO,
        "rendimiento": {"valor_t_ha": v.rend_mostrado, "tipo": v.rend_tipo, "produccion_t": v.produccion_t},
        "calidad": {"revisar": v.bq_revisar, "total": v.bq_total, "dist_media_vecinas_km": v.bq_dist_media_vecinas_km,
                    "banderas": {b: int(v[b]) for b in BANDERAS if not pd.isna(v[b])}},
        "vegetacion": {"pl_ndvi_pico": v.pl_ndvi_pico, "pl_evi_pico": v.pl_evi_pico,
                       "s2_ndwi_media_veg": v.s2_ndwi_media_veg, "cal_pl_n_obs": v.cal_pl_n_obs,
                       "cal_pl_nub_media": v.cal_pl_nub_media, "cal_pl_hueco_max_dias": v.cal_pl_hueco_max_dias,
                       "alerta_dano_satelital": v.alerta_dano_satelital},
    }
    if not estimada:
        ficha["validacion"] = {"y_pred_fuera_de_fold": v.y_pred,
                               "nota": "Parcela con rendimiento observado: no se predice. Su predicción fuera de fold "
                                       "sirve solo para medir el error del modelo."}
    else:
        d = datos.entrega_detalle().set_index("ID_POLIGONO").loc[pid]
        c = datos.credito().set_index("ID_POLIGONO").loc[pid]
        ficha["prediccion"] = {
            "rendimiento_t_ha": float(datos.entrega()[pid]),
            "intervalo_modelo_80": {"inferior": d.y_lo80, "superior": d.y_hi80,
                                    "tipo": "Intervalo empírico de referencia (nominal 80 %) · paso E · simétrico"},
            "intervalo_modelo_90": {"inferior": d.y_lo90, "superior": d.y_hi90},
            "intervalo_credito_80": {"inferior": v.lo, "superior": v.hi, "tipo": v.intervalo},
            "detalle": {"rend_vecinas_k12": d.rend_vecinas_k12, "rend_medio_municipio": d.rend_medio_municipio,
                        "comp_ridge": d.comp_ridge, "comp_municipio": d.comp_municipio, "comp_espacial": d.comp_espacial,
                        "sd_bootstrap": d.sd_bootstrap, "dist_media_vecinas_km": d.dist_media_vecinas_km,
                        "n_entrenamiento_municipio": d.n_entrenamiento_municipio, "nota": d.nota},
            "fuente": "resultados_I3/ENTREGA/predicciones_59_detalle.csv",
        }
        ficha["credito"] = {
            "tipo": "simulacion", "ingreso_esperado": c.ingreso_esperado, "credito_sugerido": c.credito_sugerido,
            "credito_cuota_fira": c.credito_cuota_fira, "pct_de_cuota_fira": c.pct_de_cuota_fira,
            "prob_ingreso_insuficiente": c.prob_ingreso_insuficiente,
            "nivel": etiqueta_nivel(c.nivel_riesgo, c.motivo), "motivo": c.motivo, "intervalo": c.intervalo,
            "fuente": "resultados_I4/credito_por_parcela_intervalo_municipio.csv",
        }
    return limpio(ficha)


@app.get("/api/parcelas/{id_parcela}/factores")
def factores(id_parcela: str):
    pid = normalizar_id(id_parcela)
    f = modelo.factores_parcela(pid)
    return limpio({
        "id": pid, "media_entrenamiento": round(float(modelo.modelo().media_), 4),
        "prediccion_modelo_final": float(f.prediccion_modelo_final.iloc[0]),
        "tipo_explicacion": f.tipo_explicacion.iloc[0],
        "factores": f[["variable", "etiqueta", "valor", "contribucion"]].to_dict(orient="records"),
        "titulo": "Descomposición aditiva (no SHAP, no causal)", "fuente": "resultados_I3/factores.csv",
    })


# ------------------------------------------------------------------ ejecutar el modelo
class SolicitudPrediccion(BaseModel):
    id_poligono: str


@app.post("/api/predict-existing")
def predecir_existente(s: SolicitudPrediccion):
    pid = normalizar_id(s.id_poligono)
    try:
        return limpio(modelo.predecir_existente(pid))
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e)) from e


# ------------------------------------------------------------------ crédito
class SolicitudCredito(BaseModel):
    id: str
    precio: float = Field(default=credito.PRECIO)
    costo_ha: float = Field(default=credito.COSTO_HA)


@app.post("/api/credito/scenario")
def escenario_credito(s: SolicitudCredito):
    pid = normalizar_id(s.id)
    try:
        return limpio(credito.escenario(pid, s.precio, s.costo_ha))
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e)) from e


@app.get("/api/credito/supuestos")
def supuestos():
    return limpio({"supuestos": datos.supuestos_credito().to_dict(orient="records"),
                   "limites": credito.LIMITES, "base": {"precio": credito.PRECIO, "costo_ha": credito.COSTO_HA},
                   "fuente": "resultados_I4/supuestos_credito.csv"})


# ------------------------------------------------------------------ página web compilada (un solo puerto)
# Si existe frontend/dist (npm run build con VITE_API_URL vacío), la API también sirve la página.
# Así corre en Google Colab o en un solo servidor sin Node. Va al final para no tapar las rutas /api.
DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if (DIST / "index.html").is_file():
    app.mount("/", StaticFiles(directory=DIST, html=True), name="web")
