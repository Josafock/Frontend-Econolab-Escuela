"use client";

import { Loader2, RefreshCw, Sparkles, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type StudyOption = {
  id: number;
  name: string;
  code: string;
  type: "study" | "package" | "other";
};

type LossRecord = {
  id: number;
  date: string;
  studyId: number;
  studyName: string;
  studyType: "study" | "package" | "other";
  supplyName: string;
  quantityLoss: number;
  notes: string | null;
  createdAt: string;
};

type HistoryResponse = {
  data: LossRecord[];
  meta: {
    total: number;
    totalQuantityLoss: number;
  };
};

type PredictionChartPoint = {
  monthKey: string;
  date: string;
  historicalLoss: number | null;
  predictedLoss: number | null;
  isForecast: boolean;
};

type PredictionResponse = {
  chartSeries: PredictionChartPoint[];
  model: {
    hasEnoughData: boolean;
    reason: string | null;
    p0: number | null;
    r: number | null;
    y0: number | null;
    k: number | null;
    dataPointsUsed: number;
    monthsAhead: number;
    basePoint: {
      period: number;
      quantityLoss: number;
      label: string;
      date: string;
    } | null;
    comparisonPoint: {
      period: number;
      quantityLoss: number;
      label: string;
      date: string;
    } | null;
  };
  summary: {
    totalHistoricalLoss: number;
    averageMonthlyLoss: number | null;
    lastRecordedLoss: number | null;
    monthsWithHistory: number;
    recordsCount: number;
    nextMonthPrediction: number | null;
    nextMonthLabel: string | null;
  };
  logisticsSuggestion: {
    level: "high" | "medium" | "low" | "unavailable";
    title: string;
    message: string;
    recommendedAction: string | null;
  };
};

function getMessage(json: unknown, fallback: string) {
  if (!json || typeof json !== "object") return fallback;
  const candidate = json as { errors?: unknown; message?: unknown };
  if (Array.isArray(candidate.errors) && typeof candidate.errors[0] === "string") {
    return candidate.errors[0];
  }
  return typeof candidate.message === "string" ? candidate.message : fallback;
}

function formatDate(value?: string | null, withTime = false) {
  if (!value) return "Sin registro";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return withTime
    ? parsed.toLocaleString("es-MX")
    : parsed.toLocaleDateString("es-MX", { timeZone: "UTC" });
}

function formatQuantity(value?: number | null) {
  if (value == null || Number.isNaN(value)) return "N/D";
  return new Intl.NumberFormat("es-MX", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatRate(value?: number | null) {
  if (value == null || Number.isNaN(value)) return "N/D";
  return new Intl.NumberFormat("es-MX", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(value);
}

function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-").map((part) => Number(part));
  const parsed = new Date(Date.UTC(year, month - 1, 1));
  return parsed.toLocaleDateString("es-MX", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatPeriodDistance(period: number | null | undefined) {
  if (period == null || Number.isNaN(period)) return "N/D";
  return period === 1 ? "1 periodo" : `${period} periodos`;
}

function getStudyTypeLabel(type: StudyOption["type"] | LossRecord["studyType"]) {
  if (type === "package") return "Paquete";
  if (type === "study") return "Servicio";
  return "Otro";
}

function formatTooltipValue(value: unknown, name: unknown) {
  const normalizedValue = Array.isArray(value) ? value[0] : value;
  return [formatQuantity(typeof normalizedValue === "number" ? normalizedValue : Number(normalizedValue)), String(name)];
}

function getSuggestionStyles(level?: PredictionResponse["logisticsSuggestion"]["level"]) {
  if (level === "high") {
    return "border-red-200 bg-red-50 text-red-900";
  }
  if (level === "low") {
    return "border-emerald-200 bg-emerald-50 text-emerald-900";
  }
  if (level === "medium") {
    return "border-amber-200 bg-amber-50 text-amber-900";
  }
  return "border-gray-200 bg-gray-50 text-gray-800";
}

function getLocalInputDate() {
  const now = new Date();
  const timezoneOffsetInMs = now.getTimezoneOffset() * 60 * 1000;
  return new Date(now.getTime() - timezoneOffsetInMs).toISOString().slice(0, 10);
}

const todayIsoDate = getLocalInputDate();

export default function LossPredictionSection() {
  const [studies, setStudies] = useState<StudyOption[]>([]);
  const [supplies, setSupplies] = useState<string[]>([]);
  const [selectedStudyId, setSelectedStudyId] = useState("");
  const [selectedSupplyName, setSelectedSupplyName] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [recordSupplyName, setRecordSupplyName] = useState("");
  const [recordDate, setRecordDate] = useState(todayIsoDate);
  const [recordQuantity, setRecordQuantity] = useState("");
  const [recordNotes, setRecordNotes] = useState("");
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [loadingStudies, setLoadingStudies] = useState(true);
  const [loadingSupplies, setLoadingSupplies] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingPrediction, setLoadingPrediction] = useState(false);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [monthsAhead, setMonthsAhead] = useState("1");

  const selectedStudy = studies.find((study) => study.id === Number(selectedStudyId)) ?? null;
  const chartSeries = prediction?.chartSeries ?? [];
  const firstForecastMonth = chartSeries.find((point) => point.isForecast)?.monthKey ?? null;
  const forecastPoints = chartSeries.filter((point) => point.isForecast);

  const loadPrediction = useCallback(async () => {
    if (!selectedStudyId || !selectedSupplyName) {
      setPrediction(null);
      return;
    }

    setLoadingPrediction(true);
    const params = new URLSearchParams({
      studyId: selectedStudyId,
      supplyName: selectedSupplyName,
      monthsAhead,
    });
    if (fromDate) params.set("fromDate", fromDate);
    if (toDate) params.set("toDate", toDate);

    const res = await fetch(`/api/loss-predictions/predict?${params.toString()}`, { method: "GET", cache: "no-store" });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json) {
      toast.error(getMessage(json, "No se pudo calcular la prediccion."));
      setPrediction(null);
      setLoadingPrediction(false);
      return;
    }

    setPrediction(json as PredictionResponse);
    setLoadingPrediction(false);
  }, [fromDate, monthsAhead, selectedStudyId, selectedSupplyName, toDate]);

  const loadHistory = useCallback(async () => {
    if (!selectedStudyId) {
      setHistory(null);
      return;
    }

    setLoadingHistory(true);
    const params = new URLSearchParams({ studyId: selectedStudyId });
    if (selectedSupplyName) params.set("supplyName", selectedSupplyName);
    if (fromDate) params.set("fromDate", fromDate);
    if (toDate) params.set("toDate", toDate);

    const res = await fetch(`/api/loss-predictions/history?${params.toString()}`, { method: "GET", cache: "no-store" });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json) {
      toast.error(getMessage(json, "No se pudo cargar el historico."));
      setHistory(null);
      setLoadingHistory(false);
      return;
    }

    setHistory(json as HistoryResponse);
    setLoadingHistory(false);
  }, [fromDate, selectedStudyId, selectedSupplyName, toDate]);

  const loadSupplies = useCallback(async (studyId: string) => {
    if (!studyId) {
      setSupplies([]);
      return;
    }

    setLoadingSupplies(true);
    const res = await fetch(`/api/loss-predictions/supplies?studyId=${studyId}`, { method: "GET", cache: "no-store" });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json) {
      toast.error(getMessage(json, "No se pudieron cargar los insumos."));
      setSupplies([]);
      setLoadingSupplies(false);
      return;
    }

    const nextSupplies = Array.isArray((json as { data?: unknown }).data) ? ((json as { data: string[] }).data) : [];
    setSupplies(nextSupplies);
    setSelectedSupplyName((current) => (current && nextSupplies.includes(current) ? current : ""));
    setLoadingSupplies(false);
  }, []);

  const loadStudies = useCallback(async () => {
    setLoadingStudies(true);
    const res = await fetch("/api/loss-predictions/studies", { method: "GET", cache: "no-store" });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json) {
      toast.error(getMessage(json, "No se pudieron cargar los servicios y paquetes."));
      setStudies([]);
      setLoadingStudies(false);
      return;
    }

    const data = Array.isArray((json as { data?: unknown }).data) ? ((json as { data: StudyOption[] }).data) : [];
    setStudies(data);
    setSelectedStudyId((current) => current || (data[0] ? String(data[0].id) : ""));
    setLoadingStudies(false);
  }, []);

  const handleRefresh = async () => {
    await loadStudies();
    if (selectedStudyId) {
      await loadSupplies(selectedStudyId);
      await loadHistory();
      if (selectedSupplyName) {
        await loadPrediction();
      }
    }
  };

  const handleSeedSample = async () => {
    setSeeding(true);
    const res = await fetch("/api/loss-predictions/seed-sample", { method: "POST" });
    const json = await res.json().catch(() => null);

    if (!res.ok || !json) {
      toast.error(getMessage(json, "No se pudo generar el historico de perdidas."));
      setSeeding(false);
      return;
    }

    const payload = json as { data?: { inserted?: number; skipped?: number; periodsGenerated?: number } };
    const inserted = payload.data?.inserted ?? 0;
    const skipped = payload.data?.skipped ?? 0;
    const periodsGenerated = payload.data?.periodsGenerated ?? 0;

    toast.success(`${inserted} registros cargados. ${skipped} omitidos. ${periodsGenerated} periodos listos para analizar.`);
    await handleRefresh();
    setSeeding(false);
  };

  const handleCreateRecord = async () => {
    if (!selectedStudyId) return toast.error("Selecciona un servicio o paquete.");
    if (!recordSupplyName.trim()) return toast.error("Ingresa el insumo.");
    if (!recordQuantity || Number(recordQuantity) <= 0) return toast.error("La cantidad debe ser mayor a cero.");

    setSaving(true);
    const res = await fetch("/api/loss-predictions/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: recordDate,
        studyId: Number(selectedStudyId),
        supplyName: recordSupplyName.trim(),
        quantityLoss: Number(recordQuantity),
        notes: recordNotes.trim() || undefined,
      }),
    });

    const json = await res.json().catch(() => null);
    if (!res.ok || !json) {
      toast.error(getMessage(json, "No se pudo registrar la perdida."));
      setSaving(false);
      return;
    }

    toast.success(getMessage(json, "Perdida registrada correctamente."));
    const nextSupplyName = recordSupplyName.trim();
    setSelectedSupplyName(nextSupplyName);
    setRecordQuantity("");
    setRecordNotes("");
    await loadSupplies(selectedStudyId);
    await loadHistory();
    await loadPrediction();
    setSaving(false);
  };

  useEffect(() => {
    void loadStudies();
  }, [loadStudies]);

  useEffect(() => {
    if (!selectedStudyId) return;
    void loadSupplies(selectedStudyId);
  }, [loadSupplies, selectedStudyId]);

  useEffect(() => {
    if (!selectedStudyId) return;
    void loadHistory();
  }, [loadHistory, selectedStudyId]);

  useEffect(() => {
    if (!selectedStudyId || !selectedSupplyName) {
      setPrediction(null);
      return;
    }
    void loadPrediction();
  }, [loadPrediction, selectedStudyId, selectedSupplyName]);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-red-100 bg-white shadow-sm">
        <div className="bg-[radial-gradient(circle_at_top_left,_rgba(239,68,68,0.14),_transparent_44%),linear-gradient(135deg,_#ffffff,_#fff7f7)] p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-red-700">
                <Sparkles className="h-3.5 w-3.5" />
                Prediccion de perdidas
              </div>
              <h1 className="mt-4 text-3xl font-bold text-gray-900">Historico y prediccion del siguiente mes por insumo</h1>
              <p className="mt-3 text-sm leading-6 text-gray-600">La vista concentra el historico mensual disponible y ajusta una tendencia exponencial con todos los meses validos para estimar el siguiente mes, junto con una sugerencia logistica para compras.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => void handleSeedSample()} disabled={seeding || loadingStudies} className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60">
                {seeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {seeding ? "Generando historial..." : "Cargar historial"}
              </button>
              <button type="button" onClick={() => void handleRefresh()} className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50">
                <RefreshCw className="h-4 w-4" />
                Actualizar
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">Filtro de analisis</h2>
          <p className="mt-1 text-sm text-gray-600">Selecciona un estudio, un insumo y el horizonte para obtener la proyeccion de los proximos meses.</p>
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            <select value={selectedStudyId} onChange={(event) => setSelectedStudyId(event.target.value)} disabled={loadingStudies} className="rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 disabled:bg-gray-100">
              {loadingStudies ? <option value="">Cargando...</option> : null}
              {!loadingStudies && studies.length === 0 ? <option value="">Sin opciones</option> : null}
              {studies.map((study) => <option key={study.id} value={study.id}>{study.name} ({study.code})</option>)}
            </select>
            <select value={selectedSupplyName} onChange={(event) => setSelectedSupplyName(event.target.value)} disabled={loadingSupplies || !selectedStudyId} className="rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 disabled:bg-gray-100">
              <option value="">{loadingSupplies ? "Cargando insumos..." : "Selecciona un insumo"}</option>
              {supplies.map((supply) => <option key={supply} value={supply}>{supply}</option>)}
            </select>
            <select value={monthsAhead} onChange={(event) => setMonthsAhead(event.target.value)} disabled={!selectedStudyId || !selectedSupplyName} className="rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 disabled:bg-gray-100">
              <option value="1">Predecir 1 mes</option>
              <option value="2">Predecir 2 meses</option>
              <option value="3">Predecir 3 meses</option>
            </select>
            <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900" />
            <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className="rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900" />
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Tipo</p><p className="mt-3 text-xl font-bold text-gray-900">{selectedStudy ? getStudyTypeLabel(selectedStudy.type) : "N/D"}</p></div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Primera prediccion</p><p className="mt-3 text-xl font-bold text-gray-900">{formatQuantity(prediction?.summary.nextMonthPrediction ?? null)}</p><p className="mt-1 text-xs text-gray-500">{prediction?.summary.nextMonthLabel ? formatMonthLabel(prediction.summary.nextMonthLabel) : "Sin calcular"}</p></div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Ultima perdida</p><p className="mt-3 text-xl font-bold text-gray-900">{formatQuantity(prediction?.summary.lastRecordedLoss ?? null)}</p></div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Tasa k</p><p className="mt-3 text-xl font-bold text-gray-900">{formatRate(prediction?.model.k ?? null)}</p><p className="mt-1 text-xs text-gray-500">Ajustada con el historico mensual completo</p></div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-red-50 p-3 text-red-600"><TrendingUp className="h-5 w-5" /></div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Registrar perdida</h2>
              <p className="mt-1 text-sm text-gray-600">Cada registro guarda fecha, servicio o paquete, insumo y cantidad de perdida.</p>
            </div>
          </div>
          <div className="mt-5 space-y-4">
            <input list="loss-supplies" value={recordSupplyName} onChange={(event) => setRecordSupplyName(event.target.value)} placeholder="Insumo perdido" className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900" />
            <datalist id="loss-supplies">{supplies.map((supply) => <option key={supply} value={supply} />)}</datalist>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <input type="date" value={recordDate} onChange={(event) => setRecordDate(event.target.value)} className="rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900" />
              <input type="number" min="0.0001" step="0.0001" value={recordQuantity} onChange={(event) => setRecordQuantity(event.target.value)} placeholder="Cantidad perdida" className="rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900" />
            </div>
            <textarea value={recordNotes} onChange={(event) => setRecordNotes(event.target.value)} rows={3} placeholder="Notas opcionales" className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900" />
            <button type="button" onClick={handleCreateRecord} disabled={saving || !selectedStudyId} className="inline-flex w-full items-center justify-center rounded-xl border border-red-500 px-4 py-3 text-sm font-semibold text-red-600 transition-colors hover:bg-red-600 hover:text-white disabled:opacity-50">
              {saving ? "Guardando..." : "Registrar perdida"}
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Historico y proyeccion</h2>
            <p className="mt-1 text-sm text-gray-600">La tendencia se calcula con todo el historico mensual y puede proyectarse hasta los proximos 3 meses para facilitar decisiones de compra.</p>
          </div>
          {(loadingHistory || loadingPrediction || seeding) ? <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-600"><Loader2 className="h-3.5 w-3.5 animate-spin" />{seeding ? "Generando historial" : "Actualizando"}</div> : null}
        </div>

        {prediction && !prediction.model.hasEnoughData ? (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{prediction.model.reason ?? "No hay suficientes datos."}</div>
        ) : null}

        <div className="mt-6 h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartSeries} margin={{ top: 12, right: 24, left: 0, bottom: 12 }}>
              <CartesianGrid stroke="#e5e7eb" strokeDasharray="4 4" />
              <XAxis dataKey="monthKey" tickFormatter={(value) => formatMonthLabel(String(value))} tick={{ fontSize: 12, fill: "#6b7280" }} />
              <YAxis tickFormatter={(value) => formatQuantity(Number(value))} tick={{ fontSize: 12, fill: "#6b7280" }} />
              <Tooltip formatter={(value, name) => formatTooltipValue(value, name)} labelFormatter={(value) => formatMonthLabel(String(value))} />
              <Legend />
              {firstForecastMonth ? <ReferenceArea x1={firstForecastMonth} x2={chartSeries[chartSeries.length - 1]?.monthKey} fill="#fee2e2" fillOpacity={0.38} /> : null}
              <Line type="monotone" dataKey="historicalLoss" name="Historico" stroke="#dc2626" strokeWidth={3} dot={{ r: 4, strokeWidth: 0 }} connectNulls />
              <Line type="monotone" dataKey="predictedLoss" name="Proyeccion" stroke="#b45309" strokeWidth={2.5} strokeDasharray="6 4" dot={{ r: 5, strokeWidth: 0 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          {forecastPoints.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500 md:col-span-3">
              Aun no hay meses proyectados para mostrar.
            </div>
          ) : (
            forecastPoints.map((point) => (
              <div key={point.monthKey} className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">Mes proyectado</p>
                <p className="mt-3 text-xl font-bold text-amber-900">{formatQuantity(point.predictedLoss)}</p>
                <p className="mt-1 text-sm text-amber-800">{formatMonthLabel(point.monthKey)}</p>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Registros</p><p className="mt-3 text-xl font-bold text-gray-900">{prediction?.summary.recordsCount ?? history?.meta.total ?? 0}</p></div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Promedio mensual</p><p className="mt-3 text-xl font-bold text-gray-900">{formatQuantity(prediction?.summary.averageMonthlyLoss ?? null)}</p></div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Total historico</p><p className="mt-3 text-xl font-bold text-gray-900">{formatQuantity(prediction?.summary.totalHistoricalLoss ?? history?.meta.totalQuantityLoss ?? null)}</p></div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Meses con datos</p><p className="mt-3 text-xl font-bold text-gray-900">{prediction?.summary.monthsWithHistory ?? 0}</p></div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Referencia inicial</p>
            <p className="mt-3 text-lg font-bold text-gray-900">{formatQuantity(prediction?.model.basePoint?.quantityLoss ?? null)}</p>
            <p className="mt-1 text-sm text-gray-600">{prediction?.model.basePoint?.label ?? "Sin dato"} · {formatDate(prediction?.model.basePoint?.date ?? null)}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Referencia final</p>
            <p className="mt-3 text-lg font-bold text-gray-900">{formatQuantity(prediction?.model.comparisonPoint?.quantityLoss ?? null)}</p>
            <p className="mt-1 text-sm text-gray-600">{prediction?.model.comparisonPoint?.label ?? "Sin dato"} · {formatDate(prediction?.model.comparisonPoint?.date ?? null)}</p>
            <p className="mt-2 text-xs text-gray-500">Ventana usada por el ajuste: {prediction?.model.basePoint && prediction?.model.comparisonPoint ? formatPeriodDistance(prediction.model.comparisonPoint.period - prediction.model.basePoint.period) : "N/D"}</p>
          </div>
        </div>

        <div className={`mt-4 rounded-2xl border p-5 ${getSuggestionStyles(prediction?.logisticsSuggestion.level)}`}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em]">Sugerencia logistica</p>
          <h3 className="mt-3 text-lg font-bold">{prediction?.logisticsSuggestion.title ?? "Sin recomendacion disponible"}</h3>
          <p className="mt-2 text-sm leading-6">{prediction?.logisticsSuggestion.message ?? "Selecciona un insumo con suficiente historico para generar una recomendacion."}</p>
          {prediction?.logisticsSuggestion.recommendedAction ? <p className="mt-3 text-sm font-semibold">Accion sugerida: {prediction.logisticsSuggestion.recommendedAction}</p> : null}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">Historico de perdidas</h2>
        <p className="mt-1 text-sm text-gray-600">Consulta por rango de fechas, servicio o paquete e insumo.</p>
        <div className="mt-5 overflow-x-auto rounded-2xl border border-gray-200">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Fecha</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Servicio o paquete</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Tipo</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Insumo</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Perdida</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Capturado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loadingHistory ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Cargando historico...</td></tr>
              ) : (history?.data ?? []).length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Todavia no hay perdidas registradas con los filtros seleccionados.</td></tr>
              ) : (
                history?.data.map((record) => (
                  <tr key={record.id}>
                    <td className="px-4 py-3 text-gray-700">{formatDate(record.date)}</td>
                    <td className="px-4 py-3 text-gray-900">{record.studyName}</td>
                    <td className="px-4 py-3 text-gray-700">{getStudyTypeLabel(record.studyType)}</td>
                    <td className="px-4 py-3 text-gray-700">{record.supplyName}</td>
                    <td className="px-4 py-3 font-semibold text-red-700">{formatQuantity(record.quantityLoss)}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(record.createdAt, true)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
