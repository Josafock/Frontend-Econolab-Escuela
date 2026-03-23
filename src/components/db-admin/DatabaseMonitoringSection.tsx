"use client";

import { BarChart3, Database, HardDrive, Loader2, RefreshCw, TimerReset, Waypoints } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

type MonitoringMetricCardProps = {
  title: string;
  value: string;
  helper: string;
  tone: "red" | "amber" | "emerald" | "slate";
  icon: ReactNode;
};

type MonitoringResponse = {
  ok: boolean;
  checkedAt: string;
  database: {
    name: string;
    sizeBytes: number;
    sizePretty: string;
    statsResetAt: string | null;
  };
  overview: {
    tableCount: number;
    indexCount: number;
    commits: number;
    rollbacks: number;
    deadlocks: number;
    tempFiles: number;
    tempBytes: number;
    tempBytesPretty: string;
    cacheHitRatioPct: number;
    totalSeqScans: number;
    totalIdxScans: number;
    indexUsagePct: number;
    totalConnections: number;
    activeConnections: number;
    idleConnections: number;
    waitingSessions: number;
    longRunningQueries: number;
    maxConnections: number;
    connectionUtilizationPct: number;
    liveTuples: number;
    deadTuples: number;
  };
  connectionsByState: Array<{
    state: string;
    total: number;
  }>;
  tableAccess: Array<{
    schema: string;
    tableName: string;
    seqScan: number;
    idxScan: number;
    liveTuples: number;
    deadTuples: number;
    indexUsagePct: number;
  }>;
  topIndexes: Array<{
    schema: string;
    tableName: string;
    indexName: string;
    scans: number;
    tuplesRead: number;
    tuplesFetched: number;
    sizeBytes: number;
    sizePretty: string;
  }>;
  storage: Array<{
    schema: string;
    tableName: string;
    totalSizeBytes: number;
    totalSizePretty: string;
    tableSizeBytes: number;
    tableSizePretty: string;
    indexesSizeBytes: number;
    indexesSizePretty: string;
    liveTuples: number;
    deadTuples: number;
  }>;
  maintenance: Array<{
    schema: string;
    tableName: string;
    vacuumCount: number;
    autovacuumCount: number;
    analyzeCount: number;
    autoanalyzeCount: number;
    lastVacuum: string | null;
    lastAutovacuum: string | null;
    lastAnalyze: string | null;
    lastAutoanalyze: string | null;
    deadTuples: number;
    maintenanceNeedPct: number;
  }>;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-MX").format(value);
}

function formatPercent(value: number) {
  return `${value.toFixed(2)}%`;
}

function formatDateTime(value?: string | null) {
  if (!value) return "Sin registro";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString("es-MX");
}

function getMetricTone(value: number, goodThreshold: number, warnThreshold: number): MonitoringMetricCardProps["tone"] {
  if (value >= goodThreshold) return "emerald";
  if (value >= warnThreshold) return "amber";
  return "red";
}

function getInverseMetricTone(value: number, goodThreshold: number, warnThreshold: number): MonitoringMetricCardProps["tone"] {
  if (value <= goodThreshold) return "emerald";
  if (value <= warnThreshold) return "amber";
  return "red";
}

function toneClasses(tone: MonitoringMetricCardProps["tone"]) {
  if (tone === "emerald") {
    return {
      panel: "border-emerald-200 bg-emerald-50/80",
      badge: "bg-emerald-100 text-emerald-700",
    };
  }

  if (tone === "amber") {
    return {
      panel: "border-amber-200 bg-amber-50/80",
      badge: "bg-amber-100 text-amber-700",
    };
  }

  if (tone === "red") {
    return {
      panel: "border-red-200 bg-red-50/80",
      badge: "bg-red-100 text-red-700",
    };
  }

  return {
    panel: "border-slate-200 bg-slate-50/80",
    badge: "bg-slate-100 text-slate-700",
  };
}

function MonitoringMetricCard({ title, value, helper, tone, icon }: MonitoringMetricCardProps) {
  const styles = toneClasses(tone);

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${styles.panel}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">{title}</p>
          <p className="mt-3 text-3xl font-bold text-gray-900">{value}</p>
          <p className="mt-2 text-sm text-gray-600">{helper}</p>
        </div>
        <div className={`rounded-2xl p-3 ${styles.badge}`}>{icon}</div>
      </div>
    </div>
  );
}

function HorizontalBar({
  label,
  value,
  helper,
  color = "from-red-600 via-red-500 to-orange-400",
}: {
  label: string;
  value: number;
  helper: string;
  color?: string;
}) {
  const safeValue = Math.max(0, Math.min(100, value));

  return (
    <div className="space-y-2 rounded-2xl border border-gray-200 bg-white/90 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900">{label}</p>
          <p className="text-xs text-gray-500">{helper}</p>
        </div>
        <span className="shrink-0 text-sm font-bold text-gray-900">{formatPercent(safeValue)}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-gray-100">
        <div className={`h-full rounded-full bg-gradient-to-r ${color}`} style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  );
}

export default function DatabaseMonitoringSection() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [monitoring, setMonitoring] = useState<MonitoringResponse | null>(null);

  const loadMonitoring = async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    const res = await fetch("/api/db-admin/monitoring", { method: "GET", cache: "no-store" });
    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      const message =
        Array.isArray(json?.errors) && typeof json.errors[0] === "string"
          ? json.errors[0]
          : typeof json?.message === "string"
            ? json.message
            : "No se pudo cargar la monitorizacion de base de datos.";

      toast.error(message);
      setMonitoring(null);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setMonitoring(json as MonitoringResponse);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    void loadMonitoring();
  }, []);

  if (loading) {
    return (
      <section className="overflow-hidden rounded-[28px] border border-red-100 bg-white shadow-sm">
        <div className="border-b border-red-100 bg-gradient-to-r from-red-600 via-red-500 to-orange-400 px-6 py-6 text-white">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-white/15 p-3">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Monitoreo de base de datos</h2>
              <p className="mt-1 text-sm text-red-50">
                Cargando metricas tecnicas de PostgreSQL para esta instancia.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center gap-3 p-10 text-gray-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          Preparando panel tecnico...
        </div>
      </section>
    );
  }

  if (!monitoring) {
    return (
      <section className="rounded-[28px] border border-red-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Monitoreo de base de datos</h2>
            <p className="mt-2 text-sm text-gray-600">
              No fue posible cargar las metricas tecnicas en este momento.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadMonitoring(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50"
          >
            <RefreshCw className="h-4 w-4" />
            Reintentar
          </button>
        </div>
      </section>
    );
  }

  const indexTone = getMetricTone(monitoring.overview.indexUsagePct, 70, 45);
  const maintenancePressurePct =
    monitoring.overview.liveTuples === 0
      ? 0
      : (monitoring.overview.deadTuples * 100) / monitoring.overview.liveTuples;
  const maintenanceTone = getInverseMetricTone(
    maintenancePressurePct,
    5,
    12,
  );

  return (
    <section className="overflow-hidden rounded-[28px] border border-red-100 bg-white shadow-sm">
      <div className="border-b border-red-100 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.2),_transparent_35%),linear-gradient(135deg,#b91c1c_0%,#dc2626_45%,#fb923c_100%)] px-6 py-6 text-white">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-red-50">
              <Waypoints className="h-3.5 w-3.5" />
              Monitoreo tecnico
            </div>
            <h2 className="mt-4 text-2xl font-bold">Monitoreo de base de datos</h2>
            <p className="mt-2 text-sm text-red-50/95">
              Indicadores tecnicos de PostgreSQL enfocados en indices, almacenamiento y mantenimiento
              interno de la base.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm">
              <p className="text-red-100">Base actual</p>
              <p className="font-semibold text-white">{monitoring.database.name || "Sin nombre"}</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm">
              <p className="text-red-100">Ultima captura</p>
              <p className="font-semibold text-white">{formatDateTime(monitoring.checkedAt)}</p>
            </div>
            <button
              type="button"
              onClick={() => void loadMonitoring(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white px-4 py-3 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Actualizando..." : "Actualizar metricas"}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-8 bg-[linear-gradient(180deg,rgba(254,242,242,0.55)_0%,rgba(255,255,255,1)_28%)] p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MonitoringMetricCard
            title="Uso de indices"
            value={formatPercent(monitoring.overview.indexUsagePct)}
            helper={`${formatNumber(monitoring.overview.indexCount)} indices detectados`}
            tone={indexTone}
            icon={<Waypoints className="h-5 w-5" />}
          />
          <MonitoringMetricCard
            title="Indices activos"
            value={formatNumber(monitoring.overview.indexCount)}
            helper={`${formatNumber(monitoring.overview.totalIdxScans)} scans sobre indices`}
            tone="slate"
            icon={<BarChart3 className="h-5 w-5" />}
          />
          <MonitoringMetricCard
            title="Tamano total"
            value={monitoring.database.sizePretty}
            helper={`${formatNumber(monitoring.overview.tableCount)} tablas monitoreadas`}
            tone="slate"
            icon={<HardDrive className="h-5 w-5" />}
          />
          <MonitoringMetricCard
            title="Dead tuples"
            value={formatNumber(monitoring.overview.deadTuples)}
            helper="Filas obsoletas pendientes de limpieza interna"
            tone={maintenanceTone}
            icon={<TimerReset className="h-5 w-5" />}
          />
        </div>

        <div className="rounded-[24px] border border-gray-200 bg-white/95 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Resumen tecnico</h3>
              <p className="mt-1 text-sm text-gray-600">
                Una lectura rapida sobre indices y necesidad de mantenimiento.
              </p>
            </div>
            <div className="rounded-2xl bg-red-50 p-3 text-red-600">
              <Database className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <HorizontalBar
              label="Accesos resueltos por indice"
              value={monitoring.overview.indexUsagePct}
              helper={`${formatNumber(monitoring.overview.totalIdxScans)} idx scan vs ${formatNumber(monitoring.overview.totalSeqScans)} seq scan`}
              color="from-red-600 to-orange-400"
            />
            <HorizontalBar
              label="Presion de mantenimiento"
              value={Math.min(100, maintenancePressurePct)}
              helper={`${formatNumber(monitoring.overview.deadTuples)} dead tuples sobre ${formatNumber(monitoring.overview.liveTuples)} live tuples`}
              color="from-rose-500 to-red-400"
            />
            <HorizontalBar
              label="Transacciones revertidas"
              value={
                monitoring.overview.commits + monitoring.overview.rollbacks === 0
                  ? 0
                  : (monitoring.overview.rollbacks * 100) /
                    (monitoring.overview.commits + monitoring.overview.rollbacks)
              }
              helper={`${formatNumber(monitoring.overview.rollbacks)} rollbacks registrados`}
              color="from-amber-500 to-yellow-400"
            />
            <HorizontalBar
              label="Actividad temporal"
              value={Math.min(100, monitoring.overview.tempFiles)}
              helper={`${formatNumber(monitoring.overview.tempFiles)} archivos temporales, ${monitoring.overview.tempBytesPretty}`}
              color="from-slate-600 to-slate-400"
            />
          </div>

          <div className="mt-4 rounded-2xl border border-red-100 bg-red-50/80 p-4 text-sm text-red-900">
            <p className="font-semibold">Reset de estadisticas</p>
            <p className="mt-1">{formatDateTime(monitoring.database.statsResetAt)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div className="rounded-[24px] border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Uso de indices por tabla</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Entre mas alto el porcentaje, mas dependiente es esa tabla de accesos por indice.
                </p>
              </div>
              <div className="rounded-2xl bg-red-50 p-3 text-red-600">
                <Waypoints className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {monitoring.tableAccess.map((table) => (
                <HorizontalBar
                  key={`${table.schema}.${table.tableName}`}
                  label={`${table.schema}.${table.tableName}`}
                  value={table.indexUsagePct}
                  helper={`${formatNumber(table.idxScan)} idx scans, ${formatNumber(table.seqScan)} seq scans`}
                />
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Indices mas usados</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Ranking de indices segun el numero de `idx_scan`.
                </p>
              </div>
              <div className="rounded-2xl bg-red-50 p-3 text-red-600">
                <BarChart3 className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {monitoring.topIndexes.map((index, indexPosition) => {
                const highestScans = monitoring.topIndexes[0]?.scans ?? 0;
                const ratio = highestScans > 0 ? (index.scans / highestScans) * 100 : 0;

                return (
                  <div key={`${index.schema}.${index.indexName}`} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {indexPosition + 1}. {index.indexName}
                        </p>
                        <p className="truncate text-xs text-gray-500">
                          {index.schema}.{index.tableName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">{formatNumber(index.scans)}</p>
                        <p className="text-xs text-gray-500">scans</p>
                      </div>
                    </div>

                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-red-600 to-orange-400"
                        style={{ width: `${Math.max(6, ratio)}%` }}
                      />
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600">
                      <span className="rounded-full bg-white px-2.5 py-1">Tamano {index.sizePretty}</span>
                      <span className="rounded-full bg-white px-2.5 py-1">
                        Tuples read {formatNumber(index.tuplesRead)}
                      </span>
                      <span className="rounded-full bg-white px-2.5 py-1">
                        Tuples fetch {formatNumber(index.tuplesFetched)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Storage por relacion</h3>
              <p className="mt-1 text-sm text-gray-600">
                Tamano total por tabla, peso de indices y distribucion de tuples.
              </p>
            </div>
            <div className="rounded-2xl bg-red-50 p-3 text-red-600">
              <HardDrive className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-5 overflow-x-auto rounded-2xl border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Tabla</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Total</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Heap</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Indices</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Dead tuples</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {monitoring.storage.map((row) => (
                  <tr key={`${row.schema}.${row.tableName}`}>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900">{row.tableName}</div>
                      <div className="text-xs text-gray-500">{row.schema}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{row.totalSizePretty}</td>
                    <td className="px-4 py-3 text-gray-700">{row.tableSizePretty}</td>
                    <td className="px-4 py-3 text-gray-700">{row.indexesSizePretty}</td>
                    <td className="px-4 py-3 text-gray-700">{formatNumber(row.deadTuples)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-[24px] border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Mantenimiento y autovacuum</h3>
              <p className="mt-1 text-sm text-gray-600">
                Tablas con mayor carga de tuples muertos y actividad reciente de vacuum/analyze.
              </p>
            </div>
            <div className={`rounded-2xl p-3 ${toneClasses(maintenanceTone).badge}`}>
              <TimerReset className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-5 overflow-x-auto rounded-2xl border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Tabla</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Dead tuples</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Necesidad</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Autovacuum</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Autoanalyze</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {monitoring.maintenance.map((row) => (
                  <tr key={`${row.schema}.${row.tableName}`}>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900">{row.tableName}</div>
                      <div className="text-xs text-gray-500">{row.schema}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{formatNumber(row.deadTuples)}</td>
                    <td className="px-4 py-3">
                      <div className="flex min-w-[160px] items-center gap-3">
                        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-red-600 to-orange-400"
                            style={{ width: `${Math.max(4, Math.min(100, row.maintenanceNeedPct))}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-gray-700">
                          {formatPercent(row.maintenanceNeedPct)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      <div>{formatNumber(row.autovacuumCount)} ejecuciones</div>
                      <div className="text-xs text-gray-500">{formatDateTime(row.lastAutovacuum)}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      <div>{formatNumber(row.autoanalyzeCount)} ejecuciones</div>
                      <div className="text-xs text-gray-500">{formatDateTime(row.lastAutoanalyze)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
