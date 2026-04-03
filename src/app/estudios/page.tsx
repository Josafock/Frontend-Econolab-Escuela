'use client';

import AddStudyModal from '@/components/estudios/AddStudyModal';
import DataTransferPanel from '@/components/data-transfer/DataTransferPanel';
import PaginationControls from '@/components/ui/PaginationControls';
import { createStudy, getStudies, type CreateStudyPayload, type Study } from '@/actions/studies/studiesActions';
import {
  DollarSign,
  Eye,
  Filter,
  FlaskConical,
  Hash,
  Loader2,
  PencilLine,
  Plus,
  Search,
  Sparkles,
  Tag,
  Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import toast from 'react-hot-toast';

const STUDY_TEMPLATE_HEADERS = [
  'name',
  'code',
  'description',
  'durationMinutes',
  'type',
  'normalPrice',
  'difPrice',
  'specialPrice',
  'hospitalPrice',
  'otherPrice',
  'defaultDiscountPercent',
  'method',
  'indicator',
  'status',
];

const STUDY_EXPORT_FIELDS = [
  { key: 'name', label: 'Nombre' },
  { key: 'code', label: 'Clave' },
  { key: 'description', label: 'Descripcion' },
  { key: 'durationMinutes', label: 'Duracion' },
  { key: 'type', label: 'Tipo' },
  { key: 'normalPrice', label: 'Precio normal' },
  { key: 'difPrice', label: 'Precio DIF' },
  { key: 'specialPrice', label: 'Precio especial' },
  { key: 'hospitalPrice', label: 'Precio hospital' },
  { key: 'otherPrice', label: 'Otro precio' },
  { key: 'defaultDiscountPercent', label: 'Descuento default' },
  { key: 'method', label: 'Metodo' },
  { key: 'indicator', label: 'Indicador' },
  { key: 'status', label: 'Estatus' },
];

function ActionButton({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
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

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(value);
}

export default function EstudiosPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | 'active' | 'suspended'>('');
  const [typeFilter, setTypeFilter] = useState<'' | 'study' | 'package' | 'other'>('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [estudios, setEstudios] = useState<Study[]>([]);

  const fetchStudies = useCallback(async () => {
    setLoading(true);
    const response = await getStudies({
      search: searchTerm.trim(),
      status: statusFilter || undefined,
      type: typeFilter || undefined,
      page,
      limit,
    });
    if (!response.ok) {
      toast.error(response.errors[0] ?? 'No se pudieron cargar estudios.');
      setEstudios([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    setEstudios(response.data.data);
    setTotal(response.data.meta.total);
    setLoading(false);
  }, [limit, page, searchTerm, statusFilter, typeFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchStudies();
    }, 350);

    return () => clearTimeout(timer);
  }, [fetchStudies]);

  const addStudy = async (payload: CreateStudyPayload) => {
    setSaving(true);
    const response = await createStudy(payload);
    if (!response.ok) {
      toast.error(response.errors[0] ?? 'No se pudo crear el estudio.');
      setSaving(false);
      return;
    }

    toast.success('Estudio registrado con exito.');
    setOpenAddModal(false);
    await fetchStudies();
    setSaving(false);
  };

  const getStatusColor = (estatus: string): string => {
    const colors: Record<string, string> = {
      active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      suspended: 'border-red-200 bg-red-50 text-red-700',
    };
    return colors[estatus] || 'border-gray-200 bg-gray-100 text-gray-700';
  };

  const getStatusLabel = (estatus: string) => {
    if (estatus === 'active') return 'Activo';
    if (estatus === 'suspended') return 'Suspendido';
    return estatus;
  };

  const getCategoryColor = (tipo: string): string => {
    const colors: Record<string, string> = {
      study: 'border-blue-200 bg-blue-50 text-blue-700',
      package: 'border-violet-200 bg-violet-50 text-violet-700',
      other: 'border-gray-200 bg-gray-100 text-gray-700',
    };
    return colors[tipo] || 'border-gray-200 bg-gray-100 text-gray-700';
  };

  const getTypeLabel = (tipo: string) => {
    if (tipo === 'study') return 'Estudio';
    if (tipo === 'package') return 'Paquete';
    if (tipo === 'other') return 'Otro';
    return tipo;
  };

  const activos = useMemo(() => estudios.filter((e) => e.status === 'active').length, [estudios]);
  const inactivos = useMemo(() => estudios.filter((e) => e.status === 'suspended').length, [estudios]);
  const precioPromedio = useMemo(() => {
    if (!estudios.length) return 0;
    return Math.round(estudios.reduce((acc, e) => acc + Number(e.normalPrice), 0) / estudios.length);
  }, [estudios]);

  return (
    <div className="min-w-0">
      <div className="mb-8 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            Catalogo de estudios
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Estudios</h1>
          <p className="mt-2 max-w-2xl text-gray-600">
            Ordena el catalogo con el mismo look visual del proyecto principal, manteniendo intactas
            las funciones de alta, busqueda y filtros del sistema actual.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
          <DataTransferPanel
            moduleKey="studies"
            moduleLabel="estudio"
            moduleLabelPlural="Estudios"
            templateHeaders={STUDY_TEMPLATE_HEADERS}
            fieldOptions={STUDY_EXPORT_FIELDS}
            onImported={fetchStudies}
          />
          <button
            type="button"
            onClick={() => setOpenAddModal(true)}
            className="app-action-button inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition-all hover:bg-red-700"
          >
            <Plus size={20} />
            Nuevo estudio
          </button>
        </div>
      </div>

      <section className="app-panel-surface mb-6 overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm">
        <div className="grid gap-6 p-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">
              <Sparkles className="h-3.5 w-3.5 text-red-600" />
              Laboratorio
            </div>
            <h2 className="mt-4 text-2xl font-semibold text-slate-900">Catalogo con mejor lectura</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Se trasladan cards, colores, filtros y estados visuales para que el catalogo de estudios
              quede alineado con el frontend avanzado.
            </p>
          </div>

          <div className="rounded-[2rem] border border-slate-900/10 bg-slate-950 p-6 text-white shadow-lg shadow-slate-900/20">
            <p className="text-xs uppercase tracking-[0.25em] text-orange-200">Panel rapido</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Activos</p>
                <p className="mt-2 text-2xl font-semibold text-white">{activos}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Precio medio</p>
                <p className="mt-2 text-2xl font-semibold text-white">{formatMoney(precioPromedio)}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="app-panel-surface mb-6 overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-gradient-to-r from-white via-red-50/60 to-white px-6 py-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o clave..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-2xl border border-gray-200 bg-white px-12 py-3 text-sm text-gray-900 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              />
            </div>

            <div className="flex flex-col gap-3 md:flex-row">
              <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3">
                <Filter size={18} className="text-gray-400" />
                <select
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value as typeof typeFilter);
                    setPage(1);
                  }}
                  className="modal-select border-0 bg-transparent p-0 text-sm text-gray-900 outline-none"
                >
                  <option value="">Todos los tipos</option>
                  <option value="study">Estudio</option>
                  <option value="package">Paquete</option>
                  <option value="other">Otro</option>
                </select>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as typeof statusFilter);
                    setPage(1);
                  }}
                  className="modal-select border-0 bg-transparent p-0 text-sm text-gray-900 outline-none"
                >
                  <option value="">Todos los estatus</option>
                  <option value="active">Activo</option>
                  <option value="suspended">Suspendido</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="app-panel-surface rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total estudios</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{total}</p>
            </div>
            <div className="rounded-2xl bg-blue-100 p-3">
              <Hash className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="app-panel-surface rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Activos</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{activos}</p>
            </div>
            <div className="rounded-2xl bg-emerald-100 p-3">
              <Tag className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="app-panel-surface rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Suspendidos</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{inactivos}</p>
            </div>
            <div className="rounded-2xl bg-rose-100 p-3">
              <FlaskConical className="h-5 w-5 text-rose-600" />
            </div>
          </div>
        </div>

        <div className="app-panel-surface rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Precio promedio</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{formatMoney(precioPromedio)}</p>
            </div>
            <div className="rounded-2xl bg-violet-100 p-3">
              <DollarSign className="h-5 w-5 text-violet-600" />
            </div>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="rounded-[2rem] border border-gray-200 bg-white p-10 shadow-sm">
          <div className="flex items-center justify-center gap-3 text-gray-600">
            <Loader2 className="h-5 w-5 animate-spin" />
            Cargando estudios...
          </div>
        </div>
      ) : estudios.length === 0 ? (
        <div className="rounded-[2rem] border border-gray-200 bg-white p-10 text-center text-gray-600 shadow-sm">
          No hay estudios registrados.
        </div>
      ) : (
        <>
          <div className="hidden overflow-visible rounded-[2rem] border border-gray-200 bg-white shadow-sm 2xl:block">
            <div className="grid grid-cols-[2.2fr_0.9fr_1fr_1fr_0.9fr_auto] gap-4 border-b border-gray-200 bg-gray-50 px-6 py-4 text-sm font-semibold text-gray-700">
              <div>Estudio</div>
              <div>Clave</div>
              <div>Tipo</div>
              <div>Precio</div>
              <div>Estatus</div>
              <div className="text-right">Acciones</div>
            </div>

            <div className="divide-y divide-gray-200">
              {estudios.map((estudio) => (
                <div
                  key={estudio.id}
                  className="grid grid-cols-[2.2fr_0.9fr_1fr_1fr_0.9fr_auto] items-start gap-4 px-6 py-5 transition-colors hover:bg-gray-50"
                >
                  <div className="min-w-0">
                    <h3 className="break-words text-sm font-semibold text-gray-900">{estudio.name}</h3>
                    <p className="mt-1 line-clamp-2 text-xs text-gray-500">{estudio.description || 'Sin descripcion'}</p>
                  </div>

                  <div>
                    <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 font-mono text-xs font-semibold text-gray-700">
                      {estudio.code}
                    </span>
                  </div>

                  <div>
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getCategoryColor(estudio.type)}`}
                    >
                      {getTypeLabel(estudio.type)}
                    </span>
                  </div>

                  <div>
                    <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      {formatMoney(Number(estudio.normalPrice))}
                    </span>
                  </div>

                  <div>
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusColor(estudio.status)}`}
                    >
                      {getStatusLabel(estudio.status)}
                    </span>
                  </div>

                  <div className="flex justify-end gap-2">
                    <ActionButton>
                      <Eye size={16} />
                    </ActionButton>
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
              itemLabel="estudios"
              onPageChange={setPage}
              onLimitChange={(nextLimit) => {
                setLimit(nextLimit);
                setPage(1);
              }}
            />
          </div>

          <div className="grid gap-4 2xl:hidden xl:grid-cols-2">
            {estudios.map((estudio) => (
              <div
                key={estudio.id}
                className="app-panel-surface rounded-3xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                      {estudio.code}
                    </p>
                    <h3 className="mt-3 text-sm font-semibold text-gray-900">{estudio.name}</h3>
                  </div>

                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusColor(estudio.status)}`}
                  >
                    {getStatusLabel(estudio.status)}
                  </span>
                </div>

                <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Tipo</p>
                    <p className="mt-1 font-semibold text-gray-900">{getTypeLabel(estudio.type)}</p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Precio</p>
                    <p className="mt-1 font-semibold text-gray-900">{formatMoney(Number(estudio.normalPrice))}</p>
                  </div>
                </div>

                <div className="rounded-2xl bg-gray-50 p-3 text-sm text-gray-700">
                  <p className="text-xs text-gray-500">Descripcion</p>
                  <p className="mt-1">{estudio.description || 'Sin descripcion'}</p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
                  <div
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getCategoryColor(estudio.type)}`}
                  >
                    {getTypeLabel(estudio.type)}
                  </div>
                  <div className="flex gap-2">
                    <ActionButton>
                      <Eye size={16} />
                    </ActionButton>
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
              itemLabel="estudios"
              onPageChange={setPage}
              onLimitChange={(nextLimit) => {
                setLimit(nextLimit);
                setPage(1);
              }}
            />
          </div>
        </>
      )}

      {openAddModal ? (
        <AddStudyModal setOpen={setOpenAddModal} addStudy={addStudy} isSaving={saving} />
      ) : null}
    </div>
  );
}
