import type { Feature, FeatureCollection, Geometry } from "geojson"

export type ParcelProperties = {
  ID_POLIGON: string
  Estado: string
  Municipio: string
  CONJUNTO: string
  "área_ha": number
  Cultivo?: string
}

export type Parcel = Feature<Geometry, ParcelProperties>
export type ParcelCollection = FeatureCollection<Geometry, ParcelProperties>

export type ParcelFocus = { id: string; secuencia: number } | null
