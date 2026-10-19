"""Reto AgroCebada 2026 - extracción reproducible de variables climáticas y topográficas.

Uso:
 python generar_clima_territorio.py --carpeta-insumos /ruta/de/archivos --salida public/data/clima_territorio_2025.json

Archivos requeridos en --carpeta-insumos:
 parcelas_agrocebada.geojson
 Reto_AgroCebada_Temperatura_2022_2025_RECORTADA_CHIRPS.zip
 Reto_AgroCebada_Topografia_INEGI_CEM4.zip

Metodología:
 - Temp CHIRTS-ERA5: lectura del píxel que contiene el centroide de cada parcela.
   0.05 grados de resolución aprox. No representa microclima dentro de la parcela.
 - Elevación y pendiente INEGI: estadísticas de pixeles intersectados por geometría
   reproyectada, con all_touched=True; resolución de entrega 120m.
 - Precipitación: NO se proporciona en el ZIP climático disponible; no se estima.
"""
from __future__ import annotations
import argparse
import json
import math
import zipfile
from pathlib import Path

import numpy as np
import rasterio
from rasterio.io import MemoryFile
from rasterio.mask import mask
from pyproj import Transformer
from shapely.geometry import shape, mapping
from shapely.ops import transform

TEMP_ZIP = 'Reto_AgroCebada_Temperatura_2022_2025_RECORTADA_CHIRPS.zip'
TOPO_ZIP = 'Reto_AgroCebada_Topografia_INEGI_CEM4.zip'


def round_safe(x, digits=2):
    x = float(x)
    return round(x, digits) if math.isfinite(x) else None


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--carpeta-insumos', type=Path, default=Path('/mnt/data'))
    parser.add_argument('--salida', type=Path, default=Path('/mnt/data/CEBADA360_Clima_Territorio/public/data/clima_territorio_2025.json'))
    args = parser.parse_args()
    root = args.carpeta_insumos
    parcelas = json.loads((root/'parcelas_agrocebada.geojson').read_text(encoding='utf-8'))['features']
    geoms = {p['properties']['ID_POLIGON']: shape(p['geometry']) for p in parcelas}
    ids = list(geoms)
    results = {pid: {'clima': {'mensual': []}, 'territorio': {}} for pid in ids}

    with zipfile.ZipFile(root/TEMP_ZIP) as z:
        for month in range(1, 13):
            items = {}
            for variable in ('Tmin','Tmax'):
                name = next((name for name in z.namelist() if name.endswith(f'/{variable}_2025_{month:02d}.tif')), None)
                if not name: raise RuntimeError(f'Falta {variable} 2025-{month:02d}')
                with MemoryFile(z.read(name)) as f:
                    with f.open() as ds:
                        coords = [(geoms[pid].centroid.x, geoms[pid].centroid.y) for pid in ids]
                        # GeoJSON EPSG:4326 y raster EPSG:4326
                        vals = []
                        for a in ds.sample(coords, masked=True):
                            val = a[0]
                            vals.append(None if np.ma.is_masked(val) or not np.isfinite(val) or float(val) == ds.nodata else float(val))
                        items[variable] = vals
            for i,pid in enumerate(ids):
                tmin = items['Tmin'][i]
                tmax = items['Tmax'][i]
                tmean = (tmin+tmax)/2 if tmin is not None and tmax is not None else None
                results[pid]['clima']['mensual'].append({
                    'mes': month,
                    'tmin_c': round_safe(tmin) if tmin is not None else None,
                    'tmax_c': round_safe(tmax) if tmax is not None else None,
                    'tmedia_c': round_safe(tmean) if tmean is not None else None,
                    'amplitud_c': round_safe(tmax-tmin) if tmin is not None and tmax is not None else None,
                    'precipitacion_mm': None,
                })

    with zipfile.ZipFile(root/TOPO_ZIP) as z:
        for part,field,scale in [
            ('Elevacion_INEGI_CEM4_120m.tif','elevacion','m'),
            ('Pendiente_INEGI_CEM4_120m_grados.tif','pendiente','grados'),
        ]:
            path = next((name for name in z.namelist() if name.endswith(part)),None)
            if not path: raise RuntimeError(f'Falta {part}')
            with MemoryFile(z.read(path)) as mem:
                with mem.open() as ds:
                    transformer = Transformer.from_crs('EPSG:4326', ds.crs, always_xy=True).transform
                    for pid,poly in geoms.items():
                        projected = transform(transformer, poly)
                        vals = None
                        try:
                            cropped,_ = mask(ds, [mapping(projected)], crop=True, all_touched=True, filled=False)
                            vals = cropped[0].compressed().astype(float)
                            vals = vals[np.isfinite(vals) & (vals != ds.nodata)]
                        except ValueError:
                            vals = np.array([], dtype=float)
                        territory = results[pid]['territorio']
                        territory.update({
                            f'{field}_media_{scale}': round_safe(vals.mean()) if vals.size else None,
                            f'{field}_min_{scale}': round_safe(vals.min()) if vals.size else None,
                            f'{field}_max_{scale}': round_safe(vals.max()) if vals.size else None,
                            f'{field}_desv_{scale}': round_safe(vals.std()) if vals.size else None,
                            f'{field}_pixeles': int(vals.size),
                        })

    meta = {
        'anio': 2025,
        'periodo_cultivo': 'abril-octubre',
        'fuentes': {
            'temperatura': 'CHIRTS-ERA5, raster mensuales Tmax y Tmin entregados en el reto',
            'topografia': 'INEGI CEM 4.0, raster de elevacion y pendiente a 120 m nativos',
            'precipitacion': 'No incluida en el ZIP de temperatura disponible: pendiente de integrar CHIRPS'
        },
        'metodos': {
            'temperatura': 'Muestreo del valor del pixel que contiene el centroide de la parcela; 0.05 grados (~5 km)',
            'topografia': 'Media/minimo/maximo/desviacion de pixeles intersectados por la parcela (all_touched=True), reproyectando EPSG:4326 a EPSG:6372. Estadistica aproximada, no ponderada por superficie de interseccion.',
            'media_temperatura': 'Aproximacion (Tmin mensual + Tmax mensual) / 2, no promedio directo de temperaturas horarias',
        },
        'nota': 'Variables descriptivas de grillas geograficas. No implican mediciones in situ ni inferencias causales.'
    }
    output = {'metadata':meta,'parcelas':results}
    args.salida.parent.mkdir(parents=True,exist_ok=True)
    args.salida.write_text(json.dumps(output,ensure_ascii=False,separators=(',',':')), encoding='utf-8')
    print('Salvado',args.salida,'bytes',args.salida.stat().st_size,'parcelas',len(results))
    for pid in ('AGC_001','AGC_042'):
        row=results[pid]
        print(pid, row['clima']['mensual'][3],row['territorio'])
    assert len(results)==197
    assert all(len(r['clima']['mensual'])==12 for r in results.values())
    assert all(r['territorio']['elevacion_media_m'] is not None and r['territorio']['pendiente_media_grados'] is not None for r in results.values())

if __name__=='__main__': main()
