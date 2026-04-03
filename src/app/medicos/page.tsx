'use client';

import AddDoctorModal from '@/components/medicos/AddDoctorModal';
import DataTransferPanel from '@/components/data-transfer/DataTransferPanel';
import PaginationControls from '@/components/ui/PaginationControls';
import { createDoctor, getDoctors, type CreateDoctorPayload, type Doctor } from '@/actions/doctors/doctorsActions';
import {
  BadgeCheck,
  Eye,
  Filter,
  Loader2,
  Mail,
  PencilLine,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Trash2,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import toast from 'react-hot-toast';

const DOCTOR_TEMPLATE_HEADERS = [
  'firstName',
  'lastName',
  'middleName',
  'email',
  'phone',
  'specialty',
  'licenseNumber',
  'notes',
];

const DOCTOR_EXPORT_FIELDS = [
  { key: 'firstName', label: 'Nombre' },
  { key: 'lastName', label: 'Apellido paterno' },
  { key: 'middleName', label: 'Apellido materno' },
  { key: 'email', label: 'Correo' },
  { key: 'phone', label: 'Telefono' },
  { key: 'specialty', label: 'Especialidad' },
  { key: 'licenseNumber', label: 'Cedula' },
  { key: 'notes', label: 'Notas' },
];

type UiDoctor = {
  id: number;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  especialidad: string;
  cedula: string;
  telefono: string;
  email: string;
  estatus: 'Activo';
};

function toUiDoctor(doctor: Doctor): UiDoctor {
  return {
    id: doctor.id,
    nombre: (doctor.firstName ?? '').toUpperCase(),
    apellidoPaterno: (doctor.lastName ?? '').toUpperCase(),
    apellidoMaterno: (doctor.middleName ?? '').toUpperCase(),
    especialidad: doctor.specialty ?? 'Sin especialidad',
    cedula: doctor.licenseNumber ?? '-',
    telefono: doctor.phone ?? '-',
    email: doctor.email ?? '-',
    estatus: 'Activo',
  };
}

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

function buildFullName(doctor: UiDoctor) {
  return [doctor.nombre, doctor.apellidoPaterno, doctor.apellidoMaterno].filter(Boolean).join(' ');
}

export default function MedicosPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [medicos, setMedicos] = useState<UiDoctor[]>([]);

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    const response = await getDoctors({
      search: searchTerm.trim(),
      page,
      limit,
    });
    if (!response.ok) {
      toast.error(response.errors[0] ?? 'No se pudieron cargar medicos.');
      setMedicos([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    setMedicos(response.data.data.map(toUiDoctor));
    setTotal(response.data.meta.total);
    setLoading(false);
  }, [limit, page, searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchDoctors();
    }, 350);

    return () => clearTimeout(timer);
  }, [fetchDoctors]);

  const addDoctor = async (payload: CreateDoctorPayload) => {
    setSaving(true);
    const response = await createDoctor(payload);
    if (!response.ok) {
      toast.error(response.errors[0] ?? 'No se pudo crear el medico.');
      setSaving(false);
      return;
    }

    toast.success('Medico registrado con exito.');
    setOpenAddModal(false);
    await fetchDoctors();
    setSaving(false);
  };

  const getEstatusColor = (estatus: string): string => {
    const colors: Record<string, string> = {
      Activo: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    };
    return colors[estatus] || 'border-gray-200 bg-gray-100 text-gray-700';
  };

  const getEspecialidadColor = (especialidad: string): string => {
    const low = especialidad.toLowerCase();
    if (low.includes('cardio')) return 'border-red-200 bg-red-50 text-red-700';
    if (low.includes('pedia')) return 'border-pink-200 bg-pink-50 text-pink-700';
    if (low.includes('derma')) return 'border-cyan-200 bg-cyan-50 text-cyan-700';
    if (low.includes('gine')) return 'border-violet-200 bg-violet-50 text-violet-700';
    return 'border-blue-200 bg-blue-50 text-blue-700';
  };

  const especialidadesUnicas = useMemo(
    () => new Set(medicos.map((m) => m.especialidad)).size,
    [medicos],
  );

  const conCedula = useMemo(
    () => medicos.filter((m) => m.cedula !== '-').length,
    [medicos],
  );

  return (
    <div className="min-w-0">
      <div className="mb-8 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            Directorio medico
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Medicos</h1>
          <p className="mt-2 max-w-2xl text-gray-600">
            Supervisa al personal medico con el mismo lenguaje visual del frontend principal:
            tarjetas, filtros limpios y acciones con mayor jerarquia.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
          <DataTransferPanel
            moduleKey="doctors"
            moduleLabel="medico"
            moduleLabelPlural="Medicos"
            templateHeaders={DOCTOR_TEMPLATE_HEADERS}
            fieldOptions={DOCTOR_EXPORT_FIELDS}
            onImported={fetchDoctors}
          />
          <button
            type="button"
            onClick={() => setOpenAddModal(true)}
            className="app-action-button inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition-all hover:bg-red-700"
          >
            <Plus size={20} />
            Nuevo medico
          </button>
        </div>
      </div>

      <section className="app-panel-surface mb-6 overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm">
        <div className="grid gap-6 p-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">
              <Sparkles className="h-3.5 w-3.5 text-red-600" />
              Operacion clinica
            </div>
            <h2 className="mt-4 text-2xl font-semibold text-slate-900">Equipo medico mas claro</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Conservamos las consultas actuales y solo trasladamos la parte visual para que el
              catalogo de medicos combine con el resto del sistema.
            </p>
          </div>

          <div className="rounded-[2rem] border border-slate-900/10 bg-slate-950 p-6 text-white shadow-lg shadow-slate-900/20">
            <p className="text-xs uppercase tracking-[0.25em] text-orange-200">Cobertura</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Activos</p>
                <p className="mt-2 text-2xl font-semibold text-white">{medicos.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Especialidades</p>
                <p className="mt-2 text-2xl font-semibold text-white">{especialidadesUnicas}</p>
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
                placeholder="Buscar por nombre, especialidad o cedula..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-2xl border border-gray-200 bg-white px-12 py-3 text-sm text-gray-900 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              />
            </div>

            <div className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700">
              <Filter size={18} />
              Busqueda paginada
            </div>
          </div>
        </div>
      </section>

      <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="app-panel-surface rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total medicos</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{total}</p>
            </div>
            <div className="rounded-2xl bg-blue-100 p-3">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="app-panel-surface rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Activos</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{medicos.length}</p>
            </div>
            <div className="rounded-2xl bg-emerald-100 p-3">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="app-panel-surface rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Especialidades</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{especialidadesUnicas}</p>
            </div>
            <div className="rounded-2xl bg-violet-100 p-3">
              <Stethoscope className="h-5 w-5 text-violet-600" />
            </div>
          </div>
        </div>

        <div className="app-panel-surface rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Con cedula</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{conCedula}</p>
            </div>
            <div className="rounded-2xl bg-amber-100 p-3">
              <BadgeCheck className="h-5 w-5 text-amber-600" />
            </div>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="rounded-[2rem] border border-gray-200 bg-white p-10 shadow-sm">
          <div className="flex items-center justify-center gap-3 text-gray-600">
            <Loader2 className="h-5 w-5 animate-spin" />
            Cargando medicos...
          </div>
        </div>
      ) : medicos.length === 0 ? (
        <div className="rounded-[2rem] border border-gray-200 bg-white p-10 text-center text-gray-600 shadow-sm">
          No hay medicos registrados.
        </div>
      ) : (
        <>
          <div className="hidden overflow-visible rounded-[2rem] border border-gray-200 bg-white shadow-sm 2xl:block">
            <div className="grid grid-cols-[2fr_1.35fr_1fr_1.4fr_0.9fr_auto] gap-4 border-b border-gray-200 bg-gray-50 px-6 py-4 text-sm font-semibold text-gray-700">
              <div>Medico</div>
              <div>Especialidad</div>
              <div>Cedula</div>
              <div>Contacto</div>
              <div>Estatus</div>
              <div className="text-right">Acciones</div>
            </div>

            <div className="divide-y divide-gray-200">
              {medicos.map((medico) => (
                <div
                  key={medico.id}
                  className="grid grid-cols-[2fr_1.35fr_1fr_1.4fr_0.9fr_auto] items-start gap-4 px-6 py-5 transition-colors hover:bg-gray-50"
                >
                  <div className="min-w-0">
                    <h3 className="break-words text-sm font-semibold text-gray-900">{buildFullName(medico)}</h3>
                    <p className="mt-1 text-xs text-gray-500">ID {medico.id}</p>
                  </div>

                  <div>
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getEspecialidadColor(medico.especialidad)}`}
                    >
                      {medico.especialidad}
                    </span>
                  </div>

                  <div>
                    <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 font-mono text-xs font-semibold text-gray-700">
                      {medico.cedula}
                    </span>
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="truncate">{medico.telefono}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="truncate">{medico.email}</span>
                    </div>
                  </div>

                  <div>
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getEstatusColor(medico.estatus)}`}
                    >
                      {medico.estatus}
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
              itemLabel="medicos"
              onPageChange={setPage}
              onLimitChange={(nextLimit) => {
                setLimit(nextLimit);
                setPage(1);
              }}
            />
          </div>

          <div className="grid gap-4 2xl:hidden xl:grid-cols-2">
            {medicos.map((medico) => (
              <div
                key={medico.id}
                className="app-panel-surface rounded-3xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                      ID {medico.id}
                    </p>
                    <h3 className="mt-3 text-sm font-semibold text-gray-900">{buildFullName(medico)}</h3>
                  </div>

                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getEstatusColor(medico.estatus)}`}
                  >
                    {medico.estatus}
                  </span>
                </div>

                <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Especialidad</p>
                    <p className="mt-1 font-semibold text-gray-900">{medico.especialidad}</p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Cedula</p>
                    <p className="mt-1 font-mono font-semibold text-gray-900">{medico.cedula}</p>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{medico.telefono}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="truncate">{medico.email}</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
                  <div
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getEspecialidadColor(medico.especialidad)}`}
                  >
                    {medico.especialidad}
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
              itemLabel="medicos"
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
        <AddDoctorModal setOpen={setOpenAddModal} addDoctor={addDoctor} isSaving={saving} />
      ) : null}
    </div>
  );
}
