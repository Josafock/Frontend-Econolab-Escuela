'use client';

import OperationProgressOverlay from '@/components/ui/OperationProgressOverlay';
import { Download, FileSpreadsheet, FileUp, RefreshCcw, UploadCloud, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

type TransferModule = 'patients' | 'doctors' | 'studies';

type ImportPreviewRow = {
  rowNumber: number;
  action: 'create' | 'update' | 'skip';
  duplicate: boolean;
  duplicateSource?: 'database' | 'file';
  summary: string;
  matchLabel?: string | null;
  errors: string[];
  raw: Record<string, string>;
};

type ImportPreviewResult = {
  message: string;
  headers: string[];
  summary: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    toCreate: number;
    toUpdate: number;
    skipped: number;
    duplicatesInFile: number;
    duplicatesInDatabase: number;
  };
  rows: ImportPreviewRow[];
};

type ImportExecutionResult = {
  message: string;
  created: number;
  updated: number;
  skipped: number;
  invalid: number;
  duplicatesInFile: number;
  duplicatesInDatabase: number;
};

type DataTransferPanelProps = {
  moduleKey: TransferModule;
  moduleLabel: string;
  moduleLabelPlural: string;
  templateHeaders: string[];
  onImported?: () => Promise<void> | void;
};

type BusyState = {
  open: boolean;
  title: string;
  description: string;
};

function getErrorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === 'object') {
    const candidate = payload as { errors?: unknown; message?: unknown };
    if (Array.isArray(candidate.errors) && typeof candidate.errors[0] === 'string') {
      return candidate.errors[0];
    }
    if (typeof candidate.message === 'string') {
      return candidate.message;
    }
  }

  return fallback;
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  window.URL.revokeObjectURL(url);
}

export default function DataTransferPanel({
  moduleKey,
  moduleLabel,
  moduleLabelPlural,
  templateHeaders,
  onImported,
}: DataTransferPanelProps) {
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [exportMode, setExportMode] = useState<'data' | 'template'>('data');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreviewResult | null>(null);
  const [busyState, setBusyState] = useState<BusyState>({
    open: false,
    title: '',
    description: '',
  });
  const [progress, setProgress] = useState(14);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (!busyState.open) return undefined;

    setProgress(16);
    const timer = window.setInterval(() => {
      setProgress((value) => (value >= 92 ? value : value + Math.max(2, (92 - value) / 6)));
    }, 180);

    return () => window.clearInterval(timer);
  }, [busyState.open]);

  const importableRows = useMemo(
    () => preview?.rows.filter((row) => row.action === 'create' || row.action === 'update').length ?? 0,
    [preview],
  );

  const resetImportState = () => {
    setSelectedFile(null);
    setPreview(null);
    setIsPreviewing(false);
    setIsImporting(false);
  };

  const closeImportModal = () => {
    resetImportState();
    setShowImportModal(false);
  };

  const handleTemplateDownload = () => {
    const content = `${templateHeaders.join(',')}\n`;
    downloadBlob(new Blob([content], { type: 'text/csv;charset=utf-8' }), `${moduleKey}-template.csv`);
    toast.success(`Plantilla de ${moduleLabelPlural.toLowerCase()} descargada.`);
  };

  const handleExport = async () => {
    setBusyState({
      open: true,
      title: 'Preparando exportacion',
      description: `Estamos reuniendo los datos de ${moduleLabelPlural.toLowerCase()} para descargarlos.`,
    });
    setIsExporting(true);

    try {
      if (exportMode === 'template') {
        handleTemplateDownload();
        return;
      }

      const res = await fetch(`/api/data-transfer/${moduleKey}/export`, {
        method: 'GET',
        cache: 'no-store',
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(getErrorMessage(payload, `No se pudo exportar ${moduleLabelPlural.toLowerCase()}.`));
      }

      const blob = await res.blob();
      const fileName =
        res.headers
          .get('content-disposition')
          ?.match(/filename="?([^"]+)"?/)?.[1] ?? `${moduleKey}-export.csv`;

      downloadBlob(blob, fileName);
      toast.success(`Exportacion de ${moduleLabelPlural.toLowerCase()} lista para descarga.`);
      setShowExportModal(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo completar la exportacion.');
    } finally {
      setProgress(100);
      window.setTimeout(() => {
        setBusyState({ open: false, title: '', description: '' });
        setIsExporting(false);
      }, 220);
    }
  };

  const handlePreview = async () => {
    if (!selectedFile) {
      toast.error('Selecciona un archivo CSV para previsualizar.');
      return;
    }

    setBusyState({
      open: true,
      title: 'Analizando archivo',
      description: `Estamos revisando duplicados, filas nuevas y cambios para ${moduleLabelPlural.toLowerCase()}.`,
    });
    setIsPreviewing(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await fetch(`/api/data-transfer/${moduleKey}/preview`, {
        method: 'POST',
        body: formData,
      });

      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(getErrorMessage(payload, 'No se pudo generar la previsualizacion.'));
      }

      setPreview(payload as ImportPreviewResult);
      toast.success(`Previsualizacion de ${moduleLabelPlural.toLowerCase()} generada.`);
    } catch (error) {
      setPreview(null);
      toast.error(error instanceof Error ? error.message : 'No se pudo analizar el archivo.');
    } finally {
      setProgress(100);
      window.setTimeout(() => {
        setBusyState({ open: false, title: '', description: '' });
        setIsPreviewing(false);
      }, 220);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error('Selecciona un archivo CSV.');
      return;
    }

    if (!preview) {
      toast.error('Primero genera la previsualizacion antes de importar.');
      return;
    }

    setBusyState({
      open: true,
      title: 'Importando informacion',
      description: `Estamos aplicando los cambios confirmados en ${moduleLabelPlural.toLowerCase()}.`,
    });
    setIsImporting(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await fetch(`/api/data-transfer/${moduleKey}/import`, {
        method: 'POST',
        body: formData,
      });

      const payload = (await res.json().catch(() => ({}))) as ImportExecutionResult | { errors?: string[]; message?: string };

      if (!res.ok) {
        throw new Error(getErrorMessage(payload, 'No se pudo completar la importacion.'));
      }

      const result = payload as ImportExecutionResult;
      toast.success(
        `${result.message} ${result.created} nuevos, ${result.updated} actualizados, ${result.skipped} omitidos.`,
      );

      closeImportModal();
      await onImported?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo importar el archivo.');
    } finally {
      setProgress(100);
      window.setTimeout(() => {
        setBusyState({ open: false, title: '', description: '' });
        setIsImporting(false);
      }, 220);
    }
  };

  const getActionStyles = (action: ImportPreviewRow['action']) => {
    if (action === 'create') return 'bg-emerald-100 text-emerald-800';
    if (action === 'update') return 'bg-amber-100 text-amber-800';
    return 'bg-slate-200 text-slate-700';
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setShowExportModal(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
        >
          <Download size={18} />
          Exportar
        </button>

        <button
          type="button"
          onClick={() => setShowImportModal(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-red-500 bg-red-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-red-700"
        >
          <UploadCloud size={18} />
          Importar
        </button>
      </div>

      {showExportModal ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-[28px] border border-white/50 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h3 className="text-xl font-semibold text-slate-950">Exportar {moduleLabelPlural}</h3>
                <p className="mt-1 text-sm text-slate-500">Elige si quieres descargar los datos actuales o solo una plantilla vacia.</p>
              </div>
              <button type="button" onClick={() => setShowExportModal(false)} className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 px-6 py-6">
              <label className={`block cursor-pointer rounded-2xl border p-4 transition ${exportMode === 'data' ? 'border-sky-300 bg-sky-50' : 'border-slate-200 bg-white'}`}>
                <input
                  type="radio"
                  className="sr-only"
                  checked={exportMode === 'data'}
                  onChange={() => setExportMode('data')}
                />
                <div className="flex items-start gap-3">
                  <FileSpreadsheet className="mt-0.5 text-sky-600" size={20} />
                  <div>
                    <div className="font-medium text-slate-900">Datos activos</div>
                    <div className="mt-1 text-sm text-slate-500">Descarga los registros actuales del modulo en formato CSV.</div>
                  </div>
                </div>
              </label>

              <label className={`block cursor-pointer rounded-2xl border p-4 transition ${exportMode === 'template' ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
                <input
                  type="radio"
                  className="sr-only"
                  checked={exportMode === 'template'}
                  onChange={() => setExportMode('template')}
                />
                <div className="flex items-start gap-3">
                  <FileUp className="mt-0.5 text-emerald-600" size={20} />
                  <div>
                    <div className="font-medium text-slate-900">Plantilla CSV</div>
                    <div className="mt-1 text-sm text-slate-500">Genera una cabecera vacia para capturar datos y luego importarlos.</div>
                  </div>
                </div>
              </label>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-5">
              <button type="button" onClick={() => setShowExportModal(false)} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExport}
                disabled={isExporting}
                className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                {isExporting ? 'Preparando...' : 'Continuar'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showImportModal ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm">
          <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[30px] border border-white/50 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h3 className="text-xl font-semibold text-slate-950">Importar {moduleLabelPlural}</h3>
                <p className="mt-1 text-sm text-slate-500">Sube un CSV, revisa la previsualizacion y confirma solo cuando estes listo.</p>
              </div>
              <button type="button" onClick={closeImportModal} className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-6 overflow-y-auto px-6 py-6 lg:grid-cols-[320px_minmax(0,1fr)]">
              <div className="space-y-4">
                <div className="rounded-3xl border border-slate-200 bg-[linear-gradient(180deg,#fff,#f8fafc)] p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-red-50 p-3 text-red-600">
                      <UploadCloud size={22} />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Archivo CSV</p>
                      <p className="text-sm text-slate-500">Solo se aceptan archivos `.csv`.</p>
                    </div>
                  </div>

                  <label className="mt-5 block cursor-pointer rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-center transition hover:border-red-300 hover:bg-red-50/40">
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      className="sr-only"
                      onChange={(event) => {
                        const file = event.target.files?.[0] ?? null;
                        setSelectedFile(file);
                        setPreview(null);
                      }}
                    />
                    <div className="text-sm font-medium text-slate-700">
                      {selectedFile ? selectedFile.name : `Seleccionar CSV de ${moduleLabelPlural.toLowerCase()}`}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {selectedFile ? `${Math.round(selectedFile.size / 1024)} KB` : 'Haz clic para elegir un archivo'}
                    </div>
                  </label>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handlePreview}
                      disabled={!selectedFile || isPreviewing}
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
                    >
                      <RefreshCcw size={16} />
                      {isPreviewing ? 'Analizando...' : 'Previsualizar'}
                    </button>
                    <button
                      type="button"
                      onClick={handleImport}
                      disabled={!preview || importableRows === 0 || isImporting}
                      className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
                    >
                      <UploadCloud size={16} />
                      {isImporting ? 'Importando...' : 'Confirmar importacion'}
                    </button>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-medium text-slate-900">Flujo recomendado</p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-600">
                    <li>1. Descarga la plantilla o un export existente.</li>
                    <li>2. Completa y guarda tu archivo en formato CSV.</li>
                    <li>3. Previsualiza para detectar duplicados o errores.</li>
                    <li>4. Confirma solo las filas listas para procesarse.</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                {preview ? (
                  <>
                    <div className="grid gap-3 md:grid-cols-4">
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                        <div className="text-xs uppercase tracking-[0.2em] text-emerald-700">Nuevos</div>
                        <div className="mt-2 text-2xl font-semibold text-emerald-900">{preview.summary.toCreate}</div>
                      </div>
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                        <div className="text-xs uppercase tracking-[0.2em] text-amber-700">Actualizar</div>
                        <div className="mt-2 text-2xl font-semibold text-amber-900">{preview.summary.toUpdate}</div>
                      </div>
                      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                        <div className="text-xs uppercase tracking-[0.2em] text-rose-700">Omitidos</div>
                        <div className="mt-2 text-2xl font-semibold text-rose-900">{preview.summary.skipped}</div>
                      </div>
                      <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
                        <div className="text-xs uppercase tracking-[0.2em] text-sky-700">Duplicados</div>
                        <div className="mt-2 text-2xl font-semibold text-sky-900">
                          {preview.summary.duplicatesInDatabase + preview.summary.duplicatesInFile}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200">
                      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
                        <div>
                          <h4 className="font-medium text-slate-900">Resumen de importacion</h4>
                          <p className="text-sm text-slate-500">
                            {preview.summary.totalRows} filas revisadas para {moduleLabelPlural.toLowerCase()}.
                          </p>
                        </div>
                        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                          {importableRows} filas listas
                        </div>
                      </div>

                      <div className="max-h-[420px] overflow-auto">
                        <table className="min-w-full text-sm">
                          <thead className="bg-slate-50 text-left text-slate-600">
                            <tr>
                              <th className="px-4 py-3 font-medium">Fila</th>
                              <th className="px-4 py-3 font-medium">Registro</th>
                              <th className="px-4 py-3 font-medium">Accion</th>
                              <th className="px-4 py-3 font-medium">Coincidencia</th>
                              <th className="px-4 py-3 font-medium">Detalle</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 bg-white">
                            {preview.rows.map((row) => (
                              <tr key={`${row.rowNumber}-${row.summary}`}>
                                <td className="px-4 py-3 align-top text-slate-500">{row.rowNumber}</td>
                                <td className="px-4 py-3 align-top">
                                  <div className="font-medium text-slate-900">{row.summary || `${moduleLabel} sin descripcion`}</div>
                                  <div className="mt-1 text-xs text-slate-500">
                                    {row.duplicate
                                      ? row.duplicateSource === 'database'
                                        ? 'Duplicado encontrado en base de datos'
                                        : 'Duplicado dentro del archivo'
                                      : 'Sin coincidencias detectadas'}
                                  </div>
                                </td>
                                <td className="px-4 py-3 align-top">
                                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${getActionStyles(row.action)}`}>
                                    {row.action}
                                  </span>
                                </td>
                                <td className="px-4 py-3 align-top text-slate-600">
                                  {row.matchLabel || 'Nuevo registro'}
                                </td>
                                <td className="px-4 py-3 align-top text-slate-600">
                                  {row.errors.length > 0 ? row.errors.join(' ') : 'Listo para procesarse.'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex h-full min-h-[360px] items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                    <div className="max-w-md">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-slate-500 shadow-sm">
                        <FileSpreadsheet size={28} />
                      </div>
                      <h4 className="mt-5 text-lg font-semibold text-slate-900">Previsualizacion pendiente</h4>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        Cuando subas tu archivo y lo analices, aqui veras que {moduleLabelPlural.toLowerCase()} se crean, cuales se actualizan y que filas se van a omitir.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <OperationProgressOverlay
        open={busyState.open}
        title={busyState.title}
        description={busyState.description}
        progress={progress}
      />
    </>
  );
}
