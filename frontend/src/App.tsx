import { useCallback, useEffect, useState } from "react"
import { Dashboard } from "@/pages/Dashboard"
import { ParcelDetail } from "@/pages/ParcelDetail"
import { PredictionAnalysis } from "@/pages/PredictionAnalysis"
import { ParcelComparison } from "@/pages/ParcelComparison"
import { Team } from "@/pages/Team"
import { About } from "@/pages/About"
import { Methodology } from "@/pages/Methodology"
import { Results } from "@/pages/Results"

function readParcelFromUrl(): string | null {
  const id = new URLSearchParams(window.location.search).get("parcela")?.trim().toUpperCase()
  return id && /^AGC_\d{3}$/.test(id) ? id : null
}

function readAnalysisFromUrl(): boolean {
  return new URLSearchParams(window.location.search).get("analisis") === "1"
}

function readComparisonFromUrl(): boolean {
  return new URLSearchParams(window.location.search).get("comparar") === "1"
}

function App() {
  const [metodologia, setMetodologia] = useState(() => new URLSearchParams(window.location.search).get("vista") === "metodologia")
  const [resultados, setResultados] = useState(() => new URLSearchParams(window.location.search).get("vista") === "resultados")
  const [acerca, setAcerca] = useState(() => new URLSearchParams(window.location.search).get("vista") === "acerca")
  const [equipo, setEquipo] = useState(() => new URLSearchParams(window.location.search).get("vista") === "equipo")
  const [parcela, setParcela] = useState<string | null>(readParcelFromUrl)
  const [analisis, setAnalisis] = useState(readAnalysisFromUrl)
  const [comparar, setComparar] = useState(readComparisonFromUrl)

  useEffect(() => {
    const sync = () => {
      setMetodologia(new URLSearchParams(window.location.search).get("vista") === "metodologia")
      setResultados(new URLSearchParams(window.location.search).get("vista") === "resultados")
      setAcerca(new URLSearchParams(window.location.search).get("vista") === "acerca")
      setEquipo(new URLSearchParams(window.location.search).get("vista") === "equipo")
      setParcela(readParcelFromUrl())
      setAnalisis(readAnalysisFromUrl())
      setComparar(readComparisonFromUrl())
    }
    window.addEventListener("popstate", sync)
    return () => window.removeEventListener("popstate", sync)
  }, [])

  const abrirParcela = useCallback((id: string) => {
    const normalizado = id.trim().toUpperCase()
    const url = new URL(window.location.href)
    url.searchParams.set("parcela", normalizado)
    url.searchParams.delete("analisis")
    url.searchParams.delete("comparar")
    window.history.pushState({}, "", url)
    setParcela(normalizado)
    setAnalisis(false)
    setComparar(false)
    window.scrollTo(0, 0)
  }, [])

  const volver = useCallback(() => {
    const url = new URL(window.location.href)
    url.searchParams.delete("parcela")
    url.searchParams.delete("analisis")
    url.searchParams.delete("comparar")
    window.history.pushState({}, "", url)
    setParcela(null)
    setAnalisis(false)
    setComparar(false)
    window.scrollTo(0, 0)
  }, [])

  const abrirAnalisis = () => {
    if (!parcela) return
    const url = new URL(window.location.href)
    url.searchParams.set("analisis", "1")
    window.history.pushState({}, "", url)
    setAnalisis(true)
    window.scrollTo(0, 0)
  }

  const volverAFicha = () => {
    const url = new URL(window.location.href)
    url.searchParams.delete("analisis")
    url.searchParams.delete("comparar")
    window.history.pushState({}, "", url)
    setAnalisis(false)
    setComparar(false)
    window.scrollTo(0, 0)
  }

  const abrirComparar = () => {
    if (!parcela) return
    const url = new URL(window.location.href)
    url.searchParams.delete("analisis")
    url.searchParams.set("comparar", "1")
    window.history.pushState({}, "", url)
    setAnalisis(false)
    setComparar(true)
    window.scrollTo(0, 0)
  }

  const volverDeComparar = () => {
    const url = new URL(window.location.href)
    url.searchParams.delete("comparar")
    window.history.pushState({}, "", url)
    setComparar(false)
    window.scrollTo(0, 0)
  }

  if (metodologia) return <Methodology />
  if (resultados) return <Results />
  if (acerca) return <About />
  if (equipo) return <Team />
  if (comparar) return <ParcelComparison initialId={parcela ?? "AGC_001"} onBack={parcela ? volverDeComparar : volver} />
  if (!parcela) return <Dashboard onOpenParcel={abrirParcela} />
  if (analisis) return <PredictionAnalysis id={parcela} onBack={volverAFicha} />
  return <ParcelDetail id={parcela} onBack={volver} onAnalysis={abrirAnalisis} onCompare={abrirComparar} />
}

export default App
