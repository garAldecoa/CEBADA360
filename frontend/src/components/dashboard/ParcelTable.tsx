import { useMemo, useState } from "react"
import { ArrowDown, ArrowUp, ArrowUpDown, MapPin, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { DatosCebada } from "@/types/cebada360"
import { formatoNumero } from "@/types/cebada360"
import type { Parcel } from "@/types/parcelas"

type SortKey = "ID_POLIGON" | "Estado" | "Municipio" | "área_ha" | "CONJUNTO"
type SortDirection = "asc" | "desc"

type Props = {
  predicciones: DatosCebada | null
  parcelas: Parcel[]
  estado: string
  onEstadoChange: (estado: string) => void
  onVerEnMapa: (id: string) => void
  onOpenParcel: (id: string) => void
}

const columnas: { key: SortKey; label: string }[] = [
  { key: "ID_POLIGON", label: "Parcela" },
  { key: "Estado", label: "Estado" },
  { key: "Municipio", label: "Municipio" },
  { key: "área_ha", label: "Superficie" },
  { key: "CONJUNTO", label: "Conjunto" },
]

export function ParcelTable({ predicciones, parcelas, estado, onEstadoChange, onVerEnMapa, onOpenParcel }: Props) {
  const [consulta, setConsulta] = useState("")
  const [conjunto, setConjunto] = useState("Todos los conjuntos")
  const [orden, setOrden] = useState<SortKey>("ID_POLIGON")
  const [direccion, setDireccion] = useState<SortDirection>("asc")
  const [porPagina, setPorPagina] = useState(10)
  const [paginaSolicitada, setPaginaSolicitada] = useState(1)

  const filtradas = useMemo(() => {
    const texto = consulta.trim().toLocaleLowerCase("es")
    return parcelas
      .filter((p) => estado === "Todos los estados" || p.properties.Estado === estado)
      .filter((p) => conjunto === "Todos los conjuntos" || p.properties.CONJUNTO === conjunto)
      .filter((p) => {
        if (!texto) return true
        const datos = p.properties
        return [datos.ID_POLIGON, datos.Municipio, datos.Estado]
          .some((valor) => String(valor).toLocaleLowerCase("es").includes(texto))
      })
      .sort((a, b) => {
        const valorA = a.properties[orden]
        const valorB = b.properties[orden]
        const comparacion = typeof valorA === "number" && typeof valorB === "number"
          ? valorA - valorB
          : String(valorA).localeCompare(String(valorB), "es", { numeric: true, sensitivity: "base" })
        return direccion === "asc" ? comparacion : -comparacion
      })
  }, [parcelas, estado, conjunto, consulta, orden, direccion])

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / porPagina))
  const pagina = Math.min(paginaSolicitada, totalPaginas)
  const inicio = (pagina - 1) * porPagina
  const paginaActual = filtradas.slice(inicio, inicio + porPagina)

  function cambiarOrden(columna: SortKey) {
    if (columna === orden) {
      setDireccion((anterior) => anterior === "asc" ? "desc" : "asc")
    } else {
      setOrden(columna)
      setDireccion("asc")
    }
    setPaginaSolicitada(1)
  }

  return (
    <section aria-label="Lista de parcelas" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Listado de parcelas</h3>
          <p className="mt-1 text-sm text-slate-600">
            {filtradas.length} de {parcelas.length} parcelas · Haz clic en «Ver en mapa» para localizar una.
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-3 md:w-auto">
          <label className="relative min-w-[210px] flex-1 md:flex-none">
            <span className="sr-only">Buscar por parcela o municipio</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="search"
              value={consulta}
              onChange={(event) => { setConsulta(event.target.value); setPaginaSolicitada(1) }}
              placeholder="ID o municipio"
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-700"
            />
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            Estado
            <select
              value={estado}
              onChange={(event) => { onEstadoChange(event.target.value); setPaginaSolicitada(1) }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2"
            >
              <option>Todos los estados</option>
              <option>Hidalgo</option>
              <option>Puebla</option>
              <option>Tlaxcala</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            Conjunto
            <select
              value={conjunto}
              onChange={(event) => { setConjunto(event.target.value); setPaginaSolicitada(1) }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2"
            >
              <option>Todos los conjuntos</option>
              <option value="ENTRENAMIENTO">Entrenamiento</option>
              <option value="PREDICCION">Predicción</option>
            </select>
          </label>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[850px] text-left text-sm">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              {columnas.map((columna) => (
                <th key={columna.key} scope="col" className="px-4 py-3 font-semibold">
                  <button
                    type="button"
                    onClick={() => cambiarOrden(columna.key)}
                    className="flex items-center gap-2 hover:text-emerald-800"
                    aria-label={`Ordenar por ${columna.label}`}
                  >
                    {columna.label}
                    {orden !== columna.key ? <ArrowUpDown className="h-3.5 w-3.5" />
                      : direccion === "asc" ? <ArrowUp className="h-3.5 w-3.5" />
                        : <ArrowDown className="h-3.5 w-3.5" />}
                  </button>
                </th>
              ))}
              <th scope="col" className="px-4 py-3 font-semibold">Rendimiento</th>
              <th scope="col" className="px-4 py-3 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginaActual.map((parcela) => {
              const p = parcela.properties
              return (
                <tr key={p.ID_POLIGON} className="hover:bg-emerald-50/60">
                  <td className="px-4 py-3 font-semibold text-emerald-900">{p.ID_POLIGON}</td>
                  <td className="px-4 py-3">{p.Estado}</td>
                  <td className="px-4 py-3">{p.Municipio}</td>
                  <td className="px-4 py-3 tabular-nums">{Number(p["área_ha"]).toLocaleString("es-MX", { maximumFractionDigits: 2 })} ha</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${p.CONJUNTO === "ENTRENAMIENTO" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-900"}`}>
                      {p.CONJUNTO === "ENTRENAMIENTO" ? "Entrenamiento" : "Predicción"}
                    </span>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{(() => {
                    const r = predicciones?.parcelas[p.ID_POLIGON]
                    if (!r) return "…"
                    return <span className="flex items-center gap-2">{formatoNumero(r.rendimiento_t_ha)} t/ha
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${r.tipo === "observado" ? "bg-slate-100 text-slate-700" : "bg-violet-100 text-violet-800"}`}>{r.tipo}</span></span>
                  })()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => onVerEnMapa(p.ID_POLIGON)}>
                        <MapPin className="mr-1 h-4 w-4" />Ver en mapa
                      </Button>
                      <Button type="button" size="sm" className="bg-emerald-900 text-white hover:bg-emerald-800" onClick={() => onOpenParcel(p.ID_POLIGON)}>
                        Ver ficha →
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {paginaActual.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-500">No se encontraron parcelas con estos filtros.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-slate-600">
        <p role="status">
          {filtradas.length === 0 ? "0 resultados" : `Mostrando ${inicio + 1}–${Math.min(inicio + porPagina, filtradas.length)} de ${filtradas.length}`}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2">
            Filas
            <select
              value={porPagina}
              onChange={(event) => { setPorPagina(Number(event.target.value)); setPaginaSolicitada(1) }}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </label>
          <Button type="button" variant="outline" size="sm" disabled={pagina === 1} onClick={() => setPaginaSolicitada(pagina - 1)}>
            Anterior
          </Button>
          <span className="tabular-nums">Página {pagina} de {totalPaginas}</span>
          <Button type="button" variant="outline" size="sm" disabled={pagina >= totalPaginas} onClick={() => setPaginaSolicitada(pagina + 1)}>
            Siguiente
          </Button>
        </div>
      </div>
    </section>
  )
}
