import { useCallback, useEffect, useMemo, useState } from "react"
import { List, Map as MapIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ParcelMap } from "@/components/dashboard/ParcelMap"
import { ParcelTable } from "@/components/dashboard/ParcelTable"
import type { DatosCebada } from "@/types/cebada360"
import { NIVEL_COLORES } from "@/types/cebada360"
import type { ParcelCollection, ParcelFocus } from "@/types/parcelas"
import {
  formatHectares,
  NO_DATA_COLOR,
  QUALITY_COLORS,
  surfaceBreaks,
  SURFACE_COLORS,
  UNCERTAINTY_COLORS,
  YIELD_COLORS,
  YIELD_LABELS,
  type MapVisualization,
} from "@/lib/map-visualization"

type Props = {
  predicciones: DatosCebada | null
  foco: ParcelFocus
  vista: "mapa" | "tabla"
  onVistaChange: (vista: "mapa" | "tabla") => void
  onFocoChange: (id: string) => void
  onOpenParcel: (id: string) => void
}

export function MapPanel({ predicciones, foco, vista, onVistaChange, onFocoChange, onOpenParcel }: Props) {
  const [estado, setEstado] = useState("Todos los estados")
  const [visualizacion, setVisualizacion] = useState<MapVisualization>("conjunto")
  const [datos, setDatos] = useState<ParcelCollection | null>(null)
  const [errorCarga, setErrorCarga] = useState("")
  const [mensaje, setMensaje] = useState("")
  const onSearchResult = useCallback((texto: string) => setMensaje(texto), [])

  const cortes = useMemo(() => datos ? surfaceBreaks(datos) : [2, 4, 6, 9], [datos])

  useEffect(() => {
    const controller = new AbortController()
    async function cargarParcelas() {
      try {
        const respuesta = await fetch("/data/parcelas_agrocebada.geojson", {
          signal: controller.signal,
        })
        if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`)
        const json: unknown = await respuesta.json()
        if (
          typeof json !== "object" || json === null ||
          !("type" in json) || json.type !== "FeatureCollection" ||
          !("features" in json) || !Array.isArray(json.features)
        ) {
          throw new Error("El archivo no es un FeatureCollection de GeoJSON")
        }
        if (!controller.signal.aborted) setDatos(json as ParcelCollection)
      } catch (error) {
        if (controller.signal.aborted) return
        console.error("Error cargando parcelas:", error)
        setErrorCarga("No se pudo cargar el GeoJSON. Revisa public/data/parcelas_agrocebada.geojson")
      }
    }
    void cargarParcelas()
    return () => controller.abort()
  }, [])

  function localizarDesdeTabla(id: string) {
    const parcela = datos?.features.find((f) => f.properties.ID_POLIGON === id)
    if (!parcela) return
    setEstado(parcela.properties.Estado)
    setMensaje("")
    onFocoChange(id)
  }

  return (
    <Card className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_5px_20px_rgba(17,48,39,0.06)]">
      <CardContent className="space-y-4 px-4 sm:px-5">
        <div className="flex flex-wrap items-center gap-3 md:gap-5">
          <label htmlFor="visualizacion" className="text-sm font-semibold text-slate-900">Visualizar por:</label>
          <select
            id="visualizacion"
            value={visualizacion}
            onChange={(event) => setVisualizacion(event.target.value as MapVisualization)}
            className="min-w-[185px] rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="conjunto">Conjunto de datos</option>
            <option value="superficie">Superficie (ha)</option>
            <option value="rendimiento" disabled={!predicciones}>1 · Rendimiento (t/ha)</option>
            <option value="incertidumbre" disabled={!predicciones}>2 · Incertidumbre de la predicción (59)</option>
            <option value="calidad" disabled={!predicciones}>3 · Calidad de la información</option>
            <option value="credito" disabled={!predicciones}>4 · Indicador de crédito simulado (59)</option>
          </select>

          <label htmlFor="estado" className="text-sm font-semibold text-slate-900">Estado:</label>
          <select
            id="estado"
            value={estado}
            onChange={(event) => { setEstado(event.target.value); setMensaje("") }}
            className="min-w-[165px] rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
          >
            <option>Todos los estados</option>
            <option>Hidalgo</option>
            <option>Puebla</option>
            <option>Tlaxcala</option>
          </select>

          <Button
            type="button"
            variant="outline"
            className="ml-auto rounded-xl border-slate-300"
            disabled={!datos}
            onClick={() => { onVistaChange(vista === "mapa" ? "tabla" : "mapa"); setMensaje("") }}
          >
            {vista === "mapa" ? <List className="mr-2 h-4 w-4" /> : <MapIcon className="mr-2 h-4 w-4" />}
            {vista === "mapa" ? "Ver lista de parcelas" : "Volver al mapa"}
          </Button>
        </div>

        {errorCarga && <p role="alert" className="text-sm text-red-700">{errorCarga}</p>}
        {mensaje && <p role="status" className="text-sm text-amber-800">{mensaje}</p>}
        {!datos && !errorCarga && (
          <div className="flex h-72 items-center justify-center text-slate-600" role="status">Cargando parcelas…</div>
        )}

        {datos && vista === "mapa" && (
          <div className="relative overflow-hidden rounded-xl">
            <ParcelMap
              datos={datos}
              predicciones={predicciones}
              estado={estado}
              foco={foco}
              visualizacion={visualizacion}
              cortesSuperficie={cortes}
              onSearchResult={onSearchResult}
              onOpenParcel={onOpenParcel}
            />
            <div className="pointer-events-none absolute bottom-7 left-3 z-10 w-[min(330px,calc(100%-24px))] rounded-xl border border-white/90 bg-white/95 p-3.5 shadow-xl backdrop-blur-md sm:bottom-5 sm:left-4">
              {visualizacion === "conjunto" ? (
                <>
                  <h3 className="mb-3 text-sm font-semibold text-slate-950">Conjunto de datos</h3>
                  <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-700">
                    <span><span className="mr-1.5 inline-block h-3.5 w-3.5 rounded-sm bg-[#34a853] align-middle" />Entrenamiento</span>
                    <span><span className="mr-1.5 inline-block h-3.5 w-3.5 rounded-sm bg-[#f5b942] align-middle" />Predicción</span>
                  </div>
                </>
              ) : visualizacion === "rendimiento" ? (
                <><h3 className="mb-2 text-sm font-semibold">Rendimiento (t/ha)</h3>
                  <div className="flex gap-1 text-xs">{YIELD_LABELS.map((v,i) => <span key={v} style={{background:YIELD_COLORS[i], color: i === 0 || i === 4 ? "white" : "#172b3a"}} className="flex-1 rounded p-1 text-center">{v}</span>)}</div>
                  <p className="mt-1.5 text-[11px] leading-snug text-slate-600">Borde punteado = rendimiento observado (138) · borde sólido = estimado por el modelo (59).</p>
                </>
              ) : visualizacion === "incertidumbre" ? (
                <><h3 className="mb-2 text-sm font-semibold">Ancho del intervalo del escenario (nominal 80 %)</h3>
                  <div className="space-y-1 text-xs text-slate-700">
                    <p><span className="mr-1.5 inline-block h-3 w-3 rounded-sm align-middle" style={{background:UNCERTAINTY_COLORS.comun}}/>Común: 1.15 t/ha (errores de las 138, paso 24)</p>
                    <p><span className="mr-1.5 inline-block h-3 w-3 rounded-sm align-middle" style={{background:UNCERTAINTY_COLORS.ampliado}}/>Ampliado en Chignahuapan: 1.26 t/ha (paso 27), sobre todo hacia arriba</p>
                    <p><span className="mr-1.5 inline-block h-3 w-3 rounded-sm align-middle" style={{background:NO_DATA_COLOR}}/>Rendimiento observado (sin intervalo)</p>
                  </div>
                  <p className="mt-1.5 text-[11px] leading-snug text-slate-500">Es incertidumbre de la predicción, no riesgo de pérdida.</p>
                </>
              ) : visualizacion === "credito" ? (
                <><h3 className="mb-2 text-sm font-semibold">Indicador del escenario de crédito</h3>
                  <div className="grid grid-cols-2 gap-1 text-xs text-slate-700">{Object.entries(NIVEL_COLORES).map(([k,c]) => <span key={k}><span className="mr-1.5 inline-block h-3 w-3 rounded-sm align-middle" style={{background:c}}/>{k}</span>)}</div>
                  <p className="mt-1.5 text-[11px] leading-snug text-slate-500">Probabilidad MODELADA de ingreso insuficiente bajo supuestos de precio y costo. No es incumplimiento real.</p>
                </>
              ) : visualizacion === "calidad" ? (
                <><h3 className="mb-2 text-sm font-semibold">Calidad de la información satelital</h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-700">{Object.entries(QUALITY_COLORS).map(([k,c]) => <span key={k}><span className="mr-1.5 inline-block h-3 w-3 rounded-sm align-middle" style={{background:c}}/>{k}</span>)}</div>
                  <p className="mt-1.5 text-[11px] leading-snug text-slate-500">Revisión de datos (banderas del paso 15), no diagnóstico de daño.</p>
                </>
              ) : (
                <>
                  <h3 className="mb-2 text-sm font-semibold text-slate-950">Superficie de parcela (ha)</h3>
                  <div className="flex h-3 w-full overflow-hidden rounded-full">
                    {SURFACE_COLORS.map((color) => (
                      <span key={color} className="h-full flex-1" style={{ backgroundColor: color }} />
                    ))}
                  </div>
                  <div className="mt-2 flex justify-between gap-1 text-[10px] font-medium tabular-nums text-slate-700">
                    <span>Menor</span>
                    {cortes.map((corte, indice) => <span key={indice}>{formatHectares(corte)}</span>)}
                    <span>Mayor</span>
                  </div>
                  <p className="mt-1.5 text-[11px] leading-snug text-slate-500">Colores por quintiles de superficie reales de las 197 parcelas.</p>
                </>
              )}
              <div className="mt-3 border-t border-slate-200 pt-2 text-[11px] text-slate-600">
                <span className="mr-1.5 inline-block h-3 w-3 rounded-sm bg-[#00e5ff] align-middle" />Contorno turquesa: parcela seleccionada
              </div>
            </div>
          </div>
        )}
        {datos && vista === "tabla" && (
          <ParcelTable
            predicciones={predicciones}
            parcelas={datos.features}
            estado={estado}
            onEstadoChange={setEstado}
            onVerEnMapa={localizarDesdeTabla}
            onOpenParcel={onOpenParcel}
          />
        )}
      </CardContent>
    </Card>
  )
}
