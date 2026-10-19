import { BarChart3, BrainCircuit, Code2, Database, Leaf, Sigma, Sprout, Users, ArrowRight } from "lucide-react"
import { Header } from "@/components/layout/Header"

// Edita las cinco fichas con los datos reales autorizados por tu equipo.
// Coloca fotos en frontend/public/images/equipo/ y escribe su ruta en "foto".
// Si foto está vacía, se muestra un avatar con iniciales (no una foto ficticia).
const integrantes = [
  { nombre: "Ian Schmitz", carrera: "Integrante 1", rol: "Actuaria", descripcion: "Desarrollo de la interfaz web, visualización de información y conexión con el backend del modelo.", etiquetas: ["Aplicación web", "Visualización", "Integración"], foto: "", color: "green", icono: Code2 },
  { nombre: "Valentina Rodriguez", carrera: "Integrante 2", rol: "Ciencia de Datos", descripcion: "Desarrollo, validación y documentación del modelo predictivo y sus componentes.", etiquetas: ["Modelo", "Validación", "Explicación"], foto: "", color: "blue", icono: BrainCircuit },
  { nombre: "Braulio Martinez", carrera: "Integrante 3", rol: "Actuaria", descripcion: "Auditoría de datos, limpieza de información satelital y documentación de variables.", etiquetas: ["Datos", "Satélites", "Clima"], foto: "", color: "gold", icono: Database },
  { nombre: "Jose Miguel Alameda", carrera: "Integrante 4", rol: "Actuaria & Ciencia de Datos", descripcion: "Integración del clima por etapa, fenología e indicadores territoriales.", etiquetas: ["Escenarios", "Crédito", "Riesgo"], foto: "", color: "purple", icono: Sigma },
  { nombre: "Gartzen Aldecoa", carrera: "Integrante 5", rol: "Ingenieria en Sistemas Computacionales", descripcion: "Construcción de escenarios de ingreso, incertidumbre y análisis financiero exploratorio.", etiquetas: ["Crédito", "Incertidumbre", "Escenarios"], foto: "", color: "rose", icono: Leaf },
] as const

const themes = {
  green: { bg: "#f3faf5", line: "#dbede1", chip: "#e0f1e5", ink: "#155c3d", icon: "#1c7547" },
  blue: { bg: "#f4f9ff", line: "#dbe9fa", chip: "#e2efff", ink: "#245da9", icon: "#3377c7" },
  gold: { bg: "#fffaf2", line: "#f3e8d5", chip: "#fff0d2", ink: "#9a5b09", icon: "#d79a13" },
  purple: { bg: "#faf7ff", line: "#e9defa", chip: "#eee6ff", ink: "#7144af", icon: "#8959ca" },
  rose: { bg: "#fff8f8", line: "#f4e2e2", chip: "#ffe8e8", ink: "#aa3d46", icon: "#d3515a" },
} as const

function iniciales(nombre: string) {
  return nombre.split(" ").filter(Boolean).slice(0, 2).map(p => p[0]).join("").toUpperCase()
}

export function Team() {
  return (
    <div className="min-h-screen bg-[#f7f9fc] text-[#102044]">
      <Header />
      <section className="relative overflow-hidden border-b border-slate-200" style={{ backgroundImage: "linear-gradient(90deg, rgba(255,255,255,.97) 0%, rgba(255,255,255,.92) 32%, rgba(255,255,255,.35) 66%, rgba(255,255,255,.08) 100%), url('/images/hero-cebada.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}>
        <div className="mx-auto max-w-[1600px] px-5 py-10 sm:px-8 lg:py-14">
          <p className="text-sm font-extrabold uppercase tracking-wider text-emerald-900">Nuestro equipo</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-tight text-[#102450] sm:text-5xl lg:text-6xl">Cinco perspectivas,<br/><span className="text-[#497b2c]">un mismo propósito</span></h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#44597e] sm:text-lg">CEBADA360 nace de la colaboración de cinco integrantes con responsabilidades complementarias en análisis de datos, modelado predictivo, estadística, información territorial y desarrollo de software. Buscamos crear una herramienta útil y comprensible para el sector agrícola.</p>
          <a href="/" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-900 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-emerald-800">Explorar parcelas <ArrowRight size={16}/></a>
        </div>
      </section>

      <main className="mx-auto max-w-[1600px] space-y-5 px-4 py-5 sm:px-7">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {integrantes.map((persona, index) => {
            const theme = themes[persona.color]
            const Icon = persona.icono
            return (
              <article key={index} className="flex h-full flex-col rounded-2xl border px-5 py-6 shadow-sm transition-shadow hover:shadow-md" style={{ background: theme.bg, borderColor: theme.line }}>
                <div className="mx-auto flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white shadow-md" style={{ background: theme.chip }}>
                  {persona.foto ? <img src={persona.foto} alt={`Fotografía de ${persona.nombre}`} className="h-full w-full object-cover" /> : <span className="text-3xl font-extrabold" style={{ color: theme.ink }}>{iniciales(persona.nombre)}</span>}
                </div>
                <h2 className="mt-4 text-center text-lg font-extrabold leading-snug text-[#102450]">{persona.nombre}</h2>
                <p className="mt-1 text-center text-sm text-[#4b5f85]">{persona.carrera}</p>
                <div className="mt-3 flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 text-center text-sm font-bold" style={{ background: theme.chip, color: theme.ink }}><Icon size={21} className="shrink-0" />{persona.rol}</div>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-[#4b5f85]">{persona.descripcion}</p>
                <div className="mt-5 flex flex-wrap gap-2">{persona.etiquetas.map(etiqueta => <span key={etiqueta} className="rounded-lg px-2.5 py-1.5 text-xs font-medium" style={{ background: theme.chip, color: theme.ink }}>{etiqueta}</span>)}</div>
              </article>
            )
          })}
        </div>

        <section className="relative overflow-hidden rounded-2xl border border-[#e1ece8] bg-[#edf5f0] shadow-sm">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "url('/images/hero-cebada.jpg')", backgroundSize: "cover", backgroundPosition: "center 65%" }}/>
          <div className="relative grid gap-6 px-6 py-7 lg:grid-cols-[1.1fr_1.5fr] lg:items-center lg:px-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#316a54]">Reto AgroCebada 2026</p>
              <h2 className="mt-1 text-2xl font-extrabold text-[#12473d] sm:text-3xl">Un equipo, un mismo objetivo</h2>
              <p className="mt-2 max-w-xl text-[#4b5f85]">Creemos en el poder de los datos y la colaboración multidisciplinaria para aportar herramientas transparentes a los retos del campo.</p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="border-l border-[#bfd4cc] px-2"><Sprout className="mx-auto mb-2 text-[#216c49]" size={36}/><p className="text-sm font-medium text-[#425879]">Conocimiento<br/>complementario</p></div>
              <div className="border-l border-[#bfd4cc] px-2"><Users className="mx-auto mb-2 text-[#216c49]" size={36}/><p className="text-sm font-medium text-[#425879]">Trabajo<br/>colaborativo</p></div>
              <div className="border-l border-[#bfd4cc] px-2"><BarChart3 className="mx-auto mb-2 text-[#216c49]" size={36}/><p className="text-sm font-medium text-[#425879]">Impacto en el<br/>sector agrícola</p></div>
            </div>
          </div>
        </section>
        <p className="pb-3 text-center text-xs text-slate-500">CEBADA360 · Reto AgroCebada 2026 · Los nombres, especialidades y fotografías deben confirmarse antes de publicar.</p>
      </main>
    </div>
  )
}
