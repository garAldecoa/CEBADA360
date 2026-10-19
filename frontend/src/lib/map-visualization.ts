import type { ParcelCollection } from "@/types/parcelas"

// Capas del mapa. Las de rendimiento, incertidumbre, crédito y calidad salen de los resultados oficiales
// (public/data/predicciones_cebada360.json, generado desde los CSV del notebook).
export type MapVisualization = "conjunto" | "superficie" | "rendimiento" | "incertidumbre" | "credito" | "calidad"

/** Rendimiento (t/ha): cortes y colores de la capa 1 (observado y estimado en la misma escala). */
export const YIELD_BREAKS = [3.0, 3.5, 4.0, 4.5] as const
export const YIELD_COLORS = ["#bb3a31", "#e59b42", "#f3dc75", "#7dbb71", "#216c48"] as const
export const YIELD_LABELS = ["< 3.0", "3.0–3.5", "3.5–4.0", "4.0–4.5", "≥ 4.5"] as const

/** Capa 2 (v2.6): solo hay dos anchos de intervalo del crédito: común 1.15 y ampliado en Chignahuapan 1.26 t/ha. */
export const UNCERTAINTY_COLORS = { comun: "#b9b3da", ampliado: "#54278f" } as const

export const QUALITY_COLORS: Record<string, string> = { ok: "#2f9e62", "atención": "#efb73e", revisar: "#d0453e" }
export const NO_DATA_COLOR = "#cbd5e1"

export const SURFACE_COLORS = [
  "#f5e8b0", // 20% de parcelas con menor superficie
  "#e5c76a",
  "#abc66a",
  "#68a85c",
  "#25724e", // 20% de parcelas con mayor superficie
] as const

export function surfaceBreaks(datos: ParcelCollection): number[] {
  const areas = datos.features
    .map((parcela) => Number(parcela.properties["área_ha"]))
    .filter(Number.isFinite)
    .sort((a, b) => a - b)

  if (areas.length === 0) return [2, 4, 6, 9]

  return [0.2, 0.4, 0.6, 0.8].map((percentil) => {
    const posicion = (areas.length - 1) * percentil
    const inferior = Math.floor(posicion)
    const superior = Math.ceil(posicion)
    const fraccion = posicion - inferior
    return areas[inferior] + (areas[superior] - areas[inferior]) * fraccion
  })
}

export function formatHectares(value: number) {
  return value.toLocaleString("es-MX", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
}
