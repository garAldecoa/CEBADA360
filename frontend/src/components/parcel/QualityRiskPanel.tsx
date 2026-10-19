import { useEffect, useState } from "react"
import { ClipboardCheck, CloudRain, Info } from "lucide-react"

type Calidad = { estado: string; total: number; distancia_vecinas_km: number | null; banderas: Record<string, number> }
type Senales = { nivel_indicador: number; meses_secos_jun_sep: number; canicula_jul_ago_pct: number; temporada_may_oct_pct: number; lluvia_cosecha_oct_mm: number; lluvia_cosecha_oct_pct: number; tmin_sep_oct_c: number }
type Response = { parcelas: Record<string, { calidad: Calidad; senales_climaticas: Senales }> }
const nombres: Record<string, string> = {
  bq_doble_joroba: "Curva vegetal de doble pico",
  bq_pico_en_borde: "Pico vegetal cerca del límite temporal",
  bq_pocas_imagenes: "Pocas imágenes válidas",
  bq_hueco_largo: "Intervalo largo sin observaciones",
  bq_lejos_de_entrenamiento: "Lejos de parcelas de entrenamiento",
  bq_ciclo_corto: "Ciclo vegetal corto",
  bq_rend_redondo: "Rendimiento reportado redondeado",
  bq_rend_atipico: "Rendimiento reportado atípico",
}
export function QualityRiskPanel({ id }: { id: string }) {
  const [data, setData] = useState<Response | null>(null)
  const [error, setError] = useState("")
  useEffect(() => {
    const abort = new AbortController()
    fetch("/data/indicadores_calidad_riesgo.json", { signal: abort.signal })
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() as Promise<Response> })
      .then(setData)
      .catch((e: unknown) => { if (!abort.signal.aborted) setError(String(e)) })
    return () => abort.abort()
  }, [])
  if (error) return <div className="p-4 text-red-700">Error cargando indicadores: {error}</div>
  if (!data) return <div className="p-4">Cargando indicadores…</div>
  const actual = data.parcelas[id]
  if (!actual) return <div className="p-4">No hay indicadores disponibles para {id}.</div>
  const { calidad: c, senales_climaticas: s } = actual
  const activas = Object.entries(c.banderas).filter(([, v]) => v === 1).map(([k]) => nombres[k] ?? k)
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-xl border border-slate-200 p-4" style={{ background: "#effaf2" }}>
        <h3 className="flex items-center gap-2 text-lg font-bold"><ClipboardCheck size={20} color="#166534" />Control de calidad de datos</h3>
        <p className="mt-2 text-sm"><strong>Estado de revisión:</strong> {c.estado.toUpperCase()}</p>
        <p className="mt-1 text-sm"><strong>Banderas de control:</strong> {c.total}</p>
        <p className="mt-1 text-sm"><strong>Distancia media a vecinas:</strong> {c.distancia_vecinas_km?.toFixed(2) ?? "—"} km</p>
        <div className="mt-3 text-sm"><strong>Observaciones:</strong>{activas.length ? <ul className="mt-2 list-disc space-y-1 pl-5">{activas.map((nombre) => <li key={nombre}>{nombre}</li>)}</ul> : <p className="mt-1">Sin banderas activas en el archivo fuente.</p>}</div>
        <p className="mt-3 text-xs text-slate-600">Una bandera de revisión no equivale por sí misma a una probabilidad ni a una categoría de incertidumbre predictiva.</p>
      </section>
      <section className="rounded-xl border border-amber-200 p-4" style={{ background: "#fff7e0" }}>
        <h3 className="flex items-center gap-2 text-lg font-bold"><CloudRain size={20} color="#a16207" />Señales climáticas observadas</h3>
        <p className="mt-2 text-sm"><strong>Indicador climático registrado:</strong> {s.nivel_indicador}</p>
        <p className="mt-1 text-sm"><strong>Meses secos (jun–sep):</strong> {s.meses_secos_jun_sep}</p>
        <p className="mt-1 text-sm"><strong>Lluvia de octubre:</strong> {s.lluvia_cosecha_oct_mm.toFixed(1)} mm</p>
        <p className="mt-1 text-sm"><strong>Octubre vs referencia:</strong> {s.lluvia_cosecha_oct_pct.toFixed(1)} %</p>
        <p className="mt-1 text-sm"><strong>Lluvia may–oct vs referencia:</strong> {s.temporada_may_oct_pct.toFixed(1)} %</p>
        <p className="mt-1 text-sm"><strong>Jul–ago vs referencia:</strong> {s.canicula_jul_ago_pct.toFixed(1)} %</p>
        <p className="mt-1 text-sm"><strong>T. mínima sep–oct:</strong> {s.tmin_sep_oct_c.toFixed(1)} °C</p>
        <p className="mt-3 flex items-start gap-2 text-xs text-amber-900"><Info size={16} className="shrink-0" />El campo «riesgo_nivel» procede del archivo de señales climáticas. No es el semáforo ni la probabilidad de bajo rendimiento del Integrante 4.</p>
      </section>
    </div>
  )
}
