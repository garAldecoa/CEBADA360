import { useEffect, useState } from "react"
import { CheckCircle2, Download, Loader2, ServerCrash, ShieldCheck, XCircle } from "lucide-react"
import { consultarTransparencia, URL_DESCARGA_ENTREGA, type Transparencia } from "@/lib/api"

/** Controles en vivo del backend: el modelo cargó, reproduce las 59 y los archivos oficiales no cambiaron. */
export function TransparencyPanel() {
  const [datos, setDatos] = useState<Transparencia | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    const controller = new AbortController()
    consultarTransparencia(controller.signal)
      .then(setDatos)
      .catch((e: unknown) => { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : String(e)) })
    return () => controller.abort()
  }, [])

  return (
    <section className="rounded-2xl border border-[#e2eaf1] bg-white p-4 shadow-[0_4px_16px_rgba(25,50,80,.06)] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-extrabold text-[#102450]"><ShieldCheck size={22} className="text-emerald-700" />Verificación en vivo del modelo</h2>
          <p className="mt-1 text-sm text-[#536784]">El servidor carga el modelo del notebook y comprueba, cada vez que arranca, que reproduce la entrega oficial.</p>
        </div>
        <a href={URL_DESCARGA_ENTREGA} className="inline-flex items-center gap-2 rounded-xl border border-emerald-800 px-4 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-50"><Download size={16} />Descargar predicciones_59_entrega.csv</a>
      </div>
      {error && <div role="alert" className="mt-4 flex items-start gap-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-900"><ServerCrash className="shrink-0" size={20} /><div><strong>Backend no disponible ({error}).</strong> Los resultados se muestran desde los archivos oficiales; para ejecutar el modelo inicia <code>uvicorn main:app --port 8000</code> en <code>backend/</code>.</div></div>}
      {!datos && !error && <p className="mt-4 flex items-center gap-2 text-sm text-slate-500"><Loader2 className="animate-spin" size={16} />Consultando al servidor…</p>}
      {datos && <>
        <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-950">
          Modelo cargado · origen: <strong>{datos.modelo.origen}</strong> · {datos.modelo.segundos_carga.toFixed(3)} s · Python {datos.modelo.python} · scikit-learn {datos.modelo.scikit_learn}
        </p>
        <ul className="mt-3 grid gap-2 md:grid-cols-2">
          {datos.controles.map((c) => (
            <li key={c.control} className="flex items-start gap-2 rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-sm">
              {c.ok ? <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-700" size={17} /> : <XCircle className="mt-0.5 shrink-0 text-rose-700" size={17} />}
              <span><span className="font-medium text-slate-900">{c.control}</span>{c.detalle && <span className="block break-all text-xs text-slate-500">{c.detalle}</span>}</span>
            </li>
          ))}
        </ul>
      </>}
    </section>
  )
}
