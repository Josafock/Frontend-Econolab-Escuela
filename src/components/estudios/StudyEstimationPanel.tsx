"use client";

import { BrainCircuit, Calculator, DollarSign } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import {
  estimateStudy,
  type StudyEstimation,
  type StudyType,
} from "@/features/studies/api/studies";

type StudyEstimationPanelProps = {
  type: StudyType;
  method: string;
  disabled?: boolean;
  onApply: (estimation: StudyEstimation) => void;
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function StudyEstimationPanel({
  type,
  method,
  disabled = false,
  onApply,
}: StudyEstimationPanelProps) {
  const [parameterCount, setParameterCount] = useState("8");
  const [isEstimating, setIsEstimating] = useState(false);
  const [estimation, setEstimation] = useState<StudyEstimation | null>(null);

  const handleEstimate = async () => {
    const parsedParameterCount = Number(parameterCount);
    if (
      !Number.isInteger(parsedParameterCount) ||
      parsedParameterCount < 0 ||
      parsedParameterCount > 500
    ) {
      toast.error("Captura un número de parámetros entre 0 y 500.");
      return;
    }

    setIsEstimating(true);
    const response = await estimateStudy({
      type,
      parameterCount: parsedParameterCount,
      method: method.trim() || undefined,
    });
    setIsEstimating(false);

    if (!response.ok) {
      toast.error(response.errors[0] ?? "No se pudo calcular la estimación.");
      return;
    }

    setEstimation(response.data.data);
  };

  return (
    <section className="rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 via-white to-white p-4">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-red-600 text-white shadow-sm">
            <BrainCircuit className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-semibold text-gray-900">
              Estimación con regresión lineal
            </h3>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-gray-600">
              El modelo usa estudios anteriores para sugerir el precio normal.
              El valor se puede modificar antes de registrar.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="text-xs font-medium text-gray-700">
            Número estimado de parámetros
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
            {isEstimating ? "Calculando..." : "Calcular estimación"}
          </button>
        </div>
      </div>

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
              Rango: {formatMoney(estimation.priceRange.min)} –{" "}
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
            Modelo entrenado con {estimation.model.trainingSamples} estudios.
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
