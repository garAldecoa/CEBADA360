import { ChartNoAxesColumnIncreasing, Map, Package, Target } from "lucide-react"
import type { DatosCebada } from "@/types/cebada360"
import { formatoNumero } from "@/types/cebada360"

export function SummaryCards({ predicciones }: { predicciones: DatosCebada | null }) {
  const m = predicciones?.metadata
  const cards = [
    { name: "Parcelas analizadas", val: m ? String(m.conteos.total) : "…", detail: m ? `${m.conteos.observadas} con rendimiento observado · ${m.conteos.estimadas} estimadas` : "", icon: Map, bg: "linear-gradient(135deg,#c3ead3,#e0f5e8)", ic: "#23764c", ib: "#a5dcb9", border: "#9bcdb0" },
    { name: "Rendimiento estimado promedio (59)", val: m ? `${formatoNumero(m.estimadas.media)} t/ha` : "…", detail: m ? `Rango de las 59 estimadas: ${formatoNumero(m.estimadas.min)} – ${formatoNumero(m.estimadas.max)} t/ha` : "", icon: ChartNoAxesColumnIncreasing, bg: "linear-gradient(135deg,#fff0ad,#fff8d9)", ic: "#8c730d", ib: "#f4df8c", border: "#e5d18e" },
    { name: "Producción estimada (59)", val: m ? `${m.estimadas.produccion_total_t.toLocaleString("es-MX", { maximumFractionDigits: 0 })} t` : "…", detail: "Rendimiento estimado × superficie", icon: Package, bg: "linear-gradient(135deg,#e3d0f5,#f4eafa)", ic: "#794a9b", ib: "#d5b8ed", border: "#c8ade4" },
    { name: "Error de validación (RMSE)", val: m ? `${m.metricas.rmse.toFixed(4)} t/ha` : "…", detail: m ? `MAE ${m.metricas.mae.toFixed(4)} · R² ${m.metricas.r2.toFixed(4)} · validación cruzada 10×5 sobre las 138; no es el error de las 59` : "", icon: Target, bg: "linear-gradient(135deg,#bde3f5,#e0f3ff)", ic: "#2864ae", ib: "#a6d5ee", border: "#9bcce5" },
  ]
  return <section aria-label="Indicadores generales" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
    {cards.map(c => { const Icon = c.icon; return <article key={c.name} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 16, minHeight: 146, padding: 20, boxShadow: "0 4px 14px rgba(25,48,57,.12)", display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ width: 52, height: 52, borderRadius: 14, background: c.ib, color: c.ic, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon size={30} /></div>
      <div><strong style={{ fontSize: c.val.length > 12 ? 22 : 29, color: "#172b3a", fontWeight: 800 }}>{c.val}</strong><p style={{ fontSize: 13, color: "#334155", fontWeight: 600, marginTop: 5 }}>{c.name}</p><p style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>{c.detail}</p></div>
    </article> })}
  </section>
}
