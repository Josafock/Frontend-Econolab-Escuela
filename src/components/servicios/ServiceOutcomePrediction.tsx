"use client";

import { Info, Loader2, Sparkles } from "lucide-react";
import type {
  ServiceOutcome,
  ServiceOutcomePrediction as ServiceOutcomePredictionResult,
} from "@/features/services/api/services";

export type ServiceOutcomePredictionVariant = "panel" | "badge";

export type ServiceOutcomePredictionProps = {
  prediction?: ServiceOutcomePredictionResult | null;
  loading?: boolean;
  variant?: ServiceOutcomePredictionVariant;
  className?: string;
};

function joinClassNames(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(" ");
}

function asPercentage(value: number) {
  if (!Number.isFinite(value)) return 0;
  const percentage = Math.abs(value) <= 1 ? value * 100 : value;
  return Math.min(100, Math.max(0, percentage));
}

function formatPercentage(value: number) {
  return `${new Intl.NumberFormat("es-MX", {
    maximumFractionDigits: 0,
  }).format(asPercentage(value))} %`;
}

function getOutcomeClasses(outcome: ServiceOutcome) {
  const classes: Record<ServiceOutcome, string> = {
    completed_on_time: "border-gray-300 bg-white text-gray-900",
    delayed: "border-red-200 bg-red-50 text-red-700",
    cancelled: "border-gray-900 bg-gray-900 text-white",
  };

  return classes[outcome];
}

function PredictionBadge({
  prediction,
  loading,
  className,
}: Omit<ServiceOutcomePredictionProps, "variant">) {
  if (loading) {
    return (
      <span
        role="status"
        className={joinClassNames(
          "inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-600",
          className,
        )}
      >
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        Calculando pronóstico...
      </span>
    );
  }

  if (!prediction?.available) {
    const message =
      prediction?.message ?? "Predicción no disponible por el momento.";

    return (
      <span
        role="status"
        title={message}
        className={joinClassNames(
          "inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-500",
          className,
        )}
      >
        <Info className="h-3.5 w-3.5" aria-hidden="true" />
        Pronóstico no disponible
      </span>
    );
  }

  return (
    <span
      role="status"
      title="Estimación basada en servicios anteriores; no sustituye el estatus real."
      className={joinClassNames(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
        getOutcomeClasses(prediction.predictedOutcome),
        className,
      )}
    >
      <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
      Probable: {prediction.label} · {formatPercentage(prediction.confidence)}
    </span>
  );
}

function PredictionPanel({
  prediction,
  loading,
  className,
}: Omit<ServiceOutcomePredictionProps, "variant">) {
  return (
    <section
      aria-live="polite"
      className={joinClassNames(
        "rounded-[1.75rem] border border-red-100 bg-gradient-to-br from-red-50 via-white to-white p-5 shadow-sm",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gray-950 text-white shadow-sm">
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          ) : (
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          )}
        </span>
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-950">Pronóstico informativo</h3>
          <p className="mt-1 text-xs leading-5 text-gray-600">
            Estimación basada en servicios anteriores. No cambia el estatus real
            de este servicio.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-gray-200 bg-white p-4 text-sm font-medium text-gray-600">
          <Loader2
            className="h-4 w-4 animate-spin text-red-600"
            aria-hidden="true"
          />
          Calculando el resultado más probable...
        </div>
      ) : !prediction?.available ? (
        <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <Info className="h-4 w-4 text-red-600" aria-hidden="true" />
            Predicción no disponible
          </p>
          <p className="mt-2 text-xs leading-5 text-gray-600">
            {prediction?.message ??
              "Aún no hay información suficiente para generar una estimación."}
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
              Resultado más probable
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <span
                className={joinClassNames(
                  "inline-flex rounded-full border px-3 py-1.5 text-sm font-semibold",
                  getOutcomeClasses(prediction.predictedOutcome),
                )}
              >
                {prediction.label}
              </span>
              <p className="text-sm text-gray-600">
                Confianza estimada:{" "}
                <strong className="text-gray-950">
                  {formatPercentage(prediction.confidence)}
                </strong>
              </p>
            </div>
          </div>

          {prediction.probabilities.length > 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                Probabilidad por resultado
              </p>
              <div className="mt-4 space-y-3">
                {prediction.probabilities.map((item) => {
                  const percentage = asPercentage(item.probability);

                  return (
                    <div key={item.outcome}>
                      <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                        <span className="font-medium text-gray-700">
                          {item.label}
                        </span>
                        <span className="font-semibold text-gray-950">
                          {formatPercentage(item.probability)}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-red-600 transition-[width]"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          <p className="text-xs leading-5 text-gray-500">
            El pronóstico puede cambiar si se modifican los estudios, importes o
            fechas del servicio.
          </p>
        </div>
      )}
    </section>
  );
}

export default function ServiceOutcomePrediction({
  variant = "panel",
  ...props
}: ServiceOutcomePredictionProps) {
  // Componente reutilizable que convierte la respuesta del modelo en un panel
  // detallado (formulario) o una insignia compacta (listado).
  return variant === "badge" ? (
    <PredictionBadge {...props} />
  ) : (
    <PredictionPanel {...props} />
  );
}
