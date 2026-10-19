import { useEffect, useState } from "react"
import { CloudRain, Info } from "lucide-react"
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

type MesLluvia = { mes: number; precipitacion_2025_mm: number | null; precipitacion_media_2022_2024_mm: number | null }
type LluviaJson = { parcelas: Record<string, MesLluvia[]> }
const nombres = ["", "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
function suma(xs: Array<number | null>) { return xs.every((v) => typeof v === "number") ? xs.reduce<number>((a, b) => a + (b ?? 0), 0) : null }
function mostrar(n: number | null) { return n === null ? "—" : `${n.toFixed(1)} mm` }

export function RainfallPanel({ id, periodo }: { id: string; periodo: "ciclo" | "anual" }) {
  const [data, setData] = useState<LluviaJson | null>(null)
  const [error, setError] = useState("")
  useEffect(() => {
    const abort = new AbortController()
    fetch("/data/precipitacion_2025_historico.json", { signal: abort.signal })
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() as Promise<LluviaJson> })
      .then(setData)
      .catch((e: unknown) => { if (!abort.signal.aborted) setError(String(e)) })
    return () => abort.abort()
  }, [])
  if (error) return <p className="rounded-xl border border-red-200 p-4 text-sm text-red-700">No se pudo cargar la lluvia: {error}</p>
  if (!data) return <p className="rounded-xl border p-4 text-sm">Cargando precipitación…</p>
  const meses = data.parcelas[id]?.filter((m) => periodo === "anual" || (m.mes >= 4 && m.mes <= 10))
  if (!meses?.length) return <p className="p-4 text-sm">No hay precipitación para {id}.</p>
  const total2025 = suma(meses.map((m) => m.precipitacion_2025_mm))
  const totalHistorico = suma(meses.map((m) => m.precipitacion_media_2022_2024_mm))
  const cambio = total2025 !== null && totalHistorico !== null && totalHistorico > 0 ? ((total2025 / totalHistorico) - 1) * 100 : null
  const rows = meses.map((m) => ({ ...m, nombre: nombres[m.mes] }))
  return (
    <section className="space-y-4 rounded-xl border border-sky-200 bg-white p-4" aria-label="Precipitación mensual">
      <div>
        <h4 className="flex items-center gap-2 font-bold text-slate-900"><CloudRain size={20} color="#2563eb" /> Precipitación mensual · 2025 vs. 2022–2024</h4>
        <p className="text-sm text-slate-600">El promedio 2022–2024 se usa como referencia climática mensual, no como predicción.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-sky-200 p-3" style={{ backgroundColor: "#e0f2fe" }}><p className="text-xs">Acumulado 2025</p><strong className="text-xl">{mostrar(total2025)}</strong></div>
        <div className="rounded-xl border border-slate-200 p-3" style={{ backgroundColor: "#f1f5f9" }}><p className="text-xs">Referencia 2022–2024</p><strong className="text-xl">{mostrar(totalHistorico)}</strong></div>
        <div className="rounded-xl border border-amber-200 p-3" style={{ backgroundColor: "#fef3c7" }}><p className="text-xs">Diferencia relativa</p><strong className="text-xl">{cambio === null ? "—" : `${cambio > 0 ? "+" : ""}${cambio.toFixed(1)} %`}</strong></div>
      </div>
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 10, right: 20, left: -12, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="nombre" /><YAxis unit=" mm" tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v, name) => [typeof v === "number" ? `${v.toFixed(1)} mm` : "—", name]} />
            <Legend />
            <Bar dataKey="precipitacion_2025_mm" name="Lluvia 2025" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={42} />
            <Line dataKey="precipitacion_media_2022_2024_mm" name="Promedio 2022–2024" stroke="#b45309" strokeWidth={2.5} dot={{ r: 3 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="overflow-x-auto"><table className="w-full min-w-[360px] text-sm"><thead className="bg-slate-50"><tr><th className="p-2 text-left">Mes</th><th className="p-2 text-right">2025 (mm)</th><th className="p-2 text-right">2022–2024 (mm)</th></tr></thead><tbody>{meses.map((m) => <tr className="border-t" key={m.mes}><td className="p-2">{nombres[m.mes]}</td><td className="p-2 text-right">{m.precipitacion_2025_mm?.toFixed(1) ?? "—"}</td><td className="p-2 text-right">{m.precipitacion_media_2022_2024_mm?.toFixed(1) ?? "—"}</td></tr>)}</tbody></table></div>
      <p className="flex items-start gap-2 text-xs text-slate-600"><Info size={16} className="shrink-0" />Fuente: datos_app/clima_mensual.csv del equipo I1/I2 (precipitación CHIRPS procesada). Los valores representan información raster regional, no mediciones de un pluviómetro en la parcela.</p>
    </section>
  )
}
