export type SatellitePoint = {
  fecha: string
  ndvi: number | null
  evi: number | null
  lai: number | null
  nubosidad: number
  observaciones: number
}

export type SatelliteData = Record<string, Partial<Record<"Sentinel-2" | "Planet", SatellitePoint[]>>>

export type YieldPrediction = {
  rendimiento_t_ha: number
  limite_inferior_t_ha?: number
  limite_superior_t_ha?: number
  confianza?: number
  riesgo?: "Bajo" | "Medio" | "Alto"
  calidad?: "Alta" | "Media" | "Baja"
  factores_favorables?: string[]
  factores_adversos?: string[]
}

export type PredictionData = Record<string, YieldPrediction>
export type ObservedYields = Record<string, number>
