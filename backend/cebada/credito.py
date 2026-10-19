"""Simulación de crédito (manual I5, sección 6, paso 5). Fórmulas idénticas a calcular() del paso 24.

Es una SIMULACIÓN educativa: no es originación, aprobación de crédito ni probabilidad de incumplimiento.
Cambiar precio o costo nunca cambia el rendimiento predicho.
"""
from __future__ import annotations

import numpy as np
import pandas as pd

from . import datos

# Supuestos del paso 24 (se muestran con su fuente leyendo resultados_I4/supuestos_credito.csv)
PRECIO = 7500.0          # MXN/t, acuerdo Grupo Modelo – productores de Hidalgo (La Jornada, 4-may-2025)
COSTO_HA = 20977.0       # MXN/ha, FIRA Agrocostos Cebada TMF Hidalgo PV 2025 (sin renta de la tierra)
PCT_FINANCIADO = 0.90
CREDITO_HA = 18878.0     # MXN/ha (cuota FIRA publicada; 0.90 × 20,977 = 18,879.3: diferencia de redondeo)
INTERESES_HA = 3242.0    # MXN/ha
FACTOR_PAGO = (CREDITO_HA + INTERESES_HA) / CREDITO_HA      # ≈ 1.1717
LIMITES = {"precio": (3000.0, 15000.0), "costo_ha": (10000.0, 40000.0)}   # rangos que acepta la calculadora


def errores_oof() -> pd.DataFrame:
    """Errores fuera de fold de las 138 (y observado − predicción OOF de predicciones.csv), con su municipio."""
    b = datos.base()[["ID_POLIGONO", "Municipio", "y"]]
    p = datos.predicciones()[["ID_POLIGONO", "CONJUNTO", "y_pred"]]
    t = p[p.CONJUNTO == "ENTRENAMIENTO"].merge(b, on="ID_POLIGONO")
    return t.assign(error=t.y - t.y_pred)[["ID_POLIGONO", "Municipio", "error"]]


def errores_para(municipio: str) -> tuple[np.ndarray, str]:
    """Paso 27: Chignahuapan usa sus propios errores (intervalo ampliado, precautorio); el resto, los de las 138."""
    e = errores_oof()
    c = datos.credito()
    if "intervalo" in c and (c[c.Municipio == municipio].intervalo.astype(str).str.startswith("ampliado")).any():
        return e[e.Municipio == municipio].error.values, "ampliado (errores del municipio, paso 27)"
    return e.error.values, "común (errores de las 138, paso 24)"


def calcular(y_pred: float, area_ha: float, errores: np.ndarray, precio: float = PRECIO, costo_ha: float = COSTO_HA) -> dict:
    """Mismo algoritmo que calcular() del paso 24, para una parcela."""
    for nombre, v in (("precio", precio), ("costo_ha", costo_ha)):
        lo, hi = LIMITES[nombre]
        if not lo <= v <= hi:
            raise ValueError(f"{nombre} fuera de rango [{lo:,.0f}, {hi:,.0f}]")
    if not area_ha > 0:
        raise ValueError("área no válida")
    p10, p90 = np.quantile(errores, [0.10, 0.90])
    credito_ha = costo_ha * PCT_FINANCIADO
    rend_pago = credito_ha * FACTOR_PAGO / precio
    lim_inf, lim_sup = max(y_pred + p10, 0.0), y_pred + p90
    ingreso_pes = lim_inf * area_ha * precio
    cuota = credito_ha * area_ha
    sugerido = min(cuota, ingreso_pes / FACTOR_PAGO)
    return {"tipo": "simulacion", "rend_esperado_t_ha": y_pred, "rend_lim_inf_80_t_ha": lim_inf, "rend_lim_sup_80_t_ha": lim_sup,
            "produccion_t": y_pred * area_ha, "ingreso_esperado_mxn": y_pred * area_ha * precio, "ingreso_pesimista_mxn": ingreso_pes,
            "costo_produccion_mxn": costo_ha * area_ha, "credito_cuota_fira_mxn": cuota, "pago_cuota_fira_mxn": cuota * FACTOR_PAGO,
            "credito_sugerido_mxn": sugerido, "pct_de_cuota_fira": sugerido / cuota,
            "cobertura_pesimista": ingreso_pes / (cuota * FACTOR_PAGO),
            "rend_minimo_pago_t_ha": rend_pago, "rend_minimo_costo_total_t_ha": (costo_ha + INTERESES_HA) / precio,
            "prob_ingreso_insuficiente": float(np.mean(y_pred + errores < rend_pago))}


def escenario(id_poligono: str, precio: float = PRECIO, costo_ha: float = COSTO_HA) -> dict:
    v = datos.visor().set_index("ID_POLIGONO").loc[id_poligono]
    if v.CONJUNTO != "PREDICCION":
        raise ValueError("La calculadora es para las 59 parcelas con rendimiento estimado")
    err, tipo = errores_para(v.Municipio)
    r = calcular(float(datos.entrega()[id_poligono]), float(v.area_ha), err, precio, costo_ha)
    r.update({"id": id_poligono, "municipio": v.Municipio, "intervalo": tipo, "precio": precio, "costo_ha": costo_ha})
    return r
