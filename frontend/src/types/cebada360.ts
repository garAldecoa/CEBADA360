/**
 * Resultados oficiales de CEBADA360 (modelo final congelado).
 * Archivo: public/data/predicciones_cebada360.json, generado por backend/scripts/exportar_datos_frontend.py
 * a partir de los CSV del notebook (no editar a mano).
 */

export type Factor = {
  variable: string
  etiqueta: string
  valor: number | null
  contribucion: number
}

export type CreditoParcela = {
  ingreso_esperado: number
  credito_sugerido: number
  credito_cuota_fira: number
  pct_de_cuota_fira: number
  prob_ingreso_insuficiente: number
  /** bajo | medio | alto | revisar dato antes de decidir (regla v2.6) */
  nivel: string
  motivo: string
}

export type ParcelaCebada = {
  conjunto: "ENTRENAMIENTO" | "PREDICCION"
  municipio: string
  estado: string
  area_ha: number
  /** observado (138, dato real) | estimado (59, predicción del modelo) */
  tipo: "observado" | "estimado"
  rendimiento_t_ha: number
  produccion_t: number
  calidad: "ok" | "atención" | "revisar" | string
  banderas: string[]
  dist_media_vecinas_km: number | null
  vegetacion: {
    pl_ndvi_pico: number | null
    pl_evi_pico: number | null
    s2_ndwi_media_veg: number | null
    cal_pl_n_obs: number | null
    cal_pl_nub_media: number | null
    cal_pl_hueco_max_dias: number | null
  }
  factores: { prediccion_modelo_final: number; tipo_explicacion: string; items: Factor[] }
  /** Solo 138: predicción fuera de fold (validación) */
  y_pred_fuera_de_fold?: number
  /** Solo 59 */
  y_lo80?: number
  y_hi80?: number
  y_lo90?: number
  y_hi90?: number
  intervalo_credito?: { lo: number; hi: number; ancho: number; tipo: string }
  detalle?: {
    rend_vecinas_k12: number
    rend_medio_municipio: number
    comp_ridge: number
    comp_municipio: number
    comp_espacial: number
    sd_bootstrap: number
    dist_media_vecinas_km: number
    n_entrenamiento_municipio: number
    nota: string
  }
  credito?: CreditoParcela
  alerta_dano_satelital?: string
}

export type DatosCebada = {
  metadata: {
    modelo: string
    formula: string
    sha256_entrega: string
    /** Media del rendimiento de las 138 (base de la descomposición aditiva) */
    media_entrenamiento: number
    metricas: { rmse: number; rmse_sd: number; mae: number; r2: number }
    nota_metricas: string
    conteos: { total: number; observadas: number; estimadas: number }
    estimadas: {
      media: number
      min: number
      max: number
      produccion_total_t: number
      credito_sugerido_total: number
      niveles_credito: Record<string, number>
    }
    importancia_global: { variable: string; etiqueta: string; media_abs_t_ha: number }[]
    fuentes: string[]
  }
  parcelas: Record<string, ParcelaCebada>
}

export const NIVEL_COLORES: Record<string, string> = {
  bajo: "#29945f",
  medio: "#efc343",
  alto: "#c64848",
  "revisar dato antes de decidir": "#7c8aa0",
}

export const NOMBRES_BANDERAS: Record<string, string> = {
  bq_doble_joroba: "Curva NDVI con doble joroba",
  bq_pico_en_borde: "Pico en el borde de la ventana",
  bq_pocas_imagenes: "Pocas imágenes Planet",
  bq_hueco_largo: "Hueco de más de 30 días",
  bq_lejos_de_entrenamiento: "Lejos de parcelas con dato",
  bq_ciclo_corto: "Ciclo muy corto",
  bq_rend_redondo: "Rendimiento reportado redondeado",
  bq_rend_atipico: "Rendimiento atípico frente a vecinas",
}

export function formatoNumero(v: number | null | undefined, d = 2) {
  return typeof v === "number" && Number.isFinite(v)
    ? v.toLocaleString("es-MX", { minimumFractionDigits: d, maximumFractionDigits: d })
    : "—"
}

export function formatoPesos(v: number | null | undefined) {
  return typeof v === "number" && Number.isFinite(v)
    ? v.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 })
    : "—"
}

export function formatoPct(v: number | null | undefined, d = 0) {
  return typeof v === "number" && Number.isFinite(v) ? `${(v * 100).toFixed(d)} %` : "—"
}
