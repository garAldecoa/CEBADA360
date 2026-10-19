"""Lectura y validación de los resultados oficiales del notebook (manual I5, sección 6, paso 3).

Este módulo solo LEE y VALIDA: nunca calcula cifras nuevas del modelo.
Los archivos de datos/ son una copia sin modificar del paquete de resultados oficial.
"""
from __future__ import annotations

import hashlib
from functools import lru_cache
from pathlib import Path

import pandas as pd

RAIZ = Path(__file__).resolve().parents[1] / "datos"
OUT, R3, R4, APP = RAIZ / "outputs", RAIZ / "resultados_I3", RAIZ / "resultados_I4", RAIZ / "resultados_app"
ENTREGA = R3 / "ENTREGA" / "predicciones_59_entrega.csv"
SHA_REFERENCIA = "21955b71fdb306a17d793aafee8eac6f223e7485287001f7d68fe48be303243c"


def _csv(ruta: Path) -> pd.DataFrame:
    # utf-8-sig: algunos CSV del Integrante 4 traen BOM
    return pd.read_csv(ruta, encoding="utf-8-sig")


@lru_cache(maxsize=None)
def base() -> pd.DataFrame:
    b = _csv(OUT / "base_maestra_v3.csv").merge(
        _csv(OUT / "coordenadas_parcelas.csv")[["ID_POLIGONO", "x_km", "y_km", "lon", "lat"]], on="ID_POLIGONO")
    assert b.loc[b.CONJUNTO == "PREDICCION", "y"].isna().all(), "Fuga: hay rendimiento en PREDICCION"
    return b


@lru_cache(maxsize=None)
def entrega() -> pd.Series:
    return _csv(ENTREGA).set_index("ID_POLIGONO").rendimiento_t_ha


@lru_cache(maxsize=None)
def entrega_detalle() -> pd.DataFrame:
    return _csv(R3 / "ENTREGA" / "predicciones_59_detalle.csv")


@lru_cache(maxsize=None)
def predicciones() -> pd.DataFrame:
    return _csv(R3 / "predicciones.csv")


@lru_cache(maxsize=None)
def factores() -> pd.DataFrame:
    return _csv(R3 / "factores.csv")


@lru_cache(maxsize=None)
def metricas() -> pd.DataFrame:
    return _csv(R3 / "metricas_modelos.csv")


@lru_cache(maxsize=None)
def visor() -> pd.DataFrame:
    return _csv(APP / "datos_visor.csv")


@lru_cache(maxsize=None)
def credito() -> pd.DataFrame:
    """Crédito por parcela con el intervalo por municipio (paso 27)."""
    return _csv(R4 / "credito_por_parcela_intervalo_municipio.csv")


@lru_cache(maxsize=None)
def supuestos_credito() -> pd.DataFrame:
    return _csv(R4 / "supuestos_credito.csv")


def sha256(ruta: Path) -> str:
    return hashlib.sha256(ruta.read_bytes()).hexdigest()


def integridad() -> list[dict]:
    """Controles en vivo para la página de Transparencia. Cada uno: nombre, ok (bool), detalle."""
    controles = []

    def control(nombre, ok, detalle=""):
        controles.append({"control": nombre, "ok": bool(ok), "detalle": str(detalle)})

    b = base()
    huella = sha256(ENTREGA)
    control("SHA-256 de la entrega = referencia", huella == SHA_REFERENCIA, huella)
    control("197 parcelas con ID únicos", len(b) == 197 and b.ID_POLIGONO.is_unique, f"{len(b)} filas")
    n = b.CONJUNTO.value_counts().to_dict()
    control("138 de entrenamiento y 59 de predicción", n.get("ENTRENAMIENTO") == 138 and n.get("PREDICCION") == 59, n)
    control("Sin rendimiento en las 59 de predicción (sin fuga)", b.loc[b.CONJUNTO == "PREDICCION", "y"].isna().all())
    ids = set(b.ID_POLIGONO)
    control("Mismos 197 ID en base, predicciones, visor y crédito",
            ids == set(predicciones().ID_POLIGONO) == set(visor().ID_POLIGONO) == set(credito().ID_POLIGONO))
    e = entrega()
    control("Entrega = las 59 de PREDICCION", set(e.index) == set(b.loc[b.CONJUNTO == "PREDICCION", "ID_POLIGONO"]),
            f"{len(e)} filas")
    sel = metricas().query("familia == 'seleccionado'").iloc[0]
    control("Métricas oficiales 0.4940 / 0.3381 / 0.6607",
            (round(sel.RMSE, 4), round(sel.MAE, 4), round(sel.R2, 4)) == (0.494, 0.3381, 0.6607),
            f"RMSE {sel.RMSE:.4f} · MAE {sel.MAE:.4f} · R² {sel.R2:.4f}")
    f = factores()
    f59 = f[f.ID_POLIGONO.isin(e.index)].groupby("ID_POLIGONO").prediccion_modelo_final.first()
    control("factores.csv: modelo final = entrega en las 59", (f59 - e.reindex(f59.index)).abs().max() < 5e-4,
            f"diferencia máx {(f59 - e.reindex(f59.index)).abs().max():.4f}")
    return controles
