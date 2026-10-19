"""Converts lightweight I1/I2 CSVs into JSON for CEBADA360 (Python standard library)."""
import csv
import json
import sys
from collections import defaultdict
from pathlib import Path

def rows(path):
    with path.open(encoding="utf-8-sig", newline="") as file:
        return list(csv.DictReader(file))

def numeric(value):
    return round(float(value), 2) if value else None

def main(source: Path, dest: Path):
    dest.mkdir(parents=True, exist_ok=True)
    rainfall = defaultdict(list)
    for r in rows(source / "clima_mensual.csv"):
        rainfall[r["ID_POLIGONO"]].append({
            "mes": int(r["mes"]),
            "precipitacion_2025_mm": numeric(r["Prec"]),
            "precipitacion_media_2022_2024_mm": numeric(r["Prec_2022_2024"]),
        })
    flags = ["bq_doble_joroba", "bq_pico_en_borde", "bq_pocas_imagenes", "bq_hueco_largo", "bq_lejos_de_entrenamiento", "bq_ciclo_corto", "bq_rend_redondo", "bq_rend_atipico"]
    quality = {
        r["ID_POLIGONO"]: {
            "estado": r["bq_revisar"], "total": int(r["bq_total"]),
            "banderas": {flag: int(r[flag]) for flag in flags},
            "distancia_vecinas_km": numeric(r["bq_dist_media_vecinas_km"]),
        } for r in rows(source / "banderas_calidad.csv")
    }
    climate = {
        r["ID_POLIGONO"]: {
            "nivel_indicador": int(r["riesgo_nivel"]),
            "meses_secos_jun_sep": int(r["riesgo_meses_secos_jun_sep"]),
            "canicula_jul_ago_pct": numeric(r["riesgo_canicula_jul_ago_pct"]),
            "temporada_may_oct_pct": numeric(r["riesgo_temporada_may_oct_pct"]),
            "lluvia_cosecha_oct_mm": numeric(r["riesgo_lluvia_cosecha_oct_mm"]),
            "lluvia_cosecha_oct_pct": numeric(r["riesgo_lluvia_cosecha_oct_pct"]),
            "tmin_sep_oct_c": numeric(r["riesgo_tmin_sep_oct"]),
        } for r in rows(source / "senales_riesgo.csv")
    }
    assert len(rainfall) == len(quality) == len(climate) == 197
    assert all(len(months) == 12 for months in rainfall.values())
    output_rain = {"metadata": {"fuente": "datos_app/clima_mensual.csv (I1/I2)", "referencia": "Promedio 2022–2024", "unidad": "mm"}, "parcelas": rainfall}
    output_quality = {"metadata": {"fuente": "datos_app/banderas_calidad.csv y senales_riesgo.csv (I1/I2)", "nota": "Señales descriptivas, no riesgo predictivo"}, "parcelas": {k: {"calidad": quality[k], "senales_climaticas": climate[k]} for k in quality}}
    (dest / "precipitacion_2025_historico.json").write_text(json.dumps(output_rain, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    (dest / "indicadores_calidad_riesgo.json").write_text(json.dumps(output_quality, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("Generadas 197 parcelas, 2364 meses y 197 controles de calidad/riesgo")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("Uso: python generar_datos_cebada360.py RUTA_DATOS_APP RUTA_FRONTEND_PUBLIC_DATA")
    main(Path(sys.argv[1]), Path(sys.argv[2]))
