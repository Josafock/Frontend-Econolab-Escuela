'use client';

import AddPatientModal from '@/components/pacientes/AddPatientModal';
import DataTransferPanel from '@/components/data-transfer/DataTransferPanel';
import PaginationControls from '@/components/ui/PaginationControls';
import {
  createPatient,
  getPatients,
  type CreatePatientPayload,
  type Patient,
} from '@/actions/patients/patientsActions';
import {
  CalendarDays,
  Eye,
  Filter,
  Loader2,
  Mail,
  MapPin,
  PencilLine,
  Phone,
  Plus,
  Search,
  Sparkles,
  Trash2,
  UserRound,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import toast from 'react-hot-toast';

const PATIENT_TEMPLATE_HEADERS = [
  'firstName',
  'lastName',
  'middleName',
  'gender',
  'birthDate',
  'phone',
  'email',
  'addressLine',
  'addressBetween',
  'addressCity',
  'addressState',
  'addressZip',
  'documentType',
  'documentNumber',
];

const PATIENT_EXPORT_FIELDS = [
  { key: 'firstName', label: 'Nombre' },
  { key: 'lastName', label: 'Apellido paterno' },
  { key: 'middleName', label: 'Apellido materno' },
  { key: 'gender', label: 'Genero' },
  { key: 'birthDate', label: 'Fecha de nacimiento' },
  { key: 'phone', label: 'Telefono' },
  { key: 'email', label: 'Correo' },
  { key: 'addressLine', label: 'Direccion' },
  { key: 'addressBetween', label: 'Entre calles' },
  { key: 'addressCity', label: 'Ciudad' },
  { key: 'addressState', label: 'Estado' },
  { key: 'addressZip', label: 'Codigo postal' },
  { key: 'documentType', label: 'Tipo de documento' },
  { key: 'documentNumber', label: 'Numero de documento' },
];

type UiPatient = {
  id: number;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  fechaNacimiento: string;
  genero: 'Femenino' | 'Masculino' | 'Otro';
  telefono: string;
  email: string;
  colonia: string;
  ciudad: string;
  fechaRegistro: string;
};

function toUiPatient(patient: Patient): UiPatient {
  return {
    id: patient.id,
    nombre: (patient.firstName ?? '').toUpperCase(),
    apellidoPaterno: (patient.lastName ?? '').toUpperCase(),
    apellidoMaterno: (patient.middleName ?? '').toUpperCase(),
    fechaNacimiento: patient.birthDate,
    genero:
      patient.gender === 'female'
        ? 'Femenino'
        : patient.gender === 'male'
          ? 'Masculino'
          : 'Otro',
    telefono: patient.phone ?? '-',
    email: patient.email ?? '-',
    colonia: patient.addressLine ?? '-',
    ciudad: patient.addressCity ?? '-',
    fechaRegistro: patient.createdAt ?? '',
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

function formatDate(value: string) {
  if (!value) return 'N/D';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'N/D';
  return parsed.toLocaleDateString('es-MX');
}

function buildFullName(patient: UiPatient) {
  return [patient.nombre, patient.apellidoPaterno, patient.apellidoMaterno].filter(Boolean).join(' ');
}

export default function PacientesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pacientes, setPacientes] = useState<UiPatient[]>([]);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    const response = await getPatients({
      search: searchTerm.trim(),
      page,
      limit,
    });

    if (!response.ok) {
      toast.error(response.errors[0] ?? 'No se pudieron cargar pacientes.');
      setPacientes([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    setPacientes(response.data.data.map(toUiPatient));
    setTotal(response.data.meta.total);
    setLoading(false);
  }, [limit, page, searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchPatients();
    }, 350);
    return () => clearTimeout(timer);
  }, [fetchPatients]);

  const addPatient = async (newPatient: CreatePatientPayload) => {
    setSaving(true);
    const response = await createPatient(newPatient);
    if (!response.ok) {
      toast.error(response.errors[0] ?? 'No se pudo registrar el paciente.');
      setSaving(false);
      return;
    }

    toast.success('Paciente registrado con exito.');
    setOpenAddModal(false);
    await fetchPatients();
    setSaving(false);
  };

  const calcularEdad = (fechaNacimiento: string): number => {
    if (!fechaNacimiento) return 0;
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();

    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }

    return Number.isNaN(edad) ? 0 : edad;
  };

  const promedioEdad = useMemo(() => {
    if (!pacientes.length) return 0;
    return Math.round(pacientes.reduce((acc, p) => acc + calcularEdad(p.fechaNacimiento), 0) / pacientes.length);
  }, [pacientes]);

  const mujeres = useMemo(
    () => pacientes.filter((patient) => patient.genero === 'Femenino').length,
    [pacientes],
  );

  const hombres = useMemo(
    () => pacientes.filter((patient) => patient.genero === 'Masculino').length,
    [pacientes],
  );

  const registrosRecientes = useMemo(() => {
    return pacientes.filter((patient) => {
      if (!patient.fechaRegistro) return false;
      const parsed = new Date(patient.fechaRegistro);
      if (Number.isNaN(parsed.getTime())) return false;
      const diff = Date.now() - parsed.getTime();
      return diff <= 1000 * 60 * 60 * 24 * 30;
    }).length;
  }, [pacientes]);

  const getGeneroColor = (genero: 'Femenino' | 'Masculino' | 'Otro'): string => {
    const colors: Record<string, string> = {
      Femenino: 'border-pink-200 bg-pink-50 text-pink-700',
      Masculino: 'border-blue-200 bg-blue-50 text-blue-700',
      Otro: 'border-gray-200 bg-gray-100 text-gray-700',
    };
    return colors[genero] || 'border-gray-200 bg-gray-100 text-gray-700';
  };

  return (
    <div className="min-w-0">
      <div className="mb-8 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            Base de pacientes
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Pacientes</h1>
          <p className="mt-2 max-w-2xl text-gray-600">
            Conserva una vista clara del padron de pacientes con tarjetas, filtros y acciones rapidas
            del mismo estilo que el frontend principal.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
          <DataTransferPanel
            moduleKey="patients"
            moduleLabel="paciente"
            moduleLabelPlural="Pacientes"
            templateHeaders={PATIENT_TEMPLATE_HEADERS}
            fieldOptions={PATIENT_EXPORT_FIELDS}
            onImported={fetchPatients}
          />
          <button
            type="button"
            onClick={() => setOpenAddModal(true)}
            className="app-action-button inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition-all hover:bg-red-700"
          >
            <Plus size={20} />
            Nuevo paciente
          </button>
        </div>
      </div>

      <section className="app-panel-surface mb-6 overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm">
        <div className="grid gap-6 p-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">
              <Sparkles className="h-3.5 w-3.5 text-red-600" />
              Expedientes
            </div>
            <h2 className="mt-4 text-2xl font-semibold text-slate-900">Control visual de pacientes</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              El modulo mantiene la misma logica actual, pero ahora comparte la jerarquia visual, tarjetas
              suaves y componentes interactivos del proyecto mas avanzado.
            </p>
          </div>

          <div className="rounded-[2rem] border border-slate-900/10 bg-slate-950 p-6 text-white shadow-lg shadow-slate-900/20">
            <p className="text-xs uppercase tracking-[0.25em] text-orange-200">Resumen rapido</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Pacientes en vista</p>
                <p className="mt-2 text-2xl font-semibold text-white">{pacientes.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Alta reciente</p>
                <p className="mt-2 text-2xl font-semibold text-white">{registrosRecientes}</p>
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
                placeholder="Buscar por nombre, telefono o documento..."
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
              <p className="text-sm font-medium text-gray-600">Total pacientes</p>
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
              <p className="text-sm font-medium text-gray-600">Mujeres</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{mujeres}</p>
            </div>
            <div className="rounded-2xl bg-pink-100 p-3">
              <UserRound className="h-5 w-5 text-pink-600" />
            </div>
          </div>
        </div>

        <div className="app-panel-surface rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Hombres</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{hombres}</p>
            </div>
            <div className="rounded-2xl bg-sky-100 p-3">
              <UserRound className="h-5 w-5 text-sky-600" />
            </div>
          </div>
        </div>

        <div className="app-panel-surface rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Edad promedio</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{promedioEdad}</p>
            </div>
            <div className="rounded-2xl bg-emerald-100 p-3">
              <CalendarDays className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="rounded-[2rem] border border-gray-200 bg-white p-10 shadow-sm">
          <div className="flex items-center justify-center gap-3 text-gray-600">
            <Loader2 className="h-5 w-5 animate-spin" />
            Cargando pacientes...
          </div>
        </div>
      ) : pacientes.length === 0 ? (
        <div className="rounded-[2rem] border border-gray-200 bg-white p-10 text-center text-gray-600 shadow-sm">
          No hay pacientes registrados.
        </div>
      ) : (
        <>
          <div className="hidden overflow-visible rounded-[2rem] border border-gray-200 bg-white shadow-sm 2xl:block">
            <div className="grid grid-cols-[2.1fr_0.8fr_1fr_1.5fr_1.4fr_1fr_auto] gap-4 border-b border-gray-200 bg-gray-50 px-6 py-4 text-sm font-semibold text-gray-700">
              <div>Paciente</div>
              <div>Edad</div>
              <div>Genero</div>
              <div>Contacto</div>
              <div>Ubicacion</div>
              <div>Registro</div>
              <div className="text-right">Acciones</div>
            </div>

            <div className="divide-y divide-gray-200">
              {pacientes.map((paciente) => (
                <div
                  key={paciente.id}
                  className="grid grid-cols-[2.1fr_0.8fr_1fr_1.5fr_1.4fr_1fr_auto] items-start gap-4 px-6 py-5 transition-colors hover:bg-gray-50"
                >
                  <div className="min-w-0">
                    <h3 className="break-words text-sm font-semibold text-gray-900">{buildFullName(paciente)}</h3>
                    <p className="mt-1 text-xs text-gray-500">ID {paciente.id}</p>
                  </div>

                  <div>
                    <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                      {calcularEdad(paciente.fechaNacimiento)} anos
                    </span>
                  </div>

                  <div>
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getGeneroColor(paciente.genero)}`}
                    >
                      {paciente.genero}
                    </span>
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="truncate">{paciente.telefono}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="truncate">{paciente.email}</span>
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="truncate">{paciente.colonia}</span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">{paciente.ciudad}</p>
                  </div>

                  <div className="text-sm text-gray-700">{formatDate(paciente.fechaRegistro)}</div>

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
              itemLabel="pacientes"
              onPageChange={setPage}
              onLimitChange={(nextLimit) => {
                setLimit(nextLimit);
                setPage(1);
              }}
            />
          </div>

          <div className="grid gap-4 2xl:hidden xl:grid-cols-2">
            {pacientes.map((paciente) => (
              <div
                key={paciente.id}
                className="app-panel-surface rounded-3xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                      ID {paciente.id}
                    </p>
                    <h3 className="mt-3 text-sm font-semibold text-gray-900">{buildFullName(paciente)}</h3>
                  </div>

                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getGeneroColor(paciente.genero)}`}
                  >
                    {paciente.genero}
                  </span>
                </div>

                <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Edad</p>
                    <p className="mt-1 font-semibold text-gray-900">{calcularEdad(paciente.fechaNacimiento)} anos</p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Registro</p>
                    <p className="mt-1 font-semibold text-gray-900">{formatDate(paciente.fechaRegistro)}</p>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{paciente.telefono}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="truncate">{paciente.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="truncate">
                      {paciente.colonia}, {paciente.ciudad}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
                  <div className="text-xs text-gray-500">Nacimiento: {formatDate(paciente.fechaNacimiento)}</div>
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
              itemLabel="pacientes"
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
        <AddPatientModal setOpen={setOpenAddModal} addPatient={addPatient} isSaving={saving} />
      ) : null}
    </div>
  );
}
