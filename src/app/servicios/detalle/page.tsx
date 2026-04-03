'use client';

import {
  Activity,
  ArrowLeft,
  BadgeCheck,
  CalendarClock,
  CreditCard,
  Download,
  FileText,
  MapPin,
  Phone,
  QrCode,
  Ticket,
  UserRound,
} from 'lucide-react';
import Image from 'next/image';

type ServicioStatus = 'CONCURSO' | 'PENDIENTE' | 'EN PROCESO' | 'COMPLETADO' | 'CANCELADO';

interface ServicioDetalle {
  folio: string;
  estudio: string;
  paciente: string;
  telefono: string;
  sucursal: string;
  creador: string;
  fechaEntrega: string;
  costo: string;
  status: ServicioStatus;
  indicaciones: string;
  notas: string;
}

const servicioGlucosaDetalle: ServicioDetalle = {
  folio: 'GLU-006',
  estudio: 'GLUCOSA EN SANGRE EN AYUNAS',
  paciente: 'JUAN PEREZ LOPEZ',
  telefono: '7711234567',
  sucursal: 'Matriz',
  creador: '2025-09-25 09:15:00',
  fechaEntrega: '2025-09-25 12:00:00',
  costo: '180',
  status: 'PENDIENTE',
  indicaciones:
    'Ayuno minimo de 8 horas. Evitar consumo de bebidas azucaradas, refrescos o cafe con azucar antes del estudio.',
  notas:
    'Paciente refiere mareos ocasionales. Se recomienda revisar resultados con el medico tratante para ajustar tratamiento si es necesario.',
};

function getStatusColor(status: ServicioStatus): string {
  const map: Record<ServicioStatus, string> = {
    CONCURSO: 'border-amber-200 bg-amber-50 text-amber-700',
    PENDIENTE: 'border-blue-200 bg-blue-50 text-blue-700',
    'EN PROCESO': 'border-orange-200 bg-orange-50 text-orange-700',
    COMPLETADO: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    CANCELADO: 'border-red-200 bg-red-50 text-red-700',
  };

  return map[status] ?? 'border-gray-200 bg-gray-100 text-gray-700';
}

export default function DetalleServicioPage() {
  const servicio = servicioGlucosaDetalle;
  const [fechaCreacion, horaCreacion] = servicio.creador.split(' ');
  const [fechaEntrega, horaEntrega] = servicio.fechaEntrega.split(' ');

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            onClick={() => {
              // TODO: navegacion al listado si mas adelante se conecta con router.
            }}
          >
            <ArrowLeft className="h-4 w-4" />
            Regresar a servicios
          </button>

          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            Detalle operativo
          </div>
          <h1 className="mt-3 text-3xl font-bold text-gray-900">Detalle de servicio</h1>
          <p className="mt-2 max-w-3xl text-gray-600">
            La vista conserva el contenido actual del servicio, pero ahora comparte el mismo lenguaje visual del frontend principal.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${getStatusColor(servicio.status)}`}>
            <BadgeCheck className="h-4 w-4" />
            {servicio.status}
          </span>
          <button className="app-action-button inline-flex items-center gap-2 rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50">
            <Ticket className="h-4 w-4" />
            Imprimir orden
          </button>
          <button className="app-action-button inline-flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition-colors hover:bg-red-700">
            <Download className="h-4 w-4" />
            Descargar PDF
          </button>
        </div>
      </div>

      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="app-panel-surface rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-red-50 p-3 text-red-600">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Resumen operativo</h2>
              <p className="text-sm text-gray-500">Vista general del servicio y de sus datos principales.</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Folio</p>
              <p className="mt-2 text-base font-semibold text-gray-900">{servicio.folio}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Costo total</p>
              <p className="mt-2 text-base font-semibold text-gray-900">${servicio.costo} MXN</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 md:col-span-2">
              <p className="text-xs uppercase tracking-wide text-gray-500">Estudio</p>
              <p className="mt-2 text-base font-semibold text-gray-900">{servicio.estudio}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Creado</p>
              <p className="mt-2 text-base font-semibold text-gray-900">
                {fechaCreacion} <span className="text-sm font-medium text-gray-500">| {horaCreacion}</span>
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Entrega estimada</p>
              <p className="mt-2 text-base font-semibold text-gray-900">
                {fechaEntrega} <span className="text-sm font-medium text-gray-500">| {horaEntrega}</span>
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 md:col-span-2">
              <p className="text-xs uppercase tracking-wide text-gray-500">Notas</p>
              <p className="mt-2 text-sm leading-6 text-gray-700">{servicio.notas}</p>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-gray-200 bg-gradient-to-br from-red-600 via-red-500 to-rose-500 p-6 text-white shadow-lg shadow-red-600/20">
          <p className="text-sm uppercase tracking-[0.2em] text-red-100">Servicio en marcha</p>
          <h2 className="mt-3 text-2xl font-semibold">{servicio.paciente}</h2>
          <p className="mt-2 text-sm text-red-50">Sucursal {servicio.sucursal}</p>

          <div className="mt-6 space-y-4 rounded-[1.5rem] bg-white/10 p-5 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <UserRound className="h-4 w-4 text-red-100" />
              <div>
                <p className="text-xs uppercase tracking-wide text-red-100">Paciente</p>
                <p className="text-sm font-medium text-white">{servicio.paciente}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-red-100" />
              <div>
                <p className="text-xs uppercase tracking-wide text-red-100">Telefono</p>
                <p className="text-sm font-medium text-white">{servicio.telefono}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-red-100" />
              <div>
                <p className="text-xs uppercase tracking-wide text-red-100">Sucursal</p>
                <p className="text-sm font-medium text-white">{servicio.sucursal}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <CalendarClock className="h-4 w-4 text-red-100" />
              <div>
                <p className="text-xs uppercase tracking-wide text-red-100">Entrega</p>
                <p className="text-sm font-medium text-white">{fechaEntrega}</p>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-red-100">Costo</p>
              <p className="mt-2 text-2xl font-semibold text-white">${servicio.costo}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-red-100">Estatus</p>
              <p className="mt-2 text-2xl font-semibold text-white">{servicio.status}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-6">
          <div className="app-panel-surface rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Detalle del estudio</h2>
                <p className="text-sm text-gray-500">Indicaciones e informacion clinica mostradas con el nuevo estilo.</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Fecha de entrega</p>
                <p className="mt-2 text-sm font-semibold text-gray-900">{servicio.fechaEntrega}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Costo</p>
                <div className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <CreditCard className="h-4 w-4 text-emerald-600" />
                  ${servicio.costo} MXN
                </div>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Tipo de muestra</p>
                <p className="mt-2 text-sm font-semibold text-gray-900">Sangre en ayuno</p>
              </div>
            </div>

            <div className="mt-5 grid gap-4">
              <div className="rounded-[1.75rem] border border-gray-200 bg-gray-50 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Indicaciones</p>
                <p className="mt-3 text-sm leading-6 text-gray-700">{servicio.indicaciones}</p>
              </div>
              <div className="rounded-[1.75rem] border border-gray-200 bg-gray-50 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Notas adicionales</p>
                <p className="mt-3 text-sm leading-6 text-gray-700">{servicio.notas}</p>
              </div>
            </div>
          </div>

          <div className="app-panel-surface rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Resultados de glucosa</h2>
                <p className="text-sm text-gray-500">Bloque visual inspirado en la version avanzada del frontend.</p>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-gray-200 bg-gray-50 p-6">
              <div className="text-center">
                <p className="text-xs text-gray-500">04/12/2025</p>
                <p className="text-xs text-gray-500">Paciente: {servicio.paciente}</p>
                <h3 className="mt-2 text-3xl font-extrabold tracking-[0.25em] text-gray-700">GLUCOSA</h3>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-white p-4 text-center md:text-left">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Valor</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">95 <span className="text-sm font-medium text-gray-500">mg/dL</span></p>
                </div>
                <div className="rounded-2xl bg-white p-4 text-center md:text-left">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Estado</p>
                  <p className="mt-2 text-3xl font-bold text-emerald-600">NORMAL</p>
                </div>
              </div>

              <div className="mx-auto mt-6 max-w-md">
                <div className="flex h-3 w-full overflow-hidden rounded-full bg-gray-200">
                  <div className="flex-1 bg-yellow-200" />
                  <div className="flex-1 bg-emerald-400" />
                  <div className="flex-1 bg-red-200" />
                </div>
                <div className="relative mt-2 h-4">
                  <div className="absolute left-1/2 top-0 -translate-x-1/2">
                    <div className="h-4 w-2.5 rounded-sm bg-emerald-600" />
                  </div>
                </div>
                <div className="mt-2 flex justify-between text-[11px] font-medium">
                  <span className="text-yellow-600">Bajo</span>
                  <span className="text-emerald-700">Normal</span>
                  <span className="text-red-600">Alto</span>
                </div>
              </div>

              <div className="mt-6 space-y-2 text-sm text-gray-700">
                <p>
                  <span className="font-semibold">Rango de referencia:</span> 70 - 110 mg/dL
                </p>
                <p>
                  <span className="font-semibold">Interpretacion:</span> Dentro de rango normal.
                </p>
                <p>
                  <span className="font-semibold">Recomendacion:</span> Continuar con controles periodicos.
                </p>
              </div>
            </div>
          </div>

          <div className="app-panel-surface rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Linea de tiempo del servicio</h2>
            <p className="mt-1 text-sm text-gray-500">Seguimiento visual del estado actual del estudio.</p>

            <ol className="relative mt-6 border-l border-gray-200 text-sm">
              <li className="mb-6 ml-4">
                <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-white bg-emerald-500" />
                <p className="text-xs text-gray-500">2025-09-25 09:15:00</p>
                <p className="font-medium text-gray-900">Servicio creado</p>
                <p className="text-gray-600">Captura de datos del paciente y generacion del folio.</p>
              </li>
              <li className="mb-6 ml-4">
                <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-white bg-blue-500" />
                <p className="text-xs text-gray-500">Pendiente</p>
                <p className="font-medium text-gray-900">Muestra en espera</p>
                <p className="text-gray-600">El paciente debe presentarse para la toma de muestra en ayunas.</p>
              </li>
              <li className="ml-4">
                <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-white bg-gray-300" />
                <p className="text-xs text-gray-500">Proximo</p>
                <p className="font-medium text-gray-900">Procesamiento de laboratorio</p>
                <p className="text-gray-600">Una vez tomada la muestra, se procesara y se generaran resultados.</p>
              </li>
            </ol>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="app-panel-surface overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm">
            <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-900 p-6 text-white">
              <p className="text-xs uppercase tracking-[0.25em] text-emerald-200">Resumen del servicio</p>
              <h2 className="mt-3 text-2xl font-semibold">${servicio.costo} MXN</h2>
              <p className="mt-2 text-sm text-emerald-100">
                Resumen ejecutivo del servicio y acceso a sus acciones principales.
              </p>
            </div>

            <div className="space-y-4 p-6">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Paciente</p>
                <p className="mt-2 text-sm font-semibold text-gray-900">{servicio.paciente}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Estatus</p>
                <p className="mt-2 text-sm font-semibold text-gray-900">{servicio.status}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Entrega estimada</p>
                <p className="mt-2 text-sm font-semibold text-gray-900">{fechaEntrega} | {horaEntrega}</p>
              </div>

              <div className="flex flex-col gap-3">
                <button className="app-action-button inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition-colors hover:bg-red-700">
                  <FileText className="h-4 w-4" />
                  Imprimir orden
                </button>
                <button className="app-action-button inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50">
                  <Download className="h-4 w-4" />
                  Descargar resultados
                </button>
              </div>
            </div>
          </div>

          <div className="app-panel-surface rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
                <QrCode className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Codigo QR para AR</h2>
                <p className="text-sm text-gray-500">Contenedor visual alineado con el nuevo estilo.</p>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center rounded-[1.75rem] border border-gray-200 bg-gray-50 p-6">
              <Image
                src="/qr.jpeg"
                alt="QR Examen de Glucosa"
                width={180}
                height={180}
                className="rounded-2xl border border-gray-200 bg-white"
              />
              <p className="mt-4 text-center text-xs leading-6 text-gray-500">
                Reemplaza este contenedor por la imagen del QR real cuando la tengas disponible en <code>/public</code>.
              </p>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
