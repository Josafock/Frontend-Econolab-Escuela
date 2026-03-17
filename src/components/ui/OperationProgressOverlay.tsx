'use client';

type OperationProgressOverlayProps = {
  open: boolean;
  title: string;
  description: string;
  progress?: number;
};

export default function OperationProgressOverlay({
  open,
  title,
  description,
  progress,
}: OperationProgressOverlayProps) {
  if (!open) return null;

  const safeProgress = typeof progress === 'number' ? Math.max(0, Math.min(100, progress)) : null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-[28px] border border-white/50 bg-white shadow-2xl">
        <div className="bg-[radial-gradient(circle_at_top_left,_rgba(239,68,68,0.22),_transparent_42%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.16),_transparent_40%)] px-6 py-6">
          <div className="flex items-center gap-4">
            <div className="relative flex h-20 w-20 items-center justify-center">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background:
                    safeProgress === null
                      ? 'conic-gradient(from 0deg, rgba(239,68,68,0.18), rgba(14,165,233,0.7), rgba(239,68,68,0.18))'
                      : `conic-gradient(from 0deg, #ef4444 ${safeProgress}%, rgba(226,232,240,0.95) ${safeProgress}% 100%)`,
                }}
              />
              <div className="absolute inset-[7px] rounded-full bg-white" />
              <div className="relative text-center">
                <div className="text-lg font-semibold text-slate-900">
                  {safeProgress === null ? '...' : `${Math.round(safeProgress)}%`}
                </div>
                <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Proceso</div>
              </div>
            </div>

            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-red-500 via-orange-400 to-sky-500 transition-all duration-300"
              style={{ width: `${safeProgress ?? 72}%` }}
            />
          </div>

          <div className="mt-3 flex gap-1.5">
            <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-red-400 [animation-delay:-0.25s]" />
            <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-orange-400 [animation-delay:-0.15s]" />
            <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-sky-500" />
          </div>
        </div>
      </div>
    </div>
  );
}
