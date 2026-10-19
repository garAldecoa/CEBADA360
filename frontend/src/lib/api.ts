/**
 * Cliente del backend FastAPI (backend/main.py). El backend importa el modelo del notebook
 * (resultados_I3/modelo_cebada360.py + modelo.joblib) y la simulación de crédito del paso 24/27.
 */
const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000"

async function leerError(response: Response) {
  try {
    const cuerpo = await response.json() as { detail?: unknown }
    if (typeof cuerpo.detail === "string") return cuerpo.detail
  } catch { /* sin cuerpo JSON */ }
  return `HTTP ${response.status}`
}

async function apiGet<T>(endpoint: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, { signal })
  if (!response.ok) throw new Error(await leerError(response))
  return response.json() as Promise<T>
}

async function apiPost<T>(endpoint: string, body: unknown, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  })
  if (!response.ok) throw new Error(await leerError(response))
  return response.json() as Promise<T>
}

export interface ApiHealth {
  status: string
  servicio: string
  modelo_cargado: boolean
  origen: string
  segundos_carga: number
  version: string
  python: string
  scikit_learn: string
}

export function verificarBackend(signal?: AbortSignal): Promise<ApiHealth> {
  return apiGet<ApiHealth>("/api/health", signal)
}

/** Resultado de ejecutar el modelo congelado sobre una parcela de PREDICCION. */
export interface EjecucionModelo {
  id: string
  y_pred: number
  comp_ridge: number
  comp_municipio: number
  comp_espacial: number
  rend_vecinas_k12: number
  oficial: number
  coincide: boolean
  ms_inferencia: number
  origen_modelo: string
  version: string
}

export function ejecutarModelo(id: string, signal?: AbortSignal): Promise<EjecucionModelo> {
  return apiPost<EjecucionModelo>("/api/predict-existing", { id_poligono: id }, signal)
}

/** Escenario de crédito (simulación educativa, paso 24/27). */
export interface EscenarioCredito {
  tipo: "simulacion"
  id: string
  municipio: string
  intervalo: string
  precio: number
  costo_ha: number
  rend_esperado_t_ha: number
  rend_lim_inf_80_t_ha: number
  rend_lim_sup_80_t_ha: number
  produccion_t: number
  ingreso_esperado_mxn: number
  ingreso_pesimista_mxn: number
  costo_produccion_mxn: number
  credito_cuota_fira_mxn: number
  pago_cuota_fira_mxn: number
  credito_sugerido_mxn: number
  pct_de_cuota_fira: number
  cobertura_pesimista: number
  rend_minimo_pago_t_ha: number
  rend_minimo_costo_total_t_ha: number
  prob_ingreso_insuficiente: number
}

export function simularCredito(id: string, precio: number, costo_ha: number, signal?: AbortSignal): Promise<EscenarioCredito> {
  return apiPost<EscenarioCredito>("/api/credito/scenario", { id, precio, costo_ha }, signal)
}

export interface Transparencia {
  controles: { control: string; ok: boolean; detalle: string }[]
  todos_ok: boolean
  modelo: Omit<ApiHealth, "status" | "servicio" | "modelo_cargado">
  verificacion_notebook: string
  versiones: string
}

export function consultarTransparencia(signal?: AbortSignal): Promise<Transparencia> {
  return apiGet<Transparencia>("/api/transparencia", signal)
}

export const URL_DESCARGA_ENTREGA = `${API_BASE_URL}/api/entrega/csv`
