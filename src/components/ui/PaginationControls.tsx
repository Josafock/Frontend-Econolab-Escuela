"use client";

type PaginationControlsProps = {
  page: number;
  limit: number;
  total: number;
  itemLabel: string;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
};

const LIMIT_OPTIONS = [10, 20, 50, 100];

export default function PaginationControls({
  page,
  limit,
  total,
  itemLabel,
  onPageChange,
  onLimitChange,
}: PaginationControlsProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex flex-col gap-4 border-t border-gray-200 bg-gray-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-3 text-sm text-gray-600 md:flex-row md:items-center">
        <p>
          Mostrando registros del <span className="font-semibold">{from}</span>{" "}
          al <span className="font-semibold">{to}</span> de un total de{" "}
          <span className="font-semibold">{total}</span> {itemLabel}
        </p>

        <label className="inline-flex items-center gap-2">
          <span>Mostrar</span>
          <select
            value={limit}
            onChange={(event) => onLimitChange(Number(event.target.value))}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
          >
            {LIMIT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <span>{itemLabel}</span>
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 self-stretch sm:self-auto">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="app-interactive-button rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-red-200 hover:bg-gray-100 hover:shadow-md hover:shadow-red-100/50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Anterior
        </button>

        <span className="inline-flex min-w-10 items-center justify-center rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white">
          {page}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="app-interactive-button rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-red-200 hover:bg-gray-100 hover:shadow-md hover:shadow-red-100/50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
