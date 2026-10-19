# CEBADA360 · Aplicación web (React + FastAPI)

Interfaz web del Reto AgroCebada FIRA 2026. El **frontend** (React + Vite) muestra los resultados oficiales y el
**backend** (FastAPI) **ejecuta el modelo congelado del notebook** (`resultados_I3/modelo_cebada360.py` + `modelo.joblib`)
y la simulación de crédito (pasos 24/27). Arquitectura «Plan B» del Manual del Integrante 5 (sección 18).

```
interfaz/
├── backend/
│   ├── main.py                  ← API (FastAPI)
│   ├── cebada/                  ← datos.py · modelo.py · credito.py · ui.py (copiados del manual, sección 6)
│   ├── datos/                   ← copia SIN MODIFICAR de los resultados oficiales (outputs, resultados_I3/I4/app)
│   ├── scripts/exportar_datos_frontend.py  ← genera los JSON del frontend desde los CSV oficiales
│   ├── tests/                   ← python -m pytest -q  (18 pruebas)
│   └── requirements.txt
└── frontend/
    ├── public/data/             ← JSON (predicciones_cebada360.json lo genera el script; no editar a mano)
    ├── public/figs/             ← figuras oficiales copiadas por el script
    └── src/
```

## Cómo correrla (Windows)

Necesitas **Python 3.12 o 3.13** (scikit-learn 1.6.1 no instala en 3.14) y **Node 20+**.

**1 · Backend** (terminal 1, desde `backend/`):

```bat
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python -m pytest -q
uvicorn main:app --reload --port 8000
```

Abre http://127.0.0.1:8000/docs para ver la API. Al arrancar debe decir que el modelo cargó con
`origen: modelo.joblib` (o «reentrenado», que también es correcto: verifica las 59 contra la entrega).

**2 · Frontend** (terminal 2, desde `frontend/`):

```bat
npm install
npm run dev
```

Abre http://localhost:5173. `frontend/.env.local` define `VITE_API_URL=http://127.0.0.1:8000`.

También puedes usar `iniciar_backend.bat` e `iniciar_frontend.bat`.

## Endpoints

| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/api/health` | Estado del modelo (origen, versión, Python, scikit-learn) |
| GET | `/api/metadata` | Métricas oficiales, conteos, SHA-256, advertencias |
| GET | `/api/parcelas?municipio=&conjunto=` | Lista de parcelas (observado 138 / estimado 59) |
| GET | `/api/parcelas/{id}` | Ficha: rendimiento, intervalos, detalle, crédito (solo las 59) |
| GET | `/api/parcelas/{id}/factores` | Descomposición aditiva (no SHAP, no causal) |
| POST | `/api/predict-existing` `{"id_poligono": "AGC_003"}` | **Ejecuta el modelo** y compara con la entrega |
| POST | `/api/credito/scenario` `{"id", "precio", "costo_ha"}` | Simulación de crédito (paso 24/27) |
| GET | `/api/transparencia` | Controles de integridad en vivo |
| GET | `/api/entrega/csv` | Descarga `predicciones_59_entrega.csv` |

## Qué se conectó

- **Ficha de cada una de las 59**: botón «▶ Ejecutar el modelo para esta parcela» → muestra la predicción, sus 3
  componentes (Ridge, municipio, GP), el tiempo y si coincide con la entrega oficial.
- **Calculadora de crédito** en la ficha (precio 5,000–10,000 MXN/t, costo 15,000–30,000 MXN/ha) que llama al backend.
  Cambiar precio o costo nunca cambia el rendimiento.
- **Datos finales** en todas las páginas (antes eran del modelo provisional de vecinas k=12): mapa con 4 capas
  (rendimiento, incertidumbre, calidad, indicador de crédito), tabla, comparación, análisis local y global.
- Las 138 de entrenamiento muestran rendimiento **observado** y su predicción fuera de fold; no muestran crédito ni probabilidad.
- Regla v2.6: AGC_065 aparece como «revisar dato antes de decidir», no «alto».
- **Página «Resultados»** (botón junto a Metodología, `/?vista=resultados`): las 28 gráficas oficiales de los paquetes
  I1/I2, I3, I4 y app, cada una con qué muestra, qué resultado expone y cómo leerlo. El texto vive en
  `frontend/src/data/evidencia.ts`; las imágenes se copian sin modificar a `public/figs/evidencia/`.
- **Metodología · Desempeño del modelo**: las tarjetas muestran las métricas oficiales (RMSE 0.4940 ± 0.0062,
  MAE 0.3381, R² 0.6607, 10 repeticiones = 1,380 errores) y la gráfica muestra sus propias métricas (repetición 0:
  RMSE 0.5026, MAE 0.3467, R² 0.6487), con la explicación de la diferencia y la calificación esperada en las 59.

## Si cambian los resultados oficiales

1. Reemplaza el contenido de `backend/datos/` con el nuevo paquete (sin editar archivos).
2. `python scripts/exportar_datos_frontend.py` (desde `backend/`).
3. `python -m pytest -q`: si algo falla, **no publicar**.

## Publicación

El backend necesita un servidor con Python (Render, Railway, Fly.io…): `uvicorn main:app --host 0.0.0.0 --port $PORT`,
con la variable `CEBADA360_CORS` = URL del frontend. El frontend se compila con `npm run build` (carpeta `dist/`) y se
publica en Vercel/Netlify con `VITE_API_URL` = URL del backend. Sin backend, la web sigue mostrando todos los
resultados; solo «Ejecutar el modelo» y la calculadora quedan sin servicio (con aviso).
