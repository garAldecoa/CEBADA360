import { useEffect, useState } from "react"
import type { DatosCebada } from "@/types/cebada360"

// Una sola descarga por sesión: todas las páginas comparten la misma promesa.
let promesa: Promise<DatosCebada> | null = null

export function cargarDatosCebada(): Promise<DatosCebada> {
  if (!promesa) {
    promesa = fetch("/data/predicciones_cebada360.json")
      .then((r) => {
        if (!r.ok) throw new Error(`predicciones_cebada360.json: HTTP ${r.status}`)
        return r.json() as Promise<DatosCebada>
      })
      .catch((e) => {
        promesa = null
        throw e
      })
  }
  return promesa
}

export function useDatosCebada() {
  const [datos, setDatos] = useState<DatosCebada | null>(null)
  const [error, setError] = useState("")
  useEffect(() => {
    let activo = true
    cargarDatosCebada()
      .then((d) => { if (activo) setDatos(d) })
      .catch((e: unknown) => { if (activo) setError(e instanceof Error ? e.message : String(e)) })
    return () => { activo = false }
  }, [])
  return { datos, error }
}
