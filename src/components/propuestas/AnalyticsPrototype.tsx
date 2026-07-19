"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  Bell,
  Boxes,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  Database,
  FlaskConical,
  LayoutDashboard,
  Search,
  Sparkles,
  Stethoscope,
  TrendingUp,
  UserRound,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";

type Proposal = "clustering" | "regresion" | "clasificacion";

const proposalLinks = [
  { id: "clustering", label: "Segmentación de estudios", href: "/propuestas/clustering", icon: Boxes },
  { id: "regresion", label: "Estimación de precios", href: "/propuestas/regresion", icon: TrendingUp },
  { id: "clasificacion", label: "Prioridad de órdenes", href: "/propuestas/clasificacion", icon: Activity },
] as const;

const baseMenu = [
  { label: "Inicio", icon: LayoutDashboard },
  { label: "Servicios", icon: ClipboardList },
  { label: "Estudios", icon: FlaskConical },
  { label: "Pacientes", icon: Users },
  { label: "Médicos", icon: Stethoscope },
  { label: "Admin BD", icon: Database },
];

function Shell({ proposal, children }: { proposal: Proposal; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f7f8fb] text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[250px] border-r border-red-100 bg-white xl:block">
        <div className="border-b border-red-100 px-6 py-5">
          <Image src="/econolab-brand.png" alt="Econolab" width={200} height={65} className="h-auto w-[180px]" priority />
          <p className="mt-1 text-xs text-slate-400">Sistema de laboratorios</p>
        </div>
        <nav className="space-y-1 px-3 py-5">
          {baseMenu.map(({ label, icon: Icon }) => (
            <div key={label} className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-slate-500">
              <Icon size={18} /> {label}
            </div>
          ))}
          <p className="px-4 pb-1 pt-4 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Analítica inteligente</p>
          {proposalLinks.map(({ id, label, href, icon: Icon }) => (
            <Link key={id} href={href} className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${proposal === id ? "border-red-100 bg-red-50 font-semibold text-red-700" : "border-transparent text-slate-500 hover:bg-slate-50"}`}>
              <span className={`grid h-8 w-8 place-items-center rounded-lg ${proposal === id ? "bg-white text-red-600 shadow-sm" : "bg-slate-100"}`}><Icon size={17} /></span>
              <span className="leading-tight">{label}</span>
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-5 left-4 right-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-red-100 text-red-600"><UserRound size={17} /></span><div><p className="text-sm font-semibold">Administrador</p><p className="text-xs text-slate-400">ECONOLAB</p></div></div>
        </div>
      </aside>
      <div className="xl:pl-[250px]">
        <header className="flex h-[72px] items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-8">
          <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-600">Módulo administrativo</p><p className="text-sm text-slate-500">Analítica inteligente</p></div>
          <div className="flex items-center gap-3"><button className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-500"><Bell size={18} /></button><div className="hidden items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm sm:flex"><span className="grid h-7 w-7 place-items-center rounded-lg bg-red-100 text-red-600"><UserRound size={15} /></span> David <ChevronDown size={14} /></div></div>
        </header>
        <main className="mx-auto max-w-[1500px] p-5 sm:p-8">{children}</main>
      </div>
    </div>
  );
}

function Heading({ eyebrow, title, description, icon: Icon }: { eyebrow: string; title: string; description: string; icon: typeof Boxes }) {
  return <div className="mb-7 flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><div className="mb-3 inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700"><Sparkles size={14} /> {eyebrow}</div><h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{title}</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{description}</p></div><div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"><Icon size={18} /> Modelo listo para analizar</div></div>;
}

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => <section className={`rounded-3xl border border-slate-200 bg-white shadow-[0_16px_40px_-30px_rgba(15,23,42,.35)] ${className}`}>{children}</section>;

function Clustering() {
  const [group, setGroup] = useState("Todos");
  const groups = [
    { name: "Rápidos y económicos", count: 34, price: "$180", time: "2 h", color: "#2563eb", bg: "bg-blue-50", example: "Biometría hemática" },
    { name: "Perfiles completos", count: 18, price: "$690", time: "8 h", color: "#7c3aed", bg: "bg-violet-50", example: "Perfil tiroideo" },
    { name: "Estudios hormonales", count: 21, price: "$520", time: "24 h", color: "#ea580c", bg: "bg-orange-50", example: "Hormona TSH" },
    { name: "Especializados", count: 13, price: "$1,250", time: "48 h", color: "#059669", bg: "bg-emerald-50", example: "Panel autoinmune" },
  ];
  const filtered = group === "Todos" ? groups : groups.filter((item) => item.name === group);
  return <Shell proposal="clustering"><Heading eyebrow="Propuesta 1 · Clustering" title="Segmentación del catálogo de estudios" description="Agrupa automáticamente los estudios con características similares para organizar mejor el catálogo, detectar patrones y facilitar decisiones administrativas." icon={Boxes} />
    <div className="grid gap-5 lg:grid-cols-[1.45fr_.8fr]">
      <Card className="p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Mapa de segmentos</h2><p className="text-sm text-slate-500">86 estudios analizados · Actualizado hoy, 10:32</p></div><select value={group} onChange={(e) => setGroup(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none"><option>Todos</option>{groups.map((g) => <option key={g.name}>{g.name}</option>)}</select></div>
        <div className="relative mt-5 h-[365px] overflow-hidden rounded-2xl border border-slate-100 bg-[radial-gradient(circle_at_center,#e2e8f0_1px,transparent_1px)] bg-[size:20px_20px]">
          {filtered.map((g, i) => { const positions = ["left-[7%] top-[12%] h-40 w-40", "right-[9%] top-[8%] h-32 w-32", "left-[34%] bottom-[7%] h-36 w-36", "right-[8%] bottom-[5%] h-28 w-28"]; return <button key={g.name} onClick={() => setGroup(g.name)} style={{ backgroundColor: `${g.color}18`, borderColor: `${g.color}55`, color: g.color }} className={`absolute grid rounded-full border-2 p-4 text-center shadow-lg backdrop-blur-sm transition hover:scale-105 ${positions[i]}`}><span className="m-auto"><b className="block text-3xl">{g.count}</b><span className="text-xs font-semibold leading-tight">{g.name}</span></span></button>; })}
          <div className="absolute left-5 top-5 rounded-lg bg-white/90 px-3 py-1.5 text-xs text-slate-500 shadow-sm">Tamaño = número de estudios</div>
        </div>
      </Card>
      <div className="space-y-5"><Card className="p-5"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">Distribución del catálogo</p><p className="mt-1 text-2xl font-semibold">4 segmentos</p></div><span className="grid h-11 w-11 place-items-center rounded-2xl bg-red-50 text-red-600"><Boxes /></span></div><div className="mt-5 space-y-4">{groups.map((g) => <button key={g.name} onClick={() => setGroup(g.name)} className="block w-full text-left"><div className="mb-1.5 flex justify-between text-xs"><span className="font-medium">{g.name}</span><span className="text-slate-400">{g.count} estudios</span></div><div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full" style={{ width: `${g.count * 2.5}%`, backgroundColor: g.color }} /></div></button>)}</div></Card><Card className="p-5"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Detalle seleccionado</p><h3 className="mt-2 font-semibold text-slate-900">{filtered[0]?.name ?? "Todos los segmentos"}</h3><div className="mt-4 grid grid-cols-3 gap-2 text-center">{[["Precio prom.", filtered[0]?.price ?? "$498"], ["Entrega", filtered[0]?.time ?? "18 h"], ["Ejemplo", filtered[0]?.example ?? "86 estudios"]].map(([a,b]) => <div key={a} className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] text-slate-400">{a}</p><p className="mt-1 truncate text-xs font-semibold">{b}</p></div>)}</div></Card></div>
    </div></Shell>;
}

function Regression() {
  const [category, setCategory] = useState("Perfil clínico"); const [parameters, setParameters] = useState(12);
  const result = useMemo(() => ({ price: Math.round(250 + parameters * 36 + (category === "Estudio especializado" ? 410 : 0)) }), [category, parameters]);
  return <Shell proposal="regresion"><Heading eyebrow="Propuesta 2 · Regresión" title="Estimación de precio" description="Simula el registro de un nuevo estudio y propone valores iniciales a partir de estudios similares del catálogo antes de su validación administrativa." icon={TrendingUp} />
    <div className="grid gap-5 lg:grid-cols-[.9fr_1.25fr]"><Card className="p-6"><div className="mb-5 flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-red-50 text-red-600"><FlaskConical size={20} /></span><div><h2 className="font-semibold">Características del nuevo estudio</h2><p className="text-sm text-slate-500">Completa la información disponible</p></div></div><div className="space-y-4"><label className="block text-sm font-medium">Nombre del estudio<input defaultValue="Perfil metabólico avanzado" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-red-300" /></label><label className="block text-sm font-medium">Categoría<select value={category} onChange={(e)=>setCategory(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"><option>Perfil clínico</option><option>Estudio especializado</option><option>Hormonal</option></select></label><label className="block text-sm font-medium">Número de parámetros<div className="mt-2 flex items-center gap-4"><input type="range" min="2" max="30" value={parameters} onChange={(e)=>setParameters(Number(e.target.value))} className="w-full accent-red-600"/><b className="w-10 rounded-lg bg-slate-100 py-2 text-center">{parameters}</b></div></label><label className="block text-sm font-medium">Método de análisis<select className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"><option>Química seca</option><option>Inmunoensayo</option><option>Espectrofotometría</option></select></label></div></Card>
      <div className="space-y-5"><Card className="overflow-hidden"><div className="border-b border-slate-100 bg-gradient-to-r from-red-50 to-white p-6"><div className="flex items-center gap-2 text-sm font-semibold text-red-700"><Sparkles size={16}/> Estimación generada por el modelo</div><div className="mt-5"><p className="text-sm text-slate-500">Precio sugerido</p><p className="mt-1 text-4xl font-semibold tracking-tight">${result.price.toLocaleString("es-MX")} <span className="text-sm font-normal text-slate-400">MXN</span></p><p className="mt-2 text-xs text-emerald-600">Rango recomendado ± $95 · Confianza del modelo: 91%</p></div></div><div className="p-6"><div className="flex items-center justify-between"><h3 className="font-semibold">Comparación con estudios similares</h3><button className="text-xs font-semibold text-red-600">Ver catálogo completo</button></div><div className="mt-4 overflow-hidden rounded-xl border border-slate-200"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="p-3">Estudio</th><th>Parámetros</th><th>Precio</th></tr></thead><tbody>{[["Perfil hepático",9,"$610"],["Química sanguínea 12",12,"$720"],["Perfil metabólico",14,"$845"]].map((r)=><tr key={String(r[0])} className="border-t border-slate-100"><td className="p-3 font-medium">{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td></tr>)}</tbody></table></div></div></Card><div className="grid gap-4 sm:grid-cols-3">{[[CircleDollarSign,"Ahorro estimado","12%","vs. definición manual"],[Clock3,"Tiempo de captura","2 min","por nuevo estudio"],[Activity,"Datos utilizados","1,000","registros de entrenamiento"]].map(([Icon,label,val,hint])=><Card key={String(label)} className="p-4"><Icon className="text-red-600" size={20}/><p className="mt-3 text-xs text-slate-500">{String(label)}</p><p className="text-xl font-semibold">{String(val)}</p><p className="text-[11px] text-slate-400">{String(hint)}</p></Card>)}</div></div>
    </div></Shell>;
}

function Classification() {
  const [filter, setFilter] = useState("Todas"); const orders = [{folio:"ECO-1048",patient:"María Hernández",study:"Panel cardíaco + Troponina",time:"45 min",level:"Alta",score:92},{folio:"ECO-1051",patient:"José Ramírez",study:"Perfil tiroideo",time:"3 h",level:"Media",score:68},{folio:"ECO-1054",patient:"Ana López",study:"Biometría hemática",time:"5 h",level:"Baja",score:28},{folio:"ECO-1057",patient:"Carlos Méndez",study:"Panel renal completo",time:"1 h",level:"Alta",score:87}]; const visible=filter==="Todas"?orders:orders.filter(o=>o.level===filter);
  const colors:Record<string,string>={Alta:"bg-red-50 text-red-700 border-red-200",Media:"bg-amber-50 text-amber-700 border-amber-200",Baja:"bg-emerald-50 text-emerald-700 border-emerald-200"};
  return <Shell proposal="clasificacion"><Heading eyebrow="Propuesta 3 · Clasificación" title="Prioridad inteligente de órdenes" description="Clasifica las órdenes en prioridad alta, media o baja según sus estudios, tiempos y tipo de muestra para ayudar al personal a organizar el flujo de trabajo." icon={Activity} />
    <div className="mb-5 grid gap-4 sm:grid-cols-3">{[["Alta","2 órdenes","Atender en menos de 1 hora","border-red-200 bg-red-50 text-red-700"],["Media","1 orden","Revisar durante el turno","border-amber-200 bg-amber-50 text-amber-700"],["Baja","1 orden","Flujo regular","border-emerald-200 bg-emerald-50 text-emerald-700"]].map(([level,count,hint,color])=><button key={level} onClick={()=>setFilter(level)} className={`rounded-2xl border p-5 text-left ${color} ${filter===level?"ring-2 ring-offset-2 ring-slate-300":""}`}><div className="flex items-center justify-between"><p className="text-sm font-semibold">Prioridad {level}</p><span className="h-2.5 w-2.5 rounded-full bg-current" /></div><p className="mt-2 text-3xl font-semibold">{count}</p><p className="mt-1 text-xs opacity-70">{hint}</p></button>)}</div>
    <Card className="overflow-hidden"><div className="flex flex-col justify-between gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center"><div><h2 className="font-semibold">Cola de trabajo del laboratorio</h2><p className="text-sm text-slate-500">Órdenes clasificadas automáticamente · jueves 16 de julio</p></div><div className="flex gap-2"><div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-400"><Search size={16}/> Buscar orden...</div><button onClick={()=>setFilter("Todas")} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold">Ver todas</button></div></div><div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-400"><tr><th className="p-4">Orden / paciente</th><th>Estudio solicitado</th><th>Tiempo restante</th><th>Índice de prioridad</th><th>Clasificación</th><th></th></tr></thead><tbody>{visible.map((o)=><tr key={o.folio} className="border-t border-slate-100 text-sm hover:bg-slate-50"><td className="p-4"><p className="font-semibold text-slate-900">{o.folio}</p><p className="text-xs text-slate-500">{o.patient}</p></td><td className="font-medium">{o.study}</td><td><span className="inline-flex items-center gap-1.5"><Clock3 size={15} className="text-slate-400"/>{o.time}</span></td><td><div className="flex items-center gap-3"><div className="h-2 w-24 rounded-full bg-slate-100"><div className={`h-2 rounded-full ${o.level==="Alta"?"bg-red-500":o.level==="Media"?"bg-amber-500":"bg-emerald-500"}`} style={{width:`${o.score}%`}} /></div><b>{o.score}</b></div></td><td><span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${colors[o.level]}`}>{o.level}</span></td><td><button className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">Ver orden</button></td></tr>)}</tbody></table></div><div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-xs text-slate-400"><span>Mostrando {visible.length} de 4 órdenes activas</span><span>El modelo se actualiza cada 5 minutos</span></div></Card>
    <div className="mt-5 grid gap-5 md:grid-cols-[1fr_.7fr]"><Card className="p-5"><p className="text-sm font-semibold">¿Cómo se asigna la prioridad?</p><div className="mt-4 grid grid-cols-4 gap-3">{[["Tipo de estudio","35%"],["Tiempo de entrega","30%"],["N.º de estudios","20%"],["Tipo de muestra","15%"]].map(([a,b])=><div key={a} className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">{a}</p><p className="mt-1 text-lg font-semibold">{b}</p></div>)}</div></Card><Card className="flex items-center gap-4 p-5"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-600"><Activity /></span><div><p className="font-semibold">Flujo optimizado</p><p className="mt-1 text-xs leading-5 text-slate-500">Las órdenes críticas aparecen primero para reducir retrasos y mejorar la atención.</p></div></Card></div>
  </Shell>;
}

export default function AnalyticsPrototype({ proposal }: { proposal: Proposal }) { if (proposal === "clustering") return <Clustering />; if (proposal === "regresion") return <Regression />; return <Classification />; }
