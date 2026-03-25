"use client";

import { getDbTopics, type DbTopic } from "@/actions/db-admin/dbAdminActions";
import DatabaseMonitoringSection from "@/components/db-admin/DatabaseMonitoringSection";
import OperationProgressOverlay from "@/components/ui/OperationProgressOverlay";
import {
  Activity,
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  CircleDashed,
  Database,
  FolderSync,
  HardDriveDownload,
  ListChecks,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Table2,
  TimerReset,
  Wrench,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

type TopicStatus = "planned" | "partial" | "implemented";
type BackupJobStatus = "queued" | "running" | "completed" | "failed";
type AutomationFrequencyPreset = "daily" | "every_3_days" | "weekly" | "custom";
type AdminTabId = "automatizacion" | "backups" | "monitorizacion" | "diagnostico";

type BackupItem = {
  name: string;
  size: number;
  createdAt: string;
  artifactType?: "file" | "directory";
};

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

type TabOption = {
  id: AdminTabId;
  title: string;
  description: string;
  icon: ReactNode;
};

const statusLabel: Record<TopicStatus, string> = {
  planned: "Planeado",
  partial: "Parcial",
  implemented: "Implementado",
};

const statusColor: Record<TopicStatus, string> = {
  planned: "border-slate-300 bg-slate-100 text-slate-700",
  partial: "border-amber-300 bg-amber-100 text-amber-800",
  implemented: "border-emerald-300 bg-emerald-100 text-emerald-800",
};

const jobStatusLabel: Record<BackupJobStatus, string> = {
  queued: "En cola",
  running: "En proceso",
  completed: "Exitoso",
  failed: "Fallido",
};

const jobStatusColor: Record<BackupJobStatus, string> = {
  queued: "border-amber-200 bg-amber-50 text-amber-800",
  running: "border-sky-200 bg-sky-50 text-sky-800",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-800",
  failed: "border-red-200 bg-red-50 text-red-800",
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
  if (intervalDays === 1) return "Cada día";
  return `Cada ${intervalDays} días`;
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
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString("es-MX");
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

function prettifyKey(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\w/, (char) => char.toUpperCase());
}

function formatTopicDataValue(value: unknown): string {
  if (value == null) return "Sin dato";
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (typeof value === "number") {
    return new Intl.NumberFormat("es-MX", { maximumFractionDigits: 2 }).format(value);
  }
  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime()) && value.includes("T")) {
      return formatDate(value);
    }
    return value;
  }
  if (Array.isArray(value)) {
    return value.length === 0 ? "Sin elementos" : `${value.length} elementos`;
  }
  if (typeof value === "object") {
    return `${Object.keys(value as Record<string, unknown>).length} campos`;
  }
  return String(value);
}

function getTopicHighlights(data: unknown) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return [];

  return Object.entries(data as Record<string, unknown>)
    .slice(0, 6)
    .map(([key, value]) => ({
      label: prettifyKey(key),
      value: formatTopicDataValue(value),
    }));
}

function getJobStatusIcon(status: BackupJobStatus) {
  if (status === "completed") return <CheckCircle2 className="h-5 w-5" />;
  if (status === "failed") return <AlertTriangle className="h-5 w-5" />;
  if (status === "running") return <RefreshCw className="h-5 w-5 animate-spin" />;
  return <CircleDashed className="h-5 w-5" />;
}

function TabButton({
  tab,
  active,
  onSelect,
}: {
  tab: TabOption;
  active: boolean;
  onSelect: (tabId: AdminTabId) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(tab.id)}
      className={`rounded-[22px] border p-4 text-left transition-colors ${
        active
          ? "border-red-200 bg-red-50 text-red-900"
          : "border-gray-200 bg-gray-50 text-gray-700 hover:border-red-200 hover:bg-red-50/60"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`rounded-2xl p-3 ${active ? "bg-white text-red-700" : "bg-white text-gray-600"}`}>
          {tab.icon}
        </div>
        <div>
          <p className="text-sm font-semibold">{tab.title}</p>
          <p className="mt-1 text-xs leading-5 text-gray-600">{tab.description}</p>
        </div>
      </div>
    </button>
  );
}

export default function DatabaseBackupsAdminSection() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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
  const [sessionExpired, setSessionExpired] = useState(false);
  const loadedTabsRef = useRef<Record<AdminTabId, boolean>>({
    automatizacion: false,
    backups: false,
    monitorizacion: false,
    diagnostico: false,
  });
  const authFailureRef = useRef(false);

  const hasActiveJobs = jobs.some((job) => job.status === "queued" || job.status === "running");
  const shouldPollAutomation = Boolean(automation?.enabled);
  const lastDatabaseJob = jobs[0] ?? null;
  const lastSuccessfulDatabaseJob = jobs.find((job) => job.status === "completed") ?? null;
  const totalArtifacts = backups.length + tableBackups.length;

  const tabs: TabOption[] = [
    {
      id: "automatizacion",
      title: "Automatización",
      description: "Programación de respaldos y registro de ejecuciones.",
      icon: <CalendarClock className="h-5 w-5" />,
    },
    {
      id: "backups",
      title: "Backups",
      description: "Respaldos completos, restauración y copias por tabla.",
      icon: <FolderSync className="h-5 w-5" />,
    },
    {
      id: "monitorizacion",
      title: "Monitorización",
      description: "Indicadores técnicos de rendimiento y almacenamiento.",
      icon: <Activity className="h-5 w-5" />,
    },
    {
      id: "diagnostico",
      title: "Diagnóstico",
      description: "Estado funcional del módulo y datos de soporte.",
      icon: <ShieldCheck className="h-5 w-5" />,
    },
  ];

  const currentTabParam = searchParams.get("tab");
  const activeTab: AdminTabId = tabs.some((tab) => tab.id === currentTabParam)
    ? (currentTabParam as AdminTabId)
    : "automatizacion";

  // Carga diferida por pestaña para evitar ráfagas de peticiones al entrar al módulo.
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

  const stopLoading = () => {
    setLoading(false);
    setLoadingBackups(false);
    setLoadingTableBackups(false);
    setLoadingTables(false);
    setLoadingJobs(false);
    setLoadingAutomation(false);
  };

  const handleUnauthorized = (message?: string) => {
    if (authFailureRef.current) return;
    authFailureRef.current = true;
    setSessionExpired(true);
    stopLoading();
    toast.error(message ?? "Tu sesión expiró. Inicia sesión nuevamente.");
    router.replace("/auth/login");
  };

  const loadTopics = async () => {
    if (authFailureRef.current) return;
    setLoading(true);
    const response = await getDbTopics();
    if (!response.ok) {
      const message = response.errors[0] ?? "No se pudo cargar el módulo de base de datos.";
      if (/sesion expiro|inicia sesion/i.test(message)) {
        handleUnauthorized(message);
        return;
      }
      toast.error(message);
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
    if (authFailureRef.current) return;
    if (!silent) setLoadingBackups(true);
    const res = await fetch("/api/db-admin/backups/list", { method: "GET", cache: "no-store" });
    const json = await res.json().catch(() => ([]));

    if (!res.ok) {
      if (res.status === 401) {
        handleUnauthorized(getMessage(json, "Tu sesión expiró. Inicia sesión nuevamente."));
        return;
      }
      if (!silent) toast.error(getMessage(json, "No se pudieron cargar los respaldos."));
      setBackups([]);
      setLoadingBackups(false);
      return;
    }

    setBackups(Array.isArray(json) ? (json as BackupItem[]) : []);
    setLoadingBackups(false);
  };

  const loadTableBackups = async (silent = false) => {
    if (authFailureRef.current) return;
    if (!silent) setLoadingTableBackups(true);
    const res = await fetch("/api/db-admin/backups/table/list", { method: "GET", cache: "no-store" });
    const json = await res.json().catch(() => ([]));

    if (!res.ok) {
      if (res.status === 401) {
        handleUnauthorized(getMessage(json, "Tu sesión expiró. Inicia sesión nuevamente."));
        return;
      }
      if (!silent) toast.error(getMessage(json, "No se pudieron cargar los respaldos por tabla."));
      setTableBackups([]);
      setLoadingTableBackups(false);
      return;
    }

    setTableBackups(Array.isArray(json) ? (json as BackupItem[]) : []);
    setLoadingTableBackups(false);
  };

  const loadTables = async () => {
    if (authFailureRef.current) return;
    setLoadingTables(true);
    const res = await fetch("/api/db-admin/tables", { method: "GET", cache: "no-store" });
    const json = (await res.json().catch(() => ({}))) as { tables?: Array<{ qualifiedName?: string } | string> };

    if (!res.ok) {
      if (res.status === 401) {
        handleUnauthorized(getMessage(json, "Tu sesión expiró. Inicia sesión nuevamente."));
        return;
      }
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
    if ((!selectedTable || !values.includes(selectedTable)) && values.length > 0) {
      setSelectedTable(values[0]);
    }
    setLoadingTables(false);
  };

  const loadJobs = async (silent = false) => {
    if (authFailureRef.current) return;
    if (!silent) setLoadingJobs(true);
    const res = await fetch("/api/db-admin/backups/jobs", { method: "GET", cache: "no-store" });
    const json = await res.json().catch(() => ([]));

    if (!res.ok) {
      if (res.status === 401) {
        handleUnauthorized(getMessage(json, "Tu sesión expiró. Inicia sesión nuevamente."));
        return;
      }
      if (!silent) toast.error(getMessage(json, "No se pudo cargar el historial de respaldos."));
      setJobs([]);
      setLoadingJobs(false);
      return;
    }

    setJobs(Array.isArray(json) ? (json as BackupJob[]) : []);
    setLoadingJobs(false);
  };

  const loadAutomation = async (silent = false) => {
    if (authFailureRef.current) return;
    if (!silent) setLoadingAutomation(true);
    const res = await fetch("/api/db-admin/backups/automation", { method: "GET", cache: "no-store" });
    const json = await res.json().catch(() => null);

    if (!res.ok || !json) {
      if (res.status === 401) {
        handleUnauthorized(getMessage(json, "Tu sesión expiró. Inicia sesión nuevamente."));
        return;
      }
      if (!silent) toast.error(getMessage(json, "No se pudo cargar la configuración automática."));
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

  // Mientras exista una ejecución activa, solo refrescamos la información de la pestaña visible.
  useEffect(() => {
    if (authFailureRef.current || loadedTabsRef.current[activeTab]) return;

    loadedTabsRef.current[activeTab] = true;

    if (activeTab === "automatizacion") {
      void loadJobs();
      void loadAutomation();
      return;
    }

    if (activeTab === "backups") {
      void loadBackups();
      void loadTableBackups();
      void loadTables();
      return;
    }

    if (activeTab === "diagnostico") {
      void loadTopics();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // La vista de automatización solo refresca su resumen cuando esa pestaña está activa.
  useEffect(() => {
    if (sessionExpired || !hasActiveJobs) return undefined;
    const timer = window.setInterval(() => {
      if (activeTab === "backups") {
        void loadJobs(true);
        void loadBackups(true);
        void loadTableBackups(true);
        return;
      }

      void loadJobs(true);
      void loadAutomation(true);
    }, 4000);
    return () => window.clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, hasActiveJobs, sessionExpired]);

  useEffect(() => {
    if (sessionExpired || !shouldPollAutomation || hasActiveJobs) return undefined;
    const timer = window.setInterval(() => {
      if (activeTab !== "automatizacion") return;
      void loadAutomation(true);
      void loadJobs(true);
    }, 30000);
    return () => window.clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, hasActiveJobs, sessionExpired, shouldPollAutomation]);

  const handleSelectTab = (tab: AdminTabId) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "automatizacion") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const handleCreateBackup = async () => {
    startOperation("Generando respaldo", "Se está enviando el respaldo completo a la cola de ejecución.");
    setCreatingBackup(true);
    const res = await fetch("/api/db-admin/backups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      toast.error(getMessage(json, "No se pudo generar el respaldo."));
      setCreatingBackup(false);
      finishOperation();
      return;
    }

    toast.success(getMessage(json, "Respaldo enviado correctamente."));
    await loadJobs();
    await loadAutomation();
    setCreatingBackup(false);
    finishOperation();
  };

  const handleCreateTableBackup = async () => {
    if (!selectedTable) {
      toast.error("Seleccione una tabla.");
      return;
    }

    startOperation("Generando respaldo", `Se está enviando el respaldo de ${selectedTable} a la cola de ejecución.`);
    setCreatingTableBackup(true);
    const res = await fetch("/api/db-admin/backups/table", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tableName: selectedTable }),
    });
    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      toast.error(getMessage(json, "No se pudo generar el respaldo por tabla."));
      setCreatingTableBackup(false);
      finishOperation();
      return;
    }

    toast.success(getMessage(json, "Respaldo por tabla enviado correctamente."));
    await loadJobs();
    setCreatingTableBackup(false);
    finishOperation();
  };

  const handleRestoreBackup = async (fileName: string) => {
    const confirmed = window.confirm(`Se restaurará la base de datos con el archivo ${fileName}. ¿Desea continuar?`);
    if (!confirmed) return;

    startOperation("Restaurando respaldo", "La restauración está en proceso.");
    setRestoringBackup(fileName);
    const res = await fetch("/api/db-admin/backups/restore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName }),
    });
    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      toast.error(getMessage(json, "No se pudo restaurar el respaldo."));
      setRestoringBackup("");
      finishOperation();
      return;
    }

    toast.success(getMessage(json, "Restauración ejecutada correctamente."));
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
      toast.error(getMessage(json, "No se pudo actualizar la configuración."));
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

    toast.success(getMessage(json, "Configuración actualizada."));
    setSavingAutomation(false);
  };

  if (sessionExpired) {
    return (
      <div className="rounded-[28px] border border-gray-200 bg-white p-8 text-sm text-gray-600 shadow-sm">
        Redirigiendo al acceso del sistema...
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      <section className="overflow-hidden rounded-[28px] border border-red-100 bg-white shadow-sm">
        <div className="bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.22),_transparent_34%),linear-gradient(135deg,#991b1b_0%,#dc2626_55%,#fb923c_100%)] px-6 py-8 text-white">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-red-50">
                <Database className="h-3.5 w-3.5" />
                Administración de Base de Datos
              </div>
              <h1 className="mt-4 text-3xl font-bold">{moduleName || "Administración de Base de Datos"}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-red-50/95">
                Panel administrativo para respaldos, monitorización, seguridad y diagnóstico del entorno de base de datos.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:min-w-[420px]">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-red-100">Automatización</p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {loadingAutomation ? "Cargando..." : automation?.enabled ? "Habilitada" : "Deshabilitada"}
                </p>
                <p className="mt-1 text-xs text-red-100">Próxima ejecución: {formatDate(automation?.nextRunAt)}</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-red-100">Respaldos</p>
                <p className="mt-2 text-lg font-semibold text-white">{totalArtifacts}</p>
                <p className="mt-1 text-xs text-red-100">
                  {backups.length} completos y {tableBackups.length} por tabla
                </p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-red-100">Último respaldo</p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {lastDatabaseJob ? jobStatusLabel[lastDatabaseJob.status] : "Sin registro"}
                </p>
                <p className="mt-1 text-xs text-red-100">{formatDate(lastDatabaseJob?.createdAt)}</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-red-100">Última revisión</p>
                <p className="mt-2 text-lg font-semibold text-white">{formatDate(checkedAt)}</p>
                <p className="mt-1 text-xs text-red-100">Cola activa: {automation?.activeQueueItems ?? 0}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <nav className="rounded-[24px] border border-gray-200 bg-white p-3 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {tabs.map((tab) => (
            <TabButton key={tab.id} tab={tab} active={activeTab === tab.id} onSelect={handleSelectTab} />
          ))}
        </div>
      </nav>

      {activeTab === "automatizacion" ? (
        <section className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-[24px] border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.16em] text-gray-500">Modo automático</p>
              <p className="mt-3 text-2xl font-bold text-gray-900">
                {loadingAutomation ? "..." : automation?.enabled ? "Activo" : "Inactivo"}
              </p>
              <p className="mt-2 text-sm text-gray-600">{loadingAutomation ? "Cargando..." : formatFrequency(automation?.intervalDays ?? 1)}</p>
            </div>
            <div className="rounded-[24px] border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.16em] text-gray-500">Ejecuciones exitosas</p>
              <p className="mt-3 text-2xl font-bold text-gray-900">
                {jobs.filter((job) => job.status === "completed").length}
              </p>
              <p className="mt-2 text-sm text-gray-600">Último cierre correcto: {formatDate(lastSuccessfulDatabaseJob?.finishedAt)}</p>
            </div>
            <div className="rounded-[24px] border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.16em] text-gray-500">Incidencias</p>
              <p className="mt-3 text-2xl font-bold text-gray-900">
                {jobs.filter((job) => job.status === "failed").length}
              </p>
              <p className="mt-2 text-sm text-gray-600">Último error: {formatDate(automation?.lastFailedAt)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_1fr]">
            <section className="flex min-h-[560px] flex-col rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm md:h-[720px]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-red-700">
                    <CalendarClock className="h-3.5 w-3.5" />
                    Automatización
                  </div>
                  <h2 className="mt-4 text-xl font-semibold text-gray-900">Configuración de respaldos automáticos</h2>
                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    Configure horario, frecuencia, retención y concurrencia para las ejecuciones automáticas.
                  </p>
                </div>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  Zona horaria: <span className="font-semibold">{automation?.timeZone ?? "Sin dato"}</span>
                </div>
              </div>

              {loadingAutomation ? (
                <div className="mt-6 flex items-center gap-3 text-sm text-gray-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cargando configuración...
                </div>
              ) : (
                <>
                  <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <label className="rounded-2xl border border-gray-200 p-4 text-sm">
                      <span className="block font-semibold text-gray-900">Habilitar</span>
                      <span className="mt-1 block text-gray-600">Activa la programación automática de respaldos completos.</span>
                      <input
                        type="checkbox"
                        checked={automationForm.enabled}
                        onChange={(e) => setAutomationForm((current) => ({ ...current, enabled: e.target.checked }))}
                        className="mt-4 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                    </label>
                    <label className="rounded-2xl border border-gray-200 p-4 text-sm">
                      <span className="block font-semibold text-gray-900">Hora</span>
                      <input
                        type="time"
                        value={automationForm.time}
                        onChange={(e) => setAutomationForm((current) => ({ ...current, time: e.target.value }))}
                        className="mt-4 w-full rounded-xl border border-gray-300 px-3 py-2"
                      />
                    </label>
                    <label className="rounded-2xl border border-gray-200 p-4 text-sm">
                      <span className="block font-semibold text-gray-900">Frecuencia</span>
                      <select
                        value={automationForm.frequencyPreset}
                        onChange={(e) => {
                          const nextPreset = e.target.value as AutomationFrequencyPreset;
                          setAutomationForm((current) => ({
                            ...current,
                            frequencyPreset: nextPreset,
                            intervalDays:
                              nextPreset === "daily" ? 1 : nextPreset === "every_3_days" ? 3 : nextPreset === "weekly" ? 7 : current.intervalDays,
                          }));
                        }}
                        className="mt-4 w-full rounded-xl border border-gray-300 px-3 py-2"
                      >
                        <option value="daily">Cada día</option>
                        <option value="every_3_days">Cada 3 días</option>
                        <option value="weekly">Cada 7 días</option>
                        <option value="custom">Personalizado</option>
                      </select>
                    </label>
                    <label className="rounded-2xl border border-gray-200 p-4 text-sm">
                      <span className="block font-semibold text-gray-900">Intervalo</span>
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
                        className="mt-4 w-full rounded-xl border border-gray-300 px-3 py-2 disabled:bg-gray-100"
                      />
                    </label>
                    <label className="rounded-2xl border border-gray-200 p-4 text-sm">
                      <span className="block font-semibold text-gray-900">Retención</span>
                      <select
                        value={automationForm.retentionDays}
                        onChange={(e) => setAutomationForm((current) => ({ ...current, retentionDays: Number(e.target.value) }))}
                        className="mt-4 w-full rounded-xl border border-gray-300 px-3 py-2"
                      >
                        {[3, 7, 14, 21, 30].map((days) => (
                          <option key={days} value={days}>
                            {days} días
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="rounded-2xl border border-gray-200 p-4 text-sm">
                      <span className="block font-semibold text-gray-900">Procesos paralelos</span>
                      <select
                        value={automationForm.parallelJobs}
                        onChange={(e) => setAutomationForm((current) => ({ ...current, parallelJobs: Number(e.target.value) }))}
                        className="mt-4 w-full rounded-xl border border-gray-300 px-3 py-2"
                      >
                        {[1, 2, 3, 4].map((value) => (
                          <option key={value} value={value}>
                            {value} proceso{value > 1 ? "s" : ""}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="mt-6 rounded-[24px] border border-gray-200 bg-gray-50 p-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-gray-500">Próxima ejecución</p>
                        <p className="mt-2 font-semibold text-gray-900">{formatDate(automation?.nextRunAt)}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-gray-500">Último intento</p>
                        <p className="mt-2 font-semibold text-gray-900">{formatDate(automation?.lastTriggeredAt)}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-gray-500">Último completado</p>
                        <p className="mt-2 font-semibold text-gray-900">{formatDate(automation?.lastCompletedAt)}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-gray-500">Cola activa</p>
                        <p className="mt-2 font-semibold text-gray-900">{automation?.activeQueueItems ?? 0}</p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                      <p className="text-sm text-gray-600">La configuración se aplica al calendario automático de respaldos.</p>
                      <button
                        type="button"
                        onClick={handleSaveAutomation}
                        disabled={savingAutomation}
                        className="rounded-xl border border-red-500 px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-600 hover:text-white disabled:opacity-50"
                      >
                        {savingAutomation ? "Guardando..." : "Guardar configuración"}
                      </button>
                    </div>
                  </div>

                  {automation?.lastError ? (
                    <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                      <p className="font-semibold">Último error registrado</p>
                      <p className="mt-1">{automation.lastError}</p>
                    </div>
                  ) : null}
                </>
              )}
            </section>

            <section className="flex h-[620px] flex-col overflow-hidden rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm md:h-[720px]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-red-700">
                    <ListChecks className="h-3.5 w-3.5" />
                    Registro de ejecuciones
                  </div>
                  <h2 className="mt-4 text-xl font-semibold text-gray-900">Historial de respaldos</h2>
                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    Consulte la fecha, el resultado y la duración de cada respaldo ejecutado, ya sea completo o por tabla.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void loadJobs()}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <RefreshCw className="h-4 w-4" />
                  Actualizar
                </button>
              </div>

              <div className="mt-6 min-h-0 flex-1 space-y-4 overflow-y-auto pr-2">
                {loadingJobs ? (
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cargando historial...
                  </div>
                ) : jobs.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-600">
                    No hay ejecuciones registradas.
                  </div>
                ) : (
                  jobs.map((job) => (
                    <article key={job.id} className="min-h-[188px] rounded-2xl border border-gray-200 bg-gray-50/80 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className={`rounded-2xl p-3 ${jobStatusColor[job.status]}`}>{getJobStatusIcon(job.status)}</div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-gray-900">
                                {job.source === "automatic" ? "Ejecución automática" : "Ejecución manual"}
                              </p>
                              <span className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700">
                                {job.type === "database" ? "Base completa" : "Por tabla"}
                              </span>
                              <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${jobStatusColor[job.status]}`}>
                                {jobStatusLabel[job.status]}
                              </span>
                            </div>
                            <p className="mt-2 text-sm text-gray-600">
                              {job.fileName ?? "Sin archivo generado"}{job.error ? ` • ${job.error}` : ""}
                            </p>
                            {job.type === "table" && job.tableName ? (
                              <p className="mt-1 text-xs text-gray-500">Tabla: {job.tableName}</p>
                            ) : null}
                          </div>
                        </div>
                        <div className="text-right text-sm text-gray-600">
                          <p className="text-xs uppercase tracking-[0.16em] text-gray-500">Duración</p>
                          <p className="mt-2 font-semibold text-gray-900">{formatDuration(job.durationMs)}</p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div className="rounded-2xl border border-gray-200 bg-white p-3 text-sm">
                          <p className="text-xs uppercase tracking-[0.16em] text-gray-500">Creado</p>
                          <p className="mt-2 font-semibold text-gray-900">{formatDate(job.createdAt)}</p>
                        </div>
                        <div className="rounded-2xl border border-gray-200 bg-white p-3 text-sm">
                          <p className="text-xs uppercase tracking-[0.16em] text-gray-500">Inicio</p>
                          <p className="mt-2 font-semibold text-gray-900">{formatDate(job.startedAt)}</p>
                        </div>
                        <div className="rounded-2xl border border-gray-200 bg-white p-3 text-sm">
                          <p className="text-xs uppercase tracking-[0.16em] text-gray-500">Finalización</p>
                          <p className="mt-2 font-semibold text-gray-900">{formatDate(job.finishedAt)}</p>
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          </div>
        </section>
      ) : null}

      {activeTab === "backups" ? (
        <section className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-[24px] border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.16em] text-gray-500">Respaldos completos</p>
              <p className="mt-3 text-2xl font-bold text-gray-900">{backups.length}</p>
              <p className="mt-2 text-sm text-gray-600">Archivos disponibles para restauración.</p>
            </div>
            <div className="rounded-[24px] border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.16em] text-gray-500">Respaldos por tabla</p>
              <p className="mt-3 text-2xl font-bold text-gray-900">{tableBackups.length}</p>
              <p className="mt-2 text-sm text-gray-600">Copias individuales por tabla.</p>
            </div>
            <div className="rounded-[24px] border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.16em] text-gray-500">Tabla seleccionada</p>
              <p className="mt-3 text-lg font-bold text-gray-900">{selectedTable || "Sin selección"}</p>
              <p className="mt-2 text-sm text-gray-600">Lista disponible: {loadingTables ? "Cargando..." : `${tables.length} tablas`}</p>
            </div>
          </div>

          <section className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-red-700">
                  <HardDriveDownload className="h-3.5 w-3.5" />
                  Respaldo completo
                </div>
                <h2 className="mt-4 text-xl font-semibold text-gray-900">Generación y restauración</h2>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Administre los archivos de respaldo completos y ejecute restauraciones cuando sea necesario.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCreateBackup}
                disabled={creatingBackup}
                className="rounded-xl border border-red-500 px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-600 hover:text-white disabled:opacity-50"
              >
                {creatingBackup ? "Procesando..." : "Generar respaldo"}
              </button>
            </div>

            <div className="mt-6">
              {loadingBackups ? (
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cargando respaldos...
                </div>
              ) : backups.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-600">
                  No hay respaldos completos disponibles.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-[24px] border border-gray-200">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Archivo</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Tipo</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Tamaño</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Fecha</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {backups.map((backup) => (
                        <tr key={backup.name}>
                          <td className="px-4 py-3 font-mono text-xs text-gray-800">{backup.name}</td>
                          <td className="px-4 py-3 text-gray-700">
                            {backup.artifactType === "directory" ? "Directorio" : "Archivo"}
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

          <section className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-red-700">
                  <Table2 className="h-3.5 w-3.5" />
                  Respaldo por tabla
                </div>
                <h2 className="mt-4 text-xl font-semibold text-gray-900">Copias individuales</h2>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Genere respaldos específicos por tabla para tareas de soporte y revisión puntual.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <select
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                  disabled={loadingTables || creatingTableBackup}
                  className="min-w-[260px] rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm disabled:bg-gray-100"
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
                  className="rounded-xl border border-red-500 px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-600 hover:text-white disabled:opacity-50"
                >
                  {creatingTableBackup ? "Procesando..." : "Generar respaldo"}
                </button>
              </div>
            </div>

            <div className="mt-6">
              {loadingTableBackups ? (
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cargando respaldos por tabla...
                </div>
              ) : tableBackups.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-600">
                  No hay respaldos por tabla disponibles.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-[24px] border border-gray-200">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Archivo</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Tamaño</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Fecha</th>
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
        </section>
      ) : null}

      {activeTab === "monitorizacion" ? (
        <section className="space-y-6">
          <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
            <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-red-700">
              <Activity className="h-3.5 w-3.5" />
              Monitorización
            </div>
            <h2 className="mt-4 text-2xl font-semibold text-gray-900">Monitorización de la base de datos</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
              Consulte métricas de rendimiento, índices, almacenamiento y mantenimiento interno del motor de base de datos.
            </p>
          </div>

          <DatabaseMonitoringSection />
        </section>
      ) : null}

      {activeTab === "diagnostico" ? (
        <section className="space-y-6">
          <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-red-700">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Diagnóstico
                </div>
                <h2 className="mt-4 text-2xl font-semibold text-gray-900">Estado del módulo administrativo</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
                  Resumen de funciones implementadas, pendientes y datos técnicos disponibles para soporte.
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                Última revisión: <span className="font-semibold">{formatDate(checkedAt)}</span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 rounded-[28px] border border-gray-200 bg-white p-8 text-gray-600 shadow-sm">
              <Loader2 className="h-5 w-5 animate-spin" />
              Cargando diagnóstico...
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              {topics.map((topic) => {
                const highlights = getTopicHighlights(topic.data);

                return (
                  <section key={topic.id} className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-red-700">
                          <Wrench className="h-3.5 w-3.5" />
                          {topic.id.replace(/_/g, " ")}
                        </div>
                        <h3 className="mt-4 text-lg font-semibold text-gray-900">{topic.title}</h3>
                      </div>
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusColor[topic.status as TopicStatus]}`}>
                        {statusLabel[topic.status as TopicStatus]}
                      </span>
                    </div>

                    <p className="mt-4 text-sm leading-6 text-gray-700">{topic.summary}</p>

                    {highlights.length > 0 ? (
                      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
                        {highlights.map((item) => (
                          <div key={`${topic.id}-${item.label}`} className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm">
                            <p className="text-xs uppercase tracking-[0.16em] text-gray-500">{item.label}</p>
                            <p className="mt-2 font-semibold text-gray-900">{item.value}</p>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
                          <CheckCircle2 className="h-4 w-4" />
                          Implementado
                        </div>
                        {topic.implemented.length === 0 ? (
                          <p className="mt-3 text-sm text-emerald-800">Sin registros.</p>
                        ) : (
                          <ul className="mt-3 space-y-2 text-sm text-emerald-900">
                            {topic.implemented.map((item) => (
                              <li key={item} className="rounded-xl bg-white/80 px-3 py-2">
                                {item}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
                          <TimerReset className="h-4 w-4" />
                          Pendiente
                        </div>
                        {topic.pending.length === 0 ? (
                          <p className="mt-3 text-sm text-amber-800">Sin pendientes.</p>
                        ) : (
                          <ul className="mt-3 space-y-2 text-sm text-amber-900">
                            {topic.pending.map((item) => (
                              <li key={item} className="rounded-xl bg-white/80 px-3 py-2">
                                {item}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>

                    {topic.recommendation ? (
                      <div className="mt-5 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
                        <p className="font-semibold">Recomendación</p>
                        <p className="mt-1">{topic.recommendation}</p>
                      </div>
                    ) : null}
                  </section>
                );
              })}
            </div>
          )}
        </section>
      ) : null}

      <OperationProgressOverlay
        open={operationOpen}
        title={operationTitle}
        description={operationDescription}
        progress={operationProgress}
      />
    </div>
  );
}
