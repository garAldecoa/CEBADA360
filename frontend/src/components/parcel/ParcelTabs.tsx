import { useState } from "react"
import { ClimatePanel } from "@/components/parcel/ClimatePanel"
import { QualityRiskPanel } from "@/components/parcel/QualityRiskPanel"
import { TerritoryPanel } from "@/components/parcel/TerritoryPanel"
import type { ClimateTerritoryData } from "@/types/clima-territorio"
import { BarChart3, CloudSun, Database, Mountain, Sprout } from "lucide-react"
import {
  CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts"
import type { Parcel } from "@/types/parcelas"
import type { SatelliteData, ObservedYields, SatellitePoint } from "@/types/parcel-detail"
import type { ParcelaCebada } from "@/types/cebada360"
import { formatoNumero, NOMBRES_BANDERAS } from "@/types/cebada360"

type Tab = "cultivo" | "clima" | "territorio" | "datos"
type Index = "ndvi" | "evi" | "lai"
type Sensor = "Sentinel-2" | "Planet"
const tabs: { id: Tab; label: string; icon: typeof Sprout }[] = [
  { id: "cultivo", label: "Evolución del cultivo", icon: Sprout },
  { id: "clima", label: "Clima", icon: CloudSun },
  { id: "territorio", label: "Territorio", icon: Mountain },
  { id: "datos", label: "Datos", icon: Database },
]
const indexNames: Record<Index, string> = { ndvi: "NDVI", evi: "EVI", lai: "LAI" }
const indexDesc: Record<Index, string> = {
  ndvi: "Vigor y presencia de vegetación verde.",
  evi: "Índice de vigor vegetal con ajustes frente a efectos del suelo y la atmósfera.",
  lai: "Índice de área foliar: superficie de hojas en relación con el terreno.",
}
function formatWeek(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("es-MX", { month: "short", day: "numeric" })
}
function countObservations(points: SatellitePoint[]) {
  return points.reduce((sum, p) => sum + p.observaciones, 0)
}

type Props = {
  parcela: Parcel
  satellite: SatelliteData
  observed: ObservedYields
  climaTerritorio: ClimateTerritoryData
  cebada: ParcelaCebada | null
}

export function ParcelTabs({ parcela, satellite, observed, climaTerritorio, cebada }: Props) {
  const [tab, setTab] = useState<Tab>("cultivo")
  const [sensor, setSensor] = useState<Sensor>("Sentinel-2")
  const [indice, setIndice] = useState<Index>("ndvi")
  const id = parcela.properties.ID_POLIGON
  const points = satellite[id]?.[sensor] ?? []
  const chartRows = points.filter((p) => p[indice] !== null)
  const observationCount = countObservations(points)
  const observedValue = observed[id]

  return (
    <section className="mt-3" aria-label="Datos de la parcela">
      <div role="tablist" aria-label="Categorías de información" className="grid grid-cols-2 gap-1.5 lg:grid-cols-4">
        {tabs.map(({ id: key, label, icon: Icon }) => (
          <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => setTab(key)}
            className={`flex min-h-12 items-center justify-center gap-2 rounded-t-xl border px-3 py-3 text-sm font-semibold transition-colors ${
              tab === key ? "border-emerald-800 bg-emerald-900 text-white" : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-emerald-50"
            }`}>
            <Icon className="h-4 w-4" />{label}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="rounded-b-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
        {tab === "cultivo" && (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-900">Índice de vegetación</h3>
                  <p className="text-xs text-slate-500">Datos satelitales reales del ciclo abril–octubre de 2025.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <label className="sr-only" htmlFor="sat-sensor">Sensor</label>
                  <select id="sat-sensor" value={sensor} onChange={(e) => setSensor(e.target.value as Sensor)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs">
                    <option value="Sentinel-2">Sentinel-2 · Básico</option>
                    <option value="Planet">Planet · PRO</option>
                  </select>
                  <label className="sr-only" htmlFor="sat-index">Índice satelital</label>
                  <select id="sat-index" value={indice} onChange={(e) => setIndice(e.target.value as Index)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs">
                    {Object.entries(indexNames).map(([key, value]) => <option key={key} value={key}>{value}</option>)}
                  </select>
                </div>
              </div>
              {chartRows.length ? (
                <div className="h-[290px] w-full" aria-label={`Gráfica de ${indexNames[indice]} de ${id}`}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartRows} margin={{ top: 10, right: 15, left: -15, bottom: 8 }}>
                      <CartesianGrid vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="fecha" tickFormatter={formatWeek} minTickGap={25} tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} domain={indice === "lai" ? [0, "auto"] : [0, "auto"]} />
                      <Tooltip labelFormatter={(label) => `Semana de ${formatWeek(String(label))}`}
                        formatter={(value) => [Number(value).toFixed(3), indexNames[indice]]} />
                      <Line type="monotone" dataKey={indice} stroke="#166534" strokeWidth={2.5} dot={{ r: 2.5 }} activeDot={{ r: 5 }} connectNulls={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-[290px] items-center justify-center rounded-xl bg-slate-50 text-center text-sm text-slate-500">
                  No hay observaciones válidas de {indexNames[indice]} para este sensor con el filtro aplicado.
                </div>
              )}
              <p className="mt-2 text-xs text-slate-500">
                Promedios semanales de observaciones con nubosidad ≤30%. Sin interpolar valores faltantes.
              </p>
            </div>
            <aside className="rounded-xl bg-slate-50 p-4">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-slate-900"><BarChart3 className="h-4 w-4" />Índices disponibles</h3>
              <p className="text-sm font-semibold text-emerald-900">{indexNames[indice]}</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{indexDesc[indice]}</p>
              <div className="my-4 border-t border-slate-200" />
              <div className="space-y-2 text-sm text-slate-700">
                <p><strong>Sensor:</strong> {sensor}</p>
                <p><strong>Semanas con datos:</strong> {points.length}</p>
                <p><strong>Observaciones aceptadas:</strong> {observationCount}</p>
              </div>
              <p className="mt-4 text-xs leading-relaxed text-slate-500">
                Los índices de Planet y Sentinel-2 se presentan por separado: no son medidas intercambiables.
              </p>
            </aside>
          </div>
        )}
        {tab === "clima" && (
          <ClimatePanel id={id} datos={climaTerritorio} />
        )}
        {tab === "territorio" && (
          <TerritoryPanel parcela={parcela} datos={climaTerritorio} />
        )}
        {tab === "datos" && (
          <div className="space-y-4">
          <div className="grid gap-4 py-2 md:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-5 text-sm">
              <h3 className="mb-3 font-bold text-slate-900">Identificación</h3>
              <p><strong>ID:</strong> {id}</p>
              <p className="mt-2"><strong>Conjunto:</strong> {parcela.properties.CONJUNTO}</p>
              <p className="mt-2"><strong>Rendimiento observado 2025:</strong> {Number.isFinite(observedValue) ? `${observedValue.toFixed(2)} t/ha` : "Oculto para el conjunto de predicción"}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-5 text-sm">
              <h3 className="mb-3 font-bold text-slate-900">Procedencia de los datos</h3>
              <p>Geometrías oficiales: Shapefile de parcelas del Reto AgroCebada FIRA 2026.</p>
              <p className="mt-2">Satélite: CSV Básico (Sentinel-2) y PRO (Planet), observaciones 2025.</p>
              <p className="mt-2">Solo se muestra el rendimiento observado cuando está disponible en entrenamiento; nunca se sustituye por una predicción.</p>
            </div>
          </div>
          {cebada && (
            <section className="rounded-xl border border-slate-200 p-4" style={{ background: "#f3f8ff" }}>
              <h3 className="text-lg font-bold text-slate-900">Vegetación y calidad de la información</h3>
              <p className="mt-2 text-sm text-slate-700">
                Pico NDVI / EVI (Planet): <strong>{formatoNumero(cebada.vegetacion.pl_ndvi_pico)} / {formatoNumero(cebada.vegetacion.pl_evi_pico)}</strong> ·
                Humedad (NDWI vegetativo): <strong>{formatoNumero(cebada.vegetacion.s2_ndwi_media_veg)}</strong> ·
                Imágenes válidas: <strong>{formatoNumero(cebada.vegetacion.cal_pl_n_obs, 0)}</strong> ·
                Nubosidad: <strong>{formatoNumero(cebada.vegetacion.cal_pl_nub_media, 1)} %</strong> ·
                Hueco máximo: <strong>{formatoNumero(cebada.vegetacion.cal_pl_hueco_max_dias, 0)} días</strong>
              </p>
              <p className="mt-2 text-sm"><strong>Banderas activas:</strong> {cebada.banderas.length ? cebada.banderas.map((b) => NOMBRES_BANDERAS[b] ?? b).join(" · ") : "ninguna"}</p>
              <p className="mt-2 text-xs text-slate-500">Señales orientativas; no diagnostican daño. Revisión de datos, no de daño. Fuente: resultados_app/datos_visor.csv.</p>
            </section>
          )}
          <QualityRiskPanel id={id} />
          </div>
        )}
      </div>
    </section>
  )
}
