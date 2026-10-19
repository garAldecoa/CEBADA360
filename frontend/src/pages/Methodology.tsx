import { useEffect, useState } from "react"
import {
  ArrowRight, BrainCircuit, ChartNoAxesCombined, CloudRain, Database,
  Gauge, Info, Leaf, MapPin, Mountain, Satellite, ShieldAlert,
  Sprout, Target, ThermometerSun, TrendingUp,
} from "lucide-react"
import {
  CartesianGrid, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart,
  Tooltip, XAxis, YAxis,
} from "recharts"
import { Header } from "@/components/layout/Header"
import { TransparencyPanel } from "@/components/layout/TransparencyPanel"

type Punto = { id: string; real: number; predicho: number }
type Trio = { p5: number; mediana: number; p95: number }
type DatosValidacion = {
  /** Métricas oficiales: 5 folds × 10 repeticiones = 1,380 errores fuera de fold (metricas_modelos.csv) */
  metricas: { rmse: number; mae: number; r2: number; rmse_sd: number; n_errores: number; esquema: string }
  /** Métricas de los 138 puntos que dibuja la gráfica (solo la repetición 0 de predicciones.csv) */
  metricas_grafica: { rmse: number; mae: number; r2: number; n: number; sesgo: number }
  esperado_59: { rmse: Trio; mae: Trio; r2: Trio }
  calibracion: { intercepto: number; pendiente: number; ic95: [number, number]; sesgo: number }
  puntos: Punto[]
  nota: string
}

const panel = "rounded-2xl border border-[#e2eaf1] bg-white p-4 shadow-[0_4px_16px_rgba(25,50,80,.06)] sm:p-5"

const pasos = [
  { icon: Satellite, titulo: "Datos satelitales", subtitulo: "Observación del cultivo", color: "#16764b", fondo: "#edf8f1", items: ["Sentinel-2, Landsat y Planet", "NDVI, EVI, LAI y NDWI", "Fenología y calidad de imágenes"] },
  { icon: CloudRain, titulo: "Datos climáticos", subtitulo: "Condiciones del ciclo", color: "#388ce3", fondo: "#eff7ff", items: ["Lluvia mensual (CHIRPS)", "Tmin y Tmax (CHIRTS-ERA5)", "Lluvia y amplitud por etapa"] },
  { icon: Mountain, titulo: "Territorio", subtitulo: "Contexto geográfico", color: "#977044", fondo: "#fff8ee", items: ["Ubicación y municipio", "Elevación y pendiente", "Vecindad espacial entre parcelas"] },
  { icon: BrainCircuit, titulo: "Modelo predictivo", subtitulo: "Ensamble CEBADA360", color: "#8052c9", fondo: "#f6f1ff", items: ["Ridge: vecinas + clima", "Promedio municipal", "Proceso gaussiano espacial"] },
  { icon: Sprout, titulo: "Resultados", subtitulo: "Estimación interpretable", color: "#176e4c", fondo: "#edf8f1", items: ["Rendimiento estimado (t/ha)", "Intervalos empíricos", "Escenarios y explicación aditiva"] },
]

function Metrica({ icon: Icon, titulo, valor, unidad, detalle, color }: {
  icon: typeof Gauge; titulo: string; valor: string; unidad?: string; detalle: string; color: string
}) {
  return <div className="flex min-h-[168px] flex-col rounded-xl border border-[#e5ecf5] bg-gradient-to-b from-white to-[#f8fbff] px-3 py-4 text-center">
    <div className="flex items-center justify-center gap-2"><Icon size={22} color={color} /><span className="font-bold text-[#11234b]">{titulo}</span></div>
    <strong className="mt-3 text-[clamp(26px,3vw,42px)] font-black tracking-tight text-[#0e2351]">{valor}</strong>
    {unidad && <span className="text-sm font-semibold text-[#1d385a]">{unidad}</span>}
    <p className="mt-auto pt-3 text-xs leading-relaxed text-[#536782]">{detalle}</p>
  </div>
}

function TarjetaFuente({ icon: Icon, titulo, color, fondo, items }: {
  icon: typeof Gauge; titulo: string; color: string; fondo: string; items: string[]
}) {
  return <article className="rounded-xl border border-white/80 p-4" style={{ background: fondo }}>
    <div className="flex items-center gap-3"><Icon color={color} size={28} /><h3 className="font-extrabold text-[#14264b]">{titulo}</h3></div>
    <ul className="mt-3 space-y-1.5 text-sm text-[#405471]">{items.map(item => <li className="flex gap-2" key={item}><span style={{ color }} aria-hidden="true">•</span><span>{item}</span></li>)}</ul>
  </article>
}

export function Methodology() {
  const [datos, setDatos] = useState<DatosValidacion | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    const controller = new AbortController()
    fetch("/data/metodologia_validacion.json", { signal: controller.signal })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() as Promise<DatosValidacion> })
      .then(v => { if (!controller.signal.aborted) setDatos(v) })
      .catch(e => { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "Error al cargar datos") })
    return () => controller.abort()
  }, [])

  return <div className="min-h-screen bg-[#f7f9fc] text-[#102044]">
    <Header />
    <section className="relative overflow-hidden border-b border-[#e5eaf0]" style={{
      backgroundImage: "linear-gradient(90deg,rgba(255,255,255,.97),rgba(255,255,255,.75) 49%,rgba(255,255,255,.18)),url('/images/hero-cebada.jpg')",
      backgroundSize: "cover", backgroundPosition: "center",
    }}>
      <div className="mx-auto max-w-[1600px] px-5 py-6 md:px-8 md:py-8">
        <h1 className="text-4xl font-black tracking-tight text-[#102450] sm:text-5xl">Metodología</h1>
        <p className="mt-2 max-w-3xl text-base font-medium text-[#263e61]">Cómo CEBADA360 transforma datos agrícolas en estimaciones de rendimiento e incertidumbre.</p>
      </div>
    </section>

    <main className="mx-auto max-w-[1600px] space-y-3 px-4 py-4 md:px-7">
      <section className={panel}>
        <h2 className="text-xl font-extrabold text-[#102450]">¿Cómo funciona CEBADA360?</h2>
        <p className="mb-4 mt-1 text-sm text-[#536784]">Integramos información de campo y territorio con un ensamble estadístico. Las variables satelitales permiten describir el cultivo, pero no todas entran directamente en el modelo final.</p>
        <div className="grid gap-2 lg:grid-cols-5">
          {pasos.map((paso, idx) => <div key={paso.titulo} className="relative rounded-xl border border-black/5 p-4" style={{ background: paso.fondo }}>
            <div className="flex items-center gap-3"><paso.icon color={paso.color} size={34} strokeWidth={1.9}/><div><h3 className="text-sm font-extrabold text-[#11264e]">{paso.titulo}</h3><p className="text-xs text-[#526681]">{paso.subtitulo}</p></div></div>
            <ul className="mt-4 space-y-2 text-xs leading-relaxed text-[#3b506c]">{paso.items.map(item => <li key={item} className="flex gap-2"><span style={{ color: paso.color }}>●</span>{item}</li>)}</ul>
            {idx < 4 && <ArrowRight className="absolute -right-3.5 top-1/2 z-10 hidden rounded-full bg-white p-1 text-[#58708c] lg:block" size={26}/>} 
          </div>)}
        </div>
        <div className="mt-4 rounded-xl bg-[#f4f8f5] px-4 py-3 text-sm text-[#245746]">
          <strong>Modelo seleccionado:</strong> predicción = (Ridge + promedio del municipio + proceso gaussiano espacial) / 3.
          <span className="ml-1 text-[#536c60]">Las explicaciones corresponden a una descomposición aditiva del ensamble, no a SHAP ni a efectos causales.</span>
        </div>
      </section>

      <div className="grid gap-3 xl:grid-cols-[1.06fr_1fr]">
        <section className={panel}>
          <div className="flex items-center gap-2"><h2 className="text-xl font-extrabold text-[#102450]">Desempeño del modelo</h2><Info className="h-4 w-4 text-[#66809e]"/></div>
          <p className="mt-1 text-sm text-[#536784]">Métricas oficiales: validación cruzada {datos ? datos.metricas.esquema : "5 folds × 10 repeticiones, estratificada por municipio"}, sobre las 138 parcelas con rendimiento observado{datos ? ` (${datos.metricas.n_errores.toLocaleString("es-MX")} errores fuera de fold)` : ""}.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Metrica icon={Target} titulo="RMSE" valor={datos ? datos.metricas.rmse.toFixed(4) : "—"} unidad={datos ? `t/ha · ± ${datos.metricas.rmse_sd.toFixed(4)} entre repeticiones` : "t/ha"} detalle="Raíz del error cuadrático medio" color="#13744e" />
            <Metrica icon={ChartNoAxesCombined} titulo="MAE" valor={datos ? datos.metricas.mae.toFixed(4) : "—"} unidad="t/ha" detalle="Error absoluto medio" color="#3d94eb" />
            <Metrica icon={TrendingUp} titulo="R²" valor={datos ? datos.metricas.r2.toFixed(4) : "—"} detalle="Coeficiente de determinación" color="#28724f" />
          </div>
          {datos && <div className="mt-4 overflow-x-auto rounded-xl border border-[#e5ecf5]">
            <table className="w-full min-w-[420px] text-sm">
              <caption className="bg-[#f6f9fc] px-3 py-2 text-left text-xs font-semibold text-[#3b506c]">Calificación esperada en las 59 parcelas (simulación del paso 19)</caption>
              <thead><tr className="text-xs text-[#5b6f88]"><th className="px-3 py-1.5 text-left font-semibold">Métrica</th><th className="px-3 py-1.5 text-right font-semibold">p5</th><th className="px-3 py-1.5 text-right font-semibold">Mediana</th><th className="px-3 py-1.5 text-right font-semibold">p95</th></tr></thead>
              <tbody>{([["RMSE (t/ha)", datos.esperado_59.rmse], ["MAE (t/ha)", datos.esperado_59.mae], ["R²", datos.esperado_59.r2]] as const).map(([k, t]) =>
                <tr key={k} className="border-t border-[#eef2f6]"><td className="px-3 py-1.5 font-medium">{k}</td><td className="px-3 py-1.5 text-right tabular-nums">{t.p5.toFixed(3)}</td><td className="px-3 py-1.5 text-right font-bold tabular-nums">{t.mediana.toFixed(3)}</td><td className="px-3 py-1.5 text-right tabular-nums">{t.p95.toFixed(3)}</td></tr>)}</tbody>
            </table>
          </div>}
          <p className="mt-3 text-xs leading-relaxed text-[#687c93]">Son métricas de validación cruzada sobre las 138 parcelas; <strong>no son el error de las 59 parcelas con rendimiento oculto</strong>, que solo se conocerá con la evaluación de FIRA. {datos && <>Calibración: y = {datos.calibracion.intercepto.toFixed(3)} + {datos.calibracion.pendiente.toFixed(3)}·ŷ (IC 95 % de la pendiente [{datos.calibracion.ic95[0].toFixed(3)}, {datos.calibracion.ic95[1].toFixed(3)}]); sesgo {datos.calibracion.sesgo.toFixed(4)} t/ha. </>}Fuentes: resultados_I3/metricas_modelos.csv (modelo seleccionado) y ENTREGA/resumen_prediccion_final.txt.</p>
        </section>

        <section className={panel}>
          <h2 className="text-xl font-extrabold text-[#102450]">Rendimiento real vs. predicho</h2>
          <p className="mt-1 text-sm text-[#536784]">Cada punto es una de las 138 parcelas con dato, predicha sin verla (fuera de fold) en la <strong>repetición 0</strong> de la validación.</p>
          {datos && <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {[["RMSE", datos.metricas_grafica.rmse.toFixed(4)], ["MAE", datos.metricas_grafica.mae.toFixed(4)], ["R²", datos.metricas_grafica.r2.toFixed(4)], ["Puntos", String(datos.metricas_grafica.n)]].map(([k, v]) =>
              <span key={k} className="rounded-full bg-[#eef6f1] px-3 py-1 text-[#1f4f3d]"><strong>{k}</strong> {v}</span>)}
            <span className="rounded-full bg-[#f3f5f8] px-3 py-1 text-[#4f6276]">de estos 138 puntos</span>
          </div>}
          {error ? <div role="alert" className="mt-5 rounded-lg bg-red-50 p-4 text-sm text-red-800">No se pudieron cargar las métricas: {error}. Comprueba el archivo public/data/metodologia_validacion.json.</div> :
            <div className="mt-2 h-[285px] w-full sm:h-[310px]" role="img" aria-label="Diagrama de dispersión entre rendimientos observados y predichos en validación">
              {datos ? <ResponsiveContainer width="100%" height="100%"><ScatterChart margin={{ top: 8, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid stroke="#e6edf3" />
                <XAxis type="number" dataKey="real" name="Real" domain={[1.5, 6]} ticks={[1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6]} tick={{ fontSize: 11 }} label={{ value: "Rendimiento real (t/ha)", position: "insideBottom", offset: -12, fontSize: 11 }}/>
                <YAxis type="number" dataKey="predicho" name="Predicho" domain={[1.5, 6]} ticks={[2, 3, 4, 5, 6]} tick={{ fontSize: 11 }} width={37} label={{ value: "Predicho (t/ha)", angle: -90, position: "insideLeft", fontSize: 11 }}/>
                <Tooltip cursor={{ strokeDasharray: "3 3" }} content={({ active, payload }) => {
                  const p = active ? payload?.[0]?.payload as Punto | undefined : undefined
                  return p ? <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow"><strong>{p.id}</strong><br/>Real {p.real.toFixed(2)} · Predicho {p.predicho.toFixed(4)} t/ha<br/>Error {(p.real - p.predicho).toFixed(4)} t/ha</div> : null
                }} />
                <ReferenceLine segment={[{ x: 1.5, y: 1.5 }, { x: 6, y: 6 }]} stroke="#64748b" strokeDasharray="5 5" />
                <Scatter name="Parcelas de validación" data={datos.puntos} fill="#19714d" fillOpacity={0.55} />
              </ScatterChart></ResponsiveContainer> : <div className="flex h-full items-center justify-center text-sm text-slate-500">Cargando gráfica de validación…</div>}
            </div>}
          <div className="mt-1 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-[#546c87]"><span><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-[#19714d]"/>138 parcelas de validación</span><span><span className="mr-2 inline-block h-0 w-5 border-t-2 border-dashed border-slate-500 align-middle"/>Predicción perfecta (y = x)</span></div>
          <details className="mt-3 rounded-lg bg-[#f6f9fc] px-3 py-2 text-xs leading-relaxed text-[#40546d]">
            <summary className="cursor-pointer font-semibold text-[#1d385a]">¿Por qué la gráfica no da 0.494?</summary>
            <p className="mt-2">0.494 se calcula con los 1,380 errores fuera de fold de las 10 repeticiones de la validación (138 parcelas × 10). La gráfica usa resultados_I3/predicciones.csv, que guarda solo la repetición 0 (138 predicciones): con ese archivo el RMSE da {datos ? datos.metricas_grafica.rmse.toFixed(3) : "0.503"} y el MAE {datos ? datos.metricas_grafica.mae.toFixed(3) : "0.347"}. La diferencia es la variación normal entre particiones (desviación entre repeticiones 0.006): no es un error.</p>
            <p className="mt-2">Los puntos forman columnas porque muchas parcelas reportaron su rendimiento redondeado (2.5, 3.0, 3.5 t/ha), y dos grupos de predicción (≈3.0 y ≈4.5 t/ha) porque hay dos zonas productivas.</p>
          </details>
          <p className="mt-2 text-xs text-[#687c93]">Gráfica elaborada por la web a partir de resultados_I3/predicciones.csv (repetición 0) y outputs/base_maestra_v3.csv (rendimiento observado).</p>
        </section>
      </div>

      <div className="grid gap-3 xl:grid-cols-[.8fr_1.2fr]">
        <section className={panel}>
          <h2 className="text-xl font-extrabold text-[#102450]">Datos del reto</h2>
          <p className="mt-1 text-sm text-[#536784]">197 parcelas del ciclo agrícola 2025, divididas según disponibilidad del rendimiento.</p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-8">
            <div className="relative flex h-44 w-44 shrink-0 items-center justify-center rounded-full" style={{ background: "conic-gradient(#14543c 0% 70.05%, #adc5b5 70.05% 100%)" }}>
              <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white shadow-inner"><span className="text-3xl font-black text-[#102450]">197</span><span className="text-xs text-[#506580]">parcelas</span></div>
            </div>
            <div className="min-w-[210px] flex-1 space-y-3 text-sm">
              <div className="flex items-start gap-3"><span className="mt-1 h-4 w-4 shrink-0 rounded-full bg-[#14543c]"/><div><strong className="text-xl text-[#102450]">138</strong><span className="ml-2 font-bold text-[#153d32]">70.1 %</span><p className="text-[#526784]">Rendimiento observado (entrenamiento y validación)</p></div></div>
              <div className="border-t border-[#edf1f4] pt-3 flex items-start gap-3"><span className="mt-1 h-4 w-4 shrink-0 rounded-full bg-[#adc5b5]"/><div><strong className="text-xl text-[#102450]">59</strong><span className="ml-2 font-bold text-[#526784]">29.9 %</span><p className="text-[#526784]">Rendimiento oculto (predicción; no hay observado disponible)</p></div></div>
            </div>
          </div>
        </section>

        <section className={panel}>
          <h2 className="text-xl font-extrabold text-[#102450]">Fuentes de datos y variables utilizadas</h2>
          <p className="mt-1 text-sm text-[#536784]">Fuentes de apoyo y variables del ensamble seleccionado.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <TarjetaFuente icon={Satellite} titulo="Satélite" color="#14784d" fondo="#eff8f3" items={["Sentinel-2", "Planet", "Landsat", "Índices para describir fenología y calidad"]}/>
            <TarjetaFuente icon={CloudRain} titulo="Clima" color="#3c92df" fondo="#eff7ff" items={["Precipitación CHIRPS", "Tmin y Tmax CHIRTS-ERA5", "Lluvia y amplitud térmica durante crecimiento"]}/>
            <TarjetaFuente icon={Mountain} titulo="Territorio" color="#936b3c" fondo="#fff8eb" items={["Ubicación y municipio", "Coordenadas espaciales", "Elevación y pendiente como contexto"]}/>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#5f7188]"><Database size={16}/><span>Datos del reto y productos derivados del análisis de CEBADA360, ciclo 2025.</span></div>
        </section>
      </div>

      <TransparencyPanel />

      <section className="rounded-2xl border border-[#dcebe5] bg-gradient-to-r from-[#eef9f2] to-[#f6fafc] p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-4xl">
            <h2 className="flex items-center gap-2 text-xl font-extrabold text-[#174b3c]"><ShieldAlert size={23}/> Cómo interpretar los resultados</h2>
            <p className="mt-1 text-sm leading-relaxed text-[#476175]">El desempeño se estimó sobre parcelas con rendimiento observado de una sola temporada. La transferencia a nuevas regiones no está garantizada. Los intervalos son empíricos y los indicadores de riesgo orientativos; no confirman daños ni constituyen una decisión de crédito.</p>
          </div>
          <a href="/" className="inline-flex items-center gap-2 rounded-xl bg-[#13553f] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1b7354]"><MapPin size={17}/> Explorar mapa <ArrowRight size={16}/></a>
        </div>
      </section>
      <div className="flex flex-wrap gap-4 px-1 pb-3 text-xs text-[#718095]"><span className="inline-flex items-center gap-1"><Leaf size={13}/> CEBADA360 · Reto AgroCebada 2026</span><span className="inline-flex items-center gap-1"><ThermometerSun size={13}/> CHIRPS / CHIRTS-ERA5 · 2025</span></div>
    </main>
  </div>
}
