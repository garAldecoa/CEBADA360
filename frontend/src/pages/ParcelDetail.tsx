import { useEffect, useState } from "react"
import { ArrowLeft, BarChart3, ClipboardCheck, Info, Leaf, Package, ShieldAlert, Sprout } from "lucide-react"
import { Header } from "@/components/layout/Header"
import { ParcelMiniMap } from "@/components/parcel/ParcelMiniMap"
import { ParcelTabs } from "@/components/parcel/ParcelTabs"
import { RunModelPanel } from "@/components/parcel/RunModelPanel"
import { FactorsChart } from "@/components/parcel/FactorsChart"
import { factoresEnTexto } from "@/lib/factores"
import { CreditPanel } from "@/components/parcel/CreditPanel"
import { cargarDatosCebada } from "@/lib/datos-cebada"
import type { Parcel, ParcelCollection } from "@/types/parcelas"
import type { SatelliteData, ObservedYields } from "@/types/parcel-detail"
import type { DatosCebada, ParcelaCebada } from "@/types/cebada360"
import { NIVEL_COLORES } from "@/types/cebada360"
import type { ClimateTerritoryData } from "@/types/clima-territorio"

type Props = { id: string; onBack: () => void; onAnalysis: () => void; onCompare: () => void }
type Bundle = { geojson: ParcelCollection; satelite: SatelliteData; observados: ObservedYields; cebada: DatosCebada; climaTerritorio: ClimateTerritoryData }
type IconComponent = typeof Leaf

function formatNumber(value: number, decimals = 2) {
  return value.toLocaleString("es-MX", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function MetricCard({ icon: Icon, value, label, note, theme }: {
  icon: IconComponent
  value: string
  label: string
  note?: string
  theme: "green" | "gold" | "blue" | "purple"
}) {
  const palettes = {
    green: {
      background: "linear-gradient(135deg, #c3ead3, #e0f5e8)",
      border: "#9bcdb0",
      iconBackground: "#a5dcb9",
      iconColor: "#23764c",
    },
    gold: {
      background: "linear-gradient(135deg, #fff0ad, #fff8d9)",
      border: "#e5d18e",
      iconBackground: "#f4df8c",
      iconColor: "#8c730d",
    },
    blue: {
      background: "linear-gradient(135deg, #bde3f5, #e0f3ff)",
      border: "#9bcce5",
      iconBackground: "#a6d5ee",
      iconColor: "#2864ae",
    },
    purple: {
      background: "linear-gradient(135deg, #e3d0f5, #f4eafa)",
      border: "#c8ade4",
      iconBackground: "#d5b8ed",
      iconColor: "#794a9b",
    },
  } as const

  const palette = palettes[theme]

  return (
    <article
      style={{
        background: palette.background,
        border: `1px solid ${palette.border}`,
        borderRadius: "16px",
        padding: "20px",
        minHeight: "115px",
        boxShadow: "0 4px 14px rgba(25,48,57,0.12)",
        display: "flex",
        alignItems: "center",
        gap: "16px",
      }}
    >
      <div
        style={{
          width: "52px",
          height: "52px",
          borderRadius: "14px",
          backgroundColor: palette.iconBackground,
          color: palette.iconColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={34} strokeWidth={1.8} aria-hidden="true" />
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ color: "#172b3a", fontSize: "23px", fontWeight: 800, lineHeight: 1.2, margin: 0 }}>
          {value}
        </p>
        <p style={{ color: "#334155", fontSize: "14px", fontWeight: 500, marginTop: "6px" }}>
          {label}
        </p>
        {note && (
          <p style={{ color: "#64748b", fontSize: "12px", marginTop: "4px" }}>
            {note}
          </p>
        )}
      </div>
    </article>
  )
}

function ScenarioPanel({ p, area }: { p: ParcelaCebada; area: number }) {
  const positions = ["#b91c1c", "#2563eb", "#15803d"]
  if (p.tipo === "observado") {
    return (
      <section className="h-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <h3 className="text-lg font-bold text-slate-950">Rendimiento observado y validación</h3>
        <p className="mt-1 text-sm text-slate-500">Parcela de entrenamiento: su rendimiento es un dato real del reto.</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-emerald-50 p-4 text-center"><p className="text-sm font-semibold text-emerald-900">Observado</p><p className="mt-2 text-2xl font-extrabold text-slate-950">{formatNumber(p.rendimiento_t_ha)} t/ha</p></div>
          <div className="rounded-xl bg-slate-50 p-4 text-center"><p className="text-sm font-semibold text-slate-700">Predicción de validación (fuera de fold)</p><p className="mt-2 text-2xl font-extrabold text-slate-950">{p.y_pred_fuera_de_fold !== undefined ? `${formatNumber(p.y_pred_fuera_de_fold)} t/ha` : "—"}</p></div>
        </div>
        <p className="mt-3 rounded-lg bg-sky-50 p-3 text-xs leading-relaxed text-sky-950">Parcela con rendimiento observado: no se predice. Su predicción fuera de fold sirve solo para medir el error del modelo (resultados_I3/predicciones.csv, repetición 0).</p>
      </section>
    )
  }
  const lower = p.y_lo80!, central = p.rendimiento_t_ha, upper = p.y_hi80!
  return (
    <section className="h-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
      <h3 className="text-lg font-bold text-slate-950">Escenarios de rendimiento</h3>
      <p className="mt-1 text-sm text-slate-500">Rendimiento y producción con el intervalo empírico de referencia (nominal 80 %).</p>
      <div className="mt-4 rounded-xl bg-gradient-to-r from-rose-50 via-blue-50 to-green-50 p-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          {([["Adverso", lower], ["Central", central], ["Favorable", upper]] as const).map(([label, value], index) => (
            <div key={label}>
              <p className="text-sm font-semibold" style={{ color: positions[index] }}>{label}</p>
              <p className="mt-2 text-base font-bold text-slate-950 sm:text-xl">{formatNumber(value)} t/ha</p>
              <p className="mt-1 text-sm text-slate-700">{formatNumber(value * area, 1)} t</p>
            </div>
          ))}
        </div>
        <div className="relative mx-5 mt-7 h-1.5 rounded-full bg-gradient-to-r from-red-300 via-blue-300 to-green-300">
          {["0%", "50%", "100%"].map((left, index) => (
            <span key={left} className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-sm" style={{ left, backgroundColor: positions[index] }} />
          ))}
        </div>
        <div className="mt-4 flex justify-between text-xs text-slate-500"><span>Menor rendimiento</span><span>Mayor rendimiento</span></div>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-slate-500">
        Intervalo empírico (nominal 80 %, paso E · simétrico): {formatNumber(lower)} – {formatNumber(upper)} t/ha.
        {p.intervalo_credito && <> Intervalo del módulo de crédito (paso 27, asimétrico): {formatNumber(p.intervalo_credito.lo)} – {formatNumber(p.intervalo_credito.hi)} t/ha · {p.intervalo_credito.tipo}.</>} Ninguno tiene garantía de cobertura en parcelas nuevas.
      </p>
    </section>
  )
}

function ExplanationPanel({ p, media }: { p: ParcelaCebada; media: number | null }) {
  const { favorables, adversos } = factoresEnTexto(p)
  const categories = [
    { title: "Factores que elevan la estimación", items: favorables, positive: true },
    { title: "Factores que la reducen", items: adversos, positive: false },
  ]
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-950">¿De dónde sale este valor? <Info className="ml-1 inline h-4 w-4 text-slate-400" /></h3>
          <p className="mt-1 text-sm text-slate-500">Descomposición aditiva (no SHAP, no causal): cuánto aporta cada factor respecto al promedio de entrenamiento.</p>
        </div>
        <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600">resultados_I3/factores.csv</span>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <FactorsChart parcela={p} media={media} />
        <div className="grid content-start gap-3">
          {categories.map((cat) => (
            <div key={cat.title} className={`rounded-xl p-4 ${cat.positive ? "bg-emerald-50/70" : "bg-rose-50/70"}`}>
              <h4 className={`flex items-center gap-2 text-sm font-bold ${cat.positive ? "text-emerald-900" : "text-rose-800"}`}>
                <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-lg text-white ${cat.positive ? "bg-emerald-700" : "bg-rose-700"}`}>{cat.positive ? "↑" : "↓"}</span>
                {cat.title}
              </h4>
              {cat.items.length ? <ul className="mt-3 space-y-1.5 pl-3 text-sm text-slate-700">{cat.items.map((item) => <li key={item}>• {item}</li>)}</ul>
                : <p className="mt-3 text-sm text-slate-500">Ningún factor con aporte relevante en este sentido.</p>}
            </div>
          ))}
          <p className="text-xs leading-relaxed text-slate-500">Vecinas, municipio y patrón espacial dependen de la ubicación: son asociaciones, no causas.</p>
        </div>
      </div>
    </section>
  )
}

function DetailContent({ id, parcela, bundle, onBack, onAnalysis, onCompare }: { id: string; parcela: Parcel; bundle: Bundle; onBack: () => void; onAnalysis: () => void; onCompare: () => void }) {
  const area = Number(parcela.properties["área_ha"])
  const p = bundle.cebada.parcelas[id]
  const estimada = p?.tipo === "estimado"
  const nivel = p?.credito?.nivel

  return (
    <div className="min-h-screen bg-slate-100">
      <Header />
      <section className="relative overflow-hidden border-b border-slate-200">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/images/hero-cebada.jpg')", backgroundColor: "#dce8df" }} />
        <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/75 to-white/65" />
        <div className="relative mx-auto flex max-w-[1600px] flex-wrap items-end justify-between gap-4 px-5 py-5 md:px-8">
          <div>
            <button type="button" onClick={onBack} className="mb-3 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white/90 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-white">
              <ArrowLeft className="h-4 w-4" />Volver al mapa
            </button>
            <h1 className="flex items-center gap-3 text-3xl font-extrabold tracking-tight text-slate-950 md:text-4xl">
              <Sprout className="h-9 w-9 text-emerald-800" />Parcela {id}
            </h1>
            <p className="ml-12 mt-1 text-sm text-slate-800 sm:text-base">
              {parcela.properties.Municipio}, {parcela.properties.Estado} · Conjunto {parcela.properties.CONJUNTO} · {formatNumber(area)} ha · calidad del dato: {p?.calidad ?? "—"}
            </p>
          </div>
          <div className="flex min-w-[190px] items-center gap-3 rounded-xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm">
            <ShieldAlert className="h-8 w-8" style={{ color: nivel ? NIVEL_COLORES[nivel] ?? "#64748b" : "#64748b" }} />
            {estimada
              ? <div><p className="text-sm font-semibold first-letter:uppercase text-slate-900">Indicador: {nivel ?? "—"}</p><p className="text-xs text-slate-500">Escenario de crédito simulado</p></div>
              : <div><p className="text-sm font-semibold text-slate-900">Rendimiento observado</p><p className="text-xs text-slate-500">Parcela de entrenamiento</p></div>}
          </div>
        </div>
      </section>
      <main className="mx-auto max-w-[1600px] space-y-3 px-4 py-4 md:px-7">
        {p?.detalle && p.detalle.nota !== "ok" && (
          <div role="status" className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">Nota del paso 19: {p.detalle.nota}</div>
        )}
        {p?.detalle && p.detalle.n_entrenamiento_municipio < 3 && (
          <div role="status" className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            Su municipio tiene &lt; 3 parcelas con dato ({p.detalle.n_entrenamiento_municipio}): el promedio municipal se apoya en muy pocas observaciones y la predicción es menos estable (desviación bootstrap {p.detalle.sd_bootstrap.toFixed(3)} t/ha). Parcela de revisión manual del paso 19.
          </div>
        )}
        {!p ? <p role="alert" className="rounded-xl bg-white p-6">No hay resultados del modelo para {id}.</p> : <>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={Leaf} theme="green" label={estimada ? "Rendimiento estimado" : "Rendimiento observado"} note={estimada ? "Modelo final · entrega oficial" : "Dato real del reto"} value={`${formatNumber(p.rendimiento_t_ha)} t/ha`} />
          <MetricCard icon={Package} theme="gold" label={estimada ? "Producción estimada" : "Producción observada"} note="Rendimiento × área" value={`${formatNumber(p.produccion_t, 1)} t`} />
          {estimada
            ? <MetricCard icon={BarChart3} theme="blue" label="Intervalo empírico" note="Nominal 80 % · paso E · sin garantía de cobertura" value={`${formatNumber(p.y_lo80!)}–${formatNumber(p.y_hi80!)} t/ha`} />
            : <MetricCard icon={BarChart3} theme="blue" label="Predicción de validación" note="Fuera de fold · solo para medir el error" value={p.y_pred_fuera_de_fold !== undefined ? `${formatNumber(p.y_pred_fuera_de_fold)} t/ha` : "—"} />}
          <MetricCard icon={ClipboardCheck} theme="purple" label="Calidad de información" note={p.banderas.length ? `${p.banderas.length} bandera(s) · ver pestaña Datos` : "Sin banderas de revisión"} value={p.calidad} />
        </div>
        <div className="grid gap-3 xl:grid-cols-2">
          <ScenarioPanel p={p} area={area} />
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
            <h3 className="mb-3 text-lg font-bold text-slate-950">Ubicación de la parcela</h3>
            <ParcelMiniMap datos={bundle.geojson} parcela={parcela} />
          </section>
        </div>
        {estimada && <RunModelPanel id={id} />}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600">Consulta cómo se forma la estimación y compárala con otras parcelas.</p>
          <div className="flex flex-wrap gap-2"><button type="button" onClick={onCompare} className="rounded-xl border border-emerald-800 bg-white px-5 py-3 text-sm font-semibold text-emerald-900 hover:bg-emerald-50">Comparar con otra parcela ↔</button><button type="button" onClick={onAnalysis} className="rounded-xl bg-emerald-900 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800">Ver análisis detallado →</button></div>
        </div>
        <ExplanationPanel p={p} media={bundle.cebada.metadata.media_entrenamiento} />
        {estimada && <CreditPanel id={id} parcela={p} />}
        </>}
        <ParcelTabs parcela={parcela} satellite={bundle.satelite} observed={bundle.observados} climaTerritorio={bundle.climaTerritorio} cebada={p ?? null} />
      </main>
    </div>
  )
}

export function ParcelDetail({ id, onBack, onAnalysis, onCompare }: Props) {
  const [bundle, setBundle] = useState<Bundle | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      try {
        const readJson = async (path: string) => {
          const response = await fetch(path, { signal: controller.signal })
          if (!response.ok) throw new Error(`No se pudo leer ${path} (HTTP ${response.status})`)
          return response.json() as Promise<unknown>
        }
        const [geojson, satelite, observados, climaTerritorio, cebada] = await Promise.all([
          readJson("/data/parcelas_agrocebada.geojson"),
          readJson("/data/satelite_2025.json"),
          readJson("/data/rendimientos_observados_2025.json"),
          readJson("/data/clima_territorio_2025.json"),
          cargarDatosCebada(),
        ])
        if (!controller.signal.aborted) setBundle({
          geojson: geojson as ParcelCollection,
          satelite: satelite as SatelliteData,
          observados: observados as ObservedYields,
          cebada,
          climaTerritorio: climaTerritorio as ClimateTerritoryData,
        })
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("No se pudo cargar la ficha:", err)
          setError(err instanceof Error ? err.message : "Error desconocido al cargar datos")
        }
      }
    }
    void load()
    return () => controller.abort()
  }, [])

  if (error) return (
    <div className="min-h-screen bg-slate-100"><Header />
      <main className="mx-auto max-w-3xl p-8"><button onClick={onBack} className="mb-6 font-medium text-emerald-800">← Volver al mapa</button>
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">{error}. Comprueba los archivos de <code>public/data</code>.</div>
      </main>
    </div>
  )
  if (!bundle) return (
    <div className="min-h-screen bg-slate-100"><Header />
      <main role="status" className="mx-auto max-w-3xl p-12 text-center text-slate-600">Cargando información de {id}…</main>
    </div>
  )

  const parcela = bundle.geojson.features.find((item) => item.properties.ID_POLIGON === id)
  if (!parcela) return (
    <div className="min-h-screen bg-slate-100"><Header />
      <main className="mx-auto max-w-3xl p-8"><button onClick={onBack} className="mb-6 font-medium text-emerald-800">← Volver al mapa</button>
        <p role="alert" className="rounded-xl bg-white p-8 text-slate-800">No existe la parcela {id} en el GeoJSON.</p>
      </main>
    </div>
  )

  return <DetailContent id={id} parcela={parcela} bundle={bundle} onBack={onBack} onAnalysis={onAnalysis} onCompare={onCompare} />
}
