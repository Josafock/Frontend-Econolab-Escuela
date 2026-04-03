'use client';

import {
  Camera,
  CheckCircle2,
  KeyRound,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { useMemo, useState } from 'react';

type ProfileTab = 'general' | 'security';

const inputClass =
  'w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500';

export default function PerfilPage() {
  const [activeTab, setActiveTab] = useState<ProfileTab>('general');
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState({
    nombre: 'Dr. Alejandro Rodriguez',
    email: 'alejandro.rodriguez@clinica.com',
    telefono: '+52 55 1234 5678',
    especialidad: 'Medicina General',
    cedula: '1234567',
    direccion: 'Av. Reforma 123, CDMX',
    fechaNacimiento: '1985-03-15',
    fechaIngreso: '2020-01-10',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const initials = useMemo(
    () =>
      userData.nombre
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join(''),
    [userData.nombre],
  );

  const handleSaveProfile = () => {
    setIsEditing(false);
    console.log('Datos guardados:', userData);
  };

  const handlePasswordChange = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    console.log('Contrasena cambiada');
  };

  return (
    <div className="space-y-6">
      <section className="app-panel-surface rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-slate-900 text-2xl font-semibold text-white shadow-lg shadow-slate-200">
                {initials || 'U'}
              </div>

              {isEditing ? (
                <button
                  type="button"
                  className="absolute -bottom-2 -right-2 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white bg-red-600 text-white shadow-lg shadow-red-600/20 transition-colors hover:bg-red-700"
                >
                  <Camera className="h-4 w-4" />
                </button>
              ) : null}
            </div>

            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Perfil</p>
              <h1 className="mt-1 truncate text-2xl font-semibold text-gray-900">{userData.nombre}</h1>
              <p className="mt-1 truncate text-sm text-gray-500">{userData.email}</p>
              <p className="mt-2 text-xs text-gray-500">Vista visual actualizada para el panel de usuario.</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Rol</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">Administrador</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-emerald-700">Estado</p>
              <div className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800">
                <CheckCircle2 className="h-4 w-4" />
                Cuenta activa
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
        <div className="space-y-6">
          <div className="app-panel-surface rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Panel lateral</p>
            <h2 className="mt-2 text-2xl font-semibold text-gray-900">Acciones de la cuenta</h2>

            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={() => setActiveTab('general')}
                className={`app-tab-button flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left text-sm font-semibold transition-colors ${
                  activeTab === 'general'
                    ? 'border border-red-200 bg-red-50 text-red-700'
                    : 'border border-gray-200 bg-gray-50 text-gray-700 hover:bg-white'
                }`}
              >
                <UserRound className="h-5 w-5" />
                Datos de la cuenta
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('security')}
                className={`app-tab-button flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left text-sm font-semibold transition-colors ${
                  activeTab === 'security'
                    ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border border-gray-200 bg-gray-50 text-gray-700 hover:bg-white'
                }`}
              >
                <KeyRound className="h-5 w-5" />
                Cambiar contrasena
              </button>
            </div>
          </div>

          <div className="app-panel-surface rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Estado</p>
            <h3 className="mt-2 text-xl font-semibold text-gray-900">Cuenta verificada</h3>

            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-700" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-900">Sesion estable</p>
                    <p className="mt-1 text-sm text-emerald-800">
                      Tu cuenta esta lista para seguir operando dentro del panel.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-5 w-5 text-blue-700" />
                  <div>
                    <p className="text-sm font-semibold text-blue-900">Correo principal</p>
                    <p className="mt-1 break-all text-sm text-blue-800">{userData.email}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-start gap-3">
                  <UserRound className="mt-0.5 h-5 w-5 text-gray-700" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Miembro desde</p>
                    <p className="mt-1 text-sm text-gray-600">{userData.fechaIngreso}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="app-panel-surface rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
          {activeTab === 'general' ? (
            <div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Resumen</p>
                  <h2 className="mt-2 text-2xl font-semibold text-gray-900">Informacion principal</h2>
                  <p className="mt-2 text-sm text-gray-600">
                    Actualiza tu informacion con la misma estructura visual del frontend principal.
                  </p>
                </div>

                {!isEditing ? (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="app-action-button rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    Editar perfil
                  </button>
                ) : (
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="app-action-button rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      className="app-action-button inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition-colors hover:bg-red-700"
                    >
                      <Save className="h-4 w-4" />
                      Guardar cambios
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-[1.75rem] border border-gray-200 bg-gray-50 p-5">
                  <div className="grid gap-4">
                    <label className="grid gap-2">
                      <span className="text-sm font-semibold text-gray-700">Nombre visible</span>
                      <input
                        type="text"
                        value={userData.nombre}
                        onChange={(e) => setUserData({ ...userData, nombre: e.target.value })}
                        disabled={!isEditing}
                        className={inputClass}
                      />
                    </label>

                    <label className="grid gap-2">
                      <span className="text-sm font-semibold text-gray-700">Correo de acceso</span>
                      <input
                        type="email"
                        value={userData.email}
                        onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                        disabled={!isEditing}
                        className={inputClass}
                      />
                    </label>

                    <label className="grid gap-2">
                      <span className="text-sm font-semibold text-gray-700">Telefono</span>
                      <input
                        type="tel"
                        value={userData.telefono}
                        onChange={(e) => setUserData({ ...userData, telefono: e.target.value })}
                        disabled={!isEditing}
                        className={inputClass}
                      />
                    </label>

                    <label className="grid gap-2">
                      <span className="text-sm font-semibold text-gray-700">Especialidad</span>
                      <input
                        type="text"
                        value={userData.especialidad}
                        onChange={(e) => setUserData({ ...userData, especialidad: e.target.value })}
                        disabled={!isEditing}
                        className={inputClass}
                      />
                    </label>

                    <label className="grid gap-2">
                      <span className="text-sm font-semibold text-gray-700">Cedula profesional</span>
                      <input
                        type="text"
                        value={userData.cedula}
                        onChange={(e) => setUserData({ ...userData, cedula: e.target.value })}
                        disabled={!isEditing}
                        className={inputClass}
                      />
                    </label>

                    <label className="grid gap-2">
                      <span className="text-sm font-semibold text-gray-700">Direccion</span>
                      <textarea
                        value={userData.direccion}
                        onChange={(e) => setUserData({ ...userData, direccion: e.target.value })}
                        disabled={!isEditing}
                        rows={4}
                        className={`${inputClass} resize-none`}
                      />
                    </label>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="rounded-3xl border border-gray-200 bg-gray-50 p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Rol operativo</p>
                    <p className="mt-3 text-lg font-semibold text-gray-900">Administrador</p>
                  </div>

                  <div className="rounded-3xl border border-gray-200 bg-gray-50 p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Nacimiento</p>
                    <p className="mt-3 text-lg font-semibold text-gray-900">{userData.fechaNacimiento}</p>
                  </div>

                  <div className="rounded-3xl border border-gray-200 bg-gray-50 p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Ingreso</p>
                    <p className="mt-3 text-lg font-semibold text-gray-900">{userData.fechaIngreso}</p>
                  </div>

                  <div className="rounded-3xl border border-gray-200 bg-gray-50 p-5">
                    <div className="flex items-start gap-3">
                      <MapPin className="mt-0.5 h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Ubicacion</p>
                        <p className="mt-3 text-sm font-semibold text-gray-900">{userData.direccion}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-gray-200 bg-gray-50 p-5">
                    <div className="flex items-start gap-3">
                      <Phone className="mt-0.5 h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Contacto</p>
                        <p className="mt-3 text-sm font-semibold text-gray-900">{userData.telefono}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Seguridad</p>
              <h2 className="mt-2 text-2xl font-semibold text-gray-900">Actualiza tu contrasena</h2>
              <p className="mt-2 text-sm text-gray-600">
                Mantiene el flujo actual, pero con una presentacion visual mas clara y consistente.
              </p>

              <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
                <div className="grid gap-4">
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-gray-700">Contrasena actual</span>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className={inputClass}
                      placeholder="Escribe tu contrasena actual"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-gray-700">Nueva contrasena</span>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className={inputClass}
                      placeholder="Minimo 8 caracteres"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-gray-700">Confirmar contrasena</span>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className={inputClass}
                      placeholder="Repite la nueva contrasena"
                    />
                  </label>
                </div>

                <div className="rounded-[1.75rem] border border-gray-200 bg-gray-50 p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Buenas practicas</p>
                  <div className="mt-4 space-y-3 text-sm text-gray-700">
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                      Usa una contrasena unica.
                    </div>
                    <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3">
                      Cambiala con regularidad.
                    </div>
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                      No la compartas con terceros.
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-500">
                  Esta vista solo actualiza el frente visual; el flujo base se mantiene.
                </p>

                <button
                  type="button"
                  onClick={handlePasswordChange}
                  className="app-action-button inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition-colors hover:bg-emerald-700"
                >
                  <KeyRound className="h-4 w-4" />
                  Actualizar contrasena
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
