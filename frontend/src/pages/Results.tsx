import { useCallback, useEffect, useState } from "react"
import { BookOpenCheck, ChartColumnBig, FileText, Info, Maximize2, ScanSearch, X } from "lucide-react"
import { Header } from "@/components/layout/Header"
import { SECCIONES, type Figura } from "@/data/evidencia"

const panel = "rounded-2xl border border-[#e2eaf1] bg-white shadow-[0_4px_16px_rgba(25,50,80,.06)]"
const rutaFigura = (f: Figura) => `/figs/evidencia/${f.archivo}`

const CLAVES = [
  { valor: "0.4940 t/ha", etiqueta: "RMSE de validación cruzada (10×5) sobre las 138", nota: "MAE 0.3381 · R² 0.6607" },
  { valor: "0.483", etiqueta: "RMSE esperado en las 59 (mediana)", nota: "rango p5–p95: 0.369–0.620" },
  { valor: "272", etiqueta: "variables extra probadas", nota: "ninguna mejora de forma significativa" },
  { valor: "0.487", etiqueta: "ruido estimado por el GP", nota: "≈ 99 % del RMSE: compatible con meseta" },
  { valor: "10.1 → 7.2 %", etiqueta: "ingreso insuficiente simulado (138)", nota: "cuota FIRA a todas vs crédito ajustado" },
]

function Lightbox({ figura, onClose }: { figura: Figura; onClose: () => void }) {
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", tecla)
    const overflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { window.removeEventListener("keydown", tecla); document.body.style.overflow = overflow }
  }, [onClose])
  return (
    <div role="dialog" aria-modal="true" aria-label={figura.titulo} onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 backdrop-blur-sm sm:p-6">
      <div onClick={(e) => e.stopPropagation()} className="flex max-h-full w-full max-w-[1500px] flex-col overflow-hidden rounded-2xl bg-white">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div><p className="font-bold text-slate-950">{figura.titulo}</p><p className="text-xs text-slate-500">{figura.paso} · {figura.archivo}</p></div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"><X size={20} /></button>
        </div>
        <div className="overflow-auto bg-white p-2"><img src={rutaFigura(figura)} alt={figura.titulo} className="mx-auto h-auto max-w-full" /></div>
      </div>
    </div>
  )
}

function TarjetaFigura({ figura, onZoom }: { figura: Figura; onZoom: (f: Figura) => void }) {
  return (
    <article className={`${panel} flex flex-col overflow-hidden`} id={`fig-${figura.id}`}>
      <button type="button" onClick={() => onZoom(figura)} className="group relative block border-b border-[#edf1f5] bg-white p-3" aria-label={`Ampliar: ${figura.titulo}`}>
        <img src={rutaFigura(figura)} alt={figura.titulo} loading="lazy" className="mx-auto max-h-[340px] w-auto max-w-full object-contain" />
        <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-lg bg-white/90 px-2 py-1 text-xs font-semibold text-slate-700 opacity-80 shadow-sm group-hover:opacity-100"><Maximize2 size={13} />Ampliar</span>
      </button>
      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="text-lg font-extrabold leading-snug text-[#102450]">{figura.titulo}</h3>
          <span className="shrink-0 rounded-full bg-[#eef4fb] px-2.5 py-1 text-[11px] font-semibold text-[#2d4f7c]">{figura.paso} · {figura.responsable}</span>
        </div>
        {figura.destacado && (
          <div className="flex items-baseline gap-2 rounded-xl bg-[#eef8f2] px-3 py-2">
            <strong className="text-xl font-black text-[#13553f]">{figura.destacado.valor}</strong>
            <span className="text-xs text-[#3d6153]">{figura.destacado.etiqueta}</span>
          </div>
        )}
        <div>
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#5b6f88]"><ScanSearch size={14} />Qué muestra</p>
          <p className="mt-1 text-sm leading-relaxed text-[#34485f]">{figura.queMuestra}</p>
        </div>
        <div>
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#5b6f88]"><ChartColumnBig size={14} />Qué resultado expone</p>
          <ul className="mt-1.5 space-y-1.5 text-sm leading-relaxed text-[#22354d]">
            {figura.resultados.map((r) => <li key={r} className="flex gap-2"><span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#1b7354]" />{r}</li>)}
          </ul>
        </div>
        <p className="mt-auto flex gap-2 rounded-lg bg-[#fff8e8] px-3 py-2 text-xs leading-relaxed text-[#6b5313]"><Info size={14} className="mt-0.5 shrink-0" />{figura.lectura}</p>
        <p className="text-[11px] leading-relaxed text-[#7a8798]">{figura.paso} · {figura.archivo}<br />Cifras: {figura.fuentes.join(" · ")}</p>
      </div>
    </article>
  )
}

export function Results() {
  const [zoom, setZoom] = useState<Figura | null>(null)
  const cerrar = useCallback(() => setZoom(null), [])
  const [activa, setActiva] = useState(SECCIONES[0].id)

  useEffect(() => {
    const observador = new IntersectionObserver((entradas) => {
      const visible = entradas.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
      if (visible) setActiva(visible.target.id.replace("sec-", ""))
    }, { rootMargin: "-120px 0px -60% 0px" })
    SECCIONES.forEach((s) => { const el = document.getElementById(`sec-${s.id}`); if (el) observador.observe(el) })
    return () => observador.disconnect()
  }, [])

  const total = SECCIONES.reduce((n, s) => n + s.figuras.length, 0)

  return <div className="min-h-screen bg-[#f7f9fc] text-[#102044]">
    <Header />
    <section className="relative overflow-hidden border-b border-[#e5eaf0]" style={{
      backgroundImage: "linear-gradient(90deg,rgba(255,255,255,.97),rgba(255,255,255,.8) 52%,rgba(255,255,255,.25)),url('/images/hero-cebada.jpg')",
      backgroundSize: "cover", backgroundPosition: "center",
    }}>
      <div className="mx-auto max-w-[1600px] px-5 py-6 md:px-8 md:py-8">
        <h1 className="text-4xl font-black tracking-tight text-[#102450] sm:text-5xl">Resultados</h1>
        <p className="mt-2 max-w-3xl text-base font-medium text-[#263e61]">Las {total} gráficas oficiales del notebook CEBADA360, explicadas: qué muestra cada una, qué resultado expone y cómo leerlo sin exagerar.</p>
      </div>
    </section>

    <main className="mx-auto max-w-[1600px] space-y-4 px-4 py-4 md:px-7">
      <section className={`${panel} p-4 sm:p-5`}>
        <h2 className="flex items-center gap-2 text-xl font-extrabold text-[#102450]"><BookOpenCheck size={22} className="text-[#1b7354]" />Lo esencial en cinco cifras</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {CLAVES.map((c) => <div key={c.etiqueta} className="rounded-xl border border-[#e5ecf5] bg-gradient-to-b from-white to-[#f8fbff] p-3">
            <strong className="block text-2xl font-black tracking-tight text-[#0e2351]">{c.valor}</strong>
            <span className="mt-1 block text-sm font-semibold text-[#1d385a]">{c.etiqueta}</span>
            <span className="mt-0.5 block text-xs text-[#5b6f88]">{c.nota}</span>
          </div>)}
        </div>
        <p className="mt-3 text-xs text-[#687c93]">Las métricas son de validación cruzada sobre las 138 parcelas con rendimiento; no son el error de las 59, que solo se conocerá con la evaluación de FIRA. Fuentes: resultados_I3/metricas_modelos.csv, ENTREGA/resumen_prediccion_final.txt, barrido_resumen.csv, variabilidad_residual_resumen.csv y resultados_I4/retrospectiva_resumen.csv.</p>
      </section>

      <nav aria-label="Secciones de resultados" className="sticky top-0 z-20 -mx-4 overflow-x-auto border-y border-[#e5eaf0] bg-[#f7f9fc]/95 px-4 py-2 backdrop-blur md:-mx-7 md:px-7">
        <div className="flex gap-2">
          {SECCIONES.map((s) => <a key={s.id} href={`#sec-${s.id}`}
            className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${activa === s.id ? "bg-[#13553f] text-white" : "bg-white text-[#34485f] ring-1 ring-[#dfe7ef] hover:bg-[#eef6f1]"}`}>
            {s.titulo} <span className="opacity-70">· {s.figuras.length}</span></a>)}
        </div>
      </nav>

      {SECCIONES.map((s, i) => <section key={s.id} id={`sec-${s.id}`} className="scroll-mt-16 space-y-3 pt-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#1b7354]">{String(i + 1).padStart(2, "0")} · {s.figuras.length} gráficas</p>
          <h2 className="text-2xl font-black tracking-tight text-[#102450]">{s.titulo}</h2>
          <p className="mt-1 max-w-4xl text-sm text-[#536784]">{s.resumen}</p>
        </div>
        <div className="grid gap-3 xl:grid-cols-2">
          {s.figuras.map((f) => <TarjetaFigura key={f.id} figura={f} onZoom={setZoom} />)}
        </div>
      </section>)}

      <p className="flex flex-wrap items-center gap-2 px-1 pb-4 pt-2 text-xs text-[#718095]"><FileText size={14} />Figuras sin modificar, copiadas de los paquetes oficiales (resultados_cebada360_I1_I2, resultados_I3 y resultados_app) por backend/scripts/exportar_datos_frontend.py.</p>
    </main>
    {zoom && <Lightbox figura={zoom} onClose={cerrar} />}
  </div>
}
