"""Pruebas automáticas (manual I5, sección 6, paso 6). Si alguna falla, no se publica.
Ejecutar desde backend/:  python -m pytest -q
"""
import json
import sys
from pathlib import Path

import numpy as np
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from fastapi.testclient import TestClient  # noqa: E402

from cebada import credito, datos, modelo  # noqa: E402
from cebada.ui import etiqueta_nivel  # noqa: E402
import main  # noqa: E402

FRONT_DATA = Path(__file__).resolve().parents[2] / "frontend" / "public" / "data"


# ----------------------------------------------------------------- integridad
def test_integridad():
    b = datos.base()
    assert len(b) == 197 and b.ID_POLIGONO.is_unique
    assert b.CONJUNTO.value_counts().to_dict() == {"ENTRENAMIENTO": 138, "PREDICCION": 59}
    assert b.loc[b.CONJUNTO == "PREDICCION", "y"].isna().all()
    assert set(b.ID_POLIGONO) == set(datos.predicciones().ID_POLIGONO) == set(datos.visor().ID_POLIGONO)
    assert datos.sha256(datos.ENTREGA) == datos.SHA_REFERENCIA
    sel = datos.metricas().query("familia == 'seleccionado'").iloc[0]
    assert (round(sel.RMSE, 4), round(sel.MAE, 4), round(sel.R2, 4)) == (0.494, 0.3381, 0.6607)
    assert all(c["ok"] for c in datos.integridad())


def test_geojson_del_frontend_tiene_los_mismos_197():
    g = json.loads((FRONT_DATA / "parcelas_agrocebada.geojson").read_text(encoding="utf-8-sig"))
    ids = {f["properties"]["ID_POLIGON"] for f in g["features"]}
    assert ids == set(datos.base().ID_POLIGONO)


# ----------------------------------------------------------------- modelo
def test_las_59_se_reproducen_con_el_predictor_python():
    e = datos.entrega()
    for pid, oficial in e.items():
        r = modelo.predecir_existente(pid)
        assert abs(r["y_pred"] - oficial) < 1e-4, pid
        assert abs((r["comp_ridge"] + r["comp_municipio"] + r["comp_espacial"]) / 3 - oficial) < 1e-4
        assert r["coincide"]


def test_no_predice_entrenamiento():
    with pytest.raises(ValueError):
        modelo.predecir_existente("AGC_001")


def test_factores_suman_la_entrega():
    e = datos.entrega()
    f = datos.factores()
    f59 = f[f.ID_POLIGONO.isin(e.index)]
    pred = f59.groupby("ID_POLIGONO").prediccion_modelo_final.first()
    assert (pred - e.reindex(pred.index)).abs().max() < 5e-4
    suma = f59.groupby("ID_POLIGONO").contribucion.sum() + modelo.modelo().media_
    assert (suma - pred).abs().max() < 2e-3


# ----------------------------------------------------------------- crédito
def test_credito_igual_al_notebook():
    c = datos.credito().set_index("ID_POLIGONO")
    for pid in datos.entrega().index:
        r = credito.escenario(pid)
        assert abs(r["credito_sugerido_mxn"] - c.loc[pid, "credito_sugerido"]) < 1.0, pid
        assert abs(r["prob_ingreso_insuficiente"] - c.loc[pid, "prob_ingreso_insuficiente"]) < 1e-3, pid
        assert abs(r["rend_lim_inf_80_t_ha"] - c.loc[pid, "rend_lim_inf_80"]) < 1e-3, pid


def test_agc003_base():
    r = credito.escenario("AGC_003")
    assert round(r["credito_sugerido_mxn"]) == 316382 and round(r["prob_ingreso_insuficiente"], 2) == 0.21


def test_precio_no_cambia_rendimiento():
    a, b = credito.escenario("AGC_003", precio=6000), credito.escenario("AGC_003", precio=9000)
    assert a["rend_esperado_t_ha"] == b["rend_esperado_t_ha"]
    assert a["prob_ingreso_insuficiente"] >= b["prob_ingreso_insuficiente"]


def test_rangos_y_umbral():
    with pytest.raises(ValueError):
        credito.escenario("AGC_003", precio=100)
    r = credito.escenario("AGC_003")
    assert round(r["rend_minimo_pago_t_ha"], 2) == 2.95 and round(r["rend_minimo_costo_total_t_ha"], 2) == 3.23
    with pytest.raises(ValueError):
        credito.escenario("AGC_001")


def test_etiqueta_nivel_v26():
    c = datos.credito().set_index("ID_POLIGONO")
    assert etiqueta_nivel(c.loc["AGC_065", "nivel_riesgo"], c.loc["AGC_065", "motivo"]) == "revisar dato antes de decidir"
    # Entre las 59 (las únicas que muestran crédito) solo cambia AGC_065
    otras = c[c.CONJUNTO == "PREDICCION"].drop(index="AGC_065")
    cambiadas = [p for p, r in otras.iterrows() if etiqueta_nivel(r.nivel_riesgo, r.motivo) != r.nivel_riesgo]
    assert cambiadas == []


# ----------------------------------------------------------------- API
@pytest.fixture(scope="module")
def cliente():
    with TestClient(main.app) as c:
        yield c


def test_api_salud_y_metadata(cliente):
    assert cliente.get("/api/health").json()["modelo_cargado"] is True
    m = cliente.get("/api/metadata").json()
    assert m["metricas"]["rmse"] == 0.494 and m["entrega"]["sha256"] == datos.SHA_REFERENCIA


def test_api_ejecutar_modelo(cliente):
    r = cliente.post("/api/predict-existing", json={"id_poligono": "agc_120"}).json()
    assert r["y_pred"] == 2.8297 and r["coincide"] is True
    assert cliente.post("/api/predict-existing", json={"id_poligono": "AGC_001"}).status_code == 422
    assert cliente.post("/api/predict-existing", json={"id_poligono": "AGC_999"}).status_code == 404
    assert cliente.post("/api/predict-existing", json={"id_poligono": "../x"}).status_code == 400


def test_api_ficha_entrenamiento_sin_credito(cliente):
    f = cliente.get("/api/parcelas/AGC_001").json()
    assert f["rendimiento"]["tipo"] == "observado" and "credito" not in f and "prediccion" not in f
    g = cliente.get("/api/parcelas/AGC_065").json()
    assert g["credito"]["nivel"] == "revisar dato antes de decidir"


def test_api_credito(cliente):
    r = cliente.post("/api/credito/scenario", json={"id": "AGC_003"}).json()
    assert round(r["credito_sugerido_mxn"]) == 316382 and r["tipo"] == "simulacion"
    assert cliente.post("/api/credito/scenario", json={"id": "AGC_003", "precio": 1}).status_code == 422


def test_json_del_frontend_coincide_con_csv():
    """El JSON estático que lee React se generó de los CSV oficiales y no fue editado a mano."""
    p = json.loads((FRONT_DATA / "predicciones_cebada360.json").read_text(encoding="utf-8"))
    e = datos.entrega()
    assert p["metadata"]["sha256_entrega"] == datos.SHA_REFERENCIA
    for pid, oficial in e.items():
        assert p["parcelas"][pid]["rendimiento_t_ha"] == oficial
        assert p["parcelas"][pid]["tipo"] == "estimado"
    obs = datos.base().set_index("ID_POLIGONO").y.dropna()
    for pid, y in obs.items():
        assert np.isclose(p["parcelas"][pid]["rendimiento_t_ha"], y)
        assert "credito" not in p["parcelas"][pid]


def test_json_del_frontend_son_validos():
    """Ningún JSON público lleva NaN/Infinity (el navegador no los acepta)."""
    def rechazar(c):
        raise ValueError(f"constante no válida en JSON: {c}")
    for ruta in FRONT_DATA.glob("*.json"):
        json.loads(ruta.read_text(encoding="utf-8-sig"), parse_constant=rechazar)


def test_desempeno_metodologia():
    """Tarjetas = métricas oficiales (10 repeticiones); gráfica = repetición 0 (manual sección 14: 0.503 / 0.347)."""
    m = json.loads((FRONT_DATA / "metodologia_validacion.json").read_text(encoding="utf-8"))
    assert (m["metricas"]["rmse"], m["metricas"]["mae"], m["metricas"]["r2"]) == (0.494, 0.3381, 0.6607)
    assert round(m["metricas_grafica"]["rmse"], 3) == 0.503 and round(m["metricas_grafica"]["mae"], 3) == 0.347
    assert len(m["puntos"]) == 138 == m["metricas_grafica"]["n"]
    assert m["esperado_59"]["rmse"] == {"p5": 0.369, "mediana": 0.483, "p95": 0.62}


def test_figuras_de_resultados_existen():
    import re
    cat = (FRONT_DATA.parents[1] / "src" / "data" / "evidencia.ts").read_text(encoding="utf-8")
    archivos = re.findall(r'archivo: "([^"]+)"', cat)
    assert len(archivos) == 28 and len(set(archivos)) == 28
    for a in archivos:
        assert (FRONT_DATA.parent / "figs" / "evidencia" / a).is_file(), a
        assert (datos.RAIZ / a).is_file(), a          # y es la figura oficial del paquete
