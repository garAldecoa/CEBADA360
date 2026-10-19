import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { ParcelaCebada } from "@/types/cebada360"
import { formatoNumero } from "@/types/cebada360"

/** Descomposición aditiva del ensamble (resultados_I3/factores.csv). No es SHAP ni efecto causal. */
export function FactorsChart({ parcela, media, compacto = false }: { parcela: ParcelaCebada; media: number | null; compacto?: boolean }) {
  const filas = [...parcela.factores.items]
    .sort((a, b) => Math.abs(b.contribucion) - Math.abs(a.contribucion))
    .map((f) => ({ ...f, nombre: f.etiqueta }))
  return (
    <div>
      <div className={compacto ? "h-[230px]" : "h-[270px]"} role="img" aria-label="Contribución de cada factor a la predicción en t/ha">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={filas} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
            <CartesianGrid horizontal={false} stroke="#e5e7eb" />
            <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => Number(v).toFixed(2)} domain={["auto", "auto"]} />
            <YAxis type="category" dataKey="nombre" width={200} tick={{ fontSize: 11 }} />
            <ReferenceLine x={0} stroke="#64748b" />
            <Tooltip formatter={(v) => [`${Number(v) > 0 ? "+" : ""}${Number(v).toFixed(4)} t/ha`, "Contribución"]}
              labelFormatter={(l, p) => {
                const valor = p?.[0]?.payload?.valor
                return `${l}${typeof valor === "number" ? ` · valor ${formatoNumero(valor, 2)}` : ""}`
              }} />
            <Bar dataKey="contribucion" radius={[3, 3, 3, 3]}>
              {filas.map((f) => <Cell key={f.variable} fill={f.contribucion >= 0 ? "#1f7a4f" : "#c24a4a"} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-1 flex justify-between rounded-lg bg-gradient-to-r from-rose-50 to-emerald-50 px-4 py-2 text-xs"><span>← Reduce frente al promedio</span><span>Aumenta frente al promedio →</span></div>
      <p className="mt-2 text-xs leading-relaxed text-slate-500">
        Gráfica elaborada por la web a partir de resultados_I3/factores.csv · media de entrenamiento{media !== null ? ` (${media.toFixed(4)} t/ha)` : ""} + suma de contribuciones = {parcela.factores.prediccion_modelo_final.toFixed(4)} t/ha · {parcela.factores.tipo_explicacion}.
      </p>
    </div>
  )
}
