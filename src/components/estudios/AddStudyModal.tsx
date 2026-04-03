'use client';

import { useState } from 'react';
import { AlignLeft, Clock3, DollarSign, Hash, Loader2, Plus, X } from 'lucide-react';
import type { CreateStudyPayload, StudyStatus, StudyType } from '@/actions/studies/studiesActions';

interface AddStudyModalProps {
  setOpen: (open: boolean) => void;
  addStudy: (payload: CreateStudyPayload) => Promise<void>;
  isSaving: boolean;
}

const inputClass =
  'w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20';

const inputWithIconClass =
  'w-full rounded-2xl border border-gray-200 bg-white px-11 py-3 text-sm text-gray-900 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20';

export default function AddStudyModal({ setOpen, addStudy, isSaving }: AddStudyModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    durationMinutes: '60',
    type: 'study' as StudyType,
    normalPrice: '0',
    difPrice: '0',
    specialPrice: '0',
    hospitalPrice: '0',
    otherPrice: '0',
    defaultDiscountPercent: '0',
    status: 'active' as StudyStatus,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.code.trim()) {
      alert('Nombre y clave son obligatorios.');
      return;
    }

    await addStudy({
      name: formData.name.trim().toUpperCase(),
      code: formData.code.trim().toUpperCase(),
      description: formData.description.trim() || undefined,
      durationMinutes: Number(formData.durationMinutes),
      type: formData.type,
      normalPrice: Number(formData.normalPrice),
      difPrice: Number(formData.difPrice),
      specialPrice: Number(formData.specialPrice),
      hospitalPrice: Number(formData.hospitalPrice),
      otherPrice: Number(formData.otherPrice),
      defaultDiscountPercent: Number(formData.defaultDiscountPercent),
      status: formData.status,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/20 bg-white shadow-2xl">
        <div className="grid max-h-[90vh] overflow-y-auto lg:grid-cols-[0.9fr_1.1fr]">
          <aside className="bg-gradient-to-br from-slate-950 via-slate-900 to-red-700 p-6 text-white lg:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-red-100">
                  <Plus className="h-3.5 w-3.5" />
                  Nuevo estudio
                </div>
                <h2 className="mt-4 text-2xl font-semibold">Alta en catalogo</h2>
                <p className="mt-3 text-sm leading-6 text-red-50/90">
                  Se mantiene la misma captura de datos, pero ahora con la presentacion visual del proyecto mas trabajado.
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
                <p className="text-xs uppercase tracking-[0.22em] text-red-100">Incluye</p>
                <div className="mt-4 grid gap-3 text-sm text-white/90">
                  <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">Nombre, clave y duracion del estudio</div>
                  <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">Tipo, estatus y descripcion</div>
                  <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">Matriz completa de precios y descuento</div>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-red-100">Tip</p>
                <p className="mt-3 text-sm leading-6 text-white/85">
                  El nombre y la clave se normalizan en mayusculas al guardar, igual que en el flujo original.
                </p>
              </div>
            </div>
          </aside>

          <section className="bg-slate-50 p-6 lg:p-8">
            <div className="mb-6 rounded-[1.75rem] border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Captura</p>
              <p className="mt-2 text-sm text-gray-600">
                Registra un estudio nuevo y define sus parametros comerciales desde una sola vista.
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="rounded-[1.75rem] border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Datos base</p>
                <div className="mt-4 grid gap-5 md:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-gray-700">Nombre</span>
                    <div className="relative">
                      <AlignLeft className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input name="name" value={formData.name} onChange={handleChange} className={inputWithIconClass} />
                    </div>
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-gray-700">Clave</span>
                    <div className="relative">
                      <Hash className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input name="code" value={formData.code} onChange={handleChange} className={inputWithIconClass} />
                    </div>
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-gray-700">Duracion (min)</span>
                    <div className="relative">
                      <Clock3 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        type="number"
                        min="1"
                        name="durationMinutes"
                        value={formData.durationMinutes}
                        onChange={handleChange}
                        className={inputWithIconClass}
                      />
                    </div>
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-gray-700">Tipo</span>
                    <select name="type" value={formData.type} onChange={handleChange} className={`modal-select ${inputClass}`}>
                      <option value="study">Estudio</option>
                      <option value="package">Paquete</option>
                      <option value="other">Otro</option>
                    </select>
                  </label>

                  <label className="grid gap-2 md:col-span-2">
                    <span className="text-sm font-semibold text-gray-700">Descripcion</span>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={4}
                      className={`${inputClass} resize-none`}
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Precios</p>
                <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {[
                    { name: 'normalPrice', label: 'Precio normal' },
                    { name: 'difPrice', label: 'Precio DIF' },
                    { name: 'specialPrice', label: 'Precio especial' },
                    { name: 'hospitalPrice', label: 'Precio hospital' },
                    { name: 'otherPrice', label: 'Precio otro' },
                    { name: 'defaultDiscountPercent', label: 'Descuento %' },
                  ].map((field) => (
                    <label key={field.name} className="grid gap-2">
                      <span className="text-sm font-semibold text-gray-700">{field.label}</span>
                      <div className="relative">
                        <DollarSign className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          name={field.name}
                          value={formData[field.name as keyof typeof formData]}
                          onChange={handleChange}
                          className={inputWithIconClass}
                        />
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Estado</p>
                <div className="mt-4 grid gap-5 md:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-gray-700">Estatus</span>
                    <select name="status" value={formData.status} onChange={handleChange} className={`modal-select ${inputClass}`}>
                      <option value="active">Activo</option>
                      <option value="suspended">Suspendido</option>
                    </select>
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
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {isSaving ? 'Guardando...' : 'Registrar estudio'}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
