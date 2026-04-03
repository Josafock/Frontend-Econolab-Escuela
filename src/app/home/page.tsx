import Link from "next/link";
import {
  Activity,
  ArrowRight,
  CalendarDays,
  ClipboardList,
  FlaskConical,
  Sparkles,
  Stethoscope,
  Users,
  Wallet,
} from "lucide-react";

const quickAccess = [
  {
    href: "/servicios",
    title: "Servicios",
    description: "Da de alta servicios, consulta el detalle operativo y sigue el estatus de entrega.",
    icon: ClipboardList,
  },
  {
    href: "/pacientes",
    title: "Pacientes",
    description: "Consulta expedientes, registra pacientes nuevos y revisa sus datos clave.",
    icon: Users,
  },
  {
    href: "/medicos",
    title: "Medicos",
    description: "Mantén actualizado el directorio medico y sus especialidades.",
    icon: Stethoscope,
  },
  {
    href: "/estudios",
    title: "Estudios",
    description: "Administra el catalogo de estudios, precios y configuraciones.",
    icon: FlaskConical,
  },
];

const timeline = [
  { label: "08:15", title: "Ingreso de muestras", detail: "Arranque de recepcion y validacion inicial de solicitudes." },
  { label: "10:40", title: "Pico operativo", detail: "Mayor volumen del dia en registro de servicios y pacientes." },
  { label: "14:30", title: "Seguimiento de entregas", detail: "Revision de servicios en proceso y cierre administrativo." },
];

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <section className="app-panel-surface overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">
              <Sparkles className="h-3.5 w-3.5 text-red-600" />
              Inicio
            </div>
            <h1 className="mt-4 max-w-3xl text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
              Panel principal del laboratorio
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Este tablero concentra el acceso rapido a los modulos principales y un resumen visual de la jornada.
              La idea es que el equipo entre, ubique prioridades y navegue con menos friccion.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Periodo</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">Hoy</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Operacion</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">Activa</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Vista</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">Administrativa</p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-900/10 bg-slate-950 p-6 text-white shadow-lg shadow-slate-900/20">
            <p className="text-xs uppercase tracking-[0.25em] text-orange-200">Resumen rapido</p>
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-start gap-3">
                  <Activity className="mt-0.5 h-5 w-5 text-emerald-300" />
                  <div>
                    <p className="text-sm font-semibold text-white">Flujo estable</p>
                    <p className="mt-1 text-sm text-slate-300">
                      El sistema está listo para operar servicios, catalogos y consultas internas.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-start gap-3">
                  <CalendarDays className="mt-0.5 h-5 w-5 text-amber-300" />
                  <div>
                    <p className="text-sm font-semibold text-white">Enfoque del dia</p>
                    <p className="mt-1 text-sm text-slate-300">
                      Prioriza captura de servicios, seguimiento de entregas y consulta de historial.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="app-panel-surface rounded-[1.75rem] border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-gray-600">Servicios del dia</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">18</p>
              <p className="mt-2 text-xs text-gray-500">Alta y seguimiento operativo.</p>
            </div>
            <div className="rounded-2xl bg-blue-100 p-3 text-blue-600">
              <ClipboardList className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="app-panel-surface rounded-[1.75rem] border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-gray-600">Pacientes atendidos</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">12</p>
              <p className="mt-2 text-xs text-gray-500">Recepcion y actualizacion de datos.</p>
            </div>
            <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="app-panel-surface rounded-[1.75rem] border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-gray-600">Estudios activos</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">43</p>
              <p className="mt-2 text-xs text-gray-500">Catalogo listo para nuevas ordenes.</p>
            </div>
            <div className="rounded-2xl bg-rose-100 p-3 text-rose-600">
              <FlaskConical className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="app-panel-surface rounded-[1.75rem] border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-gray-600">Ingreso estimado</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">$8,240</p>
              <p className="mt-2 text-xs text-gray-500">Proyección interna del periodo actual.</p>
            </div>
            <div className="rounded-2xl bg-amber-100 p-3 text-amber-600">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <div className="app-panel-surface rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Accesos rápidos</p>
            <h2 className="mt-2 text-2xl font-semibold text-gray-900">Modulos clave</h2>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {quickAccess.map((shortcut) => {
                const Icon = shortcut.icon;

                return (
                  <Link
                    key={shortcut.href}
                    href={shortcut.href}
                    className="app-panel-surface group rounded-[1.75rem] border border-gray-200 bg-gray-50 p-5 shadow-sm transition-all hover:border-red-200 hover:bg-white"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="rounded-2xl bg-white p-3 text-red-600 shadow-sm">
                        <Icon className="h-5 w-5" />
                      </div>
                      <ArrowRight className="h-4 w-4 text-red-500 transition-transform group-hover:translate-x-1" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-gray-900">{shortcut.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-gray-600">{shortcut.description}</p>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="app-panel-surface rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Ritmo del día</p>
            <h2 className="mt-2 text-2xl font-semibold text-gray-900">Actividad operativa</h2>

            <div className="mt-6 space-y-4">
              {timeline.map((item) => (
                <div key={item.label} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-gray-500">{item.label}</p>
                      <p className="mt-2 text-sm font-semibold text-gray-900">{item.title}</p>
                      <p className="mt-1 text-sm text-gray-600">{item.detail}</p>
                    </div>
                    <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                      En foco
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="app-panel-surface overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm">
            <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-red-900 p-6 text-white">
              <p className="text-xs uppercase tracking-[0.25em] text-red-100">Vista ejecutiva</p>
              <h2 className="mt-3 text-2xl font-semibold">Pulso del laboratorio</h2>
              <p className="mt-2 text-sm text-red-100">
                Un resumen visual para lectura rápida antes de entrar a cada módulo.
              </p>
            </div>

            <div className="space-y-4 p-6">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Prioridad</p>
                <p className="mt-2 text-lg font-semibold text-gray-900">Seguimiento de servicios activos</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Observación</p>
                <p className="mt-2 text-sm leading-6 text-gray-700">
                  El diseño ya empata mejor con el proyecto más avanzado: tarjetas suaves, contrastes limpios
                  y accesos con más claridad visual.
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                <p className="font-semibold">Siguiente acción sugerida</p>
                <p className="mt-2">
                  Entra al módulo de servicios para continuar con altas, detalle operativo y control de entrega.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
