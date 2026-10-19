# 🌾 CEBADA360

**Plataforma web de consulta, visualización y predicción del rendimiento de cebada**  
**Proyecto:** Datathlon · Reto AgroCebada FIRA 2026  
**Tecnologías:** React · TypeScript · Vite · FastAPI · Python · scikit-learn

> **Estado del proyecto:** aplicación funcional en desarrollo local. El frontend y el backend se han probado juntos; la publicación en internet requiere configurar y desplegar ambos servicios. Los resultados del reto y las predicciones no sustituyen verificaciones agronómicas ni decisiones financieras profesionales.

## 1. ¿Qué es CEBADA360?

CEBADA360 integra en una misma aplicación los resultados del análisis de parcelas agrícolas, información territorial y climática, estimaciones de rendimiento de cebada y herramientas de exploración de escenarios económicos. Su propósito es facilitar la consulta e interpretación de los resultados del Reto AgroCebada FIRA 2026 mediante una interfaz accesible.

El sistema distingue **138 parcelas con rendimiento observado (ENTRENAMIENTO)** y **59 parcelas cuyo rendimiento se estima (PREDICCION)**. Esta separación evita presentar un valor observado como si fuera una estimación o viceversa.

### Funcionalidades principales

- **Exploración de parcelas:** mapa, filtros, consulta de fichas y variables disponibles.
- **Rendimiento y contexto territorial:** visualizaciones, comparación de parcelas e información climática y satelital preparada a partir de los datos del proyecto.
- **Predicción de las 59 parcelas:** ejecución desde la interfaz mediante una petición al backend; muestra el rendimiento estimado, componentes del ensamble y comparación con la entrega oficial.
- **Análisis y metodología:** métricas de validación, gráficas de evidencia y explicación de cómo interpretar los resultados.
- **Simulación de escenarios de crédito:** permite modificar supuestos de precio y costo por hectárea y obtener resultados desde la API; **no modifica la predicción agronómica**.
- **Transparencia:** consulta del estado del modelo, metadatos y controles de integridad disponibles en la API.

## 2. Arquitectura y comunicación

```text
Navegador web
    │
    ▼
Frontend: React + TypeScript + Vite
    │  Solicitudes HTTP (fetch) / respuestas JSON
    │  VITE_API_URL
    ▼
Backend: Python + FastAPI
    ├── Endpoints de parcelas, factores y metodología
    ├── Ejecución de predicciones
    ├── Simulación de crédito
    └── Lectura de datos y resultados oficiales
            ├── modelo_cebada360.py
            ├── modelo.joblib
            └── CSV y archivos de resultados
```

El frontend funciona como **interfaz de usuario** y consume la API de FastAPI. El backend es responsable de ejecutar las funciones Python y acceder a los archivos necesarios. Abrir la página no significa, por sí solo, que la API esté disponible; las operaciones que requieren cálculos deben comprobar la conexión.

**Direcciones usadas en desarrollo local:**

| Servicio | Dirección | Función |
|---|---|---|
| Frontend | `http://localhost:5173` | Página web en desarrollo |
| Backend | `http://127.0.0.1:8000` | API local |
| Documentación API | `http://127.0.0.1:8000/docs` | Swagger UI para probar endpoints |
| Salud de la API | `http://127.0.0.1:8000/api/health` | Estado del backend y el modelo |

> Las direcciones `localhost` y `127.0.0.1` se refieren a **la computadora que abre el enlace**. No sirven como dirección pública cuando la aplicación se despliega en internet.

## 3. Organización del repositorio

La estructura siguiente corresponde a la carpeta `interfaz/` del proyecto recibido:

```text
interfaz/
├── README.md                       # Documentación principal
├── iniciar_backend.bat             # Inicia backend en Windows
├── iniciar_frontend.bat            # Inicia frontend en Windows
├── backend/
│   ├── main.py                     # API FastAPI y rutas
│   ├── requirements.txt            # Dependencias Python
│   ├── cebada/
│   │   ├── datos.py                # Acceso y preparación de datos
│   │   ├── modelo.py               # Carga del modelo y predicción
│   │   ├── credito.py              # Cálculos de escenarios económicos
│   │   └── ui.py                   # Datos y auxiliares para la interfaz
│   ├── datos/
│   │   ├── outputs/                # Bases procesadas
│   │   ├── resultados_I3/          # Modelo y evidencia predictiva
│   │   │   ├── modelo_cebada360.py
│   │   │   ├── modelo.joblib
│   │   │   └── ENTREGA/
│   │   ├── resultados_I4/          # Resultados relacionados con crédito
│   │   └── resultados_app/         # Insumos del visor
│   ├── scripts/
│   │   └── exportar_datos_frontend.py
│   └── tests/
│       └── test_integridad.py
└── frontend/
    ├── package.json
    ├── package-lock.json
    ├── vite.config.ts
    ├── .env.local                   # Configuración local: no subir secretos
    ├── public/
    │   ├── data/                   # JSON y GeoJSON consumidos por la interfaz
    │   └── figs/                   # Figuras y evidencias
    └── src/
        ├── pages/                  # Pantallas: mapa, detalles, equipo, etc.
        └── ...
```

**Archivos clave para mantenimiento:**

- `frontend/src/pages/Team.tsx`: información mostrada en la sección **Equipo**.
- `frontend/src/pages/Methodology.tsx`: pantalla de metodología.
- `frontend/src/pages/Results.tsx`: presentación de resultados y evidencias.
- `backend/main.py`: definición de rutas y configuración CORS.
- `backend/cebada/modelo.py`: integración del modelo predictivo.
- `backend/requirements.txt`: versiones de paquetes Python.
- `frontend/package.json`: comandos y dependencias del frontend.

## 4. Requisitos para ejecutar el proyecto

### Windows (desarrollo local)

| Herramienta | Recomendación | Comprobación |
|---|---|---|
| Python | **3.12, 64 bits** | `py -3.12 --version` |
| Node.js | Versión compatible con Vite 8; usar **Node 22.12+ o 24.0+** | `node --version` |
| npm | Incluido con Node.js | `npm --version` |
| Git | Opcional para ejecutar; necesario para trabajo con GitHub | `git --version` |

**Importante:** la versión de `scikit-learn` fijada en `requirements.txt` (`1.6.1`) se utiliza aquí con Python 3.12. No se recomienda crear el entorno con Python 3.14 para este proyecto.

## 5. Instalación y ejecución local paso a paso

La carpeta desde la que se ejecutan los comandos debe ser la indicada. Puedes abrir dos terminales en Visual Studio Code.

### 5.1. Descargar el repositorio

Si está en GitHub:

```powershell
git clone https://github.com/TU_USUARIO/CEBADA360.git
cd CEBADA360
```

Reemplaza `TU_USUARIO` por el usuario real. Si compartes un ZIP, descomprímelo y abre la carpeta `interfaz` donde estén `backend/` y `frontend/`.

### 5.2. Terminal 1 — Backend (Python 3.12)

Desde `interfaz/backend`:

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m pytest -q
.\.venv\Scripts\python.exe -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

- `venv` crea un entorno aislado dentro de `backend/.venv`.
- `pip install` instala las bibliotecas con las versiones indicadas.
- `pytest` ejecuta las pruebas antes de iniciar el servicio.
- `uvicorn` mantiene activo el servidor mientras la terminal permanezca abierta.

Cuando aparezca **`Application startup complete`**, abre `http://127.0.0.1:8000/docs` o `http://127.0.0.1:8000/api/health`.

**Nota:** la ruta raíz `/` puede devolver `404 Not Found` en esta versión. La API utiliza `/api/...`, así que un `404` en `/` no significa que el servidor haya fallado.

### 5.3. Terminal 2 — Frontend (React + Vite)

Desde `interfaz/frontend`:

```powershell
npm install
npm run dev
```

Abre la dirección local que muestre Vite, normalmente `http://localhost:5173`.

La configuración local debe indicar la URL de la API. Crea o revisa `frontend/.env.local`:

```dotenv
VITE_API_URL=http://127.0.0.1:8000
```

Si cambias este archivo, reinicia el servidor de desarrollo de Vite para que utilice la nueva variable.

### 5.4. Uso de los archivos `.bat`

La carpeta contiene `iniciar_backend.bat` e `iniciar_frontend.bat` para iniciar los servicios con doble clic. **Verifica que estés utilizando los scripts corregidos**, ya que el `.bat` original incluido en `CEBADA360_interfaz_final_2.zip` crea el entorno con `python -m venv`, que puede seleccionar una versión de Python distinta de 3.12.

Los comandos manuales anteriores son la opción más explícita y reproducible para una instalación nueva.

## 6. Cómo utilizar la aplicación

1. Inicia el backend y espera a que termine de cargar el modelo.
2. Inicia el frontend y abre la página.
3. Explora el mapa o selecciona una parcela.
4. Si pertenece a **ENTRENAMIENTO**, revisa el rendimiento observado y su predicción de validación. No necesita mostrar el botón de ejecutar predicción final.
5. Si pertenece a **PREDICCION**, utiliza **«Ejecutar el modelo para esta parcela»** para solicitar una inferencia al backend.
6. Revisa la respuesta, los componentes del ensamble y el indicador de coincidencia con la entrega oficial.
7. Si corresponde, modifica los supuestos de la calculadora de crédito para explorar escenarios económicos.

### ¿Por qué las pantallas de entrenamiento y predicción son distintas?

| Campo o acción | ENTRENAMIENTO (138) | PREDICCION (59) |
|---|---|---|
| Rendimiento observado | Disponible | Oculto/no disponible |
| Predicción de validación | Se presenta para comparación | No es la predicción oficial |
| Predicción final ejecutable | No es el flujo principal | Sí, mediante API |
| Comparación con resultado oficial | No aplica del mismo modo | Disponible en la ejecución |
| Escenario de crédito por parcela | No incluido en esa ficha | Disponible para las parcelas previstas |

Las predicciones de validación y las predicciones finales tienen funciones diferentes; no deben confundirse al presentar los resultados.

## 7. API: endpoints disponibles

La documentación interactiva se genera automáticamente en `/docs`.

| Método | Endpoint | Uso |
|---|---|---|
| `GET` | `/api` | Información general de la API |
| `GET` | `/api/health` | Verifica estado del servicio |
| `GET` | `/api/modelo/estado` | Estado y procedencia del modelo |
| `GET` | `/api/metadata` | Métricas, conteos y metadatos |
| `GET` | `/api/transparencia` | Comprobaciones de integridad |
| `GET` | `/api/parcelas` | Listado; admite filtros `municipio` y `conjunto` |
| `GET` | `/api/parcelas/{id_parcela}` | Datos de una parcela |
| `GET` | `/api/parcelas/{id_parcela}/factores` | Componentes o factores explicativos |
| `POST` | `/api/predict-existing` | Predicción de una parcela del conjunto PREDICCION |
| `POST` | `/api/credito/scenario` | Simulación económica con supuestos del usuario |
| `GET` | `/api/credito/supuestos` | Supuestos empleados en los escenarios |
| `GET` | `/api/entrega/csv` | Descarga de resultados de entrega |

### Ejemplo: ejecutar una predicción

Desde `http://127.0.0.1:8000/docs`, abre **`POST /api/predict-existing`**, selecciona **Try it out** y envía un ID que pertenezca a `PREDICCION`:

```json
{
  "id_poligono": "AGC_085"
}
```

La respuesta incluye, entre otros campos, `y_pred`, `comp_ridge`, `comp_municipio`, `comp_espacial`, `oficial`, `coincide`, `ms_inferencia` y `origen_modelo`.

El campo `coincide` verifica la correspondencia con el archivo de entrega, **no es una métrica de precisión frente a un rendimiento real oculto**.

### Ejemplo: simulación de crédito

El endpoint `POST /api/credito/scenario` recibe un cuerpo con estos campos:

```json
{
  "id": "AGC_085",
  "precio": 7000,
  "costo_ha": 22000
}
```

Los valores son **un ejemplo de entrada**, no una recomendación de precios o costos. Consulta `/api/credito/supuestos` para identificar los supuestos que utiliza la aplicación.

## 8. Modelo y métricas: qué significa lo que muestra la web

El backend integra el artefacto `modelo.joblib` y el módulo `modelo_cebada360.py` producido por el equipo de modelado. La implementación indica un **ensamble de tres componentes con pesos iguales**:

```text
rendimiento_estimado = (componente_Ridge + componente_municipal + componente_espacial) / 3
```

Según el README original del proyecto, la validación estratificada por municipio reporta:

| Métrica | Resultado reportado | Interpretación |
|---|---:|---|
| RMSE | 0.4940 t/ha | Penaliza más los errores grandes |
| MAE | 0.3381 t/ha | Magnitud media del error absoluto |
| R² | 0.6607 | Ajuste explicativo dentro del esquema evaluado |

Se describen **5 folds y 10 repeticiones**. Las métricas y figuras deben interpretarse según el procedimiento de validación con que fueron producidas. No equivalen a una garantía de rendimiento para municipios o periodos no evaluados.

**Precaución de interpretación:** la descomposición que muestra el sistema es **contable/aditiva; no es SHAP ni una demostración de causalidad**.

## 9. Pruebas funcionales y verificación de la integración

### 9.1. Pruebas automatizadas

Desde `backend/`:

```powershell
.\.venv\Scripts\python.exe -m pytest -q
```

En la versión probada durante el desarrollo local se ejecutaron **18 pruebas satisfactorias**. Ese resultado describe una ejecución concreta; vuelve a ejecutar las pruebas después de modificar código, datos o dependencias.

### 9.2. Pruebas de frontend-backend

| Prueba | Procedimiento | Resultado esperado |
|---|---|---|
| Estado API | Abrir `/api/health` | Respuesta exitosa |
| Predicción válida | Ejecutar `POST /api/predict-existing` con un ID de `PREDICCION` | `200 OK` y JSON de predicción |
| Solicitud real desde React | Abrir DevTools → Network → Fetch/XHR y pulsar «Ejecutar el modelo» | Solicitud visible al endpoint; parámetros y respuesta correctos |
| Backend detenido | Detener FastAPI y volver a intentar desde React | Mensaje de error controlado; la página no colapsa |
| Recuperación | Reiniciar FastAPI y reintentar sin refrescar | Nueva respuesta correcta |
| ID inexistente | Solicitar una parcela inexistente | Error comprensible, sin romper la aplicación |
| Cambiar de parcela | Abrir otras parcelas | ID y resultados correspondientes a cada selección |
| Compilación frontend | Ejecutar `npm run build` | Construcción sin errores |

Durante las pruebas manuales del proyecto se verificaron peticiones satisfactorias, manejo de desconexión y recuperación. **La instalación desde cero en otra computadora y el despliegue público se deben comprobar por separado.**

### 9.3. Ejemplo con herramientas del navegador

En Chrome o Edge:

1. Pulsa `F12`.
2. Abre **Network** y selecciona **Fetch/XHR**.
3. Ejecuta una predicción desde la interfaz.
4. Revisa **Headers** (URL y código HTTP), **Payload** (parcela enviada) y **Response** (JSON recibido).

Esto permite demostrar que el resultado visible se obtiene de una comunicación real con FastAPI.

## 10. Solución de problemas comunes

### `No module named pytest` o `No module named numpy`

Instala todas las dependencias **dentro del entorno Python 3.12 del backend**:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

### Fallos al instalar `scikit-learn` o `numpy`

Verifica que `.venv` sea un entorno creado con Python 3.12 y no con Python 3.14:

```powershell
.\.venv\Scripts\python.exe --version
```

Si el entorno fue creado con la versión incorrecta, cierra los servidores y vuelve a crearlo con `py -3.12 -m venv .venv` después de respaldar o eliminar la carpeta `.venv` antigua.

### `Failed to fetch` en el frontend

Confirma que FastAPI sigue funcionando, que `VITE_API_URL` apunta al servidor correcto y que CORS permite el origen del frontend. Una caída temporal del backend debe manejarse con un error visible y posibilidad de reintentar.

### `404 Not Found` en `http://127.0.0.1:8000/`

Usa `/api/health` o `/docs`; la ruta `/` no es la página de React en esta versión.

### La web abre, pero las predicciones no funcionan

Es posible que el frontend esté mostrando archivos JSON estáticos aunque el backend no esté disponible. Comprueba el endpoint de predicción en **Network**, además de verificar la carga visual de la página.

### La página no refleja cambios de configuración

Reinicia Vite después de modificar `.env.local` o cualquier variable `VITE_*`.

## 11. Actualización de resultados y archivos generados

Cuando el equipo actualice los resultados oficiales:

1. Respalda la versión actual.
2. Sustituye los archivos correspondientes de `backend/datos/` **solo por los resultados acordados por el equipo**.
3. Desde `backend/`, ejecuta:

   ```powershell
   .\.venv\Scripts\python.exe scripts/exportar_datos_frontend.py
   .\.venv\Scripts\python.exe -m pytest -q
   ```

4. Comprueba las visualizaciones, la predicción de una parcela y los controles de integridad.
5. No publiques una versión si las pruebas o verificaciones de integridad fallan.

Los archivos `frontend/public/data/` y parte de `frontend/public/figs/` contienen insumos preparados para la visualización; **no edites manualmente las predicciones oficiales** sin coordinar el cambio con el equipo responsable del modelo.

## 12. Subir el código a GitHub

Recomendación inicial: crear un **repositorio privado** y confirmar qué datos, artefactos del modelo y resultados se permite compartir bajo las reglas del reto.

### Archivos que no deben subirse

Utiliza un `.gitignore` en la raíz del repositorio con, por lo menos:

```gitignore
**/.venv/
**/venv/
**/__pycache__/
**/.pytest_cache/
**/node_modules/
**/dist/
**/.vite/
*.pyc
*.log
.env
.env.*
**/.env
**/.env.*
!.env.example
!**/.env.example
```

**Antes del primer push**, revisa qué archivos se enviarán (`git status`), comprueba que no haya claves ni credenciales y verifica los límites de tamaño del repositorio o del servicio elegido. Un repositorio privado tampoco elimina obligaciones de confidencialidad.

Comandos básicos desde la carpeta que contiene `backend/` y `frontend/`:

```powershell
git init
git branch -M main
git add .
git status
git commit -m "Documentacion e integracion inicial de CEBADA360"
git remote add origin https://github.com/TU_USUARIO/CEBADA360.git
git push -u origin main
```

**Nota:** crea primero un repositorio vacío en GitHub, sustituye la URL de ejemplo por la real y configura la identidad de Git si te la solicita.

## 13. Publicación de la página web en internet

**Objetivo:** que una persona abra una URL y utilice CEBADA360 sin instalar Python, Node.js ni ejecutar scripts en su equipo.

Una opción de arquitectura es:

- **Frontend en Vercel:** compila React/Vite y sirve los archivos estáticos.
- **Backend en Render:** aloja FastAPI, sus dependencias, `modelo.joblib` y los archivos requeridos.

### 13.1. Backend (ejemplo para un servidor Linux)

- **Directorio raíz del servicio:** `backend` si el repositorio tiene `backend/` y `frontend/` al nivel principal.
- **Entorno Python:** 3.12, configurado según las opciones del proveedor.
- **Comando de instalación:** `pip install -r requirements.txt`.
- **Comando de inicio** (ejemplo de shell Linux):

  ```bash
  uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
  ```

- **Variable de entorno:** `CEBADA360_CORS=https://TU_FRONTEND.vercel.app`, sustituyendo el dominio por el real.

**Atención:** los proveedores pueden tener límites de RAM, almacenamiento, tiempo de arranque y suspensión por inactividad. Hay que verificar que el modelo y los datos quepan y carguen de forma estable. No se ha validado aún el despliegue de esta versión en un proveedor concreto.

### 13.2. Frontend

- **Directorio raíz del proyecto:** `frontend`.
- **Comando de instalación:** `npm ci` si se mantiene actualizado `package-lock.json`.
- **Comando de compilación:** `npm run build`.
- **Directorio de salida:** `dist`.
- **Variable de entorno:** `VITE_API_URL=https://TU_BACKEND.example.com` (URL HTTPS real de la API).

Después de configurar o cambiar `VITE_API_URL` en Vercel hay que **reconstruir/desplegar nuevamente** el frontend. Las variables `VITE_*` utilizadas por la aplicación web se incorporan al cliente: **nunca coloques secretos o claves privadas en ellas**.

### 13.3. Revisión obligatoria después de desplegar

1. Abre el frontend desde una computadora o teléfono distinto.
2. Comprueba que todas las páginas y mapas cargan.
3. Ejecuta una predicción y revisa el estado HTTP en Network.
4. Prueba el simulador económico.
5. Comprueba errores controlados y recuperación.
6. Revisa HTTPS, CORS, logs del backend y controles de integridad.
7. Revisa el acceso público a los endpoints que descargan datos o resultados antes de compartir el enlace.

Publicar el frontend **sin** el backend deja inaccesibles las funciones que dependen de la API, aunque algunas gráficas y datos precargados puedan seguir mostrándose.

## 14. Roles y mantenimiento del proyecto

Las responsabilidades se reparten entre el análisis de datos, modelado, validación, análisis de crédito y desarrollo de la plataforma. **Los nombres y atribuciones finales deben confirmarse con el equipo** antes de publicarlos.

La pantalla **Equipo** se edita en `frontend/src/pages/Team.tsx`. Para actualizar fotografías, revisa los recursos estáticos de `frontend/public/` y las rutas utilizadas por ese componente.

La documentación técnica y el código de interfaz deben mantenerse coordinados con los resultados oficiales que entreguen las personas responsables del modelo.

## 15. Alcance, limitaciones y consideraciones

- El sistema se desarrolló para el contexto y datos del **Reto AgroCebada FIRA 2026**.
- Las métricas reportadas corresponden a esquemas de evaluación específicos: **no garantizan exactitud en datos o regiones nuevas**.
- Los indicadores de crédito son **escenarios basados en supuestos**; no representan una oferta ni aprobación de financiamiento.
- La descomposición de factores mostrada por el modelo **no implica causalidad**.
- La versión local comprobada no equivale a un despliegue público auditado en seguridad o rendimiento.
- Antes de hacer público el repositorio o la página, revisa licencias, permisos de distribución de datos y exposición de endpoints.

---

**CEBADA360 · Reto AgroCebada FIRA 2026**  
Documentación preparada a partir de la estructura y el README incluidos en `CEBADA360_interfaz_final_2.zip`. Sustituye las URLs de ejemplo por las reales y confirma los nombres del equipo antes de publicar.
