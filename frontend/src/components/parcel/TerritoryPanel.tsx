import { Info, MapPinned, Mountain, Ruler, TrendingUp } from "lucide-react"
import type { Parcel } from "@/types/parcelas"
import type { ClimateTerritoryData } from "@/types/clima-territorio"

function format(value: number | null | undefined, decimals = 1) {
  return typeof value === "number" && Number.isFinite(value) ? value.toLocaleString("es-MX", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) : "—"
}

function Tile({ label, value, detail, tone }: { label: string; value: string; detail?: string; tone: "green" | "blue" | "gold" | "neutral" }) {
  const palette = {
    green: { background: "linear-gradient(135deg,#daf2e4,#f0f9f3)", border: "#abd7bc" },
    blue: { background: "linear-gradient(135deg,#dcefff,#f2f9ff)", border: "#b8d8eb" },
    gold: { background: "linear-gradient(135deg,#fff0ca,#fff9e9)", border: "#ead9a8" },
    neutral: { background: "linear-gradient(135deg,#f1f5f9,#ffffff)", border: "#e2e8f0" },
  }[tone]
  return (
    <div style={{ background: palette.background, border: `1px solid ${palette.border}`, borderRadius: 14, padding: 18 }}>
      <p className="text-xs font-medium text-slate-600">{label}</p>
      <p className="mt-2 text-xl font-bold text-slate-950">{value}</p>
      {detail && <p className="mt-1 text-xs leading-relaxed text-slate-600">{detail}</p>}
    </div>
  )
}

export function TerritoryPanel({ parcela, datos }: { parcela: Parcel; datos: ClimateTerritoryData }) {
  const geo = parcela.properties
  const row = datos.parcelas[geo.ID_POLIGON]?.territorio
  if (!row) return <div role="status" className="rounded-xl bg-slate-50 p-8 text-slate-600">No hay información topográfica para esta parcela.</div>

  return (
    <div className="space-y-5">
      <div>
        <h3 className="flex items-center gap-2 text-lg font-bold text-slate-950"><Mountain className="h-5 w-5 text-emerald-700"/> Territorio de la parcela</h3>
        <p className="mt-1 text-sm text-slate-600">Elevación y pendiente estimadas con los raster INEGI–CEM 4.0 del reto, de 120 m de resolución.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Tile label="Elevación media" value={`${format(row.elevacion_media_m)} m s. n. m.`} detail="Media de píxeles intersectados" tone="green" />
        <Tile label="Pendiente media" value={`${format(row.pendiente_media_grados, 2)}°`} detail="Inclinación del terreno, en grados" tone="gold" />
        <Tile label="Superficie oficial" value={`${format(Number(geo["área_ha"]), 2)} ha`} detail="Área registrada en el conjunto de parcelas" tone="blue" />
        <Tile label="Elevación mínima–máxima" value={`${format(row.elevacion_min_m, 0)}–${format(row.elevacion_max_m, 0)} m`} detail={`Desviación de elevación: ${format(row.elevacion_desv_m)} m`} tone="neutral" />
        <Tile label="Pendiente mínima–máxima" value={`${format(row.pendiente_min_grados, 2)}–${format(row.pendiente_max_grados, 2)}°`} detail={`Desviación de pendiente: ${format(row.pendiente_desv_grados, 2)}°`} tone="neutral" />
        <Tile label="Ubicación administrativa" value={geo.Estado} detail={`Municipio: ${geo.Municipio}`} tone="neutral" />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h4 className="flex items-center gap-2 font-semibold text-slate-900"><MapPinned className="h-4 w-4 text-emerald-700"/> Identificación territorial</h4>
          <dl className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-slate-500">Parcela</dt><dd className="font-medium text-slate-900">{geo.ID_POLIGON}</dd>
            <dt className="text-slate-500">Estado</dt><dd className="font-medium text-slate-900">{geo.Estado}</dd>
            <dt className="text-slate-500">Municipio</dt><dd className="font-medium text-slate-900">{geo.Municipio}</dd>
            <dt className="text-slate-500">Conjunto</dt><dd className="font-medium text-slate-900">{geo.CONJUNTO}</dd>
          </dl>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h4 className="flex items-center gap-2 font-semibold text-slate-900"><Ruler className="h-4 w-4 text-emerald-700" /> Cobertura de muestras</h4>
          <p className="mt-3 text-sm text-slate-700">Píxeles para elevación: <strong>{row.elevacion_pixeles}</strong></p>
          <p className="mt-2 text-sm text-slate-700">Píxeles para pendiente: <strong>{row.pendiente_pixeles}</strong></p>
          <p className="mt-3 flex items-center gap-2 text-xs text-slate-500"><TrendingUp size={16} /> Los estadísticos resumen celdas del raster, no puntos medidos sobre el terreno.</p>
        </div>
      </div>
      <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
        <h4 className="flex items-center gap-2 font-semibold text-sky-900"><Info className="h-4 w-4"/> Nota metodológica</h4>
        <p className="mt-2 text-xs leading-relaxed text-sky-950">Se reproyectaron las geometrías a EPSG:6372 para extraer las celdas de elevación y pendiente de INEGI (120 m), incluyendo todos los píxeles que tocan el polígono. Los estadísticos no están ponderados por la fracción de píxel dentro de la parcela. En parcelas pequeñas, este método es aproximado y puede incluir información de bordes.</p>
        <p className="mt-2 text-xs leading-relaxed text-sky-950">Los valores topográficos son descriptivos; por sí solos no permiten afirmar un nivel de riesgo o un impacto causal sobre el rendimiento.</p>
      </div>
    </div>
  )
}
