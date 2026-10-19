import {
  ArrowRight, BarChart3, BrainCircuit, Compass,
  Leaf, Map, SearchCheck, ShieldAlert, Sprout, Target,
  Wheat, Settings2,
} from "lucide-react"
import { Header } from "@/components/layout/Header"

const preguntas = [
  { icon: Sprout, title: "¿Cuánto producirá?", description: "Estimación del rendimiento de cebada por parcela (t/ha).", bg: "#dcf4e6", ink: "#1b7854" },
  { icon: BarChart3, title: "¿Qué tan incierta es la predicción?", description: "Intervalos empíricos de referencia para interpretar su variabilidad.", bg: "#e0eeff", ink: "#397fdb" },
  { icon: ShieldAlert, title: "¿Qué riesgo presenta?", description: "Señales e indicadores orientativos, sujetos a revisión de campo.", bg: "#fff0c6", ink: "#e7a70c" },
  { icon: BrainCircuit, title: "¿Qué factores explican el resultado?", description: "Descomposición aditiva del modelo, sin atribuir causalidad.", bg: "#efe3ff", ink: "#8748cc" },
  { icon: Target, title: "¿Cómo usar esta información?", description: "Comparación de parcelas y escenarios para apoyar decisiones.", bg: "#dcf4ed", ink: "#218c79" },
] as const

const etapas = [
  { icon: Compass, name: "Observar", detail: "Satélite, clima y territorio", bg: "#276c55" },
  { icon: Settings2, name: "Predecir", detail: "Rendimiento y su incertidumbre", bg: "#4b93e9" },
  { icon: SearchCheck, name: "Explicar", detail: "Contribuciones del modelo", bg: "#9562d9" },
  { icon: Leaf, name: "Apoyar decisiones", detail: "Información clara y útil", bg: "#559e72" },
] as const

export function About() {
  return (
    <div className="min-h-screen bg-[#f7f9fc] text-[#102044]">
      <Header />

      <section
        className="relative overflow-hidden border-b border-slate-200"
        style={{
          backgroundImage: "linear-gradient(90deg, rgba(255,255,255,.99) 0%, rgba(255,255,255,.96) 29%, rgba(255,255,255,.77) 46%, rgba(255,255,255,.12) 81%), url('/images/hero-cebada.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="mx-auto max-w-[1600px] px-5 py-9 sm:px-8 lg:py-14">
          <p className="text-sm font-extrabold uppercase tracking-wide text-[#185a4b]">Acerca de</p>
          <h1 className="mt-2 text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl" style={{ background: "linear-gradient(105deg, #095943 18%, #6f9831 85%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", width: "fit-content" }}>
            CEBADA360
          </h1>
          <h2 className="mt-1 max-w-[660px] text-xl font-bold text-[#102450] sm:text-2xl">Inteligencia productiva para el cultivo de cebada</h2>
          <p className="mt-4 max-w-[610px] text-base leading-relaxed text-[#485d80] sm:text-lg">
            Una plataforma que integra información satelital, climática y territorial con modelos predictivos para estimar el rendimiento de cebada por parcela, comunicar la incertidumbre y transformar los resultados en información útil para tomar decisiones.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href="/" className="inline-flex items-center gap-3 rounded-xl bg-[#10503f] px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-[#176852]"><Map size={20}/> Explorar mapa <ArrowRight size={18}/></a>
            <a href="/?vista=metodologia" className="inline-flex items-center gap-2 rounded-xl border border-[#bfcbda] bg-white/85 px-5 py-3 font-semibold text-[#145043] transition hover:bg-white">Conocer la metodología <ArrowRight size={17}/></a>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[1600px] space-y-4 px-4 py-4 sm:px-7">
        <div className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-[#f0e8e8] p-5 shadow-sm sm:p-6" style={{ background: "linear-gradient(120deg, #fff6f6, #fffafa)" }}>
            <div className="flex items-start gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#fae1e2] text-[#b74242]"><Wheat size={34}/></div>
              <div>
                <h2 className="text-2xl font-extrabold text-[#102450]">El problema</h2>
                <p className="mt-2 text-base leading-relaxed text-[#465a79]">La producción de cebada depende de condiciones climáticas, territoriales y agronómicas que pueden variar entre parcelas. Conocer únicamente el rendimiento esperado no muestra toda la incertidumbre ni las diferencias de contexto necesarias para interpretar una estimación.</p>
              </div>
            </div>
          </article>
          <article className="rounded-2xl border border-[#e2efe7] p-5 shadow-sm sm:p-6" style={{ background: "linear-gradient(120deg, #f0f8f3, #fcfffc)" }}>
            <div className="flex items-start gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#d9efdf] text-[#226c4a]"><Target size={34}/></div>
              <div>
                <h2 className="text-2xl font-extrabold text-[#103e42]">Nuestro objetivo</h2>
                <p className="mt-2 text-base leading-relaxed text-[#465a79]">Integrar los datos del reto en una herramienta visual e interpretable que permita consultar rendimientos estimados, conocer sus limitaciones y explorar escenarios de uso de la información en el sector agrícola.</p>
              </div>
            </div>
          </article>
        </div>

        <section className="rounded-2xl border border-[#dce7f3] bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-2xl font-extrabold text-[#102450]">¿Cómo ayuda CEBADA360?</h2>
          <p className="mt-1 text-base text-[#54698a]">Cinco preguntas para comprender la información de cada parcela.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:gap-0">
            {preguntas.map(({ icon: Icon, title, description, bg, ink }, index) => (
              <div key={title} className={`flex items-start gap-3 lg:px-4 ${index > 0 ? "lg:border-l lg:border-[#d9e2ed]" : ""}`}>
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full" style={{ background: bg, color: ink }}><Icon size={30} strokeWidth={2.2}/></div>
                <div className="min-w-0">
                  <h3 className="text-sm font-extrabold leading-snug text-[#132449]">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#54698a]">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="relative overflow-hidden rounded-2xl border border-[#e1ece8] bg-[#eff7f2] p-5 shadow-sm sm:p-7">
          <div className="pointer-events-none absolute inset-0 opacity-[.15]" style={{ backgroundImage: "url('/images/hero-cebada.jpg')", backgroundSize: "cover", backgroundPosition: "center 65%" }}/>
          <div className="relative">
            <h2 className="text-center text-2xl font-extrabold text-[#10443f] sm:text-3xl">Nuestra propuesta de valor</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {etapas.map(({ icon: Icon, name, detail, bg }, i) => (
                <div key={name} className="relative flex flex-col items-center rounded-xl bg-white/60 px-3 py-4 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full text-white shadow" style={{ background: bg }}><Icon size={27}/></div>
                  <h3 className="mt-3 text-base font-extrabold text-[#14294a]">{name}</h3>
                  <p className="mt-1 max-w-48 text-sm leading-snug text-[#4c6285]">{detail}</p>
                  {i < etapas.length - 1 && <ArrowRight className="absolute -right-4 top-[43%] z-10 hidden text-[#648496] lg:block" size={23}/>} 
                </div>
              ))}
            </div>
            <p className="mx-auto mt-5 max-w-3xl text-center text-sm font-medium leading-relaxed text-[#375d59]">CEBADA360 busca convertir datos agrícolas en información interpretable para apoyar decisiones. Sus predicciones e indicadores son herramientas de apoyo y no sustituyen la evaluación agronómica o financiera en campo.</p>
          </div>
        </section>

        <p className="pb-2 text-center text-xs text-slate-500">CEBADA360 · Reto AgroCebada 2026 · Proyecto de análisis territorial y predicción agrícola</p>
      </main>
    </div>
  )
}
