import { useEffect, useRef } from "react"
import * as maplibregl from "maplibre-gl"
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url"
import "maplibre-gl/dist/maplibre-gl.css"
import type { Parcel, ParcelCollection } from "@/types/parcelas"

function parcelBounds(parcel: Parcel) {
  const bounds = new maplibregl.LngLatBounds()
  const geometry = parcel.geometry
  if (!("coordinates" in geometry)) return bounds
  function walk(points: unknown): void {
    if (!Array.isArray(points)) return
    if (typeof points[0] === "number" && typeof points[1] === "number") {
      bounds.extend([points[0], points[1]])
    } else points.forEach(walk)
  }
  walk(geometry.coordinates)
  return bounds
}

type Props = { datos: ParcelCollection; parcela: Parcel }

export function ParcelMiniMap({ datos, parcela }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    maplibregl.setWorkerUrl(workerUrl)
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          satellite: {
            type: "raster",
            tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
            tileSize: 256,
            attribution: "Imagery © Esri",
          },
        },
        layers: [{ id: "satellite", type: "raster", source: "satellite" }],
      },
      center: [-98.4, 19.75],
      zoom: 9,
    })
    let disposed = false
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-left")
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 100, unit: "metric" }), "bottom-left")
    map.on("load", () => {
      if (disposed) return
      map.addSource("parcelas", { type: "geojson", data: datos })
      map.addLayer({ id: "other-fill", type: "fill", source: "parcelas", paint: { "fill-color": "#e8ede0", "fill-opacity": 0.22 } })
      map.addLayer({ id: "other-lines", type: "line", source: "parcelas", paint: { "line-color": "#f7f7e8", "line-width": 1 } })
      map.addLayer({
        id: "selected-fill", type: "fill", source: "parcelas",
        filter: ["==", ["get", "ID_POLIGON"], parcela.properties.ID_POLIGON],
        paint: { "fill-color": "#f5b51b", "fill-opacity": 0.85 },
      })
      map.addLayer({
        id: "selected-outline", type: "line", source: "parcelas",
        filter: ["==", ["get", "ID_POLIGON"], parcela.properties.ID_POLIGON],
        paint: { "line-color": "#ffffff", "line-width": 3 },
      })
      const bounds = parcelBounds(parcela)
      if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 100, maxZoom: 14, duration: 0 })
    })
    return () => { disposed = true; map.remove() }
  }, [datos, parcela])

  return (
    <div className="relative h-[260px] overflow-hidden rounded-xl bg-slate-200">
      <div ref={containerRef} className="h-full w-full" aria-label={`Mapa de la parcela ${parcela.properties.ID_POLIGON}`} />
      <span className="pointer-events-none absolute right-3 top-3 rounded-md bg-slate-950/80 px-2.5 py-1.5 text-xs font-bold text-white shadow-lg">
        {parcela.properties.ID_POLIGON}
      </span>
      <div className="pointer-events-none absolute bottom-3 right-3 flex flex-col gap-1 rounded-lg bg-white/95 p-2 text-[11px] text-slate-700 shadow-md">
        <span><span className="mr-2 inline-block h-2.5 w-2.5 bg-[#f5b51b]" />Parcela seleccionada</span>
        <span><span className="mr-2 inline-block h-2.5 w-2.5 bg-[#c5ccbd]" />Otras parcelas</span>
      </div>
    </div>
  )
}
