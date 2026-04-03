'use client';

import { Calendar, RefreshCw, Search, Sparkles, Wallet } from 'lucide-react';
import { useMemo, useState } from 'react';

type Status = 'CONCURSO' | 'COMPLETADO' | 'CANCELADO' | 'PENDIENTE' | string;

type HistoryItem = {
  folio: string;
  estudio: string;
  paciente: string;
  fechaRegistro: string;
  sucursal: string;
  status: Status;
};

const historial: HistoryItem[] = [
  {
    folio: 'TOL-001',
    estudio: 'ANALISIS CLINICO',
    paciente: 'Maria Hernandez Hernandez',
    fechaRegistro: '2022-07-30',
    sucursal: 'Unidad Movil',
    status: 'CONCURSO',
  },
  {
    folio: 'TOL-002',
    estudio: 'COMPROBANTE DE DIABETES BASICO',
    paciente: 'Benita Rivera Hernandez',
    fechaRegistro: '2022-07-31',
    sucursal: 'Unidad Movil',
    status: 'CONCURSO',
  },
  {
    folio: 'TOL-003',
    estudio: 'BIOMETRIA HEMATICA COMPLETA',
    paciente: 'DOMINGA BAUTISTA HERNANDEZ',
    fechaRegistro: '2022-08-16',
    sucursal: 'Unidad Movil',
    status: 'CONCURSO',
  },
  {
    folio: 'TOL-004',
    estudio: 'REACCIONES FLEBRALES CONTROL (BASICO IBHC-056-EGO)',
    paciente: 'Juan Perez Lopez',
    fechaRegistro: '2022-08-20',
    sucursal: 'Unidad Movil',
    status: 'COMPLETADO',
  },
  {
    folio: 'TOL-005',
    estudio: 'PERFIL LIPIDICO',
    paciente: 'Ana Garcia Martinez',
    fechaRegistro: '2022-08-25',
    sucursal: 'Unidad Movil',
    status: 'CANCELADO',
  },
];

function getStatusColor(status: Status): string {
  const colors: Record<string, string> = {
    CONCURSO: 'border-amber-200 bg-amber-50 text-amber-700',
    COMPLETADO: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    CANCELADO: 'border-red-200 bg-red-50 text-red-700',
    PENDIENTE: 'border-blue-200 bg-blue-50 text-blue-700',
  };
  return colors[status] || 'border-gray-200 bg-gray-100 text-gray-700';
}

export default function HistorialPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesCount, setEntriesCount] = useState(10);

  const completados = useMemo(
    () => historial.filter((item) => item.status === 'COMPLETADO').length,
    [],
  );

  const cancelados = useMemo(
    () => historial.filter((item) => item.status === 'CANCELADO').length,
    [],
  );

  return (
    <div className="min-w-0">
      <div className="mb-8 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Historial operativo
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Historial</h1>
          <p className="mt-2 max-w-3xl text-gray-600">
            Revisa registros historicos con el mismo estilo visual del frontend principal:
            filtros claros, tarjetas suaves y una tabla mucho mas legible.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button className="app-action-button inline-flex items-center gap-2 rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50">
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </button>
        </div>
      </div>

      <section className="app-panel-surface mb-6 overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm">
        <div className="grid gap-6 p-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              Consulta
            </div>
            <h2 className="mt-4 text-2xl font-semibold text-slate-900">Historial con lectura mas limpia</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Mantiene la informacion y controles actuales, pero ahora replica el acomodo visual del proyecto mas avanzado.
            </p>
          </div>

          <div className="rounded-[2rem] border border-slate-900/10 bg-slate-950 p-6 text-white shadow-lg shadow-slate-900/20">
            <p className="text-xs uppercase tracking-[0.25em] text-emerald-200">Resumen rapido</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Registros</p>
                <p className="mt-2 text-2xl font-semibold text-white">{historial.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Completados</p>
                <p className="mt-2 text-2xl font-semibold text-white">{completados}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="app-panel-surface mb-6 overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-gradient-to-r from-white via-emerald-50/60 to-white px-6 py-5">
          <div className="grid gap-4 xl:grid-cols-[1fr_1fr_0.9fr_0.8fr_auto]">
            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Fecha inicio</span>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input type="date" className="w-full rounded-2xl border border-gray-200 bg-white px-11 py-3 text-sm text-gray-900 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20" />
              </div>
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Fecha fin</span>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input type="date" className="w-full rounded-2xl border border-gray-200 bg-white px-11 py-3 text-sm text-gray-900 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20" />
              </div>
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Mostrar entradas</span>
              <select
                value={entriesCount}
                onChange={(e) => setEntriesCount(Number(e.target.value))}
                className="modal-select rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value={10}>10 entradas</option>
                <option value={25}>25 entradas</option>
                <option value={50}>50 entradas</option>
                <option value={100}>100 entradas</option>
              </select>
            </label>

            <div className="flex items-end">
              <button className="app-action-button w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50">
                Limpiar filtros
              </button>
            </div>

            <label className="grid gap-2 xl:col-span-full">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Busqueda</span>
              <div className="relative max-w-xl">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar en historial..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-12 py-3 text-sm text-gray-900 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </label>
          </div>
        </div>
      </section>

      <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="app-panel-surface rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total registros</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{historial.length}</p>
            </div>
            <div className="rounded-2xl bg-blue-100 p-3">
              <Wallet className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="app-panel-surface rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completados</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{completados}</p>
            </div>
            <div className="rounded-2xl bg-emerald-100 p-3">
              <RefreshCw className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="app-panel-surface rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Cancelados</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{cancelados}</p>
            </div>
            <div className="rounded-2xl bg-rose-100 p-3">
              <Wallet className="h-5 w-5 text-rose-600" />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
        <section className="app-panel-surface overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-5">
            <h2 className="text-lg font-semibold text-gray-900">Registros del historial</h2>
            <p className="mt-1 text-sm text-gray-500">
              Visualizacion de los servicios historicos con el nuevo lenguaje visual.
            </p>
          </div>

          <div className="hidden 2xl:block">
            <div className="grid grid-cols-[1fr_2.1fr_1.5fr_1.1fr_1fr_0.9fr_auto] gap-4 border-b border-gray-200 bg-gray-50 px-6 py-4 text-sm font-semibold text-gray-700">
              <div>Folio</div>
              <div>Estudio</div>
              <div>Paciente</div>
              <div>Fecha</div>
              <div>Sucursal</div>
              <div>Estatus</div>
              <div className="text-right">Accion</div>
            </div>

            <div className="divide-y divide-gray-200">
              {historial.map((item) => (
                <div
                  key={item.folio}
                  className="grid grid-cols-[1fr_2.1fr_1.5fr_1.1fr_1fr_0.9fr_auto] items-start gap-4 px-6 py-5 transition-colors hover:bg-gray-50"
                >
                  <div>
                    <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 font-mono text-xs font-semibold text-gray-700">
                      {item.folio}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="break-words text-sm font-semibold text-gray-900">{item.estudio}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="break-words text-sm font-semibold text-gray-900">{item.paciente}</p>
                  </div>
                  <div className="text-sm text-gray-700">{item.fechaRegistro}</div>
                  <div>
                    <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                      {item.sucursal}
                    </span>
                  </div>
                  <div>
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="text-right">
                    <button className="rounded-xl border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50">
                      Ver
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 p-4 2xl:hidden">
            {historial.map((item) => (
              <div key={item.folio} className="rounded-3xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="inline-flex rounded-full bg-gray-100 px-3 py-1 font-mono text-xs font-semibold text-gray-700">
                      {item.folio}
                    </p>
                    <h3 className="mt-3 text-sm font-semibold text-gray-900">{item.estudio}</h3>
                  </div>
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                  <div className="rounded-2xl bg-white p-3">
                    <p className="text-xs text-gray-500">Paciente</p>
                    <p className="mt-1 font-semibold text-gray-900">{item.paciente}</p>
                  </div>
                  <div className="rounded-2xl bg-white p-3">
                    <p className="text-xs text-gray-500">Fecha</p>
                    <p className="mt-1 font-semibold text-gray-900">{item.fechaRegistro}</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
                  <p className="text-xs text-gray-500">{item.sucursal}</p>
                  <button className="rounded-xl border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50">
                    Ver detalle
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 px-6 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-600">
                Mostrando <span className="font-medium">{historial.length}</span> de <span className="font-medium">50</span> registros
              </p>

              <div className="flex items-center gap-2">
                <button className="rounded-xl border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
                  Anterior
                </button>
                <span className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white">1</span>
                <button className="rounded-xl border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="app-panel-surface overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm">
            <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-900 p-6 text-white">
              <p className="text-xs uppercase tracking-[0.25em] text-emerald-200">Estado actual</p>
              <h2 className="mt-3 text-2xl font-semibold">{historial.length} movimientos</h2>
              <p className="mt-2 text-sm text-emerald-100">
                Vista ejecutiva del historial con el nuevo lenguaje del sistema.
              </p>
            </div>

            <div className="space-y-4 p-6">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Entradas seleccionadas</p>
                <p className="mt-2 text-lg font-semibold text-gray-900">{entriesCount}</p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Busqueda activa</p>
                <p className="mt-2 text-sm font-semibold text-gray-900">{searchTerm || 'Sin termino de busqueda'}</p>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900">
                <p className="font-semibold">Consulta visual renovada</p>
                <p className="mt-2">
                  Este modulo ahora se integra mejor con servicios, pacientes y medicos sin modificar sus apartados funcionales.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
