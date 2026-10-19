
import { Sprout } from "lucide-react"

export function Header() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-7 py-5">
        <div className="flex items-center gap-3">
          <Sprout className="h-12 w-12 text-emerald-700" />

          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              <span className="text-emerald-950">CEBADA</span>
              <span className="text-lime-600">360</span>
            </h1>
            <p className="text-sm text-slate-600">
              Inteligencia productiva para el cultivo de cebada
            </p>
          </div>
        </div>

        <nav className="flex flex-wrap gap-x-8 gap-y-2 text-sm font-medium text-slate-800">
          <a href="/?vista=metodologia" className="hover:text-emerald-700">
            Metodología
          </a>
          <a href="/?vista=resultados" className="hover:text-emerald-700">
            Resultados
          </a>
          <a href="/?vista=acerca" className="hover:text-emerald-700">
            Acerca de
          </a>
          <a href="/?vista=equipo" className="hover:text-emerald-700">
            Equipo
          </a>
        </nav>
      </div>
    </header>
  )
}
