"use client";

import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Edit3,
  FlaskConical,
  Gauge,
  Lightbulb,
  Loader2,
  RefreshCw,
  Save,
  Search,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
  X,
} from "lucide-react";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
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

type ProfileId = string | number;

type ProfileAverages = {
  price: number;
  deliveryHours: number;
  parameterCount: number;
  requestCount: number;
};

type OperationalProfile = {
  profileId: ProfileId;
  displayName: string | null;
  suggestedName: string;
  shortDescription: string;
  keyCharacteristics: string[];
  suggestedAction: string;
  studyCount: number;
  percentage: number;
  averages: ProfileAverages;
  predominantMethod?: string | null;
  predominantSampleType?: string | null;
  specialProcessingPercentage: number;
  outlierCount: number;
};

type ProfileStudy = {
  studyId: number;
  code: string;
  name: string;
  profileId: ProfileId;
  profileDisplayName?: string | null;
  isOutlier: boolean;
  isSynthetic?: boolean;
  assignmentSource?: "stored_model_artifact" | "stored_assignment";
  values: {
    price: number;
    deliveryHours: number;
    parameterCount: number | null;
    requestCount: number;
    sampleType: string | null;
    analysisMethod: string | null;
    requiresSpecialProcessing: boolean | null;
  };
};

type CatalogFinding = {
  findingId: string;
  type: "opportunity" | "attention" | "pattern" | "summary" | string;
  title: string;
  description: string;
  profileId?: ProfileId | null;
};

type ModelEvaluation = {
  k: number;
  inertia: number;
  silhouette: number;
  daviesBouldin?: number;
  iterations?: number;
  isElbow?: boolean;
  isSelected?: boolean;
};

type TechnicalDataQuality = {
  receivedRows: number;
  usableRows: number;
  excludedRows: number;
  duplicateRows: number;
  imputedValues: Record<string, number>;
  winsorizedValues?: Record<string, number>;
  ignoredConstantFeatures?: string[];
  realRows?: number;
  syntheticRows?: number;
  syntheticPercentage?: number;
  syntheticDemandRows?: number;
  syntheticRequestCount?: number;
};

type TechnicalDetails = {
  algorithm: string;
  modelVersion: string;
  selectedK: number;
  elbowK?: number;
  selectionMethod: string;
  silhouetteScore: number;
  daviesBouldinScore?: number | null;
  inertia: number;
  evaluations: ModelEvaluation[];
  featureNames: string[];
  excludedFeatures: string[];
  dataQuality: TechnicalDataQuality;
  artifact?: {
    storage: string;
    loaded: boolean;
    schemaVersion: string | null;
    datasetFingerprintSha256: string | null;
    reassignedStudies: number;
    mismatchesWithStoredAssignments: number;
  };
  warnings: string[];
};

type StoredRun = {
  runId: ProfileId;
  executedAt?: string;
  generatedAt?: string;
  periodLabel?: string;
  totalStudies?: number;
  profileCount?: number;
  outlierCount?: number;
};

type StoredClusteringResult = {
  run: StoredRun;
  profiles: OperationalProfile[];
  studies: ProfileStudy[];
  findings: CatalogFinding[];
  technicalDetails: TechnicalDetails;
};

type ComparisonMetric = keyof ProfileAverages;
type StudySortKey =
  | "study"
  | "profile"
  | "price"
  | "delivery"
  | "parameters"
  | "requests"
  | "status";

const PROFILE_COLORS = [
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
  {
    key: "parameterCount",
    label: "Parámetros promedio",
    shortLabel: "Parámetros",
  },
  { key: "requestCount", label: "Solicitudes promedio", shortLabel: "Demanda" },
];

const GENERIC_PROFILE_NAME =
  /^(?:(?:grupo|group|cluster|segmento)\s*(?:[a-z]|\d+)?|g\s*\d+|perfil\s*k\s*\d+|unknown|desconocido)$/i;

const CATEGORY_LABELS: Record<string, string> = {
  blood: "Sangre total",
  serum: "Suero",
  plasma: "Plasma",
  urine: "Orina",
  stool: "Heces",
  swab: "Hisopo",
  other: "Otra",
  pcr: "PCR",
  elisa: "ELISA",
  enzimatico: "Enzimático",
  inmunoensayo: "Inmunoensayo",
  espectrofotometria: "Espectrofotometría",
  colorimetria: "Colorimetría",
  coagulometria: "Coagulometría",
  quimioluminiscencia: "Quimioluminiscencia",
  microscopia: "Microscopía",
  "cultivo microbiologico": "Cultivo microbiológico",
};

const FEATURE_LABELS: Record<string, string> = {
  price: "Precio",
  delivery_hours: "Tiempo de entrega",
  deliveryHours: "Tiempo de entrega",
  parameter_count: "Cantidad de parámetros",
  parameterCount: "Cantidad de parámetros",
  request_count: "Solicitudes del periodo",
  requestCount: "Solicitudes del periodo",
  sample_type: "Tipo de muestra",
  analysis_method: "Método de análisis",
  requires_special_processing: "Procesamiento especial",
  requiresSpecialProcessing: "Procesamiento especial",
  studyId: "Identificador del estudio",
  code: "Clave del estudio",
  name: "Nombre del estudio",
};

function getMessage(json: unknown, fallback: string) {
  if (!json || typeof json !== "object") return fallback;
  const candidate = json as { errors?: unknown; message?: unknown };
  if (
    Array.isArray(candidate.errors) &&
    typeof candidate.errors[0] === "string"
  ) {
    return candidate.errors[0];
  }
  return typeof candidate.message === "string" ? candidate.message : fallback;
}

function isStoredClusteringResult(
  value: unknown,
): value is StoredClusteringResult {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<StoredClusteringResult>;
  return Boolean(
    candidate.run &&
    typeof candidate.run === "object" &&
    Array.isArray(candidate.profiles) &&
    Array.isArray(candidate.studies) &&
    Array.isArray(candidate.findings) &&
    candidate.technicalDetails &&
    typeof candidate.technicalDetails === "object" &&
    Array.isArray(candidate.technicalDetails.evaluations) &&
    Array.isArray(candidate.technicalDetails.featureNames) &&
    Array.isArray(candidate.technicalDetails.excludedFeatures) &&
    Array.isArray(candidate.technicalDetails.warnings),
  );
}

function cleanFriendlyName(value?: string | null) {
  const normalized = value?.trim() ?? "";
  if (!normalized || GENERIC_PROFILE_NAME.test(normalized)) return null;
  return normalized;
}

function getProfileName(profile: OperationalProfile) {
  return (
    cleanFriendlyName(profile.displayName) ??
    cleanFriendlyName(profile.suggestedName) ??
    "Perfil operativo sin nombre"
  );
}

function getProfileColor(index: number) {
  return PROFILE_COLORS[index % PROFILE_COLORS.length];
}

function formatNumber(value: number, maximumFractionDigits = 0) {
  return new Intl.NumberFormat("es-MX", { maximumFractionDigits }).format(
    value,
  );
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

function formatDateTime(value?: string) {
  if (!value) return "Fecha no disponible";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatCategory(value?: string | null) {
  const raw = (value ?? "").trim().toLowerCase();
  const normalized = raw.replace(/_/g, " ");
  if (
    !normalized ||
    /^(unknown|desconocido|sin especificar)$/i.test(normalized)
  ) {
    return "Sin información";
  }
  if (CATEGORY_LABELS[raw]) return CATEGORY_LABELS[raw];
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function formatFeatureName(feature: string) {
  if (FEATURE_LABELS[feature]) return FEATURE_LABELS[feature];
  const insufficientCoverage = " (cobertura insuficiente)";
  if (feature.endsWith(insufficientCoverage)) {
    const baseFeature = feature.slice(0, -insufficientCoverage.length);
    const translatedBase =
      FEATURE_LABELS[baseFeature] ?? baseFeature.replace(/_/g, " ");
    return `${translatedBase} (cobertura insuficiente)`;
  }
  const [prefix, category] = feature.split("=", 2);
  if (prefix === "sample_type" && category) {
    return `Tipo de muestra: ${formatCategory(category)}`;
  }
  if (prefix === "analysis_method" && category) {
    return `Método de análisis: ${formatCategory(category)}`;
  }
  return feature.replace(/_/g, " ");
}

function hasRecordedCategory(value?: string | null) {
  const normalized = (value ?? "").trim().replace(/_/g, " ");
  return Boolean(
    normalized && !/^(unknown|desconocido|sin especificar)$/i.test(normalized),
  );
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function resolveProfileReferences(
  text: string,
  profileName?: string,
  aliases: Array<string | null | undefined> = [],
) {
  const replacement = profileName ?? "este perfil operativo";
  const normalizedAliases = [
    ...new Set(
      aliases
        .map((alias) => alias?.trim())
        .filter((alias): alias is string =>
          Boolean(alias && alias !== replacement),
        ),
    ),
  ].sort((left, right) => right.length - left.length);
  const aliasPattern = normalizedAliases.length
    ? new RegExp(normalizedAliases.map(escapeRegExp).join("|"), "gi")
    : null;
  const withFriendlyName = aliasPattern
    ? text.replace(aliasPattern, replacement)
    : text;

  return withFriendlyName
    .replace(/\b(?:grupo|group|cluster)\s*\d+\b/gi, replacement)
    .replace(/\bG\s*\d+\b/g, replacement)
    .replace(/\bunknown\b/gi, "sin información");
}

function formatComparisonValue(value: number, metric: ComparisonMetric) {
  if (metric === "price") return formatCurrency(value);
  if (metric === "deliveryHours") return `${formatNumber(value, 1)} h`;
  return formatNumber(value, 1);
}

function sumRecordValues(values?: Record<string, number>) {
  return Object.values(values ?? {}).reduce((total, value) => total + value, 0);
}

function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
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
  const toneClass = {
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
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
            {value}
          </p>
          <p className="mt-2 text-xs leading-5 text-gray-500">{helper}</p>
        </div>
        <div className={`rounded-2xl p-3 ${toneClass}`}>{icon}</div>
      </div>
    </Panel>
  );
}

function FindingCard({
  finding,
  profileName,
  profileAliases,
}: {
  finding: CatalogFinding;
  profileName?: string;
  profileAliases?: Array<string | null | undefined>;
}) {
  const normalizedType = finding.type.toLowerCase();
  const isAttention = ["attention", "warning", "risk", "outlier"].includes(
    normalizedType,
  );
  const isOpportunity = normalizedType === "opportunity";
  const styles = isAttention
    ? "border-amber-200 bg-amber-50 text-amber-950"
    : isOpportunity
      ? "border-emerald-200 bg-emerald-50 text-emerald-950"
      : "border-slate-200 bg-slate-50 text-slate-900";
  const Icon = isAttention
    ? ShieldAlert
    : isOpportunity
      ? TrendingUp
      : Lightbulb;
  const typeLabel = isAttention
    ? "Atención"
    : isOpportunity
      ? "Oportunidad"
      : normalizedType === "pattern"
        ? "Patrón observado"
        : "Hallazgo";

  return (
    <article className={`rounded-2xl border p-5 ${styles}`}>
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-white/70 p-2.5">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">
            {typeLabel}
          </p>
          {profileName ? (
            <p className="mt-2 text-xs font-semibold opacity-70">
              {profileName}
            </p>
          ) : null}
          <h3 className="mt-2 font-semibold">
            {resolveProfileReferences(
              finding.title,
              profileName,
              profileAliases,
            )}
          </h3>
          <p className="mt-2 text-sm leading-6 opacity-80">
            {resolveProfileReferences(
              finding.description,
              profileName,
              profileAliases,
            )}
          </p>
        </div>
      </div>
    </article>
  );
}

export default function StudyClusteringSection() {
  const [result, setResult] = useState<StoredClusteringResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comparisonMetric, setComparisonMetric] =
    useState<ComparisonMetric>("price");
  const [profileFilter, setProfileFilter] = useState<"all" | string>("all");
  const [reviewOnly, setReviewOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortState, setSortState] = useState<{
    key: StudySortKey;
    direction: SortDirection;
  }>({ key: "study", direction: "asc" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [draftDisplayName, setDraftDisplayName] = useState("");
  const [savingProfileId, setSavingProfileId] = useState<string | null>(null);

  const loadLatestResult = useCallback(
    async (initial = false, notify = true) => {
      if (initial) setLoading(true);
      else setRefreshing(true);
      setError(null);

      try {
        // USO EN EL SISTEMA: solicita los perfiles y estudios que K-Means dejo
        // almacenados. La interfaz solo presenta el resultado; no entrena aqui.
        const response = await fetch("/api/study-clustering/analysis", {
          method: "GET",
          cache: "no-store",
        });
        const json = await response.json().catch(() => null);

        if (!response.ok || !isStoredClusteringResult(json)) {
          const message = getMessage(
            json,
            "No se pudo consultar el último resultado almacenado.",
          );
          setError(message);
          if (!initial) toast.error(message);
          return;
        }

        setResult(json);
        setProfileFilter("all");
        setReviewOnly(false);
        setSearchTerm("");
        setPage(1);
        if (!initial && notify) toast.success("Información actualizada.");
      } catch {
        const message =
          "No fue posible conectar con el módulo de perfiles operativos.";
        setError(message);
        if (!initial) toast.error(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadLatestResult(true);
  }, [loadLatestResult]);

  const namedProfiles = useMemo(
    () =>
      (result?.profiles ?? []).map((profile, index) => ({
        ...profile,
        friendlyName: getProfileName(profile),
        color: getProfileColor(index),
      })),
    [result?.profiles],
  );
  const activeFeatureNames = useMemo(
    () => new Set(result?.technicalDetails.featureNames ?? []),
    [result?.technicalDetails.featureNames],
  );
  const hasParameterInformation = activeFeatureNames.has("parameter_count");
  const hasSpecialProcessingInformation = activeFeatureNames.has(
    "requires_special_processing",
  );
  const availableComparisonMetrics = COMPARISON_METRICS.filter((metric) => {
    const featureByMetric: Record<ComparisonMetric, string> = {
      price: "price",
      deliveryHours: "delivery_hours",
      parameterCount: "parameter_count",
      requestCount: "request_count",
    };
    return activeFeatureNames.has(featureByMetric[metric.key]);
  });
  const effectiveComparisonMetric = availableComparisonMetrics.some(
    (metric) => metric.key === comparisonMetric,
  )
    ? comparisonMetric
    : availableComparisonMetrics[0]?.key;

  const profileById = useMemo(
    () =>
      new Map(
        namedProfiles.map((profile) => [String(profile.profileId), profile]),
      ),
    [namedProfiles],
  );

  const getStudyProfileName = useCallback(
    (study: ProfileStudy) => {
      const profile = profileById.get(String(study.profileId));
      if (profile) return profile.friendlyName;
      return (
        cleanFriendlyName(study.profileDisplayName) ??
        "Perfil operativo sin nombre"
      );
    },
    [profileById],
  );

  const filteredStudies = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase("es-MX");
    const matching = (result?.studies ?? []).filter((study) => {
      if (profileFilter !== "all" && String(study.profileId) !== profileFilter)
        return false;
      if (reviewOnly && !study.isOutlier) return false;
      if (!normalizedSearch) return true;

      return [
        study.name,
        study.code,
        getStudyProfileName(study),
        study.values.sampleType,
        study.values.analysisMethod,
      ].some((value) =>
        (value ?? "").toLocaleLowerCase("es-MX").includes(normalizedSearch),
      );
    });

    const direction = sortState.direction === "asc" ? 1 : -1;
    return [...matching].sort((left, right) => {
      let comparison = 0;
      if (sortState.key === "study") {
        comparison = left.name.localeCompare(right.name, "es", {
          sensitivity: "base",
        });
      } else if (sortState.key === "profile") {
        comparison = getStudyProfileName(left).localeCompare(
          getStudyProfileName(right),
          "es",
          {
            sensitivity: "base",
          },
        );
      } else if (sortState.key === "price") {
        comparison = left.values.price - right.values.price;
      } else if (sortState.key === "delivery") {
        comparison = left.values.deliveryHours - right.values.deliveryHours;
      } else if (sortState.key === "parameters") {
        comparison =
          (left.values.parameterCount ?? -1) -
          (right.values.parameterCount ?? -1);
      } else if (sortState.key === "requests") {
        comparison = left.values.requestCount - right.values.requestCount;
      } else {
        comparison = Number(left.isOutlier) - Number(right.isOutlier);
      }
      return comparison * direction;
    });
  }, [
    getStudyProfileName,
    profileFilter,
    result?.studies,
    reviewOnly,
    searchTerm,
    sortState,
  ]);

  const paginatedStudies = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredStudies.slice(start, start + pageSize);
  }, [filteredStudies, page, pageSize]);

  const comparisonData = useMemo(
    () =>
      effectiveComparisonMetric
        ? namedProfiles.map((profile) => ({
            profileId: String(profile.profileId),
            displayName: profile.friendlyName,
            chartLabel:
              profile.friendlyName.length > 30
                ? `${profile.friendlyName.slice(0, 29)}…`
                : profile.friendlyName,
            value: profile.averages[effectiveComparisonMetric],
            color: profile.color,
          }))
        : [],
    [effectiveComparisonMetric, namedProfiles],
  );

  const selectedComparison = COMPARISON_METRICS.find(
    (metric) => metric.key === effectiveComparisonMetric,
  );
  const reviewCount =
    result?.run.outlierCount ??
    (result?.studies ?? []).filter((study) => study.isOutlier).length;
  const totalStudies = result?.run.totalStudies ?? result?.studies.length ?? 0;
  const profileCount = result?.run.profileCount ?? result?.profiles.length ?? 0;
  const executedAt = result?.run.executedAt ?? result?.run.generatedAt;

  const toggleSort = (key: StudySortKey) => {
    setSortState((current) => ({
      key,
      direction:
        current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
    setPage(1);
  };

  const startEditingProfile = (profile: (typeof namedProfiles)[number]) => {
    setEditingProfileId(String(profile.profileId));
    setDraftDisplayName(profile.friendlyName);
  };

  const cancelEditingProfile = () => {
    setEditingProfileId(null);
    setDraftDisplayName("");
  };

  const saveDisplayName = async (profileId: ProfileId) => {
    const normalizedName = draftDisplayName.trim();
    if (normalizedName.length < 3) {
      toast.error("Escribe un nombre de al menos 3 caracteres.");
      return;
    }
    if (GENERIC_PROFILE_NAME.test(normalizedName)) {
      toast.error(
        "Usa un nombre descriptivo, por ejemplo: Económicos y frecuentes.",
      );
      return;
    }

    const id = String(profileId);
    setSavingProfileId(id);
    try {
      const response = await fetch(
        `/api/study-clustering/profiles/${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayName: normalizedName }),
        },
      );
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(
          getMessage(json, "No se pudo actualizar el nombre del perfil."),
        );
        return;
      }

      await loadLatestResult(false, false);
      cancelEditingProfile();
      toast.success("Nombre del perfil actualizado.");
    } catch {
      toast.error("No fue posible actualizar el nombre del perfil.");
    } finally {
      setSavingProfileId(null);
    }
  };

  if (loading) {
    return (
      <Panel className="overflow-hidden">
        <div className="bg-gradient-to-r from-red-700 via-red-600 to-slate-950 px-6 py-7 text-white">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-white/15 p-3">
              <FlaskConical className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                Segmentación operativa de estudios
              </h1>
              <p className="mt-1 text-sm text-red-50">
                Consultando el último resultado almacenado.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center gap-3 p-12 text-gray-600">
          <Loader2 className="h-5 w-5 animate-spin text-red-600" />
          Cargando información...
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
                Organización administrativa
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight">
                Segmentación operativa de estudios
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-red-50/95">
                Consulta grupos de estudios con características económicas y
                operativas similares para analizar su precio, demanda, tiempo de
                entrega y complejidad.
              </p>
            </div>

            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              {result ? (
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm">
                  <p className="text-red-100">Última actualización</p>
                  <p className="mt-1 font-semibold text-white">
                    {formatDateTime(executedAt)}
                  </p>
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => void loadLatestResult(false)}
                disabled={refreshing}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-red-700 shadow-sm transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                />
                {refreshing ? "Actualizando..." : "Actualizar información"}
              </button>
            </div>
          </div>
        </div>
      </Panel>

      {error && result ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-900">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">No se pudo cargar la información</p>
              <p className="mt-1 text-sm">{error}</p>
            </div>
          </div>
        </div>
      ) : null}

      {result ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Estudios incluidos"
              value={formatNumber(totalStudies)}
              helper="Registros del último resultado disponible"
              icon={<FlaskConical className="h-5 w-5" />}
            />
            <MetricCard
              label="Perfiles operativos"
              value={formatNumber(profileCount)}
              helper="Segmentos con características similares"
              icon={<BarChart3 className="h-5 w-5" />}
              tone="red"
            />
            <MetricCard
              label="Estudios por revisar"
              value={formatNumber(reviewCount)}
              helper="Se apartan del comportamiento habitual de su perfil"
              icon={<Target className="h-5 w-5" />}
              tone={reviewCount > 0 ? "amber" : "emerald"}
            />
            <MetricCard
              label="Cobertura de demanda"
              value={result.run.periodLabel || "Periodo almacenado"}
              helper="Ventana usada en el último cálculo disponible"
              icon={<TrendingUp className="h-5 w-5" />}
              tone="slate"
            />
          </section>

          <Panel className="p-6">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-amber-50 p-3 text-amber-700">
                <Lightbulb className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-600">
                  Lectura administrativa
                </p>
                <h2 className="mt-2 text-xl font-semibold text-gray-900">
                  Hallazgos del catálogo
                </h2>
                <p className="mt-1 text-sm leading-6 text-gray-600">
                  Puntos destacados derivados del último resultado guardado.
                </p>
              </div>
            </div>

            {result.findings.length > 0 ? (
              <div className="mt-5 grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
                {result.findings.map((finding) => {
                  const findingProfile = finding.profileId
                    ? profileById.get(String(finding.profileId))
                    : null;
                  return (
                    <FindingCard
                      key={finding.findingId}
                      finding={finding}
                      profileName={findingProfile?.friendlyName}
                      profileAliases={[
                        findingProfile?.suggestedName,
                        findingProfile?.displayName,
                      ]}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-600">
                El último resultado no registró hallazgos adicionales.
              </div>
            )}
          </Panel>

          <Panel className="p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-600">
                  Comparación general
                </p>
                <h2 className="mt-2 text-xl font-semibold text-gray-900">
                  Diferencias entre perfiles operativos
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Compara una variable a la vez para mantener sus unidades
                  claras.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableComparisonMetrics.map((metric) => (
                  <button
                    key={metric.key}
                    type="button"
                    onClick={() => setComparisonMetric(metric.key)}
                    className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                      effectiveComparisonMetric === metric.key
                        ? "bg-slate-900 text-white"
                        : "border border-gray-200 bg-white text-gray-600 hover:border-red-200 hover:text-red-700"
                    }`}
                  >
                    {metric.shortLabel}
                  </button>
                ))}
              </div>
            </div>

            {selectedComparison && effectiveComparisonMetric ? (
              <div className="mt-6 h-[360px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={comparisonData}
                    layout="vertical"
                    margin={{ top: 8, right: 24, left: 12, bottom: 8 }}
                  >
                    <CartesianGrid
                      stroke="#e5e7eb"
                      strokeDasharray="4 4"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      tickFormatter={(value) =>
                        effectiveComparisonMetric === "price"
                          ? `$${formatNumber(Number(value))}`
                          : formatNumber(Number(value), 1)
                      }
                      tick={{ fontSize: 12, fill: "#6b7280" }}
                    />
                    <YAxis
                      type="category"
                      dataKey="chartLabel"
                      width={220}
                      tick={{ fontSize: 12, fill: "#374151" }}
                    />
                    <Tooltip
                      formatter={(value) => [
                        formatComparisonValue(
                          Number(value),
                          effectiveComparisonMetric,
                        ),
                        selectedComparison.label,
                      ]}
                      labelFormatter={(label, payload) => {
                        const item = payload?.[0]?.payload as
                          { displayName?: unknown } | undefined;
                        return typeof item?.displayName === "string"
                          ? item.displayName
                          : String(label);
                      }}
                    />
                    <Bar
                      dataKey="value"
                      name={selectedComparison.label}
                      radius={[0, 10, 10, 0]}
                    >
                      {comparisonData.map((item) => (
                        <Cell key={item.profileId} fill={item.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-600">
                No hay variables numéricas con variación suficiente para
                comparar los perfiles.
              </div>
            )}
          </Panel>

          <section>
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-600">
                  Segmentación del catálogo
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-gray-900">
                  Perfiles operativos encontrados
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-6 text-gray-600">
                Puedes reemplazar el nombre sugerido por uno que sea más claro
                para el equipo.
              </p>
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
              {namedProfiles.map((profile) => {
                const profileId = String(profile.profileId);
                const isEditing = editingProfileId === profileId;
                const isSaving = savingProfileId === profileId;

                return (
                  <Panel key={profileId} className="overflow-hidden">
                    <div
                      className="h-1.5"
                      style={{ backgroundColor: profile.color }}
                    />
                    <div className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          {isEditing ? (
                            <div>
                              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Nombre visible
                              </label>
                              <input
                                value={draftDisplayName}
                                maxLength={80}
                                onChange={(event) =>
                                  setDraftDisplayName(event.target.value)
                                }
                                className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm font-semibold text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                                autoFocus
                              />
                              <div className="mt-2 flex gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    void saveDisplayName(profile.profileId)
                                  }
                                  disabled={isSaving}
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                                >
                                  {isSaving ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Save className="h-3.5 w-3.5" />
                                  )}
                                  Guardar
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelEditingProfile}
                                  disabled={isSaving}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 disabled:opacity-60"
                                >
                                  <X className="h-3.5 w-3.5" />
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-xl font-semibold text-gray-900">
                                  {profile.friendlyName}
                                </h3>
                                <span
                                  className="rounded-full px-3 py-1 text-xs font-semibold"
                                  style={{
                                    backgroundColor: `${profile.color}18`,
                                    color: profile.color,
                                  }}
                                >
                                  {profile.studyCount} estudios ·{" "}
                                  {formatPercent(profile.percentage)}
                                </span>
                              </div>
                              <p className="mt-2 text-sm leading-6 text-gray-600">
                                {resolveProfileReferences(
                                  profile.shortDescription,
                                  profile.friendlyName,
                                  [profile.suggestedName, profile.displayName],
                                )}
                              </p>
                            </>
                          )}
                        </div>

                        {!isEditing ? (
                          <button
                            type="button"
                            onClick={() => startEditingProfile(profile)}
                            className="shrink-0 rounded-xl border border-gray-200 p-2.5 text-gray-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                            aria-label={`Editar nombre de ${profile.friendlyName}`}
                            title="Editar nombre visible"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {[
                          ...(activeFeatureNames.has("price")
                            ? [
                                [
                                  "Precio",
                                  formatCurrency(profile.averages.price),
                                ],
                              ]
                            : []),
                          ...(activeFeatureNames.has("delivery_hours")
                            ? [
                                [
                                  "Entrega",
                                  `${formatNumber(profile.averages.deliveryHours, 1)} h`,
                                ],
                              ]
                            : []),
                          ...(hasParameterInformation
                            ? [
                                [
                                  "Parámetros",
                                  formatNumber(
                                    profile.averages.parameterCount,
                                    1,
                                  ),
                                ],
                              ]
                            : []),
                          ...(activeFeatureNames.has("request_count")
                            ? [
                                [
                                  "Solicitudes",
                                  formatNumber(
                                    profile.averages.requestCount,
                                    1,
                                  ),
                                ],
                              ]
                            : []),
                        ].map(([label, value]) => (
                          <div
                            key={label}
                            className="rounded-2xl bg-gray-50 p-3"
                          >
                            <p className="text-[11px] font-medium text-gray-500">
                              {label}
                            </p>
                            <p className="mt-1 text-sm font-bold text-gray-900">
                              {value}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-3">
                        {hasRecordedCategory(profile.predominantSampleType) ? (
                          <div className="rounded-2xl border border-gray-200 p-3">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                              Muestra predominante
                            </p>
                            <p className="mt-2 text-sm font-semibold text-gray-900">
                              {formatCategory(profile.predominantSampleType)}
                            </p>
                          </div>
                        ) : null}
                        {hasRecordedCategory(profile.predominantMethod) ? (
                          <div className="rounded-2xl border border-gray-200 p-3">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                              Método predominante
                            </p>
                            <p className="mt-2 truncate text-sm font-semibold text-gray-900">
                              {formatCategory(profile.predominantMethod)}
                            </p>
                          </div>
                        ) : null}
                        {hasSpecialProcessingInformation ? (
                          <div className="rounded-2xl border border-gray-200 p-3">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                              Procesamiento especial
                            </p>
                            <p className="mt-2 text-sm font-semibold text-gray-900">
                              {formatPercent(
                                profile.specialProcessingPercentage,
                              )}
                            </p>
                          </div>
                        ) : null}
                      </div>

                      {!hasRecordedCategory(profile.predominantSampleType) ? (
                        <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
                          No existe información suficiente sobre el tipo de
                          muestra para caracterizar este perfil.
                        </p>
                      ) : null}

                      <p className="mt-3 text-xs font-medium text-gray-600">
                        {profile.outlierCount === 0
                          ? "Sin estudios que requieran revisión"
                          : `${profile.outlierCount} ${profile.outlierCount === 1 ? "estudio requiere" : "estudios requieren"} revisión`}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {profile.keyCharacteristics.map((characteristic) => (
                          <span
                            key={characteristic}
                            className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600"
                          >
                            {resolveProfileReferences(
                              characteristic,
                              profile.friendlyName,
                              [profile.suggestedName, profile.displayName],
                            )}
                          </span>
                        ))}
                      </div>

                      <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-red-700">
                          Acción administrativa sugerida
                        </p>
                        <p className="mt-1 text-sm leading-5 text-gray-700">
                          {profile.suggestedAction}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setProfileFilter(profileId);
                          setReviewOnly(false);
                          setPage(1);
                        }}
                        className="mt-5 text-sm font-semibold text-red-700 hover:text-red-800"
                      >
                        Consultar estudios
                      </button>
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
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-600">
                    Consulta detallada
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-gray-900">
                    Estudios por perfil operativo
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Revisa el comportamiento de cada estudio dentro del perfil
                    asignado.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setReviewOnly((current) => !current);
                      setPage(1);
                    }}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                      reviewOnly
                        ? "bg-amber-100 text-amber-900"
                        : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <ShieldAlert className="h-4 w-4" />
                    Requieren revisión
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileFilter("all");
                      setReviewOnly(false);
                      setSearchTerm("");
                      setPage(1);
                    }}
                    className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Limpiar filtros
                  </button>
                </div>
              </div>

              <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_300px]">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="search"
                    value={searchTerm}
                    onChange={(event) => {
                      setSearchTerm(event.target.value);
                      setPage(1);
                    }}
                    placeholder="Buscar por estudio, clave, perfil, muestra o método..."
                    className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-11 pr-4 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                  />
                </div>
                <select
                  value={profileFilter}
                  onChange={(event) => {
                    setProfileFilter(event.target.value);
                    setPage(1);
                  }}
                  className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                >
                  <option value="all">Todos los perfiles</option>
                  {namedProfiles.map((profile) => (
                    <option
                      key={String(profile.profileId)}
                      value={String(profile.profileId)}
                    >
                      {profile.friendlyName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1320px] text-left">
                <thead className="bg-gray-50 text-sm text-gray-700">
                  <tr>
                    <th className="px-5 py-4">
                      <SortableTableHeader
                        label="Estudio"
                        active={sortState.key === "study"}
                        direction={sortState.direction}
                        onToggle={() => toggleSort("study")}
                      />
                    </th>
                    <th className="px-4 py-4">
                      <SortableTableHeader
                        label="Perfil operativo"
                        active={sortState.key === "profile"}
                        direction={sortState.direction}
                        onToggle={() => toggleSort("profile")}
                      />
                    </th>
                    <th className="px-4 py-4">
                      <SortableTableHeader
                        label="Precio"
                        active={sortState.key === "price"}
                        direction={sortState.direction}
                        onToggle={() => toggleSort("price")}
                      />
                    </th>
                    <th className="px-4 py-4">
                      <SortableTableHeader
                        label="Entrega"
                        active={sortState.key === "delivery"}
                        direction={sortState.direction}
                        onToggle={() => toggleSort("delivery")}
                      />
                    </th>
                    <th className="px-4 py-4">
                      <SortableTableHeader
                        label="Parámetros"
                        active={sortState.key === "parameters"}
                        direction={sortState.direction}
                        onToggle={() => toggleSort("parameters")}
                      />
                    </th>
                    <th className="px-4 py-4">
                      <SortableTableHeader
                        label="Solicitudes"
                        active={sortState.key === "requests"}
                        direction={sortState.direction}
                        onToggle={() => toggleSort("requests")}
                      />
                    </th>
                    <th className="px-4 py-4">Muestra y método</th>
                    <th className="px-4 py-4">Procesamiento especial</th>
                    <th className="px-4 py-4">
                      <SortableTableHeader
                        label="Comportamiento"
                        active={sortState.key === "status"}
                        direction={sortState.direction}
                        onToggle={() => toggleSort("status")}
                      />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white text-sm">
                  {paginatedStudies.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-5 py-12 text-center text-gray-500"
                      >
                        No hay estudios que coincidan con los filtros
                        seleccionados.
                      </td>
                    </tr>
                  ) : (
                    paginatedStudies.map((study) => {
                      const profile = profileById.get(String(study.profileId));
                      return (
                        <tr
                          key={study.studyId}
                          className={
                            study.isOutlier
                              ? "bg-amber-50/40"
                              : "hover:bg-gray-50"
                          }
                        >
                          <td className="px-5 py-4">
                            <p className="font-semibold text-gray-900">
                              {study.name}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              {study.code}
                            </p>
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className="inline-flex max-w-[220px] rounded-full px-3 py-1 text-xs font-semibold"
                              style={{
                                backgroundColor: `${profile?.color ?? "#64748b"}18`,
                                color: profile?.color ?? "#475569",
                              }}
                            >
                              {getStudyProfileName(study)}
                            </span>
                          </td>
                          <td className="px-4 py-4 font-semibold text-gray-900">
                            {formatCurrency(study.values.price)}
                          </td>
                          <td className="px-4 py-4 text-gray-700">
                            {formatNumber(study.values.deliveryHours, 1)} h
                          </td>
                          <td className="px-4 py-4 text-gray-700">
                            {study.values.parameterCount == null
                              ? "Sin información"
                              : formatNumber(study.values.parameterCount, 1)}
                          </td>
                          <td className="px-4 py-4 text-gray-700">
                            {formatNumber(study.values.requestCount, 1)}
                          </td>
                          <td className="px-4 py-4">
                            <p className="font-medium text-gray-800">
                              {formatCategory(study.values.sampleType)}
                            </p>
                            <p className="mt-1 max-w-[190px] truncate text-xs text-gray-500">
                              {formatCategory(study.values.analysisMethod)}
                            </p>
                          </td>
                          <td className="px-4 py-4 text-gray-700">
                            {study.values.requiresSpecialProcessing == null
                              ? "Sin información"
                              : study.values.requiresSpecialProcessing
                                ? "Sí requiere"
                                : "No requiere"}
                          </td>
                          <td className="px-4 py-4">
                            {study.isOutlier ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                Requiere revisión
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Comportamiento habitual
                              </span>
                            )}
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

          <details className="group rounded-[1.75rem] border border-gray-200 bg-white shadow-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                  <Gauge className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">
                    Detalles técnicos del modelo
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Métricas de validación, calidad de datos y variables
                    utilizadas.
                  </p>
                </div>
              </div>
              <span className="text-sm font-semibold text-red-700 group-open:hidden">
                Ver detalles
              </span>
              <span className="hidden text-sm font-semibold text-red-700 group-open:inline">
                Ocultar
              </span>
            </summary>

            <div className="space-y-6 border-t border-gray-200 p-6">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">Algoritmo</p>
                  <p className="mt-2 font-semibold text-gray-900">
                    {result.technicalDetails.algorithm} v
                    {result.technicalDetails.modelVersion}
                  </p>
                </div>
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">
                    Perfiles seleccionados
                  </p>
                  <p className="mt-2 font-semibold text-gray-900">
                    {result.technicalDetails.selectedK}
                  </p>
                </div>
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">
                    Coeficiente de silueta
                  </p>
                  <p className="mt-2 font-semibold text-gray-900">
                    {formatNumber(result.technicalDetails.silhouetteScore, 4)}
                  </p>
                </div>
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">Inercia</p>
                  <p className="mt-2 font-semibold text-gray-900">
                    {formatNumber(result.technicalDetails.inertia, 2)}
                  </p>
                </div>
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">Davies-Bouldin</p>
                  <p className="mt-2 font-semibold text-gray-900">
                    {result.technicalDetails.daviesBouldinScore == null
                      ? "No disponible"
                      : formatNumber(
                          result.technicalDetails.daviesBouldinScore,
                          4,
                        )}
                  </p>
                  <p className="mt-1 text-[11px] text-gray-500">
                    Un valor menor representa grupos más compactos.
                  </p>
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-2">
                <div className="rounded-2xl border border-gray-200 p-5">
                  <h3 className="font-semibold text-gray-900">
                    Método del codo
                  </h3>
                  <div className="mt-4 h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={result.technicalDetails.evaluations}>
                        <CartesianGrid stroke="#e5e7eb" strokeDasharray="4 4" />
                        <XAxis
                          dataKey="k"
                          tick={{ fontSize: 12, fill: "#6b7280" }}
                        />
                        <YAxis
                          tick={{ fontSize: 12, fill: "#6b7280" }}
                          width={58}
                        />
                        <Tooltip
                          formatter={(value) => [
                            formatNumber(Number(value), 2),
                            "Inercia",
                          ]}
                          labelFormatter={(value) => `K = ${String(value)}`}
                        />
                        {result.technicalDetails.elbowK ? (
                          <ReferenceLine
                            x={result.technicalDetails.elbowK}
                            stroke="#f97316"
                            strokeDasharray="5 5"
                          />
                        ) : null}
                        <Line
                          type="monotone"
                          dataKey="inertia"
                          stroke="#dc2626"
                          strokeWidth={3}
                          dot={{ r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 p-5">
                  <h3 className="font-semibold text-gray-900">
                    Coeficiente de silueta
                  </h3>
                  <div className="mt-4 h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={result.technicalDetails.evaluations}>
                        <CartesianGrid
                          stroke="#e5e7eb"
                          strokeDasharray="4 4"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="k"
                          tick={{ fontSize: 12, fill: "#6b7280" }}
                        />
                        <YAxis
                          domain={[-1, 1]}
                          tick={{ fontSize: 12, fill: "#6b7280" }}
                          width={46}
                        />
                        <Tooltip
                          formatter={(value) => [
                            formatNumber(Number(value), 4),
                            "Silueta",
                          ]}
                          labelFormatter={(value) => `K = ${String(value)}`}
                        />
                        <ReferenceLine y={0} stroke="#94a3b8" />
                        <Bar dataKey="silhouette" radius={[8, 8, 0, 0]}>
                          {result.technicalDetails.evaluations.map(
                            (evaluation) => (
                              <Cell
                                key={evaluation.k}
                                fill={
                                  evaluation.k ===
                                  result.technicalDetails.selectedK
                                    ? "#dc2626"
                                    : "#cbd5e1"
                                }
                              />
                            ),
                          )}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-gray-200">
                <div className="border-b border-gray-200 px-5 py-4">
                  <h3 className="font-semibold text-gray-900">
                    Comparación de alternativas de K
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Se favorece mayor silueta y menor Davies-Bouldin, evitando
                    grupos demasiado pequeños.
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-left text-gray-600">
                      <tr>
                        <th className="px-5 py-3 font-semibold">K</th>
                        <th className="px-5 py-3 font-semibold">Inercia</th>
                        <th className="px-5 py-3 font-semibold">Silueta</th>
                        <th className="px-5 py-3 font-semibold">
                          Davies-Bouldin
                        </th>
                        <th className="px-5 py-3 font-semibold">Decisión</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {result.technicalDetails.evaluations.map((evaluation) => (
                        <tr key={`evaluation-${evaluation.k}`}>
                          <td className="px-5 py-3 font-semibold">
                            {evaluation.k}
                          </td>
                          <td className="px-5 py-3">
                            {formatNumber(evaluation.inertia, 2)}
                          </td>
                          <td className="px-5 py-3">
                            {formatNumber(evaluation.silhouette, 4)}
                          </td>
                          <td className="px-5 py-3">
                            {evaluation.daviesBouldin == null
                              ? "—"
                              : formatNumber(evaluation.daviesBouldin, 4)}
                          </td>
                          <td className="px-5 py-3">
                            {evaluation.k ===
                            result.technicalDetails.selectedK ? (
                              <span className="rounded-full bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
                                Seleccionado
                              </span>
                            ) : evaluation.isElbow ? (
                              <span className="text-xs text-amber-700">
                                Codo
                              </span>
                            ) : (
                              <span className="text-xs text-gray-500">
                                Alternativa
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-2xl border border-gray-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Variables utilizadas
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {result.technicalDetails.featureNames.map((feature) => (
                      <span
                        key={feature}
                        className="rounded-full bg-red-50 px-3 py-1 text-xs text-red-700"
                      >
                        {formatFeatureName(feature)}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-gray-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Campos excluidos
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {result.technicalDetails.excludedFeatures.map((feature) => (
                      <span
                        key={feature}
                        className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700"
                      >
                        {formatFeatureName(feature)}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-gray-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Calidad del dataset
                  </p>
                  <dl className="mt-3 space-y-2 text-sm text-gray-700">
                    <div className="flex justify-between gap-3">
                      <dt>Filas utilizables</dt>
                      <dd className="font-semibold">
                        {result.technicalDetails.dataQuality.usableRows}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>Duplicados</dt>
                      <dd className="font-semibold">
                        {result.technicalDetails.dataQuality.duplicateRows}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>Valores completados</dt>
                      <dd className="font-semibold">
                        {sumRecordValues(
                          result.technicalDetails.dataQuality.imputedValues,
                        )}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>Extremos ajustados</dt>
                      <dd className="font-semibold">
                        {sumRecordValues(
                          result.technicalDetails.dataQuality.winsorizedValues,
                        )}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>Filas reales</dt>
                      <dd className="font-semibold">
                        {result.technicalDetails.dataQuality.realRows ?? "—"}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>Filas sintéticas ECN-CAT</dt>
                      <dd className="font-semibold">
                        {result.technicalDetails.dataQuality.syntheticRows ??
                          "—"}
                        {result.technicalDetails.dataQuality
                          .syntheticPercentage != null
                          ? ` (${formatNumber(result.technicalDetails.dataQuality.syntheticPercentage, 2)}%)`
                          : ""}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>Solicitudes sintéticas ECO-ML</dt>
                      <dd className="font-semibold">
                        {result.technicalDetails.dataQuality
                          .syntheticRequestCount ?? "—"}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              {result.technicalDetails.artifact ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
                  <p className="font-semibold">
                    Artefacto reutilizable del modelo
                  </p>
                  <p className="mt-1">
                    {result.technicalDetails.artifact.loaded
                      ? `El backend cargó el JSONB v${result.technicalDetails.artifact.schemaVersion ?? "desconocida"} y reasignó ${result.technicalDetails.artifact.reassignedStudies} estudios a sus centroides.`
                      : "Esta ejecución es anterior al artefacto reutilizable; vuelve a calcular el clustering."}
                  </p>
                  {result.technicalDetails.artifact.loaded ? (
                    <p className="mt-1">
                      Diferencias contra la fotografía guardada:{" "}
                      {
                        result.technicalDetails.artifact
                          .mismatchesWithStoredAssignments
                      }
                      .
                    </p>
                  ) : null}
                </div>
              ) : null}

              {result.technicalDetails.warnings.length > 0 ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  <p className="font-semibold">Advertencias del resultado</p>
                  <ul className="mt-2 space-y-1">
                    {result.technicalDetails.warnings.map((warning, index) => (
                      <li key={`${warning}-${index}`}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </details>
        </>
      ) : (
        <Panel className="p-10 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-amber-500" />
          <h2 className="mt-4 text-xl font-semibold text-gray-900">
            No hay un resultado almacenado
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-gray-600">
            {error ??
              "El módulo mostrará aquí los perfiles operativos cuando exista una ejecución guardada por el proceso programado."}
          </p>
        </Panel>
      )}
    </div>
  );
}
