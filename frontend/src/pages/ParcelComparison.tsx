import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, GitCompareArrows, Leaf, Search, Mountain, CloudRain, Info, Package, BarChart3, ShieldCheck, Thermometer, Ruler, TrendingUp, Sprout } from "lucide-react"
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts"
import { Header } from "@/components/layout/Header"
import { ComparisonMap } from "@/components/compare/ComparisonMap"
import type { Parcel, ParcelCollection } from "@/types/parcelas"
import type { DatosCebada, ParcelaCebada } from "@/types/cebada360"
import { cargarDatosCebada } from "@/lib/datos-cebada"
import type { ClimateTerritoryData } from "@/types/clima-territorio"
import type { SatelliteData } from "@/types/parcel-detail"

type RainMonth={mes:number;precipitacion_2025_mm:number;precipitacion_media_2022_2024_mm:number}
type Rain={parcelas:Record<string,RainMonth[]>}
type Bundle={geo:ParcelCollection; predictions:DatosCebada;climate:ClimateTerritoryData;satellite:SatelliteData;rain:Rain}
type Props={initialId:string;onBack:()=>void}
const months=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]
const display=(n:number | null | undefined,d=2)=>typeof n==="number"&&Number.isFinite(n)?n.toLocaleString("es-MX",{minimumFractionDigits:d,maximumFractionDigits:d}):"No disponible"
const latestId=(items:Parcel[],skip:string)=>items.find(p=>p.properties.ID_POLIGON!==skip)?.properties.ID_POLIGON??skip

function getSatelliteSeries(data:SatelliteData,id:string,index:"ndvi"|"evi"|"lai") {
  const entry=data[id]
  const arr=entry?.Planet?.length ? entry.Planet : entry?.["Sentinel-2"]??[]
  const grouped=new Map<number,number[]>()
  for (const p of arr) {
    const month=Number(p.fecha.slice(5,7)),value=p[index]
    if(month>=4&&month<=10&&typeof value==="number"&&Number.isFinite(value)) grouped.set(month,[...(grouped.get(month)??[]),value])
  }
  return new Map([...grouped].map(([m,v])=>[m,Number((v.reduce((a,b)=>a+b,0)/v.length).toFixed(3))]))
}

export function ParcelComparison({initialId,onBack}:Props){
  const [bundle,setBundle]=useState<Bundle|null>(null)
  const [error,setError]=useState("")
  const [idA,setIdA]=useState(initialId)
  const [idB,setIdB]=useState("")
  const [index,setIndex]=useState<"ndvi"|"evi"|"lai">("ndvi")
  const [climateMode,setClimateMode]=useState<"rain"|"temp">("rain")
  useEffect(()=>{
    const controller=new AbortController()
    const load=async()=>{
      try {
        const paths=["/data/parcelas_agrocebada.geojson","/data/clima_territorio_2025.json","/data/satelite_2025.json","/data/precipitacion_2025_historico.json"]
        const [[geo,climate,satellite,rain],predictions]=await Promise.all([Promise.all(paths.map(async path=>{const r=await fetch(path,{signal:controller.signal});if(!r.ok)throw new Error(`${path}: HTTP ${r.status}`);return r.json() as Promise<unknown>})),cargarDatosCebada()])
        if(!controller.signal.aborted)setBundle({geo:geo as ParcelCollection,predictions,climate:climate as ClimateTerritoryData,satellite:satellite as SatelliteData,rain:rain as Rain})
      }catch(e){if(!controller.signal.aborted)setError(e instanceof Error?e.message:"Error cargando datos")}
    }
    void load();return()=>controller.abort()
  },[])
  const parcels=useMemo(()=>[...(bundle?.geo.features??[])].sort((a,b)=>a.properties.ID_POLIGON.localeCompare(b.properties.ID_POLIGON)),[bundle])
  const selectedB=idB||latestId(parcels,idA)
  const a=parcels.find(p=>p.properties.ID_POLIGON===idA)
  const b=parcels.find(p=>p.properties.ID_POLIGON===selectedB)
  const pa:ParcelaCebada|undefined=bundle?.predictions.parcelas[idA],pb:ParcelaCebada|undefined=bundle?.predictions.parcelas[selectedB]
  const intervalo=(p?:ParcelaCebada)=>p?.y_lo80!==undefined&&p.y_hi80!==undefined?`${display(p.y_lo80,2)}–${display(p.y_hi80,2)}`:p?"Observado (sin intervalo)":"—"
  const indicador=(p?:ParcelaCebada)=>p?.credito?`${p.credito.nivel} · ${(p.credito.prob_ingreso_insuficiente*100).toFixed(0)} %`:p?"No aplica (observado)":"—"
  const areaA=Number(a?.properties["área_ha"]),areaB=Number(b?.properties["área_ha"])
  const territory=bundle?.climate.parcelas
  const rainA=bundle?.rain.parcelas[idA]??[],rainB=bundle?.rain.parcelas[selectedB]??[]
  const rainfallSum=(months:RainMonth[])=>months.filter(x=>x.mes>=4&&x.mes<=10).reduce((s,x)=>s+x.precipitacion_2025_mm,0)
  const monthlyTemp=(id:string)=>territory?.[id]?.clima.mensual.filter(x=>x.mes>=4&&x.mes<=10)??[]
  const avg=(values:number[])=>values.length?values.reduce((a,b)=>a+b,0)/values.length:null
  const valsA=[pa?`${display(pa.rendimiento_t_ha,2)} (${pa.tipo})`:"—",display(pa?.produccion_t,1),intervalo(pa),indicador(pa),display(rainA.length?rainfallSum(rainA):null,1),display(avg(monthlyTemp(idA).map(x=>x.tmax_c).filter((x):x is number=>x!==null)),1),display(territory?.[idA]?.territorio.elevacion_media_m,1),display(territory?.[idA]?.territorio.pendiente_media_grados,2),display(areaA,2)]
  const valsB=[pb?`${display(pb.rendimiento_t_ha,2)} (${pb.tipo})`:"—",display(pb?.produccion_t,1),intervalo(pb),indicador(pb),display(rainB.length?rainfallSum(rainB):null,1),display(avg(monthlyTemp(selectedB).map(x=>x.tmax_c).filter((x):x is number=>x!==null)),1),display(territory?.[selectedB]?.territorio.elevacion_media_m,1),display(territory?.[selectedB]?.territorio.pendiente_media_grados,2),display(areaB,2)]
  const satA=useMemo(()=>bundle?getSatelliteSeries(bundle.satellite,idA,index):new Map<number,number>(),[bundle,idA,index])
  const satB=useMemo(()=>bundle?getSatelliteSeries(bundle.satellite,selectedB,index):new Map<number,number>(),[bundle,selectedB,index])
  const vegetation=Array.from({length:7},(_,i)=>({mes:months[i+3],A:satA.get(i+4)??null,B:satB.get(i+4)??null}))
  const climate=Array.from({length:7},(_,i)=>{const month=i+4;return {mes:months[month-1],A:climateMode==="rain"?rainA.find(x=>x.mes===month)?.precipitacion_2025_mm??null:monthlyTemp(idA).find(x=>x.mes===month)?.tmax_c??null,B:climateMode==="rain"?rainB.find(x=>x.mes===month)?.precipitacion_2025_mm??null:monthlyTemp(selectedB).find(x=>x.mes===month)?.tmax_c??null}})
  const cardStyle={border:"1px solid #dde5ed",borderRadius:16,background:"white",padding:18,boxShadow:"0 2px 8px rgba(28,46,65,.06)"} as const
  const changeA=(id:string)=>{setIdA(id);if(id===selectedB)setIdB(latestId(parcels,id))}
  const changeB=(id:string)=>{if(id!==idA)setIdB(id)}
  return <div className="min-h-screen bg-slate-100"><Header/>
    <div className="relative overflow-hidden border-b border-slate-200"><div className="absolute inset-0 bg-cover bg-center" style={{backgroundImage:"url('/images/hero-cebada.jpg')",backgroundColor:"#dce8df"}}/><div className="absolute inset-0 bg-white/75"/>
      <div className="relative mx-auto max-w-[1600px] px-5 py-6 md:px-8"><button onClick={onBack} className="mb-4 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"><ArrowLeft size={16}/>Volver a {initialId}</button><h1 className="flex items-center gap-3 text-3xl font-extrabold text-slate-950"><GitCompareArrows color="#0d5b42"/>Comparar parcelas</h1><p className="mt-1 text-slate-700">Diferencias productivas, ambientales y de riesgo entre dos parcelas.</p></div>
    </div>
    <main className="mx-auto max-w-[1600px] space-y-4 px-4 py-5 md:px-7">
      {error?<div role="alert" className="rounded-xl bg-rose-50 p-6 text-rose-800">{error}</div>:!bundle?<div role="status" className="p-10">Cargando comparación…</div>:!a||!b?<div role="alert">No se encontraron dos parcelas distintas.</div>:<>
        <p className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-950"><Info className="mr-2 inline h-4 w-4"/>Rendimientos del <strong>modelo final</strong>: observado en las 138 de entrenamiento y estimado en las 59. El intervalo (nominal 80 %) y el indicador de crédito simulado solo existen para las estimadas. Los datos climáticos y topográficos son observaciones raster, no explicaciones causales.</p>
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_1fr] 2xl:grid-cols-[1fr_auto_1fr_0.8fr] lg:items-center"><div style={{...cardStyle,background:"linear-gradient(135deg,#d8efe2,#eef9f2)"}}><label htmlFor="parcela-a" className="mb-2 block font-semibold text-slate-900">🌱 Parcela A</label><select id="parcela-a" className="w-full rounded-lg border border-slate-300 bg-white p-2" value={idA} onChange={e=>changeA(e.target.value)}>{parcels.filter(p=>p.properties.ID_POLIGON!==selectedB).map(p=><option key={p.properties.ID_POLIGON}>{p.properties.ID_POLIGON}</option>)}</select><p className="mt-2 text-sm">{a.properties.Estado} · {display(areaA)} ha · {a.properties.CONJUNTO}</p></div><span className="text-center text-xl font-black">VS</span><div style={{...cardStyle,background:"linear-gradient(135deg,#d6e9ff,#f1f7ff)"}}><label htmlFor="parcela-b" className="mb-2 block font-semibold text-slate-900">🌿 Parcela B</label><select id="parcela-b" className="w-full rounded-lg border border-slate-300 bg-white p-2" value={selectedB} onChange={e=>changeB(e.target.value)}>{parcels.filter(p=>p.properties.ID_POLIGON!==idA).map(p=><option key={p.properties.ID_POLIGON}>{p.properties.ID_POLIGON}</option>)}</select><p className="mt-2 text-sm">{b.properties.Estado} · {display(areaB)} ha · {b.properties.CONJUNTO}</p></div><div style={{...cardStyle,background:"linear-gradient(135deg,#eef5ff,#fafcff)"}} className="lg:col-span-3 2xl:col-span-1"><div className="flex items-center gap-2 font-bold text-slate-900"><Search size={19} color="#3b82f6"/>Parcela similar</div><p className="mt-2 text-xs text-slate-600">Próximamente: selección automática con un método de similitud validado.</p><button type="button" disabled className="mt-3 w-full rounded-lg bg-slate-200 px-3 py-2 text-sm font-medium text-slate-500">Buscar parcela similar</button></div></div>
        {/* Indicadores: cuatro tarjetas comparativas en lugar de una tabla larga */}
        <section style={cardStyle}>
          <h2 className="text-lg font-bold text-slate-950">Resumen comparativo</h2>
          <p className="mb-4 text-sm text-slate-500">Principales indicadores de las dos parcelas.</p>
          <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
            {[
              {title:"Rendimiento",unit:"t/ha",icon:Leaf,values:[valsA[0],valsB[0]],background:"#edf8f2"},
              {title:"Producción",unit:"t",icon:Package,values:[valsA[1],valsB[1]],background:"#fff8e8"},
              {title:"Intervalo empírico (nominal 80 %)",unit:"t/ha",icon:BarChart3,values:[valsA[2],valsB[2]],background:"#edf5ff"},
              {title:"Indicador de crédito simulado",unit:"nivel · prob. modelada",icon:ShieldCheck,values:[valsA[3],valsB[3]],background:"#f9f2fb"},
            ].map(metric=>{
              const MetricIcon=metric.icon
              return <article key={metric.title} className="rounded-xl border border-slate-200 p-3" style={{background:metric.background}}>
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800"><MetricIcon size={19} color="#176749"/>{metric.title}</div>
                <div className="grid grid-cols-2 gap-2">
                  {metric.values.map((value,i)=><div key={i} className="rounded-lg border border-white/80 p-3 text-center" style={{background:i===0?"#e1f3e9":"#e1efff"}}>
                    <div className="mb-1 text-xs font-semibold" style={{color:i===0?"#166534":"#1d4ed8"}}>{i===0?idA:selectedB}</div>
                    <div className="break-words text-base font-extrabold text-slate-950">{value}</div>
                    <div className="mt-1 text-[11px] text-slate-500">{metric.unit}</div>
                  </div>)}
                </div>
              </article>
            })}
          </div>
        </section>
        {/* Tres paneles equilibrados como en el diseño de referencia */}
        <div className="grid items-stretch gap-3 xl:grid-cols-[1.12fr_0.95fr_0.93fr]">
          <section style={cardStyle} className="min-w-0">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-950"><Mountain size={20} color="#176749"/>Ubicación de las parcelas</h2>
            <p className="mb-3 text-sm text-slate-500">Geometrías reales de las parcelas A y B.</p>
            <ComparisonMap data={bundle.geo} a={a} b={b}/>
            <div className="mt-3 flex flex-wrap gap-4 text-xs font-semibold text-slate-700"><span>🟨 {idA}</span><span>🟦 {selectedB}</span></div>
          </section>
          <section style={cardStyle} className="min-w-0">
            <h2 className="text-lg font-bold text-slate-950">Comparación de variables clave</h2>
            <p className="mb-3 text-sm text-slate-500">Indicadores climáticos y del terreno, ciclo 2025.</p>
            <div className="overflow-x-auto"><table className="w-full min-w-[330px] text-xs sm:text-sm">
              <thead><tr className="bg-slate-100"><th className="rounded-l-lg p-2 text-left">Variable</th><th className="p-2 text-center text-emerald-800">{idA}</th><th className="rounded-r-lg p-2 text-center text-blue-800">{selectedB}</th></tr></thead>
              <tbody>
                {[
                  {name:"Lluvia abr–oct (mm)",icon:CloudRain,i:4},
                  {name:"T. máxima media (°C)",icon:Thermometer,i:5},
                  {name:"Elevación (m)",icon:Mountain,i:6},
                  {name:"Pendiente (°)",icon:TrendingUp,i:7},
                  {name:"Superficie (ha)",icon:Ruler,i:8},
                ].map(v=>{const VarIcon=v.icon;return <tr key={v.name} className="border-b border-slate-100"><td className="p-3"><span className="flex items-center gap-2"><VarIcon size={17} color="#477260"/>{v.name}</span></td><td className="p-3 text-center font-semibold" style={{background:"#edf9f2"}}>{valsA[v.i]}</td><td className="p-3 text-center font-semibold" style={{background:"#eff6ff"}}>{valsB[v.i]}</td></tr>})}
              </tbody>
            </table></div>
            <p className="mt-3 text-xs text-slate-500">Pendiente en grados; las cifras provienen de los datos raster.</p>
          </section>
          <section style={cardStyle} className="min-w-0">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-950"><Info size={19} color="#176749"/>Principales diferencias</h2>
            <p className="mb-3 text-sm text-slate-500">Comparación descriptiva, no causal.</p>
            <div className="space-y-2">
              {[
                {name:"Rendimiento (observado o estimado)",x:pa?.rendimiento_t_ha,y:pb?.rendimiento_t_ha,unit:"t/ha",icon:Sprout,bg:"#eef8f3"},
                {name:"Precipitación del ciclo",x:rainA.length?rainfallSum(rainA):null,y:rainB.length?rainfallSum(rainB):null,unit:"mm",icon:CloudRain,bg:"#eef6ff"},
                {name:"Elevación",x:territory?.[idA]?.territorio.elevacion_media_m,y:territory?.[selectedB]?.territorio.elevacion_media_m,unit:"m",icon:Mountain,bg:"#f8f5ed"},
                {name:"Pendiente",x:territory?.[idA]?.territorio.pendiente_media_grados,y:territory?.[selectedB]?.territorio.pendiente_media_grados,unit:"°",icon:TrendingUp,bg:"#fff0f0"},
              ].map(item=>{const DiffIcon=item.icon;return <div key={item.name} className="flex items-start gap-3 rounded-xl p-3" style={{background:item.bg}}><DiffIcon className="mt-1 shrink-0" size={23} color="#27744e"/><div><h3 className="text-sm font-bold text-slate-900">{item.name}</h3><p className="mt-1 text-xs leading-relaxed text-slate-600">{typeof item.x==="number"&&typeof item.y==="number"?`${item.x===item.y?"Ambas parcelas registran el mismo valor":`${item.x>item.y?idA:selectedB} registra un valor mayor`}: ${display(item.x,2)} ${item.unit} frente a ${display(item.y,2)} ${item.unit}.`:"Datos no disponibles"}</p></div></div>})}
            </div>
            <button type="button" disabled title="Pendiente de un método de similitud validado" className="mt-3 w-full rounded-lg bg-slate-200 p-3 text-sm font-medium text-slate-500"><Search className="mr-2 inline h-4 w-4"/>Buscar parcela similar (próximamente)</button>
          </section>
        </div>
        <div className="grid gap-3 lg:grid-cols-2"><section style={cardStyle}><div className="mb-3 flex flex-wrap items-center justify-between gap-3"><h2 className="flex items-center gap-2 font-bold"><Leaf size={18}/>Evolución del cultivo</h2><select aria-label="Índice satelital" className="rounded-lg border p-2 text-sm" value={index} onChange={e=>setIndex(e.target.value as typeof index)}><option value="ndvi">NDVI</option><option value="evi">EVI</option><option value="lai">LAI</option></select></div><p className="mb-3 text-xs text-slate-500">Medias mensuales de observaciones Planet disponibles.</p><div className="h-[290px]"><ResponsiveContainer width="100%" height="100%"><LineChart data={vegetation} margin={{top:10,right:16,bottom:8,left:0}}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="mes"/><YAxis domain={["auto","auto"]}/><Tooltip/><Legend formatter={v=>v==="A"?idA:selectedB}/><Line dataKey="A" stroke="#16834a" strokeWidth={2.5} connectNulls/><Line dataKey="B" stroke="#2b79df" strokeWidth={2.5} connectNulls/></LineChart></ResponsiveContainer></div></section><section style={cardStyle}><div className="mb-3 flex flex-wrap items-center justify-between gap-3"><h2 className="flex items-center gap-2 font-bold"><CloudRain size={18}/>Condiciones climáticas</h2><select aria-label="Variable climática" className="rounded-lg border p-2 text-sm" value={climateMode} onChange={e=>setClimateMode(e.target.value as typeof climateMode)}><option value="rain">Precipitación (mm)</option><option value="temp">Temperatura máxima (°C)</option></select></div><p className="mb-3 text-xs text-slate-500">Valores mensuales extraídos de productos climáticos.</p><div className="h-[290px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={climate} margin={{top:10,right:16,bottom:8,left:0}}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="mes"/><YAxis/><Tooltip/><Legend formatter={v=>v==="A"?idA:selectedB}/><Bar dataKey="A" fill="#16834a"/><Bar dataKey="B" fill="#2b79df"/></BarChart></ResponsiveContainer></div></section></div>
      </>}
    </main>
  </div>
}
