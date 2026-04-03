'use client';

import { useMemo, useState } from 'react';
import { Building, Calendar, DollarSign, Loader2, Search, Stethoscope, Users, X } from 'lucide-react';
import type { Patient } from '@/actions/patients/patientsActions';
import type { Study } from '@/actions/studies/studiesActions';
import type { Doctor } from '@/actions/doctors/doctorsActions';
import Link from 'next/link';

type CreateServiceForm = {
  folio: string;
  patientId: number;
  doctorId?: number;
  studyId: number;
  branchName: string;
  deliveryAt: string;
};

interface AddServiceModalProps {
  setOpen: (open: boolean) => void;
  addService: (newService: CreateServiceForm) => Promise<void>;
  patients: Patient[];
  doctors: Doctor[];
  studies: Study[];
  isSaving: boolean;
}

const branches = [
  { id: 'matriz', name: 'Matriz - Centro' },
  { id: 'movil-1', name: 'Unidad Movil Norte' },
  { id: 'movil-2', name: 'Unidad Movil Sur' },
  { id: 'movil-3', name: 'Unidad Movil Este' },
];

const inputClass =
  'w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20';

const inputWithIconClass =
  'w-full rounded-2xl border border-gray-200 bg-white px-11 py-3 text-sm text-gray-900 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20';

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(value);
}

export default function AddServiceModal({
  setOpen,
  addService,
  patients,
  doctors,
  studies,
  isSaving,
}: AddServiceModalProps) {
  const [folio, setFolio] = useState('');
  const [selectedStudyId, setSelectedStudyId] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');

  const selectedStudy = useMemo(
    () => studies.find((s) => String(s.id) === selectedStudyId),
    [selectedStudyId, studies],
  );

  const selectedPatient = useMemo(
    () => patients.find((patient) => String(patient.id) === selectedPatientId),
    [patients, selectedPatientId],
  );

  const selectedDoctor = useMemo(
    () => doctors.find((doctor) => String(doctor.id) === selectedDoctorId),
    [doctors, selectedDoctorId],
  );

  const selectedBranch = useMemo(
    () => branches.find((branch) => branch.id === selectedBranchId),
    [selectedBranchId],
  );

  const selectedPrice = selectedStudy ? Number(selectedStudy.normalPrice) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!folio || !selectedStudyId || !selectedPatientId || !selectedBranchId || !deliveryDate) {
      alert('Completa los campos obligatorios para agregar el servicio.');
      return;
    }

    const branchName = branches.find((b) => b.id === selectedBranchId)?.name ?? '';

    await addService({
      folio: folio.trim().toUpperCase(),
      patientId: Number(selectedPatientId),
      doctorId: selectedDoctorId ? Number(selectedDoctorId) : undefined,
      studyId: Number(selectedStudyId),
      branchName,
      deliveryAt: `${deliveryDate}T14:00:00.000Z`,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/20 bg-white shadow-2xl">
        <div className="grid max-h-[90vh] overflow-y-auto lg:grid-cols-[0.95fr_1.05fr]">
          <aside className="bg-gradient-to-br from-slate-950 via-slate-900 to-red-700 p-6 text-white lg:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-red-100">
                  <Stethoscope className="h-3.5 w-3.5" />
                  Nuevo servicio
                </div>
                <h2 className="mt-4 text-2xl font-semibold">Alta de servicio</h2>
                <p className="mt-3 text-sm leading-6 text-red-50/90">
                  Replica el estilo del frontend principal sin alterar la logica de alta actual.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/20"
                disabled={isSaving}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-8 space-y-4">
              <div className="rounded-[1.75rem] border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.22em] text-red-100">Resumen en vivo</p>
                <div className="mt-4 space-y-3 text-sm text-white/90">
                  <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-red-100">Estudio</p>
                    <p className="mt-1 font-semibold text-white">{selectedStudy?.name ?? 'Sin seleccionar'}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-red-100">Paciente</p>
                    <p className="mt-1 font-semibold text-white">
                      {selectedPatient
                        ? `${selectedPatient.firstName} ${selectedPatient.lastName} ${selectedPatient.middleName ?? ''}`.trim()
                        : 'Sin seleccionar'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-red-100">Costo estimado</p>
                    <p className="mt-1 font-semibold text-white">{formatMoney(selectedPrice)}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-red-100">Accesos rapidos</p>
                <div className="mt-4 flex flex-col gap-3">
                  <Link
                    onClick={() => setOpen(false)}
                    className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/20"
                    href="/estudios"
                  >
                    Ir a estudios
                  </Link>
                  <Link
                    onClick={() => setOpen(false)}
                    className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/20"
                    href="/pacientes"
                  >
                    Ir a pacientes
                  </Link>
                  <Link
                    onClick={() => setOpen(false)}
                    className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/20"
                    href="/medicos"
                  >
                    Ir a medicos
                  </Link>
                </div>
              </div>
            </div>
          </aside>

          <section className="bg-slate-50 p-6 lg:p-8">
            <div className="mb-6 rounded-[1.75rem] border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Captura</p>
              <p className="mt-2 text-sm text-gray-600">
                Completa folio, estudio, paciente, sucursal y fecha de entrega para crear el servicio.
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="rounded-[1.75rem] border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Datos operativos</p>
                <div className="mt-4 grid gap-5">
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-gray-700">Folio</span>
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        value={folio}
                        onChange={(e) => setFolio(e.target.value)}
                        placeholder="ECO-0001"
                        className={inputWithIconClass}
                      />
                    </div>
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-gray-700">Estudio o analisis</span>
                    <select
                      value={selectedStudyId}
                      onChange={(e) => setSelectedStudyId(e.target.value)}
                      className={`modal-select ${inputClass}`}
                    >
                      <option value="">Seleccionar estudio...</option>
                      {studies.map((study) => (
                        <option key={study.id} value={study.id}>
                          {study.name}
                        </option>
                      ))}
                    </select>
                    <div className="text-right">
                      <Link onClick={() => setOpen(false)} className="text-xs font-semibold text-red-600 hover:underline" href="/estudios">
                        + Crear nuevo estudio
                      </Link>
                    </div>
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-gray-700">Paciente</span>
                    <div className="relative">
                      <Users className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <select
                        value={selectedPatientId}
                        onChange={(e) => setSelectedPatientId(e.target.value)}
                        className={`modal-select ${inputWithIconClass}`}
                      >
                        <option value="">Seleccionar paciente...</option>
                        {patients.map((patient) => (
                          <option key={patient.id} value={patient.id}>
                            {patient.firstName} {patient.lastName} {patient.middleName ?? ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="text-right">
                      <Link onClick={() => setOpen(false)} className="text-xs font-semibold text-red-600 hover:underline" href="/pacientes">
                        + Crear nuevo paciente
                      </Link>
                    </div>
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-gray-700">Doctor (opcional)</span>
                    <div className="relative">
                      <Users className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <select
                        value={selectedDoctorId}
                        onChange={(e) => setSelectedDoctorId(e.target.value)}
                        className={`modal-select ${inputWithIconClass}`}
                      >
                        <option value="">Sin doctor asignado</option>
                        {doctors.map((doctor) => (
                          <option key={doctor.id} value={doctor.id}>
                            {doctor.firstName} {doctor.lastName} {doctor.middleName ?? ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="text-right">
                      <Link onClick={() => setOpen(false)} className="text-xs font-semibold text-red-600 hover:underline" href="/medicos">
                        + Crear nuevo doctor
                      </Link>
                    </div>
                  </label>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Programacion</p>
                <div className="mt-4 grid gap-5 md:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-gray-700">Sucursal</span>
                    <div className="relative">
                      <Building className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <select
                        value={selectedBranchId}
                        onChange={(e) => setSelectedBranchId(e.target.value)}
                        className={`modal-select ${inputWithIconClass}`}
                      >
                        <option value="">Seleccionar sucursal...</option>
                        {branches.map((branch) => (
                          <option key={branch.id} value={branch.id}>
                            {branch.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-gray-700">Fecha de entrega</span>
                    <div className="relative">
                      <Calendar className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        type="date"
                        value={deliveryDate}
                        onChange={(e) => setDeliveryDate(e.target.value)}
                        className={inputWithIconClass}
                      />
                    </div>
                  </label>

                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 md:col-span-2">
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-5 w-5 text-emerald-700" />
                      <div>
                        <p className="text-sm font-semibold text-emerald-900">Costo estimado del servicio</p>
                        <p className="mt-1 text-lg font-bold text-emerald-800">{formatMoney(selectedPrice)}</p>
                        <p className="mt-1 text-xs text-emerald-700">
                          {selectedBranch?.name ?? 'Selecciona una sucursal para completar el resumen.'}
                          {selectedDoctor ? ` Doctor: ${selectedDoctor.firstName} ${selectedDoctor.lastName}` : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="app-action-button rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                  disabled={isSaving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="app-action-button inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Stethoscope className="h-4 w-4" />}
                  {isSaving ? 'Guardando...' : 'Agregar servicio'}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
