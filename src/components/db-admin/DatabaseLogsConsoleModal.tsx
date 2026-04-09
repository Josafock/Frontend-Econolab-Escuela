"use client";

import {
  Database,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

type ConsoleEntryLevel = "info" | "warn" | "error" | "success";
type ConsoleEntryCategory = "summary" | "query" | "lock" | "backup" | "statement" | "system";
type ConsoleEntry = {
  id: string;
  occurredAt: string;
  level: ConsoleEntryLevel;
  source: string;
  category: ConsoleEntryCategory;
  title: string;
  message: string;
  context: string | null;
  commandText: string | null;
};

type MonitoringLogsResponse = {
  ok: boolean;
  checkedAt: string;
  summary: {
    activeSessions: number;
    waitingSessions: number;
    blockedSessions: number;
    longRunningSessions: number;
    backupJobsTracked: number;
    failedBackupJobs: number;
    topStatementsTracked: number;
  };
  capabilities: {
    liveActivity: boolean;
    lockInspection: boolean;
    backupHistory: boolean;
    queryFrequencyExtensionInstalled: boolean;
    queryFrequencyRanking: boolean;
    serverLogFiles: boolean;
  };
  logging: {
    loggingCollector: string;
    logStatement: string;
    logMinDurationStatement: string;
    pgStatStatementsVersion: string | null;
  };
  activeSessions: Array<{
    pid: number;
    user: string;
    applicationName: string;
    clientAddress: string;
    state: string;
    waitEventType: string | null;
    waitEvent: string | null;
    backendType: string;
    queryStart: string | null;
    stateChange: string | null;
    queryDurationMs: number;
    queryPreview: string;
    queryText: string;
  }>;
  blockedSessions: Array<{
    blockedPid: number;
    blockedUser: string;
    blockedState: string;
    blockedWaitEventType: string | null;
    blockedWaitEvent: string | null;
    blockedDurationMs: number;
    blockedQueryPreview: string;
    blockedQueryText: string;
    blockingPid: number;
    blockingUser: string;
    blockingState: string;
    blockingQueryPreview: string;
    blockingQueryText: string;
  }>;
  topStatements: Array<{
    id: string;
    calls: number;
    totalExecTimeMs: number;
    meanExecTimeMs: number;
    rows: number;
    sharedHits: number;
    sharedReads: number;
    tempWritten: number;
    queryPreview: string;
    queryText: string;
  }>;
  backupJobs: Array<{
    id: string;
    type: "database" | "table";
    source: "manual" | "automatic";
    status: "queued" | "running" | "completed" | "failed";
    createdAt: string;
    startedAt: string | null;
    finishedAt: string | null;
    durationMs: number | null;
    fileName: string | null;
    tableName: string | null;
    error: string | null;
  }>;
  notes: string[];
  consoleEntries: ConsoleEntry[];
};

function formatDateTime(value?: string | null) {
  if (!value) return "Sin registro";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("es-MX");
}

function formatShortTime(value?: string | null) {
  if (!value) return "--:--:--";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleTimeString("es-MX");
}

function getMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object") {
    const candidate = payload as { errors?: unknown; message?: unknown };
    if (Array.isArray(candidate.errors) && typeof candidate.errors[0] === "string") return candidate.errors[0];
    if (typeof candidate.message === "string") return candidate.message;
  }
  return fallback;
}

function getLevelTextColor(level: ConsoleEntryLevel) {
  if (level === "success") return "text-emerald-300";
  if (level === "warn") return "text-amber-300";
  if (level === "error") return "text-rose-300";
  return "text-sky-300";
}

export default function DatabaseLogsConsoleModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<MonitoringLogsResponse | null>(null);

  const loadLogs = async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    const res = await fetch("/api/db-admin/monitoring/logs", {
      method: "GET",
      cache: "no-store",
    });
    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      const message = getMessage(json, "No se pudo cargar la consola de actividad.");
      toast.error(message);
      setRefreshing(false);
      setLoading(false);
      return;
    }

    setData(json as MonitoringLogsResponse);
    setRefreshing(false);
    setLoading(false);
  };

  useEffect(() => {
    if (!open) return;
    void loadLogs();
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const timer = window.setInterval(() => {
      void loadLogs(true);
    }, 15_000);
    return () => window.clearInterval(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 px-3 py-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[95vh] w-full max-w-7xl flex-col overflow-hidden rounded-[30px] border border-slate-700 bg-[linear-gradient(180deg,#111827_0%,#020617_100%)] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-slate-800 bg-[#020617] px-5 py-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">
                <Database className="h-4 w-4" />
                Consola Tecnica PostgreSQL
              </div>
              <p className="mt-2 text-sm text-slate-400">
                Vista continua tipo terminal. Se refresca cada 15 segundos y muestra todo el flujo disponible.
              </p>
              <p className="mt-2 font-mono text-xs text-slate-500">
                {data
                  ? `snapshot=${formatDateTime(data.checkedAt)} sessions=${data.summary.activeSessions} locks=${data.summary.blockedSessions} backups=${data.summary.backupJobsTracked}`
                  : "snapshot=pending"}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void loadLogs(true)}
                disabled={loading || refreshing}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-emerald-400/30 hover:bg-slate-800 disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                {refreshing ? "Actualizando..." : "Refrescar"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
                Cerrar
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto bg-[#020617] px-5 py-5">
          {loading && !data ? (
            <div className="flex min-h-[70vh] items-center justify-center gap-3 font-mono text-emerald-300">
              <Loader2 className="h-5 w-5 animate-spin" />
              Inicializando consola...
            </div>
          ) : data ? (
            <div className="rounded-[28px] border border-slate-800 bg-black shadow-sm">
              <div className="border-b border-slate-800 px-4 py-3 font-mono text-xs text-slate-500">
                Microsoft Windows [Version Econolab.DB.Monitor]
                <br />
                (c) Econolab AdminDB. Todos los derechos reservados.
              </div>

              <div className="max-h-[72vh] overflow-y-auto px-4 py-4 font-mono text-[13px] leading-6 text-emerald-300">
                <div className="text-slate-500">C:\Users\AdminDB&gt; monitor-db --live --all</div>
                <div className="mb-4 text-sky-300">
                  Snapshot cargado {formatDateTime(data.checkedAt)} | refresh=15s | output=full-stream
                </div>

                {data.notes.map((note, index) => (
                  <div key={`${note}-${index}`} className="mb-2 text-amber-300">
                    REM {note}
                  </div>
                ))}

                <div className="mt-4 space-y-5">
                  {data.consoleEntries.map((entry, index) => (
                    <div key={entry.id} className="whitespace-pre-wrap break-words">
                      <div className="text-slate-500">
                        {String(index + 1).padStart(3, "0")} [{formatShortTime(entry.occurredAt)}] {entry.source}:{entry.category}
                      </div>
                      <div className={getLevelTextColor(entry.level)}>
                        {entry.level.toUpperCase()} &gt; {entry.title}
                      </div>
                      <div className="text-slate-100">{entry.message}</div>
                      {entry.context ? <div className="text-slate-500"># {entry.context}</div> : null}
                      {entry.commandText ? (
                        <pre className="mt-1 whitespace-pre-wrap break-words text-emerald-300">{`PSQL> ${entry.commandText}`}</pre>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[40vh] items-center justify-center font-mono text-slate-400">
              No hay datos para mostrar.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
