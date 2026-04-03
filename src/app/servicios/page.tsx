'use client';

import AddServiceModal from '@/components/servicios/AgregarServicioModal';
import PaginationControls from '@/components/ui/PaginationControls';
import {
  createService,
  getServices,
  type ServiceOrder,
  type ServiceStatus,
} from '@/actions/services/servicesActions';
import { getPatients, type Patient } from '@/actions/patients/patientsActions';
import { getStudies, type Study } from '@/actions/studies/studiesActions';
import { getDoctors, type Doctor } from '@/actions/doctors/doctorsActions';
import {
  Activity,
  BadgeCheck,
  ClipboardList,
  Clock3,
  Eye,
  FileText,
  Filter,
  Loader2,
  PencilLine,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

type UiService = {
  id: number;
  folio: string;
  estudio: string;
  paciente: string;
  telefono: string;
  sucursal: string;
  creador: string;
  fechaEntrega: string;
  costo: string;
  status: ServiceStatus;
};

function formatDate(date?: string | null) {
  if (!date) return 'N/D';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return 'N/D';
  return parsed.toLocaleString('es-MX');
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(value);
}

function toUiService(service: ServiceOrder): UiService {
  const studyNames = (service.items ?? []).map((item) => item.studyNameSnapshot).join(', ');
  const patientName = service.patient
    ? `${service.patient.firstName} ${service.patient.lastName} ${service.patient.middleName ?? ''}`.trim()
    : 'Sin paciente';

  return {
    id: service.id,
    folio: service.folio,
    estudio: studyNames || 'Sin estudios',
    paciente: patientName,
    telefono: service.patient?.phone ?? '-',
    sucursal: service.branchName ?? 'Sin sucursal',
    creador: formatDate(service.createdAt),
    fechaEntrega: formatDate(service.deliveryAt),
    costo: Number(service.totalAmount).toFixed(2),
    status: service.status,
  };
}

function getStatusColor(status: ServiceStatus): string {
  const colors: Record<ServiceStatus, string> = {
    pending: 'border-blue-200 bg-blue-50 text-blue-700',
    in_progress: 'border-orange-200 bg-orange-50 text-orange-700',
    delayed: 'border-amber-200 bg-amber-50 text-amber-700',
    completed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    cancelled: 'border-red-200 bg-red-50 text-red-700',
  };
  return colors[status] || 'border-gray-200 bg-gray-50 text-gray-700';
}

function statusLabel(status: ServiceStatus) {
  const labels: Record<ServiceStatus, string> = {
    pending: 'Pendiente',
    in_progress: 'En curso',
    delayed: 'Retrasado',
    completed: 'Concluido',
    cancelled: 'Cancelado',
  };
  return labels[status] || status;
}

function ActionButton({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'success' | 'danger';
}) {
  const toneClass =
    tone === 'success'
      ? 'hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700'
      : tone === 'danger'
        ? 'hover:border-red-200 hover:bg-red-50 hover:text-red-700'
        : 'hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700';

  return (
    <button
      type="button"
      className={`rounded-xl border border-gray-200 bg-white p-2 text-gray-500 transition-colors ${toneClass}`}
    >
      {children}
    </button>
  );
}

export default function ServiciosPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | ServiceStatus>('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [openServiceModal, setOpenServiceModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [servicios, setServicios] = useState<UiService[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [studies, setStudies] = useState<Study[]>([]);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    const response = await getServices({
      search: searchTerm.trim(),
      status: statusFilter || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      page,
      limit,
    });

    if (!response.ok) {
      toast.error(response.errors[0] ?? 'No se pudieron cargar servicios.');
      setServicios([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    setServicios(response.data.data.map(toUiService));
    setTotal(response.data.meta.total);
    setLoading(false);
  }, [fromDate, limit, page, searchTerm, statusFilter, toDate]);

  const loadFormCatalogs = useCallback(async () => {
    const [patientsResponse, doctorsResponse, studiesResponse] = await Promise.all([
      getPatients({ limit: 200 }),
      getDoctors({ limit: 200 }),
      getStudies({ limit: 200, status: 'active' }),
    ]);

    if (patientsResponse.ok) setPatients(patientsResponse.data.data);
    if (doctorsResponse.ok) setDoctors(doctorsResponse.data.data);
    if (studiesResponse.ok) setStudies(studiesResponse.data.data);
  }, []);

  useEffect(() => {
    void loadFormCatalogs();
  }, [loadFormCatalogs]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchServices();
    }, 350);
    return () => clearTimeout(timer);
  }, [fetchServices]);

  const addService = async (newService: {
    folio: string;
    patientId: number;
    doctorId?: number;
    studyId: number;
    branchName: string;
    deliveryAt: string;
  }) => {
    setSaving(true);
    const response = await createService({
      folio: newService.folio,
      patientId: newService.patientId,
      doctorId: newService.doctorId,
      branchName: newService.branchName,
      deliveryAt: newService.deliveryAt,
      items: [
        {
          studyId: newService.studyId,
          priceType: 'normal',
          quantity: 1,
        },
      ],
    });

    if (!response.ok) {
      toast.error(response.errors[0] ?? 'No se pudo crear el servicio.');
      setSaving(false);
      return;
    }

    toast.success(`Servicio ${newService.folio} agregado exitosamente.`);
    setOpenServiceModal(false);
    await fetchServices();
    setSaving(false);
  };

  const stats = useMemo(() => {
    const completed = servicios.filter((service) => service.status === 'completed').length;
    const inProgress = servicios.filter((service) => service.status === 'in_progress').length;
    const delayed = servicios.filter((service) => service.status === 'delayed').length;
    const income = servicios.reduce((acc, service) => acc + Number(service.costo), 0);
    return { total: servicios.length, completed, inProgress, delayed, income };
  }, [servicios]);

  return (
    <div className="min-w-0">
      <div className="mb-8 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            Gestión de servicios
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Servicios</h1>
          <p className="mt-2 max-w-2xl text-gray-600">
            Registra servicios, controla fechas de entrega y mantén un panorama claro del flujo operativo.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button className="app-action-button inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700 shadow-sm transition-all hover:bg-emerald-100">
            <FileText size={18} />
            Generar corte del día
          </button>

          <button
            onClick={() => setOpenServiceModal(true)}
            className="app-action-button inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition-all hover:bg-red-700"
          >
            <Plus size={20} />
            Nuevo servicio
          </button>
        </div>
      </div>

      <section className="app-panel-surface mb-6 overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm">
        <div className="grid gap-6 p-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">
              <Sparkles className="h-3.5 w-3.5 text-red-600" />
              Operación
            </div>
            <h2 className="mt-4 text-2xl font-semibold text-slate-900">Control visual de servicios</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Este módulo ahora comparte el mismo lenguaje visual del proyecto principal: tarjetas suaves, filtros claros
              y bloques operativos más legibles.
            </p>
          </div>

          <div className="rounded-[2rem] border border-slate-900/10 bg-slate-950 p-6 text-white shadow-lg shadow-slate-900/20">
            <p className="text-xs uppercase tracking-[0.25em] text-orange-200">Resumen rápido</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Concluidos</p>
                <p className="mt-2 text-2xl font-semibold text-white">{stats.completed}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-300">En curso</p>
                <p className="mt-2 text-2xl font-semibold text-white">{stats.inProgress}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="app-panel-surface mb-6 overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-gradient-to-r from-white via-red-50/60 to-white px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por folio, estudio o paciente..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-2xl border border-gray-200 bg-white px-12 py-3 text-sm text-gray-900 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowFilters((current) => !current)}
              className="app-action-button inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <Filter size={18} />
              Filtros
            </button>
          </div>
        </div>

        {showFilters ? (
          <div className="space-y-4 px-6 py-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Estatus</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: '', label: 'Todos' },
                  { value: 'pending', label: 'Pendientes' },
                  { value: 'in_progress', label: 'En curso' },
                  { value: 'delayed', label: 'Retrasados' },
                  { value: 'completed', label: 'Concluidos' },
                  { value: 'cancelled', label: 'Cancelados' },
                ].map((option) => (
                  <button
                    key={option.value || 'all'}
                    type="button"
                    onClick={() => {
                      setStatusFilter(option.value as '' | ServiceStatus);
                      setPage(1);
                    }}
                    className={`app-chip-button rounded-full px-4 py-2 text-sm font-medium transition-all ${
                      statusFilter === option.value
                        ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                        : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">Desde</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => {
                    setFromDate(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">Hasta</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => {
                    setToDate(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                />
              </div>
            </div>
          </div>
        ) : null}
      </section>

      <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="app-panel-surface rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Servicios</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{total}</p>
            </div>
            <div className="rounded-2xl bg-blue-100 p-3">
              <ClipboardList className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="app-panel-surface rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Concluidos</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{stats.completed}</p>
            </div>
            <div className="rounded-2xl bg-emerald-100 p-3">
              <BadgeCheck className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="app-panel-surface rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">En curso</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{stats.inProgress}</p>
            </div>
            <div className="rounded-2xl bg-orange-100 p-3">
              <Clock3 className="h-5 w-5 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="app-panel-surface rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ingreso estimado</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{formatMoney(stats.income)}</p>
            </div>
            <div className="rounded-2xl bg-rose-100 p-3">
              <Activity className="h-5 w-5 text-rose-600" />
            </div>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="rounded-[2rem] border border-gray-200 bg-white p-10 shadow-sm">
          <div className="flex items-center justify-center gap-3 text-gray-600">
            <Loader2 className="h-5 w-5 animate-spin" />
            Cargando servicios...
          </div>
        </div>
      ) : servicios.length === 0 ? (
        <div className="rounded-[2rem] border border-gray-200 bg-white p-10 text-center text-gray-600 shadow-sm">
          No hay servicios para el filtro seleccionado.
        </div>
      ) : (
        <>
          <div className="hidden overflow-visible rounded-[2rem] border border-gray-200 bg-white shadow-sm 2xl:block">
            <div className="grid grid-cols-[1.1fr_2.1fr_1.8fr_1fr_1.4fr_1.4fr_0.9fr_1fr_1fr] gap-4 border-b border-gray-200 bg-gray-50 px-6 py-4 text-sm font-semibold text-gray-700">
              <div>Folio</div>
              <div>Estudios</div>
              <div>Paciente</div>
              <div>Sucursal</div>
              <div>Creación</div>
              <div>Entrega</div>
              <div>Total</div>
              <div>Estatus</div>
              <div className="text-right">Acciones</div>
            </div>

            <div className="divide-y divide-gray-200">
              {servicios.map((servicio) => (
                <div
                  key={servicio.id}
                  className="grid grid-cols-[1.1fr_2.1fr_1.8fr_1fr_1.4fr_1.4fr_0.9fr_1fr_1fr] items-start gap-4 px-6 py-5 transition-colors hover:bg-gray-50"
                >
                  <div>
                    <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                      {servicio.folio}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <h3 className="break-words text-sm font-semibold text-gray-900">{servicio.estudio}</h3>
                  </div>

                  <div className="min-w-0">
                    <p className="break-words text-sm font-semibold text-gray-900">{servicio.paciente}</p>
                    <p className="mt-1 text-xs text-gray-500">Tel. {servicio.telefono}</p>
                  </div>

                  <div>
                    <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                      {servicio.sucursal}
                    </span>
                  </div>

                  <div className="text-sm text-gray-700">{servicio.creador}</div>
                  <div className="text-sm text-gray-700">{servicio.fechaEntrega}</div>

                  <div>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      {formatMoney(Number(servicio.costo))}
                    </span>
                  </div>

                  <div>
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusColor(servicio.status)}`}>
                      {statusLabel(servicio.status)}
                    </span>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Link
                      href="/servicios/detalle"
                      className="rounded-xl border border-gray-200 bg-white p-2 text-gray-500 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <Eye size={16} />
                    </Link>
                    <ActionButton tone="success">
                      <PencilLine size={16} />
                    </ActionButton>
                    <ActionButton tone="danger">
                      <Trash2 size={16} />
                    </ActionButton>
                  </div>
                </div>
              ))}
            </div>

            <PaginationControls
              page={page}
              limit={limit}
              total={total}
              itemLabel="servicios"
              onPageChange={setPage}
              onLimitChange={(nextLimit) => {
                setLimit(nextLimit);
                setPage(1);
              }}
            />
          </div>

          <div className="grid gap-4 2xl:hidden xl:grid-cols-2">
            {servicios.map((servicio) => (
              <div
                key={servicio.id}
                className="app-panel-surface rounded-3xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                      {servicio.folio}
                    </p>
                    <h3 className="mt-3 text-sm font-semibold text-gray-900">{servicio.estudio}</h3>
                  </div>

                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusColor(servicio.status)}`}>
                    {statusLabel(servicio.status)}
                  </span>
                </div>

                <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Paciente</p>
                    <p className="mt-1 font-semibold text-gray-900">{servicio.paciente}</p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Sucursal</p>
                    <p className="mt-1 font-semibold text-gray-900">{servicio.sucursal}</p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Creación</p>
                    <p className="mt-1 font-semibold text-gray-900">{servicio.creador}</p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Total</p>
                    <p className="mt-1 font-semibold text-gray-900">{formatMoney(Number(servicio.costo))}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                  <div className="text-xs text-gray-500">Entrega: {servicio.fechaEntrega}</div>

                  <div className="flex gap-2">
                    <Link
                      href="/servicios/detalle"
                      className="rounded-xl border border-gray-200 bg-white p-2 text-gray-500 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <Eye size={16} />
                    </Link>
                    <ActionButton tone="success">
                      <PencilLine size={16} />
                    </ActionButton>
                    <ActionButton tone="danger">
                      <Trash2 size={16} />
                    </ActionButton>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm 2xl:hidden">
            <PaginationControls
              page={page}
              limit={limit}
              total={total}
              itemLabel="servicios"
              onPageChange={setPage}
              onLimitChange={(nextLimit) => {
                setLimit(nextLimit);
                setPage(1);
              }}
            />
          </div>
        </>
      )}

      {openServiceModal ? (
        <AddServiceModal
          setOpen={setOpenServiceModal}
          addService={addService}
          patients={patients}
          doctors={doctors}
          studies={studies}
          isSaving={saving}
        />
      ) : null}
    </div>
  );
}
