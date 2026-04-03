'use client';

import { useState } from 'react';
import { BadgeCheck, Loader2, Mail, Phone, Stethoscope, User, UserPlus, X } from 'lucide-react';
import type { CreateDoctorPayload } from '@/actions/doctors/doctorsActions';

interface AddDoctorModalProps {
  setOpen: (open: boolean) => void;
  addDoctor: (payload: CreateDoctorPayload) => Promise<void>;
  isSaving: boolean;
}

const inputWithIconClass =
  'w-full rounded-2xl border border-gray-200 bg-white px-11 py-3 text-sm text-gray-900 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20';

export default function AddDoctorModal({ setOpen, addDoctor, isSaving }: AddDoctorModalProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    specialty: '',
    licenseNumber: '',
    phone: '',
    email: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      alert('Nombre y apellido paterno son obligatorios.');
      return;
    }

    await addDoctor({
      firstName: formData.firstName.trim().toUpperCase(),
      lastName: formData.lastName.trim().toUpperCase(),
      middleName: formData.middleName.trim().toUpperCase() || undefined,
      specialty: formData.specialty.trim() || undefined,
      licenseNumber: formData.licenseNumber.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      email: formData.email.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl overflow-hidden rounded-[2rem] border border-white/20 bg-white shadow-2xl">
        <div className="grid max-h-[90vh] overflow-y-auto lg:grid-cols-[0.95fr_1.05fr]">
          <aside className="bg-gradient-to-br from-slate-950 via-slate-900 to-red-700 p-6 text-white lg:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-red-100">
                  <UserPlus className="h-3.5 w-3.5" />
                  Nuevo medico
                </div>
                <h2 className="mt-4 text-2xl font-semibold">Alta de medico</h2>
                <p className="mt-3 text-sm leading-6 text-red-50/90">
                  El formulario conserva el flujo actual, pero ahora comparte el mismo acabado visual y jerarquia del frontend avanzado.
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
                <p className="text-xs uppercase tracking-[0.22em] text-red-100">Enfoque</p>
                <div className="mt-4 grid gap-3 text-sm text-white/90">
                  <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">Datos personales y apellido base</div>
                  <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">Especialidad y cedula profesional</div>
                  <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">Telefono y correo opcionales</div>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-red-100">Importante</p>
                <p className="mt-3 text-sm leading-6 text-white/85">
                  Los nombres siguen guardandose en mayusculas, igual que en el comportamiento original.
                </p>
              </div>
            </div>
          </aside>

          <section className="bg-slate-50 p-6 lg:p-8">
            <div className="mb-6 rounded-[1.75rem] border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Captura</p>
              <p className="mt-2 text-sm text-gray-600">
                Completa el perfil del medico y registra sus datos para dejarlo disponible en servicios.
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid gap-5 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-gray-700">Nombre</span>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input name="firstName" value={formData.firstName} onChange={handleChange} className={inputWithIconClass} />
                  </div>
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-gray-700">Apellido paterno</span>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input name="lastName" value={formData.lastName} onChange={handleChange} className={inputWithIconClass} />
                  </div>
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-gray-700">Apellido materno</span>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input name="middleName" value={formData.middleName} onChange={handleChange} className={inputWithIconClass} />
                  </div>
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-gray-700">Especialidad</span>
                  <div className="relative">
                    <Stethoscope className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input name="specialty" value={formData.specialty} onChange={handleChange} className={inputWithIconClass} />
                  </div>
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-gray-700">Cedula profesional</span>
                  <div className="relative">
                    <BadgeCheck className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input name="licenseNumber" value={formData.licenseNumber} onChange={handleChange} className={inputWithIconClass} />
                  </div>
                </label>
              </div>

              <div className="rounded-[1.75rem] border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Contacto</p>
                <div className="mt-4 grid gap-5 md:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-gray-700">Telefono</span>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input name="phone" value={formData.phone} onChange={handleChange} className={inputWithIconClass} />
                    </div>
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-gray-700">Correo</span>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input name="email" value={formData.email} onChange={handleChange} className={inputWithIconClass} />
                    </div>
                  </label>
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
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  {isSaving ? 'Guardando...' : 'Registrar medico'}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
