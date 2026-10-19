/** Datos espaciales extraídos de CHIRTS-ERA5 e INEGI CEM para 197 parcelas. */
export type ClimateMonth = {
  mes: number
  tmin_c: number | null
  tmax_c: number | null
  tmedia_c: number | null
  amplitud_c: number | null
  precipitacion_mm: number | null
}

export type TerritorySummary = {
  elevacion_media_m: number | null
  elevacion_min_m: number | null
  elevacion_max_m: number | null
  elevacion_desv_m: number | null
  elevacion_pixeles: number
  pendiente_media_grados: number | null
  pendiente_min_grados: number | null
  pendiente_max_grados: number | null
  pendiente_desv_grados: number | null
  pendiente_pixeles: number
}

export type ClimateTerritoryRecord = {
  clima: { mensual: ClimateMonth[] }
  territorio: TerritorySummary
}

export type ClimateTerritoryData = {
  metadata: {
    anio: number
    periodo_cultivo: string
    fuentes: {
      temperatura: string
      topografia: string
      precipitacion: string
    }
    metodos: {
      temperatura: string
      topografia: string
      media_temperatura: string
    }
    nota: string
  }
  parcelas: Record<string, ClimateTerritoryRecord>
}
