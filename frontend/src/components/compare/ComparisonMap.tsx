import { useEffect, useRef } from "react"
import * as maplibregl from "maplibre-gl"
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url"
import "maplibre-gl/dist/maplibre-gl.css"
import type { Parcel, ParcelCollection } from "@/types/parcelas"

function boundsOf(...parcels: Parcel[]) {
  const bounds = new maplibregl.LngLatBounds()
  function walk(coords: unknown): void {
    if (!Array.isArray(coords)) return
    if (typeof coords[0] === "number" && typeof coords[1] === "number") bounds.extend([coords[0], coords[1]])
    else coords.forEach(walk)
  }
  parcels.forEach((p) => { if ("coordinates" in p.geometry) walk(p.geometry.coordinates) })
  return bounds
}

export function ComparisonMap({ data, a, b }: {data: ParcelCollection; a: Parcel; b: Parcel}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ref.current) return
    maplibregl.setWorkerUrl(workerUrl)
    const map = new maplibregl.Map({
      container: ref.current,
      center: [-98.5, 19.7], zoom: 8,
      style: {version: 8, sources: {satellite: {type: "raster", tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],tileSize:256,attribution:"Imagery © Esri"}},layers:[{id:"satellite",type:"raster",source:"satellite"}]},
    })
    map.addControl(new maplibregl.NavigationControl({showCompass:false}),"top-left")
    let alive = true
    map.on("load", () => {
      if (!alive) return
      map.addSource("parcelas",{type:"geojson",data})
      map.addLayer({id:"all-fill",type:"fill",source:"parcelas",paint:{"fill-color":"#d3d9c9","fill-opacity":0.2}})
      map.addLayer({id:"all-line",type:"line",source:"parcelas",paint:{"line-color":"#f3f3df","line-width":1}})
      for (const [id, parcel, color] of [["a",a,"#f5b51b"],["b",b,"#3b82f6"]] as const) {
        const filter: maplibregl.FilterSpecification = ["==",["get","ID_POLIGON"],parcel.properties.ID_POLIGON]
        map.addLayer({id:`${id}-fill`,type:"fill",source:"parcelas",filter,paint:{"fill-color":color,"fill-opacity":0.86}})
        map.addLayer({id:`${id}-line`,type:"line",source:"parcelas",filter,paint:{"line-color":"#ffffff","line-width":3}})
      }
      const bounds=boundsOf(a,b)
      if (!bounds.isEmpty()) map.fitBounds(bounds,{padding:65,maxZoom:13,duration:0})
    })
    return () => {alive=false;map.remove()}
  },[data,a,b])
  return <div className="relative h-[300px] overflow-hidden rounded-xl bg-slate-200">
    <div ref={ref} className="h-full w-full" aria-label="Mapa comparativo de ambas parcelas"/>
    <div className="pointer-events-none absolute bottom-3 right-3 rounded-lg bg-white/95 p-3 text-xs shadow-md">
      <div><span style={{backgroundColor:"#f5b51b"}} className="mr-2 inline-block h-3 w-3"/>{a.properties.ID_POLIGON}</div>
      <div className="mt-1"><span style={{backgroundColor:"#3b82f6"}} className="mr-2 inline-block h-3 w-3"/>{b.properties.ID_POLIGON}</div>
    </div>
  </div>
}
