'use client';

import { useState } from 'react';
import { Calendar, Loader2, Mail, MapPin, Phone, User, UserPlus, X } from 'lucide-react';
import type { CreatePatientPayload } from '@/actions/patients/patientsActions';

interface AddPatientModalProps {
  setOpen: (open: boolean) => void;
  addPatient: (newPatient: CreatePatientPayload) => Promise<void>;
  isSaving: boolean;
}

const calculateDOBFromAge = (age: number): string => {
  const today = new Date();
  const year = today.getFullYear() - age;
  return `${year}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

const inputClass =
  'w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20';

const inputWithIconClass =
  'w-full rounded-2xl border border-gray-200 bg-white px-11 py-3 text-sm text-gray-900 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20';

export default function AddPatientModal({ setOpen, addPatient, isSaving }: AddPatientModalProps) {
  const [formData, setFormData] = useState({
    nombre: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    edad: '',
    genero: '',
    telefono: '',
    email: '',
    colonia: '',
    ciudad: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const requiredFields = ['nombre', 'apellidoPaterno', 'edad', 'genero'];
    const isFormValid = requiredFields.every((field) => formData[field as keyof typeof formData]);
    const parsedAge = parseInt(formData.edad, 10);

    if (!isFormValid || Number.isNaN(parsedAge) || parsedAge < 0) {
      alert('Completa los datos obligatorios del paciente.');
      return;
    }

    const newPatient: CreatePatientPayload = {
      firstName: formData.nombre.trim().toUpperCase(),
      lastName: formData.apellidoPaterno.trim().toUpperCase(),
      middleName: formData.apellidoMaterno.trim().toUpperCase() || undefined,
      birthDate: calculateDOBFromAge(parsedAge),
      gender: formData.genero as 'female' | 'male' | 'other',
      phone: formData.telefono.trim() || undefined,
      email: formData.email.trim() || undefined,
      addressLine: formData.colonia.trim() || undefined,
      addressCity: formData.ciudad.trim() || undefined,
    };

    await addPatient(newPatient);
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
                  Nuevo registro
                </div>
                <h2 className="mt-4 text-2xl font-semibold">Nuevo paciente</h2>
                <p className="mt-3 text-sm leading-6 text-red-50/90">
                  Usa el mismo estilo del proyecto principal para dar de alta pacientes sin modificar la logica de captura.
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
                <p className="text-xs uppercase tracking-[0.22em] text-red-100">Campos clave</p>
                <div className="mt-4 grid gap-3 text-sm text-white/90">
                  <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">Nombre y apellido paterno</div>
                  <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">Edad y genero para perfil inicial</div>
                  <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">Contacto y ubicacion opcionales</div>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-red-100">Sugerencia</p>
                <p className="mt-3 text-sm leading-6 text-white/85">
                  Los datos se convierten a mayusculas al guardar, igual que en el flujo original.
                </p>
              </div>
            </div>
          </aside>

          <section className="bg-slate-50 p-6 lg:p-8">
            <div className="mb-6 rounded-[1.75rem] border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Captura</p>
              <p className="mt-2 text-sm text-gray-600">
                Completa los datos principales. Los obligatorios se validan antes de enviar.
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid gap-5 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-gray-700">Nombre</span>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleChange}
                      placeholder="Maria"
                      className={inputWithIconClass}
                    />
                  </div>
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-gray-700">Apellido paterno</span>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="apellidoPaterno"
                      value={formData.apellidoPaterno}
                      onChange={handleChange}
                      placeholder="Gonzalez"
                      className={inputWithIconClass}
                    />
                  </div>
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-gray-700">Apellido materno</span>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="apellidoMaterno"
                      value={formData.apellidoMaterno}
                      onChange={handleChange}
                      placeholder="Lopez"
                      className={inputWithIconClass}
                    />
                  </div>
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-gray-700">Edad</span>
                  <div className="relative">
                    <Calendar className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      name="edad"
                      value={formData.edad}
                      onChange={handleChange}
                      placeholder="30"
                      min="0"
                      max="120"
                      className={inputWithIconClass}
                    />
                  </div>
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-gray-700">Genero</span>
                  <select
                    name="genero"
                    value={formData.genero}
                    onChange={handleChange}
                    className={`modal-select ${inputClass}`}
                  >
                    <option value="">Seleccionar genero...</option>
                    <option value="female">Femenino</option>
                    <option value="male">Masculino</option>
                    <option value="other">Otro</option>
                  </select>
                </label>
              </div>

              <div className="rounded-[1.75rem] border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Contacto</p>
                <div className="mt-4 grid gap-5 md:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-gray-700">Telefono</span>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        type="tel"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleChange}
                        placeholder="7711234567"
                        className={inputWithIconClass}
                      />
                    </div>
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-gray-700">Correo electronico</span>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="paciente@ejemplo.com"
                        className={inputWithIconClass}
                      />
                    </div>
                  </label>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Ubicacion</p>
                <div className="mt-4 grid gap-5 md:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-gray-700">Ciudad</span>
                    <div className="relative">
                      <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        name="ciudad"
                        value={formData.ciudad}
                        onChange={handleChange}
                        placeholder="Pachuca"
                        className={inputWithIconClass}
                      />
                    </div>
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-gray-700">Colonia</span>
                    <div className="relative">
                      <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        name="colonia"
                        value={formData.colonia}
                        onChange={handleChange}
                        placeholder="Centro"
                        className={inputWithIconClass}
                      />
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
                  {isSaving ? 'Registrando...' : 'Registrar paciente'}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
