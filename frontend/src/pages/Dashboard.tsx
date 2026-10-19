import { useState } from "react"
import { Search } from "lucide-react"
import { Header } from "@/components/layout/Header"
import { SummaryCards } from "@/components/dashboard/SummaryCards"
import { MapPanel } from "@/components/dashboard/MapPanel"
import type { ParcelFocus } from "@/types/parcelas"
import { useDatosCebada } from "@/lib/datos-cebada"

type Props = { onOpenParcel: (id: string) => void }

export function Dashboard({ onOpenParcel }: Props) {
  const { datos: predicciones, error } = useDatosCebada()
  const [texto, setTexto] = useState("")
  const [foco, setFoco] = useState<ParcelFocus>(null)
  const [vista, setVista] = useState<"mapa" | "tabla">("mapa")

  function enfocarParcela(id: string) {
    setFoco((anterior) => ({
      id,
      secuencia: (anterior?.secuencia ?? 0) + 1,
    }))
    setVista("mapa")
  }

  function buscar() {
    const id = texto.trim().toUpperCase()
    if (!id) return
    enfocarParcela(id)
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Header />
      <main className="mx-auto max-w-[1600px] px-4 py-6 md:px-7">
        <section className="relative mb-6 overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/images/hero-cebada.jpg')", backgroundColor: "#dce8df" }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/75 to-white/55" />
          <div className="relative z-10 flex min-h-[220px] flex-col justify-between gap-6 px-6 py-8 md:flex-row md:items-center md:px-10 md:py-10">
            <div className="max-w-3xl">
              <h2 className="text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">Panorama general</h2>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-800 md:text-lg">
                Explora las 197 parcelas de Hidalgo, Puebla y Tlaxcala (ciclo PV 2025): rendimiento observado o estimado, incertidumbre y escenarios de crédito.
              </p>
            </div>
            <form className="w-full shrink-0 md:max-w-[280px]" onSubmit={(event) => { event.preventDefault(); buscar() }}>
              <label htmlFor="parcel-search" className="mb-2 block text-sm font-semibold text-slate-900">Buscar parcela</label>
              <div className="flex items-center gap-3 rounded-xl border border-white/80 bg-white/90 px-4 py-3 shadow-md backdrop-blur-sm focus-within:ring-2 focus-within:ring-emerald-500/20">
                <button type="submit" aria-label="Buscar parcela" title="Buscar parcela" className="cursor-pointer text-slate-600 hover:text-emerald-700">
                  <Search className="h-5 w-5" />
                </button>
                <input id="parcel-search" type="text" value={texto} onChange={(event) => setTexto(event.target.value)} placeholder="Ej. AGC_042" className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-500" />
              </div>
            </form>
          </div>
        </section>
        {error && <p role="alert" className="mb-3 rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-sm text-rose-800">No se pudieron cargar los resultados del modelo: {error}</p>}
        <p className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-950">
          <strong>Modelo final CEBADA360</strong> · ŷ = (Ridge + promedio municipal + proceso gaussiano espacial) / 3.
          <span className="ml-1 text-emerald-900/80">138 parcelas con rendimiento observado · 59 estimadas por el modelo (entrega oficial, SHA-256 21955b71…).</span>
        </p>
        <section className="mb-5"><SummaryCards predicciones={predicciones} /></section>
        <MapPanel predicciones={predicciones} foco={foco} vista={vista} onVistaChange={setVista} onFocoChange={enfocarParcela} onOpenParcel={onOpenParcel} />
      </main>
    </div>
  )
}
