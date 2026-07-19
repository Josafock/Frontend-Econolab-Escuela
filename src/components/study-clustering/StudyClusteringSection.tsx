"use client";

import {
  AlertTriangle,
  BarChart3,
  Boxes,
  BrainCircuit,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Database,
  FlaskConical,
  Gauge,
  Layers3,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  Target,
} from "lucide-react";
import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import SortableTableHeader from "@/components/ui/SortableTableHeader";
import TablePagination from "@/components/ui/TablePagination";
import type { SortDirection } from "@/lib/table/sort";

type CategorySummary = {
  value: string;
  count: number;
  percentage: number;
};

type ClusterAverages = {
  price: number;
  deliveryHours: number;
  parameterCount: number;
  requestCount: number;
};

type ClusterProfile = {
  cluster: number;
  label: string;
  studyCount: number;
  percentage: number;
  outlierCount: number;
  outlierThreshold: number | null;
  averages: ClusterAverages;
  specialProcessingPercentage: number;
  sampleTypes: CategorySummary[];
  analysisMethods: CategorySummary[];
  traits: string[];
};

type ClusteredStudy = {
  studyId: number;
  code: string;
  name: string;
  cluster: number;
  distanceToCentroid: number;
  outlierScore: number;
  isOutlier: boolean;
  isSynthetic: boolean;
  values: {
    price: number;
    deliveryHours: number;
    parameterCount: number;
    requestCount: number;
    sampleType: string;
    analysisMethod: string;
    requiresSpecialProcessing: boolean;
  };
};

type ClusterEvaluation = {
  k: number;
  inertia: number;
  silhouette: number;
  iterations: number;
  minimumClusterSize: number;
  stableForAutomaticSelection: boolean;
  isElbow: boolean;
  isSelected: boolean;
};

type StudyClusteringAnalysis = {
  generatedAt: string;
  period: {
    months: number;
    from: string;
    to: string;
  };
  sources: Record<string, string>;
  model: {
    algorithm: "kmeans";
    version: string;
    selectedK: number;
    elbowK: number;
    selectionMethod: "requested_by_user" | "highest_silhouette";
    silhouetteScore: number;
    inertia: number;
    trainingSamples: number;
    featureNames: string[];
    displayOnlyFields: string[];
  };
  evaluations: ClusterEvaluation[];
  profiles: ClusterProfile[];
  studies: ClusteredStudy[];
  dataQuality: {
    receivedRows: number;
    usableRows: number;
    excludedRows: number;
    duplicateRows: number;
    imputedValues: Record<string, number>;
    winsorizedValues?: Record<string, number>;
    winsorizationPercentiles?: { lower: number; upper: number };
    ignoredConstantFeatures: string[];
  };
  warnings: string[];
};

type AnalysisControls = {
  periodMonths: string;
  maxK: string;
  kMode: "automatic" | "manual";
  requestedK: string;
  includeSynthetic: boolean;
};

type ComparisonMetric = keyof ClusterAverages;
type StudySortKey =
  | "study"
  | "cluster"
  | "price"
  | "delivery"
  | "parameters"
  | "requests"
  | "outlier";

const INITIAL_CONTROLS: AnalysisControls = {
  periodMonths: "6",
  maxK: "6",
  kMode: "automatic",
  requestedK: "3",
  includeSynthetic: false,
};

const CLUSTER_COLORS = [
  "#dc2626",
  "#0f172a",
  "#f97316",
  "#7c3aed",
  "#0284c7",
  "#059669",
];

const COMPARISON_METRICS: Array<{
  key: ComparisonMetric;
  label: string;
  shortLabel: string;
}> = [
  { key: "price", label: "Precio promedio", shortLabel: "Precio" },
  { key: "deliveryHours", label: "Entrega promedio", shortLabel: "Entrega" },
  { key: "parameterCount", label: "Parámetros promedio", shortLabel: "Parámetros" },
  { key: "requestCount", label: "Solicitudes promedio", shortLabel: "Demanda" },
];

const PERIOD_OPTIONS = [
  { value: "1", label: "Último mes" },
  { value: "3", label: "Últimos 3 meses" },
  { value: "6", label: "Últimos 6 meses" },
  { value: "12", label: "Últimos 12 meses" },
  { value: "24", label: "Últimos 24 meses" },
];

function getMessage(json: unknown, fallback: string) {
  if (!json || typeof json !== "object") return fallback;
  const candidate = json as { errors?: unknown; message?: unknown };
  if (Array.isArray(candidate.errors) && typeof candidate.errors[0] === "string") {
    return candidate.errors[0];
  }
  return typeof candidate.message === "string" ? candidate.message : fallback;
}

function getClusterColor(cluster: number) {
  return CLUSTER_COLORS[(Math.max(cluster, 1) - 1) % CLUSTER_COLORS.length];
}

function formatNumber(value: number, maximumFractionDigits = 0) {
  return new Intl.NumberFormat("es-MX", {
    maximumFractionDigits,
  }).format(value);
}

function sumRecordValues(values?: Record<string, number>) {
  return Object.values(values ?? {}).reduce((total, value) => total + value, 0);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number, maximumFractionDigits = 1) {
  return `${formatNumber(value, maximumFractionDigits)}%`;
}

function formatDateTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("es-MX", {
    dateStyle: "medium",
    timeZone: "UTC",
  });
}

function formatCategory(value?: string | null) {
  const normalized = (value ?? "").trim().replace(/_/g, " ");
  if (!normalized || normalized.toLowerCase() === "sin especificar") {
    return "Sin especificar";
  }
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function formatComparisonValue(value: number, metric: ComparisonMetric) {
  if (metric === "price") return formatCurrency(value);
  if (metric === "deliveryHours") return `${formatNumber(value, 1)} h`;
  return formatNumber(value, 1);
}

function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`app-panel-surface rounded-[1.75rem] border border-gray-200 bg-white shadow-sm ${className}`}
    >
      {children}
    </section>
  );
}

function MetricCard({
  label,
  value,
  helper,
  icon,
  tone = "slate",
}: {
  label: string;
  value: string;
  helper: string;
  icon: ReactNode;
  tone?: "red" | "slate" | "amber" | "emerald";
}) {
  const toneClasses = {
    red: "bg-red-50 text-red-700",
    slate: "bg-slate-100 text-slate-700",
    amber: "bg-amber-50 text-amber-700",
    emerald: "bg-emerald-50 text-emerald-700",
  }[tone];

  return (
    <Panel className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900">{value}</p>
          <p className="mt-2 text-xs leading-5 text-gray-500">{helper}</p>
        </div>
        <div className={`rounded-2xl p-3 ${toneClasses}`}>{icon}</div>
      </div>
    </Panel>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-5 text-center text-sm text-gray-500">
      {message}
    </div>
  );
}

export default function StudyClusteringSection() {
  const [controls, setControls] = useState<AnalysisControls>(INITIAL_CONTROLS);
  const [analysis, setAnalysis] = useState<StudyClusteringAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comparisonMetric, setComparisonMetric] = useState<ComparisonMetric>("price");
  const [clusterFilter, setClusterFilter] = useState<"all" | number>("all");
  const [outliersOnly, setOutliersOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortState, setSortState] = useState<{
    key: StudySortKey;
    direction: SortDirection;
  }>({ key: "study", direction: "asc" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadAnalysis = useCallback(
    async (requestedControls: AnalysisControls, initial = false) => {
      if (initial) setLoading(true);
      else setRefreshing(true);
      setError(null);

      const params = new URLSearchParams({
        periodMonths: requestedControls.periodMonths,
        maxK: requestedControls.maxK,
        includeSynthetic: String(requestedControls.includeSynthetic),
      });
      if (requestedControls.kMode === "manual") {
        params.set("requestedK", requestedControls.requestedK);
      }

      try {
        const response = await fetch(
          `/api/study-clustering/analysis?${params.toString()}`,
          { method: "GET", cache: "no-store" },
        );
        const json = await response.json().catch(() => null);

        if (!response.ok || !json) {
          const message = getMessage(
            json,
            "No se pudo ejecutar el análisis de clustering.",
          );
          setError(message);
          toast.error(message);
          return;
        }

        setAnalysis(json as StudyClusteringAnalysis);
        setClusterFilter("all");
        setOutliersOnly(false);
        setSearchTerm("");
        setPage(1);
        if (!initial) {
          toast.success("Análisis de clustering actualizado.");
        }
      } catch {
        const message = "No fue posible conectar con el módulo de clustering.";
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadAnalysis(INITIAL_CONTROLS, true);
  }, [loadAnalysis]);

  const profileByCluster = useMemo(
    () => new Map((analysis?.profiles ?? []).map((profile) => [profile.cluster, profile])),
    [analysis?.profiles],
  );

  const filteredStudies = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase("es-MX");
    const matching = (analysis?.studies ?? []).filter((study) => {
      if (clusterFilter !== "all" && study.cluster !== clusterFilter) return false;
      if (outliersOnly && !study.isOutlier) return false;
      if (!normalizedSearch) return true;

      const profile = profileByCluster.get(study.cluster);
      return [
        study.name,
        study.code,
        study.values.sampleType,
        study.values.analysisMethod,
        profile?.label ?? "",
      ].some((value) => value.toLocaleLowerCase("es-MX").includes(normalizedSearch));
    });

    const direction = sortState.direction === "asc" ? 1 : -1;
    return [...matching].sort((left, right) => {
      let result = 0;
      if (sortState.key === "study") {
        result = left.name.localeCompare(right.name, "es", { sensitivity: "base" });
      } else if (sortState.key === "cluster") {
        result = left.cluster - right.cluster;
      } else if (sortState.key === "price") {
        result = left.values.price - right.values.price;
      } else if (sortState.key === "delivery") {
        result = left.values.deliveryHours - right.values.deliveryHours;
      } else if (sortState.key === "parameters") {
        result = left.values.parameterCount - right.values.parameterCount;
      } else if (sortState.key === "requests") {
        result = left.values.requestCount - right.values.requestCount;
      } else {
        result = left.outlierScore - right.outlierScore;
      }
      return result * direction;
    });
  }, [analysis?.studies, clusterFilter, outliersOnly, profileByCluster, searchTerm, sortState]);

  const paginatedStudies = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredStudies.slice(start, start + pageSize);
  }, [filteredStudies, page, pageSize]);

  const comparisonData = useMemo(
    () =>
      (analysis?.profiles ?? []).map((profile) => ({
        cluster: `G${profile.cluster}`,
        clusterNumber: profile.cluster,
        label: profile.label,
        value: profile.averages[comparisonMetric],
      })),
    [analysis?.profiles, comparisonMetric],
  );

  const outlierCount = useMemo(
    () => (analysis?.studies ?? []).filter((study) => study.isOutlier).length,
    [analysis?.studies],
  );

  const selectedComparison = COMPARISON_METRICS.find(
    (metric) => metric.key === comparisonMetric,
  )!;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const maximum = Number(controls.maxK);
    const requested = Number(controls.requestedK);
    if (
      controls.kMode === "manual" &&
      (!Number.isInteger(requested) || requested < 2 || requested > maximum)
    ) {
      toast.error(`El número manual de clusters debe estar entre 2 y ${maximum}.`);
      return;
    }
    void loadAnalysis(controls);
  };

  const toggleSort = (key: StudySortKey) => {
    setSortState((current) => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
    setPage(1);
  };

  if (loading) {
    return (
      <Panel className="overflow-hidden">
        <div className="bg-gradient-to-r from-red-700 via-red-600 to-slate-950 px-6 py-7 text-white">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-white/15 p-3">
              <Boxes className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Clustering de estudios</h1>
              <p className="mt-1 text-sm text-red-50">
                Preparando el dataset y evaluando diferentes cantidades de grupos.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center gap-3 p-12 text-gray-600">
          <Loader2 className="h-5 w-5 animate-spin text-red-600" />
          Ejecutando análisis administrativo...
        </div>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <Panel className="overflow-hidden">
        <div className="bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.2),_transparent_35%),linear-gradient(135deg,#991b1b_0%,#dc2626_48%,#0f172a_100%)] px-6 py-7 text-white">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-red-50">
                <Sparkles className="h-3.5 w-3.5" />
                Analítica administrativa
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight">
                Segmentación operativa de estudios
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-red-50/95">
                Compara precio, entrega, parámetros y demanda para descubrir grupos
                similares dentro del catálogo. Este análisis no crea categorías médicas ni
                emite recomendaciones clínicas.
              </p>
            </div>

            {analysis ? (
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm">
                <p className="text-red-100">Última ejecución</p>
                <p className="mt-1 font-semibold text-white">
                  {formatDateTime(analysis.generatedAt)}
                </p>
              </div>
            ) : null}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-red-50 p-3 text-red-600">
              <SlidersHorizontal className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Configuración del análisis</h2>
              <p className="text-sm text-gray-600">
                La demanda se calcula dentro del periodo seleccionado.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <label className="block text-sm font-medium text-gray-700">
              Periodo de solicitudes
              <select
                value={controls.periodMonths}
                onChange={(event) =>
                  setControls((current) => ({
                    ...current,
                    periodMonths: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              >
                {PERIOD_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-medium text-gray-700">
              Máximo de clusters
              <select
                value={controls.maxK}
                onChange={(event) => {
                  const nextMaximum = Number(event.target.value);
                  setControls((current) => ({
                    ...current,
                    maxK: event.target.value,
                    requestedK:
                      Number(current.requestedK) > nextMaximum
                        ? event.target.value
                        : current.requestedK,
                  }));
                }}
                className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              >
                {[2, 3, 4, 5, 6].map((value) => (
                  <option key={value} value={value}>
                    Evaluar hasta {value}
                  </option>
                ))}
              </select>
            </label>

            <div className="text-sm font-medium text-gray-700">
              Selección de K
              <div className="mt-2 grid grid-cols-2 rounded-xl border border-gray-300 bg-gray-50 p-1">
                {(["automatic", "manual"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() =>
                      setControls((current) => ({ ...current, kMode: mode }))
                    }
                    className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                      controls.kMode === mode
                        ? "bg-white text-red-700 shadow-sm"
                        : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    {mode === "automatic" ? "Automática" : "Manual"}
                  </button>
                ))}
              </div>
            </div>

            <label className="block text-sm font-medium text-gray-700">
              Número manual de clusters
              <select
                value={controls.requestedK}
                disabled={controls.kMode === "automatic"}
                onChange={(event) =>
                  setControls((current) => ({
                    ...current,
                    requestedK: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
              >
                {Array.from({ length: Math.max(Number(controls.maxK) - 1, 1) }, (_, index) => index + 2).map(
                  (value) => (
                    <option key={value} value={value}>
                      {value} clusters
                    </option>
                  ),
                )}
              </select>
            </label>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={refreshing}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-red-600/20 transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {refreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {refreshing ? "Analizando..." : "Ejecutar análisis"}
              </button>
            </div>
          </div>

          <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <input
              type="checkbox"
              checked={controls.includeSynthetic}
              onChange={(event) =>
                setControls((current) => ({
                  ...current,
                  includeSynthetic: event.target.checked,
                }))
              }
              className="mt-0.5 h-4 w-4 accent-red-600"
            />
            <span>
              <span className="block text-sm font-semibold text-amber-900">
                Incluir registros sintéticos de demostración
              </span>
              <span className="mt-1 block text-xs leading-5 text-amber-800">
                Úsalos sólo para pruebas académicas. El análisis operativo debe basarse en
                estudios reales.
              </span>
            </span>
          </label>
        </form>
      </Panel>

      {error ? (
        <div className="flex flex-col gap-4 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-900 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">No se pudo actualizar el análisis</p>
              <p className="mt-1 text-sm">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void loadAnalysis(controls)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
          >
            <RefreshCw className="h-4 w-4" />
            Reintentar
          </button>
        </div>
      ) : null}

      {analysis ? (
        <>
          {analysis.warnings.length > 0 ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <div className="flex items-start gap-3 text-amber-900">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold">Advertencias sobre los datos</p>
                  <ul className="mt-2 space-y-1 text-sm leading-5">
                    {analysis.warnings.map((warning) => (
                      <li key={warning}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : null}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Estudios analizados"
              value={formatNumber(analysis.dataQuality.usableRows)}
              helper={`${formatNumber(analysis.dataQuality.receivedRows)} filas recibidas · ${formatNumber(analysis.dataQuality.excludedRows)} excluidas`}
              icon={<FlaskConical className="h-5 w-5" />}
              tone="slate"
            />
            <MetricCard
              label="Clusters seleccionados"
              value={String(analysis.model.selectedK)}
              helper={
                analysis.model.selectionMethod === "requested_by_user"
                  ? "Cantidad indicada manualmente"
                  : "Mejor coeficiente de silueta"
              }
              icon={<Boxes className="h-5 w-5" />}
              tone="red"
            />
            <MetricCard
              label="Coeficiente de silueta"
              value={formatNumber(analysis.model.silhouetteScore, 4)}
              helper={`Codo detectado en K = ${analysis.model.elbowK}`}
              icon={<Gauge className="h-5 w-5" />}
              tone="emerald"
            />
            <MetricCard
              label="Valores atípicos"
              value={formatNumber(outlierCount)}
              helper="Distancia superior al umbral de su cluster"
              icon={<Target className="h-5 w-5" />}
              tone={outlierCount > 0 ? "amber" : "slate"}
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <Panel className="p-6">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-red-50 p-3 text-red-600">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Método del codo</h2>
                  <p className="mt-1 text-sm leading-5 text-gray-600">
                    Busca el punto donde aumentar K deja de reducir considerablemente la
                    inercia.
                  </p>
                </div>
              </div>
              <div className="mt-6 h-[300px]">
                {analysis.evaluations.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analysis.evaluations} margin={{ top: 8, right: 18, left: 4, bottom: 4 }}>
                      <CartesianGrid stroke="#e5e7eb" strokeDasharray="4 4" />
                      <XAxis dataKey="k" tick={{ fontSize: 12, fill: "#6b7280" }} />
                      <YAxis
                        tickFormatter={(value) => formatNumber(Number(value), 0)}
                        tick={{ fontSize: 12, fill: "#6b7280" }}
                        width={58}
                      />
                      <Tooltip
                        formatter={(value) => [formatNumber(Number(value), 2), "Inercia"]}
                        labelFormatter={(value) => `K = ${String(value)}`}
                      />
                      <ReferenceLine
                        x={analysis.model.elbowK}
                        stroke="#f97316"
                        strokeDasharray="5 5"
                        label={{ value: "Codo", fill: "#c2410c", fontSize: 12 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="inertia"
                        name="Inercia"
                        stroke="#dc2626"
                        strokeWidth={3}
                        dot={{ r: 4, fill: "#ffffff", strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart message="No hay evaluaciones disponibles para dibujar la curva." />
                )}
              </div>
            </Panel>

            <Panel className="p-6">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                  <BrainCircuit className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Coeficiente de silueta</h2>
                  <p className="mt-1 text-sm leading-5 text-gray-600">
                    Un valor mayor indica grupos más compactos y mejor separados entre sí.
                  </p>
                </div>
              </div>
              <div className="mt-6 h-[300px]">
                {analysis.evaluations.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analysis.evaluations} margin={{ top: 8, right: 18, left: 4, bottom: 4 }}>
                      <CartesianGrid stroke="#e5e7eb" strokeDasharray="4 4" vertical={false} />
                      <XAxis dataKey="k" tick={{ fontSize: 12, fill: "#6b7280" }} />
                      <YAxis
                        domain={[-1, 1]}
                        tickFormatter={(value) => formatNumber(Number(value), 2)}
                        tick={{ fontSize: 12, fill: "#6b7280" }}
                        width={46}
                      />
                      <Tooltip
                        formatter={(value) => [formatNumber(Number(value), 4), "Silueta"]}
                        labelFormatter={(value) => `K = ${String(value)}`}
                      />
                      <ReferenceLine y={0} stroke="#94a3b8" />
                      <Bar dataKey="silhouette" name="Silueta" radius={[8, 8, 0, 0]}>
                        {analysis.evaluations.map((evaluation) => (
                          <Cell
                            key={evaluation.k}
                            fill={evaluation.isSelected ? "#dc2626" : "#cbd5e1"}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart message="No hay evaluaciones disponibles para comparar." />
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-600">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-600" /> K seleccionado
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-300" /> Alternativas evaluadas
                </span>
              </div>
            </Panel>
          </section>

          <Panel className="p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-red-50 p-3 text-red-600">
                  <Layers3 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Comparación entre clusters</h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Selecciona una métrica para comparar sin mezclar unidades diferentes.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {COMPARISON_METRICS.map((metric) => (
                  <button
                    key={metric.key}
                    type="button"
                    onClick={() => setComparisonMetric(metric.key)}
                    className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                      comparisonMetric === metric.key
                        ? "bg-slate-900 text-white"
                        : "border border-gray-200 bg-white text-gray-600 hover:border-red-200 hover:text-red-700"
                    }`}
                  >
                    {metric.shortLabel}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-6 h-[330px]">
              {comparisonData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData} margin={{ top: 8, right: 18, left: 4, bottom: 4 }}>
                    <CartesianGrid stroke="#e5e7eb" strokeDasharray="4 4" vertical={false} />
                    <XAxis dataKey="cluster" tick={{ fontSize: 12, fill: "#6b7280" }} />
                    <YAxis
                      tickFormatter={(value) =>
                        comparisonMetric === "price"
                          ? `$${formatNumber(Number(value), 0)}`
                          : formatNumber(Number(value), 1)
                      }
                      tick={{ fontSize: 12, fill: "#6b7280" }}
                      width={64}
                    />
                    <Tooltip
                      formatter={(value) => [
                        formatComparisonValue(Number(value), comparisonMetric),
                        selectedComparison.label,
                      ]}
                      labelFormatter={(_, payload) =>
                        payload?.[0]?.payload?.label ?? "Cluster"
                      }
                    />
                    <Bar dataKey="value" name={selectedComparison.label} radius={[10, 10, 0, 0]}>
                      {comparisonData.map((item) => (
                        <Cell
                          key={item.clusterNumber}
                          fill={getClusterColor(item.clusterNumber)}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart message="No hay perfiles de cluster para comparar." />
              )}
            </div>
          </Panel>

          <section>
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-600">
                  Perfiles encontrados
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-gray-900">
                  Características promedio de cada grupo
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-6 text-gray-600">
                Los nombres describen rasgos operativos; no sustituyen las categorías médicas
                del catálogo.
              </p>
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
              {analysis.profiles.map((profile) => {
                const color = getClusterColor(profile.cluster);
                const dominantSample = profile.sampleTypes[0];
                const dominantMethod = profile.analysisMethods[0];

                return (
                  <Panel key={profile.cluster} className="overflow-hidden">
                    <div className="h-1.5" style={{ backgroundColor: color }} />
                    <div className="p-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className="inline-flex rounded-full px-3 py-1 text-xs font-bold"
                              style={{ backgroundColor: `${color}18`, color }}
                            >
                              Grupo {profile.cluster}
                            </span>
                            <span className="text-xs text-gray-500">
                              {profile.studyCount} estudios · {formatPercent(profile.percentage)}
                            </span>
                          </div>
                          <h3 className="mt-3 text-lg font-semibold text-gray-900">
                            {profile.label}
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setClusterFilter(profile.cluster);
                            setOutliersOnly(false);
                            setPage(1);
                          }}
                          className="shrink-0 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition-colors hover:border-red-200 hover:text-red-700"
                        >
                          Ver estudios
                        </button>
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {[
                          ["Precio", formatCurrency(profile.averages.price)],
                          ["Entrega", `${formatNumber(profile.averages.deliveryHours, 1)} h`],
                          ["Parámetros", formatNumber(profile.averages.parameterCount, 1)],
                          ["Solicitudes", formatNumber(profile.averages.requestCount, 1)],
                        ].map(([label, value]) => (
                          <div key={label} className="rounded-2xl bg-gray-50 p-3">
                            <p className="text-[11px] font-medium text-gray-500">{label}</p>
                            <p className="mt-1 text-sm font-bold text-gray-900">{value}</p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl border border-gray-200 p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                            Muestra dominante
                          </p>
                          <p className="mt-2 text-sm font-semibold text-gray-900">
                            {formatCategory(dominantSample?.value)}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {dominantSample ? formatPercent(dominantSample.percentage) : "Sin datos"}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-gray-200 p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                            Método dominante
                          </p>
                          <p className="mt-2 truncate text-sm font-semibold text-gray-900" title={formatCategory(dominantMethod?.value)}>
                            {formatCategory(dominantMethod?.value)}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {dominantMethod ? formatPercent(dominantMethod.percentage) : "Sin datos"}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-gray-200 p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                            Procesamiento especial
                          </p>
                          <p className="mt-2 text-sm font-semibold text-gray-900">
                            {formatPercent(profile.specialProcessingPercentage)}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {profile.outlierCount} atípicos
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {profile.traits.length > 0 ? (
                          profile.traits.map((trait) => (
                            <span
                              key={trait}
                              className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600"
                            >
                              {formatCategory(trait)}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-500">Operación estándar</span>
                        )}
                      </div>
                    </div>
                  </Panel>
                );
              })}
            </div>
          </section>

          <Panel className="overflow-hidden">
            <div className="border-b border-gray-200 bg-gradient-to-r from-white via-red-50/60 to-white p-6">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-red-50 p-3 text-red-600">
                      <Database className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Estudios segmentados</h2>
                      <p className="mt-1 text-sm text-gray-600">
                        Identificadores y nombres se muestran aquí, pero no fueron usados por K-Means.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOutliersOnly((current) => !current);
                      setPage(1);
                    }}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                      outliersOnly
                        ? "bg-amber-100 text-amber-900"
                        : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <ShieldAlert className="h-4 w-4" />
                    Sólo atípicos
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setClusterFilter("all");
                      setOutliersOnly(false);
                      setSearchTerm("");
                      setPage(1);
                    }}
                    className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Limpiar filtros
                  </button>
                </div>
              </div>

              <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_240px]">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="search"
                    value={searchTerm}
                    onChange={(event) => {
                      setSearchTerm(event.target.value);
                      setPage(1);
                    }}
                    placeholder="Buscar por estudio, clave, muestra o método..."
                    className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-11 pr-4 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                  />
                </div>
                <select
                  value={clusterFilter}
                  onChange={(event) => {
                    setClusterFilter(
                      event.target.value === "all" ? "all" : Number(event.target.value),
                    );
                    setPage(1);
                  }}
                  className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                >
                  <option value="all">Todos los clusters</option>
                  {analysis.profiles.map((profile) => (
                    <option key={profile.cluster} value={profile.cluster}>
                      Grupo {profile.cluster} · {profile.studyCount} estudios
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1280px] text-left">
                <thead className="bg-gray-50 text-sm text-gray-700">
                  <tr>
                    <th className="px-5 py-4">
                      <SortableTableHeader label="Estudio" active={sortState.key === "study"} direction={sortState.direction} onToggle={() => toggleSort("study")} />
                    </th>
                    <th className="px-4 py-4">
                      <SortableTableHeader label="Cluster" active={sortState.key === "cluster"} direction={sortState.direction} onToggle={() => toggleSort("cluster")} />
                    </th>
                    <th className="px-4 py-4">
                      <SortableTableHeader label="Precio" active={sortState.key === "price"} direction={sortState.direction} onToggle={() => toggleSort("price")} />
                    </th>
                    <th className="px-4 py-4">
                      <SortableTableHeader label="Entrega" active={sortState.key === "delivery"} direction={sortState.direction} onToggle={() => toggleSort("delivery")} />
                    </th>
                    <th className="px-4 py-4">
                      <SortableTableHeader label="Parámetros" active={sortState.key === "parameters"} direction={sortState.direction} onToggle={() => toggleSort("parameters")} />
                    </th>
                    <th className="px-4 py-4">
                      <SortableTableHeader label="Solicitudes" active={sortState.key === "requests"} direction={sortState.direction} onToggle={() => toggleSort("requests")} />
                    </th>
                    <th className="px-4 py-4">Muestra / método</th>
                    <th className="px-4 py-4">Proc. especial</th>
                    <th className="px-4 py-4">
                      <SortableTableHeader label="Atípico" active={sortState.key === "outlier"} direction={sortState.direction} onToggle={() => toggleSort("outlier")} />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white text-sm">
                  {paginatedStudies.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-5 py-12 text-center text-gray-500">
                        No hay estudios que coincidan con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    paginatedStudies.map((study) => {
                      const profile = profileByCluster.get(study.cluster);
                      const color = getClusterColor(study.cluster);
                      return (
                        <tr
                          key={study.studyId}
                          className={study.isOutlier ? "bg-amber-50/40" : "hover:bg-gray-50"}
                        >
                          <td className="px-5 py-4">
                            <p className="font-semibold text-gray-900">{study.name}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                              <span>{study.code}</span>
                              {study.isSynthetic ? (
                                <span className="rounded-full bg-violet-100 px-2 py-0.5 font-semibold text-violet-700">
                                  Sintético
                                </span>
                              ) : null}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className="inline-flex max-w-[180px] rounded-full px-3 py-1 text-xs font-semibold"
                              style={{ backgroundColor: `${color}18`, color }}
                              title={profile?.label}
                            >
                              Grupo {study.cluster}
                            </span>
                          </td>
                          <td className="px-4 py-4 font-semibold text-gray-900">
                            {formatCurrency(study.values.price)}
                          </td>
                          <td className="px-4 py-4 text-gray-700">
                            {formatNumber(study.values.deliveryHours, 1)} h
                          </td>
                          <td className="px-4 py-4 text-gray-700">
                            {formatNumber(study.values.parameterCount, 1)}
                          </td>
                          <td className="px-4 py-4 text-gray-700">
                            {formatNumber(study.values.requestCount, 1)}
                          </td>
                          <td className="px-4 py-4">
                            <p className="font-medium text-gray-800">
                              {formatCategory(study.values.sampleType)}
                            </p>
                            <p className="mt-1 max-w-[190px] truncate text-xs text-gray-500" title={formatCategory(study.values.analysisMethod)}>
                              {formatCategory(study.values.analysisMethod)}
                            </p>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${study.values.requiresSpecialProcessing ? "bg-red-50 text-red-700" : "bg-gray-100 text-gray-600"}`}>
                              {study.values.requiresSpecialProcessing ? "Sí" : "No"}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            {study.isOutlier ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                Sí · {formatNumber(study.outlierScore, 2)}x
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                                <CheckCircle2 className="h-4 w-4" /> Dentro del perfil
                              </span>
                            )}
                            <p className="mt-1 text-[11px] text-gray-500">
                              Distancia: {formatNumber(study.distanceToCentroid, 3)}
                            </p>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <TablePagination
              page={page}
              pageSize={pageSize}
              totalItems={filteredStudies.length}
              itemLabel="estudios"
              onPageChange={setPage}
              onPageSizeChange={(nextPageSize) => {
                setPageSize(nextPageSize);
                setPage(1);
              }}
            />
          </Panel>

          <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <Panel className="p-6">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-red-50 p-3 text-red-600">
                  <Database className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Preparación del dataset</h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Resumen de limpieza y transformación antes de ejecutar K-Means.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {[
                  ["Duplicados eliminados", analysis.dataQuality.duplicateRows],
                  [
                    "Valores imputados",
                    sumRecordValues(analysis.dataQuality.imputedValues),
                  ],
                  [
                    "Extremos ajustados",
                    sumRecordValues(analysis.dataQuality.winsorizedValues),
                  ],
                  ["Filas excluidas", analysis.dataQuality.excludedRows],
                  ["Muestras del modelo", analysis.model.trainingSamples],
                ].map(([label, value]) => (
                  <div key={String(label)} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className="mt-2 text-xl font-bold text-gray-900">
                      {formatNumber(Number(value))}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-gray-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                    Variables usadas por el modelo
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {analysis.model.featureNames.map((feature) => (
                      <span key={feature} className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-gray-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                    Campos sólo para mostrar
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {analysis.model.displayOnlyFields.map((field) => (
                      <span key={field} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                        {field}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-xs leading-5 text-gray-500">
                    Estos campos no participan en la distancia ni en la asignación del cluster.
                  </p>
                </div>
              </div>

              {analysis.dataQuality.ignoredConstantFeatures.length > 0 ? (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  <span className="font-semibold">Variables constantes ignoradas:</span>{" "}
                  {analysis.dataQuality.ignoredConstantFeatures.join(", ")}.
                </div>
              ) : null}
            </Panel>

            <Panel className="p-6">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                  <CircleDollarSign className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Origen de los datos</h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Periodo del {formatDate(analysis.period.from)} al {formatDate(analysis.period.to)}.
                  </p>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {Object.entries(analysis.sources).map(([feature, source]) => (
                  <div key={feature} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCategory(feature)}
                    </p>
                    <p className="mt-1 break-words font-mono text-xs text-gray-500">{source}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl bg-slate-950 p-4 text-sm leading-6 text-slate-200">
                <div className="flex items-center gap-2 font-semibold text-white">
                  <Clock3 className="h-4 w-4 text-red-400" />
                  Modelo {analysis.model.algorithm.toUpperCase()} v{analysis.model.version}
                </div>
                <p className="mt-2">
                  Resultado descriptivo para organización administrativa. La decisión final
                  sobre el catálogo permanece a cargo del personal de ECONOLAB.
                </p>
              </div>
            </Panel>
          </section>
        </>
      ) : (
        <Panel className="p-10 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-amber-500" />
          <h2 className="mt-4 text-xl font-semibold text-gray-900">Sin resultados disponibles</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-gray-600">
            Revisa los parámetros del análisis y vuelve a intentarlo. Se necesitan al menos
            diez estudios utilizables con variación suficiente.
          </p>
        </Panel>
      )}
    </div>
  );
}
