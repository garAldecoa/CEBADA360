import { useState } from "react"
import { RainfallPanel } from "@/components/parcel/RainfallPanel"
import { CloudSun, Info, Thermometer, TrendingUp } from "lucide-react"
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { ClimateMonth, ClimateTerritoryData } from "@/types/clima-territorio"

const nombres = ["", "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

function formato(value: number | null | undefined, decimals = 1) {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(decimals) : "—"
}

function promedio(values: Array<number | null>): number | null {
  const valid = values.filter((v): v is number => typeof v === "number" && Number.isFinite(v))
  return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : null
}

function Summary({ label, value, unit, icon: Icon, color }: {
  label: string
  value: string
  unit: string
  icon: typeof Thermometer
  color: string
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
      <Icon size={22} color={color} aria-hidden="true" />
      <p className="mt-2 text-xs font-medium text-slate-600">{label}</p>
      <p className="mt-1 text-xl font-bold text-slate-950">{value} <span className="text-sm font-medium text-slate-600">{unit}</span></p>
    </div>
  )
}

export function ClimatePanel({ id, datos }: { id: string; datos: ClimateTerritoryData }) {
  const [periodo, setPeriodo] = useState<"ciclo" | "anual">("ciclo")
  const row = datos.parcelas[id]?.clima
  if (!row?.mensual?.length) {
    return <div role="status" className="rounded-xl bg-slate-50 p-8 text-slate-600">No hay datos de temperatura para esta parcela.</div>
  }

  const meses: ClimateMonth[] = periodo === "ciclo"
    ? row.mensual.filter((d) => d.mes >= 4 && d.mes <= 10)
    : row.mensual
  const datosGrafica = meses.map((item) => ({
    ...item,
    nombre: nombres[item.mes],
  }))
  const mediaMin = promedio(meses.map((d) => d.tmin_c))
  const mediaMax = promedio(meses.map((d) => d.tmax_c))
  const media = promedio(meses.map((d) => d.tmedia_c))

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold text-slate-950"><CloudSun className="h-5 w-5 text-amber-600" />Clima de la parcela · 2025</h3>
          <p className="mt-1 text-sm text-slate-600">Temperaturas mensuales extraídas de CHIRTS-ERA5 para la ubicación de la parcela.</p>
        </div>
        <div>
          <label htmlFor="clima-periodo" className="mr-2 text-sm font-medium text-slate-700">Periodo:</label>
          <select id="clima-periodo" value={periodo} onChange={(e) => setPeriodo(e.target.value as "ciclo" | "anual")}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900">
            <option value="ciclo">Ciclo agrícola (abr–oct)</option>
            <option value="anual">Año completo (ene–dic)</option>
          </select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Summary label="Temperatura mínima mensual promedio" value={formato(mediaMin)} unit="°C" icon={Thermometer} color="#2563eb" />
        <Summary label="Temperatura máxima mensual promedio" value={formato(mediaMax)} unit="°C" icon={TrendingUp} color="#dc2626" />
        <Summary label="Temperatura media estimada" value={formato(media)} unit="°C" icon={CloudSun} color="#b45309" />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white px-2 pb-3 pt-4 sm:px-4">
        <h4 className="mb-4 px-2 text-sm font-bold text-slate-900">Evolución mensual de temperatura (°C)</h4>
        <div className="h-[290px] w-full" aria-label={`Serie climática de ${id} en ${periodo === "ciclo" ? "el ciclo agrícola" : "2025"}`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={datosGrafica} margin={{ top: 8, right: 24, left: -18, bottom: 6 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="nombre" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} unit="°" domain={["auto", "auto"]} />
              <Tooltip formatter={(value, name) => [typeof value === "number" ? `${value.toFixed(2)} °C` : "Sin dato", name]} />
              <Legend verticalAlign="top" height={34} />
              <Line type="monotone" dataKey="tmax_c" name="T. máxima" stroke="#dc2626" strokeWidth={2.5} dot={{ r: 3 }} connectNulls={false} />
              <Line type="monotone" dataKey="tmedia_c" name="T. media estimada" stroke="#c28a22" strokeWidth={2} strokeDasharray="5 4" dot={{ r: 2 }} connectNulls={false} />
              <Line type="monotone" dataKey="tmin_c" name="T. mínima" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3 }} connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.5fr)]">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <h4 className="border-b border-slate-100 px-4 py-3 font-semibold text-slate-900">Temperaturas por mes</h4>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[460px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-700"><tr>
                <th className="px-4 py-2">Mes</th><th className="px-3 py-2">Mín. °C</th><th className="px-3 py-2">Máx. °C</th><th className="px-3 py-2">Media °C</th><th className="px-3 py-2">Amplitud °C</th>
              </tr></thead>
              <tbody>{meses.map((mes) => <tr key={mes.mes} className="border-t border-slate-100">
                <td className="px-4 py-2 font-semibold text-slate-800">{nombres[mes.mes]}</td>
                <td className="px-3 py-2">{formato(mes.tmin_c)}</td><td className="px-3 py-2">{formato(mes.tmax_c)}</td>
                <td className="px-3 py-2">{formato(mes.tmedia_c)}</td><td className="px-3 py-2">{formato(mes.amplitud_c)}</td>
              </tr>)}</tbody>
            </table>
          </div>
        </div>
        <aside className="space-y-3">
          <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
            <h4 className="flex items-center gap-2 font-semibold text-sky-900"><Info size={19} /> Cómo se obtuvo</h4>
            <p className="mt-2 text-xs leading-relaxed text-sky-950">Temperaturas del píxel del raster que contiene el centroide de la parcela. Resolución de 0.05° (aproximadamente 5 km). Los valores describen la celda climática regional, no un termómetro ubicado en la parcela.</p>
            <p className="mt-2 text-xs leading-relaxed text-sky-950">T. media estimada = (Tmin + Tmax)/2. El promedio mostrado resume valores mensuales, sin asumir que sean mediciones diarias.</p>
          </div>
        </aside>
      </div>
      <RainfallPanel id={id} periodo={periodo} />
    </div>
  )
}
