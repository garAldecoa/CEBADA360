import { useEffect, useState } from "react"
import { ArrowLeft, BarChart3, Database, Globe2, Info, Leaf, ShieldAlert } from "lucide-react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Header } from "@/components/layout/Header"
import { FactorsChart } from "@/components/parcel/FactorsChart"
import { factoresEnTexto } from "@/lib/factores"
import { RunModelPanel } from "@/components/parcel/RunModelPanel"
import { useDatosCebada } from "@/lib/datos-cebada"
import { formatoNumero, formatoPct } from "@/types/cebada360"

type Tab = "local" | "global" | "technical"
type Modelo = { modelo: string; familia: string; RMSE: number; RMSE_sd: number; MAE: number; R2: number }

const styles = {
  green: { background: "linear-gradient(135deg,#c3ead3,#e0f5e8)", border: "#9bcdb0", color: "#23764c" },
  gold: { background: "linear-gradient(135deg,#fff0ad,#fff8d9)", border: "#e5d18e", color: "#8c730d" },
  blue: { background: "linear-gradient(135deg,#bde3f5,#e0f3ff)", border: "#9bcce5", color: "#2864ae" },
} as const

function Indicator({ icon: Icon, title, value, theme }: {
  icon: typeof Leaf; title: string; value: string; theme: keyof typeof styles
}) {
  const palette = styles[theme]
  return <article className="flex min-h-28 items-center gap-4 rounded-2xl p-5 shadow-sm" style={{ background: palette.background, border: `1px solid ${palette.border}` }}>
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ background: "#ffffff80", color: palette.color }}><Icon size={30} /></div>
    <div className="min-w-0"><p className="text-xl font-extrabold first-letter:uppercase text-slate-950 md:text-2xl">{value}</p><p className="text-sm text-slate-700">{title}</p></div>
  </article>
}

export function PredictionAnalysis({ id, onBack }: { id: string; onBack: () => void }) {
  const [tab, setTab] = useState<Tab>("local")
  const { datos, error } = useDatosCebada()
  const [modelos, setModelos] = useState<Modelo[]>([])

  useEffect(() => {
    const controller = new AbortController()
    fetch("/data/metodologia_validacion.json", { signal: controller.signal })
      .then(r => r.ok ? r.json() : null)
      .then((v: { modelos?: Modelo[] } | null) => { if (v?.modelos) setModelos(v.modelos) })
      .catch(() => { /* la tabla es opcional */ })
    return () => controller.abort()
  }, [])

  const p = datos?.parcelas[id]
  const estimada = p?.tipo === "estimado"
  const cards = [
    { id: "local", title: "Explicación local", description: "¿De dónde sale el valor de esta parcela?", icon: BarChart3 },
    { id: "global", title: "Importancia global", description: "¿Qué factores pesan más en general?", icon: Globe2 },
    { id: "technical", title: "Detalle técnico", description: "Datos, componentes y ejecución del modelo", icon: Database },
  ] as const
  const texto = p ? factoresEnTexto(p) : null

  return <div className="min-h-screen bg-slate-100 text-slate-950">
    <Header />
    <section className="relative overflow-hidden border-b border-slate-200">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/images/hero-cebada.jpg')", backgroundColor: "#dce8df" }} />
      <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/75 to-white/65" />
      <div className="relative mx-auto max-w-[1600px] px-5 py-6 md:px-8">
        <button type="button" onClick={onBack} className="mb-3 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-700 shadow-sm"><ArrowLeft size={17}/> Volver a {id}</button>
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Análisis de la predicción</h1>
        <p className="mt-2 flex items-center gap-2 text-lg font-semibold"><Leaf className="text-emerald-700"/> Parcela {id}</p>
        <p className="ml-8 text-sm text-slate-700">{p ? `${p.municipio}, ${p.estado} · ${formatoNumero(p.area_ha)} ha · Conjunto: ${p.conjunto}` : "…"}</p>
      </div>
    </section>
    <main className="mx-auto max-w-[1600px] space-y-4 px-4 py-5 md:px-7">
      {!datos && !error && <p role="status" className="rounded-xl bg-white p-6">Cargando análisis de {id}…</p>}
      {error && <p role="alert" className="rounded-xl border border-rose-300 bg-rose-50 p-5 text-rose-800">{error}</p>}
      {datos && !p && <p role="alert" className="rounded-xl bg-white p-6">No existe la parcela {id}.</p>}
      {datos && p && <>
        <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-950"><strong>Modelo final CEBADA360.</strong> Las explicaciones son una descomposición aditiva contable del ensamble (resultados_I3/factores.csv): no son valores SHAP ni efectos causales. {estimada ? "" : "En esta parcela de entrenamiento explican el ajuste del modelo final, no la predicción fuera de fold."}</div>
        <div className="grid gap-3 md:grid-cols-3">
          <Indicator icon={Leaf} theme="green" title={estimada ? "Rendimiento estimado" : "Rendimiento observado"} value={`${formatoNumero(p.rendimiento_t_ha, estimada ? 4 : 2)} t/ha`}/>
          {estimada
            ? <Indicator icon={ShieldAlert} theme="gold" title={`Indicador de crédito simulado · prob. modelada ${formatoPct(p.credito?.prob_ingreso_insuficiente)}`} value={p.credito?.nivel ?? "—"}/>
            : <Indicator icon={ShieldAlert} theme="gold" title="Predicción de validación (fuera de fold)" value={`${formatoNumero(p.y_pred_fuera_de_fold, 4)} t/ha`}/>}
          {estimada
            ? <Indicator icon={BarChart3} theme="blue" title="Intervalo empírico (nominal 80 %)" value={`${formatoNumero(p.y_lo80)}–${formatoNumero(p.y_hi80)} t/ha`}/>
            : <Indicator icon={BarChart3} theme="blue" title="Error de validación de esta parcela" value={`${formatoNumero((p.rendimiento_t_ha) - (p.y_pred_fuera_de_fold ?? NaN), 4)} t/ha`}/>}
        </div>
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-1 bg-slate-100 p-1 md:grid-cols-3" role="tablist" aria-label="Vistas del análisis">
            {cards.map(item => {
              const Icon = item.icon
              return <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} onClick={() => setTab(item.id)} className={`flex items-center justify-center gap-3 rounded-xl px-4 py-4 text-left transition-colors ${tab === item.id ? "bg-emerald-900 text-white" : "bg-white text-slate-700 hover:bg-slate-50"}`}>
                <Icon size={24}/><span><strong className="block text-sm">{item.title}</strong><span className="block text-xs opacity-80">{item.description}</span></span>
              </button>
            })}
          </div>
          {tab === "local" && <div className="grid gap-5 p-5 lg:grid-cols-[1.4fr_1fr]" role="tabpanel">
            <div><h2 className="text-xl font-bold">Descomposición aditiva (no SHAP, no causal)</h2><p className="mt-1 text-sm text-slate-500">Cuánto aporta cada factor, en t/ha, respecto a la media de entrenamiento ({datos.metadata.media_entrenamiento.toFixed(4)} t/ha).</p>
              <div className="mt-4"><FactorsChart parcela={p} media={datos.metadata.media_entrenamiento} /></div>
            </div>
            <div><h2 className="text-xl font-bold">Interpretación principal</h2><p className="mt-1 text-sm text-slate-500">Los mismos números, en texto.</p>
              <div className="mt-4 space-y-3">
                <div className="rounded-xl bg-emerald-50 p-4"><strong className="text-sm text-emerald-900">Elevan la estimación</strong>{texto?.favorables.length ? <ul className="mt-2 space-y-1 text-sm">{texto.favorables.map(t => <li key={t}>• {t}</li>)}</ul> : <p className="mt-2 text-sm text-slate-600">Ninguno relevante.</p>}</div>
                <div className="rounded-xl bg-rose-50 p-4"><strong className="text-sm text-rose-800">La reducen</strong>{texto?.adversos.length ? <ul className="mt-2 space-y-1 text-sm">{texto.adversos.map(t => <li key={t}>• {t}</li>)}</ul> : <p className="mt-2 text-sm text-slate-600">Ninguno relevante.</p>}</div>
                <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-slate-700"><Info className="mb-2 text-sky-700" size={18}/>Vecinas, promedio del municipio y patrón espacial dependen todos de la ubicación, así que no son variables independientes. La lluvia y la amplitud térmica del crecimiento entran por el Ridge.</div>
              </div>
            </div>
          </div>}
          {tab === "global" && <div className="grid gap-5 p-5 lg:grid-cols-2" role="tabpanel">
            <div><h2 className="text-xl font-bold">Importancia global del modelo</h2><p className="mt-1 text-sm text-slate-600">Contribución media absoluta de cada factor sobre las 197 parcelas (t/ha). Común a todas las parcelas.</p>
              <div className="mt-4 h-[260px]"><ResponsiveContainer width="100%" height="100%">
                <BarChart data={datos.metadata.importancia_global} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid horizontal={false} stroke="#e5e7eb" />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => Number(v).toFixed(2)} />
                  <YAxis type="category" dataKey="etiqueta" width={210} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [`${Number(v).toFixed(4)} t/ha`, "Contribución media absoluta"]} />
                  <Bar dataKey="media_abs_t_ha" fill="#2a6f97" radius={[3, 3, 3, 3]} />
                </BarChart>
              </ResponsiveContainer></div>
              <p className="mt-2 text-xs text-slate-500">Gráfica elaborada por la web a partir de resultados_I3/factores.csv (media de |contribución|). Ubicación (municipio, patrón espacial y vecinas) domina; el clima del crecimiento aporta poco por parcela, aunque mejora el RMSE de validación (0.4995 → 0.4963).</p>
            </div>
            <figure><img src="/figs/importancia_factores.png" alt="Figura oficial de importancia de factores" className="w-full rounded-xl border border-slate-200" /><figcaption className="mt-2 text-xs text-slate-500">Figura oficial · resultados_I3/figs/importancia_factores.png</figcaption></figure>
          </div>}
          {tab === "technical" && <div className="space-y-5 p-5" role="tabpanel">
            <div><h2 className="text-xl font-bold">Detalle técnico de la estimación</h2><p className="mt-1 text-sm text-slate-500">Valores de los archivos oficiales para {id}.</p>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{(estimada && p.detalle ? [
                ["Fuente", "resultados_I3/ENTREGA/predicciones_59_detalle.csv"], ["Predicción (entrega)", `${formatoNumero(p.rendimiento_t_ha, 4)} t/ha`],
                ["Intervalo 80 % (paso E)", `${formatoNumero(p.y_lo80, 4)}–${formatoNumero(p.y_hi80, 4)} t/ha`], ["Intervalo 90 % (paso E)", `${formatoNumero(p.y_lo90, 4)}–${formatoNumero(p.y_hi90, 4)} t/ha`],
                ["Componente Ridge", `${formatoNumero(p.detalle.comp_ridge, 4)} t/ha`], ["Componente municipio", `${formatoNumero(p.detalle.comp_municipio, 4)} t/ha`],
                ["Componente espacial (GP)", `${formatoNumero(p.detalle.comp_espacial, 4)} t/ha`], ["Vecinas k=12 (IDW)", `${formatoNumero(p.detalle.rend_vecinas_k12, 4)} t/ha`],
                ["Desviación bootstrap", `${formatoNumero(p.detalle.sd_bootstrap, 4)} t/ha`], ["Distancia media a vecinas", `${formatoNumero(p.detalle.dist_media_vecinas_km, 2)} km`],
                ["Parcelas con dato en su municipio", String(p.detalle.n_entrenamiento_municipio)], ["Nota del paso 19", p.detalle.nota],
              ] : [
                ["Fuente", "resultados_I3/predicciones.csv · datos_visor.csv"], ["Rendimiento observado", `${formatoNumero(p.rendimiento_t_ha)} t/ha`],
                ["Predicción fuera de fold", `${formatoNumero(p.y_pred_fuera_de_fold, 4)} t/ha`], ["Calidad del dato", p.calidad],
              ]).map(([k,v]) => <div key={k} className="rounded-xl bg-slate-50 p-4"><dt className="text-xs text-slate-500">{k}</dt><dd className="mt-1 break-words font-semibold text-slate-900">{v}</dd></div>)}</dl>
              {estimada && <p className="mt-2 text-xs text-slate-500">La desviación bootstrap mide estabilidad del entrenamiento; no es un intervalo.</p>}
            </div>
            {estimada && <RunModelPanel id={id} />}
            {modelos.length > 0 && <div>
              <h3 className="text-lg font-bold">Modelos evaluados</h3>
              <p className="mt-1 text-sm text-slate-500">{datos.metadata.nota_metricas}</p>
              <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200"><table className="w-full min-w-[640px] text-sm">
                <thead className="bg-slate-100 text-left"><tr><th className="p-2">Modelo</th><th className="p-2">Familia</th><th className="p-2 text-right">RMSE</th><th className="p-2 text-right">MAE</th><th className="p-2 text-right">R²</th></tr></thead>
                <tbody>{modelos.map(m => <tr key={m.modelo} className={`border-t border-slate-100 ${m.familia === "seleccionado" ? "bg-emerald-50 font-semibold" : ""}`}><td className="p-2">{m.modelo}</td><td className="p-2">{m.familia}</td><td className="p-2 text-right tabular-nums">{m.RMSE.toFixed(4)} ± {m.RMSE_sd.toFixed(4)}</td><td className="p-2 text-right tabular-nums">{m.MAE.toFixed(4)}</td><td className="p-2 text-right tabular-nums">{m.R2.toFixed(4)}</td></tr>)}</tbody>
              </table></div>
              <p className="mt-2 text-xs text-slate-500">Paso B · resultados_I3/metricas_modelos.csv. Ensamble 0.4940 vs Ridge 0.4963: diferencia de 0.0023 t/ha, pequeña. No se afirma superioridad estadística ni que sea el mejor modelo posible.</p>
            </div>}
          </div>}
        </section>
      </>}
    </main>
  </div>
}
