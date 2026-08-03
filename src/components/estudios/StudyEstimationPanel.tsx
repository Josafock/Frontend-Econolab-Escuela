"use client";

import { BrainCircuit, Calculator, DollarSign } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  estimateStudy,
  type StudyEstimation,
  type StudySampleType,
  type StudyType,
} from "@/features/studies/api/studies";

type StudyEstimationPanelProps = {
  type: StudyType;
  method: string;
  durationMinutes: number;
  sampleType: StudySampleType;
  requiresSpecialProcessing?: boolean | null;
  disabled?: boolean;
  onApply: (estimation: StudyEstimation) => void;
};

const SAMPLE_TYPE_LABELS: Record<StudySampleType, string> = {
  unknown: "Sin especificar",
  blood: "Sangre total",
  serum: "Suero",
  plasma: "Plasma",
  urine: "Orina",
  stool: "Heces",
  swab: "Hisopo",
  other: "Otra / sin especificar",
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDuration(minutes: number) {
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return "Sin especificar";
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours > 0 && remainingMinutes > 0) {
    return `${hours} h ${remainingMinutes} min`;
  }

  if (hours > 0) {
    return `${hours} h`;
  }

  return `${remainingMinutes} min`;
}

function formatMethod(method: string) {
  const trimmedMethod = method.trim();
  return trimmedMethod || "Sin especificar";
}

function formatSpecialProcessing(value?: boolean | null) {
  if (value == null) {
    return "Sin especificar";
  }

  return value ? "Si requiere" : "No requiere";
}

export default function StudyEstimationPanel({
  type,
  method,
  durationMinutes,
  sampleType,
  requiresSpecialProcessing,
  disabled = false,
  onApply,
}: StudyEstimationPanelProps) {
  const [parameterCount, setParameterCount] = useState("8");
  const [isEstimating, setIsEstimating] = useState(false);
  const [estimation, setEstimation] = useState<StudyEstimation | null>(null);

  useEffect(() => {
    setEstimation(null);
  }, [
    durationMinutes,
    method,
    parameterCount,
    requiresSpecialProcessing,
    sampleType,
    type,
  ]);

  const handleEstimate = async () => {
    const parsedParameterCount = Number(parameterCount);
    if (
      !Number.isInteger(parsedParameterCount) ||
      parsedParameterCount < 0 ||
      parsedParameterCount > 500
    ) {
      toast.error("Captura un numero de parametros entre 0 y 500.");
      return;
    }

    setIsEstimating(true);
    const response = await estimateStudy({
      type,
      parameterCount: parsedParameterCount,
      durationMinutes,
      method: method.trim() || undefined,
      sampleType,
      requiresSpecialProcessing,
    });
    setIsEstimating(false);

    if (!response.ok) {
      toast.error(response.errors[0] ?? "No se pudo calcular la estimacion.");
      return;
    }

    setEstimation(response.data.data);
  };

  const predictors = [
    {
      label: "Numero de parametros",
      value: parameterCount.trim() || "Sin capturar",
    },
    {
      label: "Duracion",
      value: formatDuration(durationMinutes),
    },
    {
      label: "Metodo",
      value: formatMethod(method),
    },
    {
      label: "Tipo de muestra",
      value: SAMPLE_TYPE_LABELS[sampleType] ?? "Sin especificar",
    },
    {
      label: "Procesamiento especial",
      value: formatSpecialProcessing(requiresSpecialProcessing),
    },
  ];

  return (
    <section className="rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 via-white to-white p-4">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-red-600 text-white shadow-sm">
            <BrainCircuit className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-semibold text-gray-900">
              Estimacion con regresion Ridge
            </h3>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-gray-600">
              El modelo entrenado y validado usa el catalogo historico para
              sugerir el precio normal. El valor se puede modificar antes de
              registrar.
            </p>
            <p className="mt-2 text-xs leading-5 text-gray-500">
              Esta prediccion usa 5 variables: numero de parametros, duracion,
              metodo, tipo de muestra y procesamiento especial.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:min-w-52 sm:items-end">
          <label className="text-xs font-medium text-gray-700">
            Numero estimado de parametros
            <input
              type="number"
              min="0"
              max="500"
              step="1"
              value={parameterCount}
              onChange={(event) => setParameterCount(event.target.value)}
              className="mt-1 block w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 sm:w-44"
              disabled={disabled || isEstimating}
            />
          </label>
          <button
            type="button"
            onClick={handleEstimate}
            disabled={disabled || isEstimating}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Calculator className="h-4 w-4" />
            {isEstimating ? "Calculando..." : "Calcular estimacion"}
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {predictors.map((predictor) => (
          <div
            key={predictor.label}
            className="rounded-xl border border-white/80 bg-white/90 p-3 shadow-sm"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
              {predictor.label}
            </p>
            <p className="mt-1 text-sm font-semibold text-gray-900">
              {predictor.value}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-3 text-xs leading-5 text-gray-500">
        Captura los datos del estudio en el formulario y despues calcula la
        estimacion. Si algun campo queda sin especificar, el modelo usara la
        referencia general aprendida en entrenamiento.
      </p>

      {estimation ? (
        <div className="mt-4 grid gap-3 border-t border-red-100 pt-4 lg:grid-cols-[1fr_auto]">
          <div className="rounded-xl border border-gray-200 bg-white p-3">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <DollarSign className="h-4 w-4 text-red-600" /> Precio sugerido
            </div>
            <p className="mt-1 text-2xl font-semibold text-gray-900">
              {formatMoney(estimation.suggestedNormalPrice)}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Rango: {formatMoney(estimation.priceRange.min)} a{" "}
              {formatMoney(estimation.priceRange.max)}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onApply(estimation)}
            disabled={disabled}
            className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
          >
            Usar precio sugerido
          </button>
          <p className="text-xs text-gray-500 lg:col-span-2">
            Modelo entrenado con {estimation.model.trainingSamples} estudios y
            evaluado con {estimation.model.testSamples} diferentes (MAE: {"$"}
            {estimation.model.priceMeanAbsoluteError.toFixed(2)} MXN).
          </p>
          {estimation.warnings.length > 0 ? (
            <p className="text-xs leading-5 text-amber-700 lg:col-span-2">
              Nota sobre los datos: {estimation.warnings.join(" ")}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
