"use client";

import { getDbTopics, type DbTopic } from "@/actions/db-admin/dbAdminActions";
import OperationProgressOverlay from "@/components/ui/OperationProgressOverlay";
import { Loader2, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

type TopicStatus = "planned" | "partial" | "implemented";
type BackupItem = {
  name: string;
  size: number;
  createdAt: string;
  artifactType?: "file" | "directory";
};

type BackupJobStatus = "queued" | "running" | "completed" | "failed";
type AutomationFrequencyPreset = "daily" | "every_3_days" | "weekly" | "custom";
type BackupJob = {
  id: string;
  type: "database" | "table";
  source: "manual" | "automatic";
  status: BackupJobStatus;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  durationMs: number | null;
  fileName: string | null;
  tableName: string | null;
  error: string | null;
};

type AutomationState = {
  enabled: boolean;
  time: string;
  intervalDays: number;
  retentionDays: number;
  parallelJobs: number;
  lastTriggeredAt: string | null;
  lastCompletedAt: string | null;
  lastFailedAt: string | null;
  lastError: string | null;
  nextRunAt: string | null;
  timeZone: string;
  activeDatabaseJobId: string | null;
  activeDatabaseJobStatus: BackupJobStatus | null;
  activeQueueItems: number;
};

type AutomationForm = {
  enabled: boolean;
  time: string;
  intervalDays: number;
  frequencyPreset: AutomationFrequencyPreset;
  retentionDays: number;
  parallelJobs: number;
};

const statusLabel: Record<TopicStatus, string> = {
  planned: "Planeado",
  partial: "Parcial",
  implemented: "Implementado",
};

const statusColor: Record<TopicStatus, string> = {
  planned: "bg-gray-100 text-gray-800 border-gray-300",
  partial: "bg-amber-100 text-amber-800 border-amber-300",
  implemented: "bg-green-100 text-green-800 border-green-300",
};

const jobStatusLabel: Record<BackupJobStatus, string> = {
  queued: "En cola",
  running: "En proceso",
  completed: "Completado",
  failed: "Fallido",
};

const jobStatusColor: Record<BackupJobStatus, string> = {
  queued: "bg-amber-100 text-amber-800 border-amber-200",
  running: "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  failed: "bg-red-100 text-red-800 border-red-200",
};

const defaultAutomationForm: AutomationForm = {
  enabled: false,
  time: "02:00",
  intervalDays: 1,
  frequencyPreset: "daily",
  retentionDays: 7,
  parallelJobs: 2,
};

function getFrequencyPreset(intervalDays: number): AutomationFrequencyPreset {
  if (intervalDays === 1) return "daily";
  if (intervalDays === 3) return "every_3_days";
  if (intervalDays === 7) return "weekly";
  return "custom";
}

function formatFrequency(intervalDays: number) {
  if (intervalDays === 1) return "Cada dia";
  return `Cada ${intervalDays} dias`;
}

function getMessage(json: unknown, fallback: string) {
  if (!json || typeof json !== "object") return fallback;
  const candidate = json as { errors?: unknown; message?: unknown };
  if (Array.isArray(candidate.errors) && typeof candidate.errors[0] === "string") {
    return candidate.errors[0];
  }
  return typeof candidate.message === "string" ? candidate.message : fallback;
}

function formatDate(value?: string | null) {
  if (!value) return "Sin registro";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDuration(durationMs: number | null) {
  if (durationMs == null) return "En espera";
  const seconds = Math.max(0, Math.round(durationMs / 1000));
  const minutes = Math.floor(seconds / 60);
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds % 60}s`;
}

export default function DatabaseBackupsAdminSection() {
  const [loading, setLoading] = useState(true);
  const [loadingBackups, setLoadingBackups] = useState(true);
  const [loadingTableBackups, setLoadingTableBackups] = useState(true);
  const [loadingTables, setLoadingTables] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingAutomation, setLoadingAutomation] = useState(true);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [creatingTableBackup, setCreatingTableBackup] = useState(false);
  const [savingAutomation, setSavingAutomation] = useState(false);
  const [restoringBackup, setRestoringBackup] = useState("");
  const [moduleName, setModuleName] = useState("");
  const [checkedAt, setCheckedAt] = useState("");
  const [topics, setTopics] = useState<DbTopic[]>([]);
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [tableBackups, setTableBackups] = useState<BackupItem[]>([]);
  const [jobs, setJobs] = useState<BackupJob[]>([]);
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState("");
  const [automation, setAutomation] = useState<AutomationState | null>(null);
  const [automationForm, setAutomationForm] = useState<AutomationForm>(defaultAutomationForm);
  const [operationTitle, setOperationTitle] = useState("");
  const [operationDescription, setOperationDescription] = useState("");
  const [operationOpen, setOperationOpen] = useState(false);
  const [operationProgress, setOperationProgress] = useState(12);

  const hasActiveJobs = jobs.some((job) => job.status === "queued" || job.status === "running");
  const shouldPollAutomation = Boolean(automation?.enabled);

  useEffect(() => {
    if (!operationOpen) return undefined;
    setOperationProgress(14);
    const timer = window.setInterval(() => {
      setOperationProgress((value) => (value >= 93 ? value : value + Math.max(2, (93 - value) / 5)));
    }, 180);
    return () => window.clearInterval(timer);
  }, [operationOpen]);

  const startOperation = (title: string, description: string) => {
    setOperationTitle(title);
    setOperationDescription(description);
    setOperationOpen(true);
  };

  const finishOperation = () => {
    setOperationProgress(100);
    window.setTimeout(() => {
      setOperationOpen(false);
      setOperationTitle("");
      setOperationDescription("");
    }, 220);
  };

  const loadTopics = async () => {
    setLoading(true);
    const response = await getDbTopics();
    if (!response.ok) {
      toast.error(response.errors[0] ?? "No se pudo cargar el modulo de base de datos.");
      setTopics([]);
      setLoading(false);
      return;
    }
    setModuleName(response.data.module);
    setCheckedAt(response.data.checkedAt);
    setTopics(response.data.topics);
    setLoading(false);
  };

  const loadBackups = async (silent = false) => {
    if (!silent) setLoadingBackups(true);
    const res = await fetch("/api/db-admin/backups/list", { method: "GET", cache: "no-store" });
    const json = await res.json().catch(() => ([]));
    if (!res.ok) {
      if (!silent) toast.error(getMessage(json, "No se pudieron cargar los backups."));
      setBackups([]);
      setLoadingBackups(false);
      return;
    }
    setBackups(Array.isArray(json) ? (json as BackupItem[]) : []);
    setLoadingBackups(false);
  };

  const loadTableBackups = async (silent = false) => {
    if (!silent) setLoadingTableBackups(true);
    const res = await fetch("/api/db-admin/backups/table/list", { method: "GET", cache: "no-store" });
    const json = await res.json().catch(() => ([]));
    if (!res.ok) {
      if (!silent) toast.error(getMessage(json, "No se pudieron cargar los backups de tabla."));
      setTableBackups([]);
      setLoadingTableBackups(false);
      return;
    }
    setTableBackups(Array.isArray(json) ? (json as BackupItem[]) : []);
    setLoadingTableBackups(false);
  };

  const loadTables = async () => {
    setLoadingTables(true);
    const res = await fetch("/api/db-admin/tables", { method: "GET", cache: "no-store" });
    const json = (await res.json().catch(() => ({}))) as { tables?: Array<{ qualifiedName?: string } | string> };
    if (!res.ok) {
      toast.error(getMessage(json, "No se pudieron cargar las tablas."));
      setTables([]);
      setLoadingTables(false);
      return;
    }
    const values = Array.isArray(json.tables)
      ? json.tables
          .map((table) => (typeof table === "string" ? table : table.qualifiedName ?? ""))
          .filter((value) => value.length > 0)
      : [];
    setTables(values);
    if (!selectedTable && values.length > 0) setSelectedTable(values[0]);
    setLoadingTables(false);
  };

  const loadJobs = async (silent = false) => {
    if (!silent) setLoadingJobs(true);
    const res = await fetch("/api/db-admin/backups/jobs", { method: "GET", cache: "no-store" });
    const json = await res.json().catch(() => ([]));
    if (!res.ok) {
      if (!silent) toast.error(getMessage(json, "No se pudieron cargar los jobs de backup."));
      setJobs([]);
      setLoadingJobs(false);
      return;
    }
    setJobs(Array.isArray(json) ? (json as BackupJob[]) : []);
    setLoadingJobs(false);
  };

  const loadAutomation = async (silent = false) => {
    if (!silent) setLoadingAutomation(true);
    const res = await fetch("/api/db-admin/backups/automation", { method: "GET", cache: "no-store" });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json) {
      if (!silent) toast.error(getMessage(json, "No se pudo cargar la automatizacion."));
      setAutomation(null);
      setLoadingAutomation(false);
      return;
    }
    const data = json as AutomationState;
    setAutomation(data);
    if (!silent) {
      setAutomationForm({
        enabled: data.enabled,
        time: data.time,
        intervalDays: data.intervalDays,
        frequencyPreset: getFrequencyPreset(data.intervalDays),
        retentionDays: data.retentionDays,
        parallelJobs: data.parallelJobs,
      });
    }
    setLoadingAutomation(false);
  };

  useEffect(() => {
    void loadTopics();
    void loadBackups();
    void loadTableBackups();
    void loadTables();
    void loadJobs();
    void loadAutomation();
  }, []);

  useEffect(() => {
    if (!hasActiveJobs) return undefined;
    const timer = window.setInterval(() => {
      void loadJobs(true);
      void loadBackups(true);
      void loadTableBackups(true);
      void loadAutomation(true);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [hasActiveJobs]);

  useEffect(() => {
    if (!shouldPollAutomation || hasActiveJobs) return undefined;
    const timer = window.setInterval(() => {
      void loadAutomation(true);
      void loadJobs(true);
      void loadBackups(true);
    }, 30000);
    return () => window.clearInterval(timer);
  }, [hasActiveJobs, shouldPollAutomation]);

  const handleCreateBackup = async () => {
    startOperation("Encolando backup", "Estamos enviando el respaldo completo a la cola optimizada.");
    setCreatingBackup(true);
    const res = await fetch("/api/db-admin/backups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(getMessage(json, "No se pudo generar el backup."));
      setCreatingBackup(false);
      finishOperation();
      return;
    }
    toast.success(getMessage(json, "Backup enviado a la cola correctamente."));
    await loadJobs();
    await loadAutomation();
    setCreatingBackup(false);
    finishOperation();
  };

  const handleCreateTableBackup = async () => {
    if (!selectedTable) {
      toast.error("Selecciona una tabla.");
      return;
    }
    startOperation("Encolando backup de tabla", `Estamos enviando el respaldo de ${selectedTable} a la cola.`);
    setCreatingTableBackup(true);
    const res = await fetch("/api/db-admin/backups/table", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tableName: selectedTable }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(getMessage(json, "No se pudo generar el backup de tabla."));
      setCreatingTableBackup(false);
      finishOperation();
      return;
    }
    toast.success(getMessage(json, "Backup de tabla enviado a la cola."));
    await loadJobs();
    setCreatingTableBackup(false);
    finishOperation();
  };

  const handleRestoreBackup = async (fileName: string) => {
    const ok = window.confirm(`Esta accion restaurara la base de datos con: ${fileName}. Deseas continuar?`);
    if (!ok) return;
    startOperation("Restaurando backup", "Estamos restaurando la base de datos. Este proceso puede tardar unos momentos.");
    setRestoringBackup(fileName);
    const res = await fetch("/api/db-admin/backups/restore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(getMessage(json, "No se pudo restaurar el backup."));
      setRestoringBackup("");
      finishOperation();
      return;
    }
    toast.success(getMessage(json, "Restauracion ejecutada correctamente."));
    setRestoringBackup("");
    finishOperation();
  };

  const handleSaveAutomation = async () => {
    setSavingAutomation(true);
    const res = await fetch("/api/db-admin/backups/automation", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        enabled: automationForm.enabled,
        time: automationForm.time,
        intervalDays: automationForm.intervalDays,
        retentionDays: automationForm.retentionDays,
        parallelJobs: automationForm.parallelJobs,
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(getMessage(json, "No se pudo actualizar la automatizacion."));
      setSavingAutomation(false);
      return;
    }
    const settings = (json as { settings?: AutomationState }).settings;
    if (settings) {
      setAutomation(settings);
      setAutomationForm({
        enabled: settings.enabled,
        time: settings.time,
        intervalDays: settings.intervalDays,
        frequencyPreset: getFrequencyPreset(settings.intervalDays),
        retentionDays: settings.retentionDays,
        parallelJobs: settings.parallelJobs,
      });
    }
    toast.success(getMessage(json, "Automatizacion actualizada."));
    setSavingAutomation(false);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Modulo de Base de Datos</h1>
        <p className="mt-2 text-sm text-gray-600">{moduleName || "Administracion de Base de Datos"}</p>
        {checkedAt ? <p className="mt-1 text-xs text-gray-500">Ultima revision: {new Date(checkedAt).toLocaleString()}</p> : null}
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Automatizacion de backups</h2>
            <p className="mt-1 text-sm text-gray-600">Programa respaldos diarios, cada varios dias o en un intervalo personalizado. Los backups completos vuelven a priorizar el formato .tar y la pantalla se refresca sola para mostrar ejecuciones automaticas.</p>
          </div>
          <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            Cola inteligente y calendario flexible
          </div>
        </div>

        {loadingAutomation ? (
          <div className="mt-5 text-sm text-gray-600">Cargando configuracion...</div>
        ) : (
          <>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
              <label className="rounded-lg border border-gray-200 p-4 text-sm">
                <span className="block font-semibold text-gray-900">Activar</span>
                <span className="mt-1 block text-gray-600">Ejecuta un backup completo automaticamente segun la frecuencia elegida.</span>
                <input type="checkbox" checked={automationForm.enabled} onChange={(e) => setAutomationForm((current) => ({ ...current, enabled: e.target.checked }))} className="mt-4 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500" />
              </label>
              <label className="rounded-lg border border-gray-200 p-4 text-sm">
                <span className="block font-semibold text-gray-900">Hora</span>
                <input type="time" value={automationForm.time} onChange={(e) => setAutomationForm((current) => ({ ...current, time: e.target.value }))} className="mt-4 w-full rounded-lg border border-gray-300 px-3 py-2" />
              </label>
              <label className="rounded-lg border border-gray-200 p-4 text-sm">
                <span className="block font-semibold text-gray-900">Frecuencia</span>
                <select
                  value={automationForm.frequencyPreset}
                  onChange={(e) => {
                    const nextPreset = e.target.value as AutomationFrequencyPreset;
                    setAutomationForm((current) => ({
                      ...current,
                      frequencyPreset: nextPreset,
                      intervalDays:
                        nextPreset === "daily"
                          ? 1
                          : nextPreset === "every_3_days"
                            ? 3
                            : nextPreset === "weekly"
                              ? 7
                              : current.intervalDays,
                    }));
                  }}
                  className="mt-4 w-full rounded-lg border border-gray-300 px-3 py-2"
                >
                  <option value="daily">Cada dia</option>
                  <option value="every_3_days">Cada 3 dias</option>
                  <option value="weekly">Cada 7 dias</option>
                  <option value="custom">Personalizado</option>
                </select>
              </label>
              <label className="rounded-lg border border-gray-200 p-4 text-sm">
                <span className="block font-semibold text-gray-900">Cada cuantos dias</span>
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={automationForm.intervalDays}
                  disabled={automationForm.frequencyPreset !== "custom"}
                  onChange={(e) => {
                    const nextValue = Number(e.target.value);
                    setAutomationForm((current) => ({
                      ...current,
                      intervalDays: Number.isNaN(nextValue) ? current.intervalDays : Math.max(1, Math.min(90, Math.trunc(nextValue))),
                    }));
                  }}
                  className="mt-4 w-full rounded-lg border border-gray-300 px-3 py-2 disabled:bg-gray-100"
                />
                <span className="mt-2 block text-xs text-gray-500">
                  {automationForm.frequencyPreset === "custom" ? "Define tu propio intervalo entre 1 y 90 dias." : "Se activa solo cuando eliges Personalizado."}
                </span>
              </label>
              <label className="rounded-lg border border-gray-200 p-4 text-sm">
                <span className="block font-semibold text-gray-900">Retencion</span>
                <select value={automationForm.retentionDays} onChange={(e) => setAutomationForm((current) => ({ ...current, retentionDays: Number(e.target.value) }))} className="mt-4 w-full rounded-lg border border-gray-300 px-3 py-2">
                  {[3, 7, 14, 21, 30].map((days) => <option key={days} value={days}>{days} dias</option>)}
                </select>
              </label>
              <label className="rounded-lg border border-gray-200 p-4 text-sm">
                <span className="block font-semibold text-gray-900">Procesos paralelos</span>
                <select value={automationForm.parallelJobs} onChange={(e) => setAutomationForm((current) => ({ ...current, parallelJobs: Number(e.target.value) }))} className="mt-4 w-full rounded-lg border border-gray-300 px-3 py-2">
                  {[1, 2, 3, 4].map((value) => <option key={value} value={value}>{value} proceso{value > 1 ? "s" : ""}</option>)}
                </select>
              </label>
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="grid grid-cols-1 gap-3 text-sm text-gray-700 md:grid-cols-2 xl:grid-cols-5">
                <div><span className="block text-xs uppercase tracking-wide text-gray-500">Siguiente ejecucion</span><span className="font-semibold">{formatDate(automation?.nextRunAt)}</span></div>
                <div><span className="block text-xs uppercase tracking-wide text-gray-500">Frecuencia</span><span className="font-semibold">{automation ? formatFrequency(automation.intervalDays) : "Sin dato"}</span></div>
                <div><span className="block text-xs uppercase tracking-wide text-gray-500">Ultimo completado</span><span className="font-semibold">{formatDate(automation?.lastCompletedAt)}</span></div>
                <div><span className="block text-xs uppercase tracking-wide text-gray-500">Cola activa</span><span className="font-semibold">{automation?.activeQueueItems ?? 0}</span></div>
                <div><span className="block text-xs uppercase tracking-wide text-gray-500">Zona horaria</span><span className="font-semibold">{automation?.timeZone ?? "Sin dato"}</span></div>
              </div>
              <button type="button" onClick={handleSaveAutomation} disabled={savingAutomation} className="rounded-lg border border-red-500 px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-600 hover:text-white disabled:opacity-50">
                {savingAutomation ? "Guardando..." : "Guardar automatizacion"}
              </button>
            </div>
            {automation?.lastError ? <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">Ultimo error automatico: {automation.lastError}</p> : null}
          </>
        )}
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Jobs de backup</h2>
            <p className="mt-1 text-sm text-gray-600">
              Aqui puedes ver si el respaldo esta en cola, ejecutandose o ya termino.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadJobs()}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar jobs
          </button>
        </div>

        <div className="mt-5">
          {loadingJobs ? (
            <div className="text-sm text-gray-600">Cargando jobs...</div>
          ) : jobs.length === 0 ? (
            <div className="text-sm text-gray-600">Todavia no hay jobs registrados.</div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Estado</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Origen</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Tipo</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Creado</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Duracion</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Resultado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {jobs.map((job) => (
                    <tr key={job.id}>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${jobStatusColor[job.status]}`}>
                          {jobStatusLabel[job.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{job.source === "automatic" ? "Automatico" : "Manual"}</td>
                      <td className="px-4 py-3 text-gray-700">{job.type === "database" ? "Base completa" : (job.tableName ?? "Tabla")}</td>
                      <td className="px-4 py-3 text-gray-700">{formatDate(job.createdAt)}</td>
                      <td className="px-4 py-3 text-gray-700">{formatDuration(job.durationMs)}</td>
                      <td className="px-4 py-3 text-gray-700">
                        {job.error ? <span className="text-red-700">{job.error}</span> : (job.fileName ?? "Pendiente")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Backups</h2>
            <p className="mt-1 text-sm text-gray-600">
              Los respaldos completos usan la cola optimizada y ahora se guardan en .tar cuando el servidor tiene pg_dump disponible.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCreateBackup}
            disabled={creatingBackup}
            className="rounded-lg border border-red-500 px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-600 hover:text-white disabled:opacity-50"
          >
            {creatingBackup ? "Encolando..." : "Generar backup"}
          </button>
        </div>

        <div className="mt-5">
          {loadingBackups ? (
            <div className="text-sm text-gray-600">Cargando backups...</div>
          ) : backups.length === 0 ? (
            <div className="text-sm text-gray-600">No hay backups disponibles.</div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Artefacto</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Tipo</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Tamano</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Creado</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {backups.map((backup) => (
                    <tr key={backup.name}>
                      <td className="px-4 py-3 font-mono text-xs text-gray-800">{backup.name}</td>
                      <td className="px-4 py-3 text-gray-700">
                        {backup.artifactType === "directory" ? "Directorio optimizado" : "Archivo"}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{formatBytes(backup.size)}</td>
                      <td className="px-4 py-3 text-gray-700">{formatDate(backup.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleRestoreBackup(backup.name)}
                          disabled={restoringBackup === backup.name}
                          className="rounded-lg border border-red-500 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-600 hover:text-white disabled:opacity-50"
                        >
                          {restoringBackup === backup.name ? "Restaurando..." : "Restaurar"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Backups por tabla</h2>
            <p className="mt-1 text-sm text-gray-600">
              Respalda una tabla especifica y deja que el trabajo se procese en la misma cola administrativa.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              disabled={loadingTables || creatingTableBackup}
              className="min-w-[260px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm disabled:bg-gray-100"
            >
              {loadingTables ? (
                <option value="">Cargando tablas...</option>
              ) : tables.length === 0 ? (
                <option value="">Sin tablas disponibles</option>
              ) : (
                tables.map((table) => (
                  <option key={table} value={table}>
                    {table}
                  </option>
                ))
              )}
            </select>
            <button
              type="button"
              onClick={handleCreateTableBackup}
              disabled={creatingTableBackup || loadingTables || tables.length === 0}
              className="rounded-lg border border-red-500 px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-600 hover:text-white disabled:opacity-50"
            >
              {creatingTableBackup ? "Encolando..." : "Generar backup de tabla"}
            </button>
          </div>
        </div>

        <div className="mt-5">
          {loadingTableBackups ? (
            <div className="text-sm text-gray-600">Cargando backups de tabla...</div>
          ) : tableBackups.length === 0 ? (
            <div className="text-sm text-gray-600">No hay backups de tabla disponibles.</div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Archivo</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Tamano</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Creado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {tableBackups.map((backup) => (
                    <tr key={backup.name}>
                      <td className="px-4 py-3 font-mono text-xs text-gray-800">{backup.name}</td>
                      <td className="px-4 py-3 text-gray-700">{formatBytes(backup.size)}</td>
                      <td className="px-4 py-3 text-gray-700">{formatDate(backup.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {loading ? (
        <div className="flex items-center justify-center gap-3 rounded-lg border border-gray-200 bg-white p-8 text-gray-600 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin" />
          Cargando temas del modulo...
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {topics.map((topic) => (
            <section key={topic.id} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-lg font-semibold text-gray-900">{topic.title}</h2>
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
                    statusColor[topic.status as TopicStatus]
                  }`}
                >
                  {statusLabel[topic.status as TopicStatus]}
                </span>
              </div>

              <p className="mt-3 text-sm text-gray-700">{topic.summary}</p>

              <div className="mt-4">
                <h3 className="text-sm font-semibold text-gray-900">Implementado</h3>
                <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-gray-700">
                  {topic.implemented.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="mt-4">
                <h3 className="text-sm font-semibold text-gray-900">Pendiente</h3>
                <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-gray-700">
                  {topic.pending.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              {topic.recommendation ? (
                <p className="mt-4 rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
                  Recomendacion: {topic.recommendation}
                </p>
              ) : null}

              {topic.data ? (
                <div className="mt-4">
                  <h3 className="mb-2 text-sm font-semibold text-gray-900">Datos tecnicos</h3>
                  <pre className="overflow-auto rounded-md bg-gray-900 p-3 text-xs text-gray-100">
                    {JSON.stringify(topic.data, null, 2)}
                  </pre>
                </div>
              ) : null}
            </section>
          ))}
        </div>
      )}

      <OperationProgressOverlay
        open={operationOpen}
        title={operationTitle}
        description={operationDescription}
        progress={operationProgress}
      />
    </div>
  );
}
