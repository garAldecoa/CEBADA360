import { useEffect, useRef, useState } from "react"
import * as maplibregl from "maplibre-gl"
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url"
import "maplibre-gl/dist/maplibre-gl.css"
import type { DatosCebada } from "@/types/cebada360"
import { formatoNumero, formatoPct, NIVEL_COLORES } from "@/types/cebada360"
import type { Parcel, ParcelCollection, ParcelFocus } from "@/types/parcelas"
import {
  NO_DATA_COLOR, QUALITY_COLORS, SURFACE_COLORS, UNCERTAINTY_COLORS, YIELD_BREAKS, YIELD_COLORS,
  type MapVisualization,
} from "@/lib/map-visualization"

type Props = {
  datos: ParcelCollection
  predicciones: DatosCebada | null
  estado: string
  foco: ParcelFocus
  visualizacion: MapVisualization
  cortesSuperficie: number[]
  onSearchResult: (message: string) => void
  onOpenParcel: (id: string) => void
}

function boundsFor(parcela: Parcel): maplibregl.LngLatBounds {
  const bounds = new maplibregl.LngLatBounds()
  const geometria = parcela.geometry

  function visitar(valor: unknown) {
    if (!Array.isArray(valor)) return
    if (typeof valor[0] === "number" && typeof valor[1] === "number") {
      bounds.extend([valor[0], valor[1]])
    } else {
      valor.forEach(visitar)
    }
  }

  if ("coordinates" in geometria) visitar(geometria.coordinates)
  return bounds
}

function seleccionarParcela(
  map: maplibregl.Map,
  parcela: Parcel,
  popupRef: { current: maplibregl.Popup | null },
  onOpenParcel: (id: string) => void,
  predicciones: DatosCebada | null,
) {
  const bounds = boundsFor(parcela)
  const properties = parcela.properties

  map.setFilter("parcelas-selected", ["==", ["get", "ID_POLIGON"], properties.ID_POLIGON])
  popupRef.current?.remove()

  // Construimos el popup con textContent para tratar los atributos como texto seguro.
  const contenido = document.createElement("div")
  contenido.style.cssText = "color:#172b3a;min-width:185px;line-height:1.7"
  const titulo = document.createElement("strong")
  titulo.style.fontSize = "16px"
  titulo.textContent = properties.ID_POLIGON
  contenido.append(titulo)

  const p = predicciones?.parcelas[properties.ID_POLIGON]
  const filas: [string, string][] = [
    ["Municipio", `${properties.Municipio}, ${properties.Estado}`],
    ["Área", `${formatoNumero(properties["área_ha"])} ha`],
    ["Conjunto", properties.CONJUNTO],
  ]
  if (p) {
    filas.push([p.tipo === "observado" ? "Rendimiento observado" : "Rendimiento estimado", `${formatoNumero(p.rendimiento_t_ha)} t/ha`])
    filas.push([p.tipo === "observado" ? "Producción observada" : "Producción estimada", `${formatoNumero(p.produccion_t, 1)} t`])
    if (p.y_lo80 !== undefined && p.y_hi80 !== undefined) filas.push(["Intervalo (nominal 80 %)", `${formatoNumero(p.y_lo80)} – ${formatoNumero(p.y_hi80)} t/ha`])
    if (p.credito) filas.push(["Indicador (simulación)", `${p.credito.nivel} · ${formatoPct(p.credito.prob_ingreso_insuficiente)}`])
  }
  for (const [nombre, valor] of filas) {
    const linea = document.createElement("div")
    linea.textContent = `${nombre}: ${valor}`
    contenido.append(linea)
  }

  const boton = document.createElement("button")
  boton.type = "button"
  boton.textContent = "Ver ficha de parcela →"
  boton.style.cssText = "margin-top:10px;background:#105144;color:white;border:0;border-radius:8px;padding:8px 12px;font-weight:600;cursor:pointer;width:100%"
  boton.addEventListener("click", () => onOpenParcel(properties.ID_POLIGON))
  contenido.append(boton)

  popupRef.current = new maplibregl.Popup({ offset: 12 })
    .setLngLat(bounds.getCenter())
    .setDOMContent(contenido)
    .addTo(map)

  map.fitBounds(bounds, { padding: 110, maxZoom: 15, duration: 850 })
}

export function ParcelMap({ datos, predicciones, estado, foco, visualizacion, cortesSuperficie, onSearchResult, onOpenParcel }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const popupRef = useRef<maplibregl.Popup | null>(null)
  const [ready, setReady] = useState(false)
  const prediccionesRef = useRef<DatosCebada | null>(predicciones)
  useEffect(() => { prediccionesRef.current = predicciones }, [predicciones])

  useEffect(() => {
    if (!containerRef.current) return
    let disposed = false

    // Conservamos esta configuración: es la que funciona con tu MapLibre 6.14.0.
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

    mapRef.current = map
    map.addControl(new maplibregl.NavigationControl(), "top-left")

    map.on("load", () => {
      if (disposed) return
      try {
        map.addSource("parcelas", { type: "geojson", data: datos })
        map.addLayer({
          id: "parcelas-fill", type: "fill", source: "parcelas",
          paint: {
            "fill-color": ["match", ["get", "CONJUNTO"],
              "ENTRENAMIENTO", "#34a853", "PREDICCION", "#f5b942", "#94a3b8"],
            "fill-opacity": 0.65,
          },
        })
        // Borde punteado = rendimiento observado (138) · borde sólido = estimado por el modelo (59)
        map.addLayer({
          id: "parcelas-outline", type: "line", source: "parcelas",
          filter: ["==", ["get", "CONJUNTO"], "PREDICCION"],
          paint: { "line-color": "#ffffff", "line-width": 2 },
        })
        map.addLayer({
          id: "parcelas-outline-obs", type: "line", source: "parcelas",
          filter: ["==", ["get", "CONJUNTO"], "ENTRENAMIENTO"],
          paint: { "line-color": "#ffffff", "line-width": 1.6, "line-dasharray": [2, 1.5] },
        })
        map.addLayer({
          id: "parcelas-selected", type: "line", source: "parcelas",
          filter: ["==", ["get", "ID_POLIGON"], ""],
          paint: { "line-color": "#00e5ff", "line-width": 4 },
        })

        map.on("click", "parcelas-fill", (event) => {
          const id = event.features?.[0]?.properties?.ID_POLIGON as string | undefined
          const parcela = datos.features.find((p) => p.properties.ID_POLIGON === id)
          if (parcela) {
            seleccionarParcela(map, parcela, popupRef, onOpenParcel, prediccionesRef.current)
            onSearchResult("")
          }
        })
        map.on("mouseenter", "parcelas-fill", () => { map.getCanvas().style.cursor = "pointer" })
        map.on("mouseleave", "parcelas-fill", () => { map.getCanvas().style.cursor = "" })
        setReady(true)
      } catch (error) {
        console.error("Error dibujando las parcelas:", error)
        onSearchResult("No se pudieron dibujar las parcelas. Revisa la consola.")
      }
    })

    return () => {
      disposed = true
      map.remove()
      mapRef.current = null
    }
  }, [datos, onSearchResult, onOpenParcel])

  // Adjuntar los resultados oficiales a la fuente GeoJSON (sin mutar geometrías originales).
  useEffect(() => {
    const map = mapRef.current
    const source = map?.getSource("parcelas") as maplibregl.GeoJSONSource | undefined
    if (!ready || !source) return
    const enriched: ParcelCollection = { ...datos, features: datos.features.map(f => {
      const p = predicciones?.parcelas[f.properties.ID_POLIGON]
      return { ...f, properties: { ...f.properties,
        rend: p?.rendimiento_t_ha ?? -1,
        ancho: p?.intervalo_credito?.ancho ?? -1,
        nivel: p?.credito?.nivel ?? "sin-datos",
        calidad: p?.calidad ?? "sin-datos",
      } }
    }) }
    source.setData(enriched)
  }, [datos, predicciones, ready])

  // Cambiar la paleta sin recrear el mapa, perder zoom o selección.
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map || !map.getLayer("parcelas-fill")) return

    if (visualizacion === "conjunto") {
      map.setPaintProperty("parcelas-fill", "fill-color", [
        "match", ["get", "CONJUNTO"],
        "ENTRENAMIENTO", "#34a853", "PREDICCION", "#f5b942", "#94a3b8",
      ])
    } else if (visualizacion === "rendimiento") {
      map.setPaintProperty("parcelas-fill", "fill-color", ["step", ["to-number", ["get", "rend"], -1],
        NO_DATA_COLOR, 0, YIELD_COLORS[0], YIELD_BREAKS[0], YIELD_COLORS[1], YIELD_BREAKS[1], YIELD_COLORS[2],
        YIELD_BREAKS[2], YIELD_COLORS[3], YIELD_BREAKS[3], YIELD_COLORS[4]])
    } else if (visualizacion === "incertidumbre") {
      // Solo las 59: dos anchos (común 1.15 · ampliado Chignahuapan 1.26 t/ha)
      map.setPaintProperty("parcelas-fill", "fill-color", ["step", ["to-number", ["get", "ancho"], -1],
        NO_DATA_COLOR, 0, UNCERTAINTY_COLORS.comun, 1.2, UNCERTAINTY_COLORS.ampliado])
    } else if (visualizacion === "credito") {
      map.setPaintProperty("parcelas-fill", "fill-color", ["match", ["get", "nivel"],
        ...Object.entries(NIVEL_COLORES).flat(), NO_DATA_COLOR] as unknown as maplibregl.ExpressionSpecification)
    } else if (visualizacion === "calidad") {
      map.setPaintProperty("parcelas-fill", "fill-color", ["match", ["get", "calidad"],
        ...Object.entries(QUALITY_COLORS).flat(), NO_DATA_COLOR] as unknown as maplibregl.ExpressionSpecification)
    } else {
      map.setPaintProperty("parcelas-fill", "fill-color", [
        "step", ["to-number", ["get", "área_ha"], 0],
        SURFACE_COLORS[0],
        cortesSuperficie[0], SURFACE_COLORS[1],
        cortesSuperficie[1], SURFACE_COLORS[2],
        cortesSuperficie[2], SURFACE_COLORS[3],
        cortesSuperficie[3], SURFACE_COLORS[4],
      ])
    }
  }, [visualizacion, cortesSuperficie, ready])

  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map) return

    const porEstado: maplibregl.FilterSpecification = estado === "Todos los estados"
      ? ["has", "ID_POLIGON"] : ["==", ["get", "Estado"], estado]
    map.setFilter("parcelas-fill", porEstado)
    map.setFilter("parcelas-outline", ["all", porEstado, ["==", ["get", "CONJUNTO"], "PREDICCION"]])
    map.setFilter("parcelas-outline-obs", ["all", porEstado, ["==", ["get", "CONJUNTO"], "ENTRENAMIENTO"]])
    map.setFilter("parcelas-selected", ["==", ["get", "ID_POLIGON"], ""])
    popupRef.current?.remove()

    const visibles = estado === "Todos los estados"
      ? datos.features : datos.features.filter((p) => p.properties.Estado === estado)
    if (visibles.length) {
      const bounds = new maplibregl.LngLatBounds()
      visibles.forEach((parcela) => {
        const b = boundsFor(parcela)
        bounds.extend(b.getSouthWest())
        bounds.extend(b.getNorthEast())
      })
      map.fitBounds(bounds, { padding: 45, maxZoom: 12, duration: 650 })
    }
  }, [datos, estado, ready])

  useEffect(() => {
    const map = mapRef.current
    if (!foco || !ready || !map) return
    const parcela = datos.features.find(
      (p) => p.properties.ID_POLIGON.toUpperCase() === foco.id.trim().toUpperCase()
    )
    if (!parcela) {
      onSearchResult(`No existe la parcela ${foco.id}.`)
      return
    }
    if (estado !== "Todos los estados" && parcela.properties.Estado !== estado) {
      onSearchResult(`La parcela ${foco.id} pertenece a ${parcela.properties.Estado}. Cambia el filtro de estado.`)
      return
    }
    seleccionarParcela(map, parcela, popupRef, onOpenParcel, prediccionesRef.current)
    onSearchResult("")
  }, [datos, estado, foco, ready, onSearchResult, onOpenParcel])

  return (
    <div ref={containerRef} className="h-[540px] w-full overflow-hidden rounded-xl" aria-label="Mapa interactivo de parcelas" />
  )
}
