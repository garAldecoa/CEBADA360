import { useState } from "react"
import { CheckCircle2, Cpu, Loader2, Play, XCircle } from "lucide-react"
import { ejecutarModelo, type EjecucionModelo } from "@/lib/api"
import { formatoNumero } from "@/types/cebada360"

/**
 * Ejecuta el modelo congelado (backend → cebada/modelo.py → resultados_I3/modelo_cebada360.py)
 * para una de las 59 parcelas y lo compara con la entrega oficial.
 */
export function RunModelPanel({ id }: { id: string }) {
  const [estado, setEstado] = useState<"inicial" | "cargando" | "listo" | "error">("inicial")
  const [resultado, setResultado] = useState<EjecucionModelo | null>(null)
  const [error, setError] = useState("")

  async function ejecutar() {
    setEstado("cargando")
    setError("")
    try {
      const r = await ejecutarModelo(id)
      setResultado(r)
      setEstado("listo")
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setEstado("error")
    }
  }

  return (
    <section className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-white to-emerald-50/60 p-4 shadow-sm md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold text-slate-950"><Cpu className="h-5 w-5 text-emerald-800" />Ejecutar el modelo</h3>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Corre en el servidor el mismo modelo del notebook (<code className="text-xs">modelo_cebada360.py</code> + <code className="text-xs">modelo.joblib</code>) para {id} y verifica que coincide con la entrega oficial.
          </p>
        </div>
        <button type="button" onClick={ejecutar} disabled={estado === "cargando"}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-900 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 disabled:opacity-60">
          {estado === "cargando" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Ejecutar el modelo para esta parcela
        </button>
      </div>

      {estado === "error" && (
        <div role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          <p className="font-semibold">No se pudo ejecutar el modelo: {error}</p>
          <p className="mt-1 text-rose-800">Comprueba que el backend esté encendido (<code>uvicorn main:app --port 8000</code> en la carpeta <code>backend/</code>) y que <code>VITE_API_URL</code> apunte a él.</p>
        </div>
      )}

      {estado === "listo" && resultado && (
        <div className="mt-4 space-y-3" role="status">
          <div className={`flex flex-wrap items-center gap-2 rounded-xl p-3 text-sm font-semibold ${resultado.coincide ? "bg-emerald-100 text-emerald-950" : "bg-rose-100 text-rose-900"}`}>
            {resultado.coincide ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
            Predicción del modelo: {resultado.y_pred.toFixed(4)} t/ha · entrega oficial {resultado.oficial.toFixed(4)} · {resultado.coincide ? "coincide" : "NO COINCIDE"} · {resultado.ms_inferencia} ms · {resultado.origen_modelo}
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {[
              ["Ridge (vecinas + clima)", resultado.comp_ridge, `Vecinas k=12 (IDW): ${formatoNumero(resultado.rend_vecinas_k12, 4)} t/ha`],
              ["Promedio del municipio", resultado.comp_municipio, "Media de entrenamiento del municipio"],
              ["Proceso gaussiano espacial", resultado.comp_espacial, "Patrón espacial (RBF + ruido blanco)"],
            ].map(([nombre, valor, nota]) => (
              <div key={String(nombre)} className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-xs text-slate-500">{nombre}</p>
                <p className="mt-1 text-xl font-extrabold tabular-nums text-slate-950">{Number(valor).toFixed(4)} <span className="text-sm font-semibold text-slate-600">t/ha</span></p>
                <p className="mt-1 text-[11px] text-slate-500">{nota}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500">ŷ = (Ridge + municipio + espacial) / 3 = ({resultado.comp_ridge.toFixed(4)} + {resultado.comp_municipio.toFixed(4)} + {resultado.comp_espacial.toFixed(4)}) / 3 = {resultado.y_pred.toFixed(4)} t/ha · {resultado.version}</p>
        </div>
      )}
    </section>
  )
}
