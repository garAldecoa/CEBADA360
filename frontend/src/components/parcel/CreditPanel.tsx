import { useEffect, useState } from "react"
import { Calculator, Landmark, Loader2 } from "lucide-react"
import { simularCredito, type EscenarioCredito } from "@/lib/api"
import type { ParcelaCebada } from "@/types/cebada360"
import { formatoNumero, formatoPct, formatoPesos, NIVEL_COLORES } from "@/types/cebada360"

const PRECIO_BASE = 7500
const COSTO_BASE = 20977

function Tarjeta({ titulo, valor, nota }: { titulo: string; valor: string; nota?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="text-xs text-slate-500">{titulo}</p>
      <p className="mt-1 text-lg font-extrabold tabular-nums text-slate-950">{valor}</p>
      {nota && <p className="mt-0.5 text-[11px] text-slate-500">{nota}</p>}
    </div>
  )
}

/**
 * Solo para las 59 estimadas (las 138 de entrenamiento no muestran crédito ni probabilidad).
 * Resumen: resultados_I4/credito_por_parcela_intervalo_municipio.csv. Calculadora: backend → cebada/credito.py (paso 24/27).
 */
export function CreditPanel({ id, parcela }: { id: string; parcela: ParcelaCebada }) {
  const [precio, setPrecio] = useState(PRECIO_BASE)
  const [costo, setCosto] = useState(COSTO_BASE)
  const [escenario, setEscenario] = useState<EscenarioCredito | null>(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState("")
  const c = parcela.credito

  useEffect(() => {
    const controller = new AbortController()
    const t = window.setTimeout(() => {
      setCargando(true)
      simularCredito(id, precio, costo, controller.signal)
        .then((r) => { setEscenario(r); setError("") })
        .catch((e: unknown) => { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : String(e)) })
        .finally(() => { if (!controller.signal.aborted) setCargando(false) })
    }, 250)
    return () => { controller.abort(); window.clearTimeout(t) }
  }, [id, precio, costo])

  if (!c) return null
  const color = NIVEL_COLORES[c.nivel] ?? "#94a3b8"
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
      <h3 className="flex items-center gap-2 text-lg font-bold text-slate-950"><Landmark className="h-5 w-5 text-emerald-800" />Escenario de crédito</h3>
      <p className="mt-1 text-sm text-slate-600">Simulación educativa con supuestos públicos. No es originación ni aprobación de crédito ni probabilidad de incumplimiento.</p>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <Tarjeta titulo="Ingreso esperado" valor={formatoPesos(c.ingreso_esperado)} nota="Rendimiento × área × 7,500 MXN/t" />
        <Tarjeta titulo={`Crédito sugerido (${formatoPct(c.pct_de_cuota_fira)} de la cuota FIRA)`} valor={formatoPesos(c.credito_sugerido)} nota={`Cuota FIRA: ${formatoPesos(c.credito_cuota_fira)}`} />
        <Tarjeta titulo="Prob. modelada de ingreso insuficiente" valor={formatoPct(c.prob_ingreso_insuficiente)} nota="Escenario con errores fuera de fold" />
        <div className="rounded-xl border p-3" style={{ borderColor: color, background: `${color}1a` }}>
          <p className="text-xs text-slate-500">Indicador</p>
          <p className="mt-1 text-lg font-extrabold first-letter:uppercase text-slate-950">{c.nivel}</p>
          <p className="mt-0.5 text-[11px] text-slate-600">{c.motivo}</p>
        </div>
      </div>
      <p className="mt-2 text-[11px] text-slate-500">Fuente: resultados_I4/credito_por_parcela_intervalo_municipio.csv (paso 27).</p>

      <div className="mt-5 rounded-xl bg-slate-50 p-4">
        <h4 className="flex items-center gap-2 font-bold text-slate-900"><Calculator className="h-4 w-4" />Calculadora de escenarios {cargando && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}</h4>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <label className="text-sm text-slate-700">Precio de la cebada: <strong>{precio.toLocaleString("es-MX")} MXN/t</strong>
            <input type="range" min={5000} max={10000} step={100} value={precio} onChange={(e) => setPrecio(Number(e.target.value))} className="mt-2 w-full accent-emerald-800" />
          </label>
          <label className="text-sm text-slate-700">Costo de producción: <strong>{costo.toLocaleString("es-MX")} MXN/ha</strong>
            <input type="range" min={15000} max={30000} step={250} value={costo} onChange={(e) => setCosto(Number(e.target.value))} className="mt-2 w-full accent-emerald-800" />
          </label>
        </div>
        <button type="button" onClick={() => { setPrecio(PRECIO_BASE); setCosto(COSTO_BASE) }} className="mt-2 text-xs font-semibold text-emerald-800 hover:underline">Volver a valores base (7,500 MXN/t · 20,977 MXN/ha)</button>
        {error && <p role="alert" className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-800">No se pudo calcular el escenario: {error}. ¿Está encendido el backend?</p>}
        {escenario && (
          <>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <Tarjeta titulo="Rendimiento estimado" valor={`${formatoNumero(escenario.rend_esperado_t_ha)} t/ha`} nota="No cambia con precio ni costo" />
              <Tarjeta titulo="Ingreso esperado" valor={formatoPesos(escenario.ingreso_esperado_mxn)} />
              <Tarjeta titulo="Crédito sugerido" valor={formatoPesos(escenario.credito_sugerido_mxn)} nota={`${formatoPct(escenario.pct_de_cuota_fira)} de la cuota`} />
              <Tarjeta titulo="Prob. modelada de ingreso insuficiente" valor={formatoPct(escenario.prob_ingreso_insuficiente)} />
            </div>
            <p className="mt-2 text-xs text-slate-600">
              Rendimiento mínimo para pagar crédito + intereses: <strong>{formatoNumero(escenario.rend_minimo_pago_t_ha)} t/ha</strong> · intervalo del escenario {formatoNumero(escenario.rend_lim_inf_80_t_ha)} – {formatoNumero(escenario.rend_lim_sup_80_t_ha)} t/ha ({escenario.intervalo}) · tipo = {escenario.tipo === "simulacion" ? "simulación" : escenario.tipo}
            </p>
          </>
        )}
      </div>
    </section>
  )
}
