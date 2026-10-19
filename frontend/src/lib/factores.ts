import type { ParcelaCebada } from "@/types/cebada360"

/** Resume los factores en favorables y adversos (mismos números de factores.csv, en texto). */
export function factoresEnTexto(parcela: ParcelaCebada) {
  const items = [...parcela.factores.items].sort((a, b) => Math.abs(b.contribucion) - Math.abs(a.contribucion))
  const linea = (f: (typeof items)[number]) => `${f.etiqueta}: ${f.contribucion > 0 ? "+" : ""}${f.contribucion.toFixed(3)} t/ha`
  return {
    favorables: items.filter((f) => f.contribucion > 0.005).map(linea),
    adversos: items.filter((f) => f.contribucion < -0.005).map(linea),
  }
}
