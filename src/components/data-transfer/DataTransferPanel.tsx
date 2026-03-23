'use client';

import OperationProgressOverlay from '@/components/ui/OperationProgressOverlay';
import { Download, FileSpreadsheet, FileUp, RefreshCcw, UploadCloud, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

type TransferModule = 'patients' | 'doctors' | 'studies';
type ExportFieldOption = { key: string; label: string };
type ExportDataset = { rows: Record<string, string>[]; fileName: string };
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
  fieldOptions: ExportFieldOption[];
  onImported?: () => Promise<void> | void;
};

function getErrorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === 'object') {
    const candidate = payload as { errors?: unknown; message?: unknown };
    if (Array.isArray(candidate.errors) && typeof candidate.errors[0] === 'string') return candidate.errors[0];
    if (typeof candidate.message === 'string') return candidate.message;
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

function parseCsv(content: string): string[][] {
  const normalizedContent = content.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentValue = '';
  let inQuotes = false;
  for (let i = 0; i < normalizedContent.length; i += 1) {
    const char = normalizedContent[i];
    const next = normalizedContent[i + 1];
    if (char === '"') {
      if (inQuotes && next === '"') {
        currentValue += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === ',' && !inQuotes) {
      currentRow.push(currentValue);
      currentValue = '';
      continue;
    }
    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i += 1;
      currentRow.push(currentValue);
      if (currentRow.some((value) => value.trim() !== '')) rows.push(currentRow);
      currentRow = [];
      currentValue = '';
      continue;
    }
    currentValue += char;
  }
  currentRow.push(currentValue);
  if (currentRow.some((value) => value.trim() !== '')) rows.push(currentRow);
  return rows;
}

function toCsv(headers: string[], rows: string[][]) {
  const escape = (value: string) => (!/[",\r\n]/.test(value) ? value : `"${value.replace(/"/g, '""')}"`);
  return `${[headers, ...rows].map((row) => row.map((value) => escape(value ?? '')).join(',')).join('\r\n')}\r\n`;
}

export default function DataTransferPanel({
  moduleKey,
  moduleLabel,
  moduleLabelPlural,
  templateHeaders,
  fieldOptions,
  onImported,
}: DataTransferPanelProps) {
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [exportMode, setExportMode] = useState<'data' | 'template'>('data');
  const [selectedExportFields, setSelectedExportFields] = useState<string[]>(fieldOptions.map((field) => field.key));
  const [exportDataset, setExportDataset] = useState<ExportDataset | null>(null);
  const [exportPreviewReady, setExportPreviewReady] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreviewResult | null>(null);
  const [busy, setBusy] = useState({ open: false, title: '', description: '' });
  const [progress, setProgress] = useState(14);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isPreparingExportPreview, setIsPreparingExportPreview] = useState(false);

  useEffect(() => {
    if (!busy.open) return undefined;
    setProgress(16);
    const timer = window.setInterval(() => setProgress((value) => (value >= 92 ? value : value + Math.max(2, (92 - value) / 6))), 180);
    return () => window.clearInterval(timer);
  }, [busy.open]);

  useEffect(() => {
    if (!showExportModal) return;
    setSelectedExportFields(fieldOptions.map((field) => field.key));
    setExportPreviewReady(false);
  }, [fieldOptions, showExportModal]);

  const selectedFieldDefinitions = useMemo(
    () => fieldOptions.filter((field) => selectedExportFields.includes(field.key)),
    [fieldOptions, selectedExportFields],
  );
  const templateFieldKeys = selectedFieldDefinitions.length > 0
    ? selectedFieldDefinitions.map((field) => field.key)
    : templateHeaders;
  const importableRows = useMemo(() => preview?.rows.filter((row) => row.action !== 'skip').length ?? 0, [preview]);
  const exportPreviewRows = useMemo(() => {
    if (exportMode === 'template') return [templateFieldKeys.map(() => '')];
    return (exportDataset?.rows ?? []).slice(0, 8).map((row) => selectedFieldDefinitions.map((field) => row[field.key] ?? ''));
  }, [exportDataset, exportMode, selectedFieldDefinitions, templateFieldKeys]);

  const stopBusy = () => {
    setProgress(100);
    window.setTimeout(() => setBusy({ open: false, title: '', description: '' }), 220);
  };

  const ensureExportDataset = async () => {
    if (exportDataset) return exportDataset;
    const res = await fetch(`/api/data-transfer/${moduleKey}/export`, { method: 'GET', cache: 'no-store' });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      throw new Error(getErrorMessage(payload, `No se pudo cargar ${moduleLabelPlural.toLowerCase()} para exportar.`));
    }
    const csvContent = await res.text();
    const rows = parseCsv(csvContent);
    const headers = rows[0] ?? [];
    const normalizedHeaders = headers.map((header) => header.trim());
    const dataset: ExportDataset = {
      fileName:
        res.headers.get('content-disposition')?.match(/filename="?([^"]+)"?/)?.[1] ?? `${moduleKey}-export.csv`,
      rows: rows.slice(1).map((row) =>
        normalizedHeaders.reduce<Record<string, string>>((acc, header, index) => {
          acc[header] = row[index] ?? '';
          return acc;
        }, {}),
      ),
    };
    setExportDataset(dataset);
    return dataset;
  };

  const toggleField = (fieldKey: string) => {
    setSelectedExportFields((current) =>
      current.includes(fieldKey) ? current.filter((key) => key !== fieldKey) : [...current, fieldKey],
    );
    setExportPreviewReady(false);
  };

  const handleExportPreview = async () => {
    if (selectedFieldDefinitions.length === 0) return toast.error('Selecciona al menos un campo para exportar.');
    if (exportMode === 'template') return setExportPreviewReady(true);
    setBusy({ open: true, title: 'Preparando vista previa', description: `Estamos cargando ${moduleLabelPlural.toLowerCase()} con los campos seleccionados.` });
    setIsPreparingExportPreview(true);
    try {
      await ensureExportDataset();
      setExportPreviewReady(true);
      toast.success(`Vista previa de exportacion para ${moduleLabelPlural.toLowerCase()} lista.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo generar la vista previa.');
    } finally {
      setIsPreparingExportPreview(false);
      stopBusy();
    }
  };

  const handleExport = async () => {
    if (selectedFieldDefinitions.length === 0) return toast.error('Selecciona al menos un campo para exportar.');
    setBusy({ open: true, title: 'Preparando exportacion', description: `Estamos preparando ${moduleLabelPlural.toLowerCase()} para descarga.` });
    setIsExporting(true);
    try {
      if (exportMode === 'template') {
        downloadBlob(new Blob([`${templateFieldKeys.join(',')}\n`], { type: 'text/csv;charset=utf-8' }), `${moduleKey}-template.csv`);
      } else {
        const dataset = await ensureExportDataset();
        const csv = toCsv(
          selectedFieldDefinitions.map((field) => field.key),
          dataset.rows.map((row) => selectedFieldDefinitions.map((field) => row[field.key] ?? '')),
        );
        downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), dataset.fileName.replace('.csv', `-${selectedFieldDefinitions.length}-campos.csv`));
      }
      toast.success(`Exportacion de ${moduleLabelPlural.toLowerCase()} lista para descarga.`);
      setShowExportModal(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo completar la exportacion.');
    } finally {
      setIsExporting(false);
      stopBusy();
    }
  };

  const handleImportPreview = async () => {
    if (!selectedFile) return toast.error('Selecciona un archivo CSV para previsualizar.');
    setBusy({ open: true, title: 'Analizando archivo', description: `Estamos revisando duplicados, filas nuevas y cambios para ${moduleLabelPlural.toLowerCase()}.` });
    setIsPreviewing(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const res = await fetch(`/api/data-transfer/${moduleKey}/preview`, { method: 'POST', body: formData });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(getErrorMessage(payload, 'No se pudo generar la previsualizacion.'));
      setPreview(payload as ImportPreviewResult);
      toast.success(`Previsualizacion de ${moduleLabelPlural.toLowerCase()} generada.`);
    } catch (error) {
      setPreview(null);
      toast.error(error instanceof Error ? error.message : 'No se pudo analizar el archivo.');
    } finally {
      setIsPreviewing(false);
      stopBusy();
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return toast.error('Selecciona un archivo CSV.');
    if (!preview) return toast.error('Primero genera la previsualizacion antes de importar.');
    setBusy({ open: true, title: 'Importando informacion', description: `Estamos aplicando los cambios confirmados en ${moduleLabelPlural.toLowerCase()}.` });
    setIsImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const res = await fetch(`/api/data-transfer/${moduleKey}/import`, { method: 'POST', body: formData });
      const payload = (await res.json().catch(() => ({}))) as ImportExecutionResult | { errors?: string[]; message?: string };
      if (!res.ok) throw new Error(getErrorMessage(payload, 'No se pudo completar la importacion.'));
      const result = payload as ImportExecutionResult;
      toast.success(`${result.message} ${result.created} nuevos, ${result.updated} actualizados, ${result.skipped} omitidos.`);
      setSelectedFile(null);
      setPreview(null);
      setShowImportModal(false);
      await onImported?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo importar el archivo.');
    } finally {
      setIsImporting(false);
      stopBusy();
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => setShowExportModal(true)} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700">
          <Download size={18} /> Exportar
        </button>
        <button type="button" onClick={() => setShowImportModal(true)} className="inline-flex items-center gap-2 rounded-xl border border-red-500 bg-red-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-red-700">
          <UploadCloud size={18} /> Importar
        </button>
      </div>

      {showExportModal ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm">
          <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[30px] border border-white/50 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h3 className="text-xl font-semibold text-slate-950">Exportar {moduleLabelPlural}</h3>
                <p className="mt-1 text-sm text-slate-500">Selecciona columnas y revisa una vista previa antes de descargar.</p>
              </div>
              <button type="button" onClick={() => setShowExportModal(false)} className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"><X size={18} /></button>
            </div>

            <div className="grid gap-6 overflow-y-auto px-6 py-6 lg:grid-cols-[340px_minmax(0,1fr)]">
              <div className="space-y-4">
                <div className="rounded-3xl border border-slate-200 bg-[linear-gradient(180deg,#fff,#f8fafc)] p-5 shadow-sm">
                  <label className={`mb-3 block cursor-pointer rounded-2xl border p-4 ${exportMode === 'data' ? 'border-sky-300 bg-sky-50' : 'border-slate-200'}`}>
                    <input type="radio" className="sr-only" checked={exportMode === 'data'} onChange={() => { setExportMode('data'); setExportPreviewReady(false); }} />
                    <div className="flex gap-3"><FileSpreadsheet className="text-sky-600" size={20} /><div><div className="font-medium text-slate-900">Datos activos</div><div className="text-sm text-slate-500">Exporta registros reales.</div></div></div>
                  </label>
                  <label className={`block cursor-pointer rounded-2xl border p-4 ${exportMode === 'template' ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200'}`}>
                    <input type="radio" className="sr-only" checked={exportMode === 'template'} onChange={() => { setExportMode('template'); setExportPreviewReady(false); }} />
                    <div className="flex gap-3"><FileUp className="text-emerald-600" size={20} /><div><div className="font-medium text-slate-900">Plantilla CSV</div><div className="text-sm text-slate-500">Solo con los campos elegidos.</div></div></div>
                  </label>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between"><div><p className="font-medium text-slate-900">Campos a exportar</p><p className="text-sm text-slate-500">Elige exactamente las columnas.</p></div><div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{selectedFieldDefinitions.length} seleccionados</div></div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {fieldOptions.map((field) => {
                      const checked = selectedExportFields.includes(field.key);
                      return (
                        <label key={field.key} className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-3 py-2.5 text-sm ${checked ? 'border-sky-300 bg-sky-50 text-sky-900' : 'border-slate-200 text-slate-600'}`}>
                          <input type="checkbox" checked={checked} onChange={() => toggleField(field.key)} className="h-4 w-4 rounded border-slate-300" />
                          <span>{field.label}</span>
                        </label>
                      );
                    })}
                  </div>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button type="button" onClick={handleExportPreview} disabled={isPreparingExportPreview || selectedFieldDefinitions.length === 0} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"><RefreshCcw size={16} />{isPreparingExportPreview ? 'Preparando...' : 'Vista previa'}</button>
                    <button type="button" onClick={handleExport} disabled={isExporting || selectedFieldDefinitions.length === 0} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"><Download size={16} />{isExporting ? 'Exportando...' : 'Descargar CSV'}</button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {exportPreviewReady ? (
                  <>
                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4"><div className="text-xs uppercase tracking-[0.2em] text-sky-700">Campos</div><div className="mt-2 text-2xl font-semibold text-sky-900">{selectedFieldDefinitions.length}</div></div>
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4"><div className="text-xs uppercase tracking-[0.2em] text-emerald-700">Registros</div><div className="mt-2 text-2xl font-semibold text-emerald-900">{exportMode === 'template' ? 0 : exportDataset?.rows.length ?? 0}</div></div>
                      
                    </div>
                    <div className="rounded-3xl border border-slate-200">
                      <div className="border-b border-slate-200 px-5 py-4"><h4 className="font-medium text-slate-900">Vista previa de exportacion</h4><p className="text-sm text-slate-500">{exportMode === 'template' ? `Se descargara una plantilla con ${selectedFieldDefinitions.length} columnas.` : `Mostrando ${Math.min(exportPreviewRows.length, 8)} filas de ${exportDataset?.rows.length ?? 0}.`}</p></div>
                      <div className="max-h-[460px] overflow-auto">
                        <table className="min-w-full text-sm">
                          <thead className="bg-slate-50 text-left text-slate-600"><tr>{selectedFieldDefinitions.map((field) => <th key={field.key} className="px-4 py-3 font-medium">{field.label}</th>)}</tr></thead>
                          <tbody className="divide-y divide-slate-200 bg-white">
                            {exportPreviewRows.length > 0 ? exportPreviewRows.map((row, rowIndex) => (
                              <tr key={`export-preview-${rowIndex}`}>{row.map((value, valueIndex) => <td key={`${rowIndex}-${valueIndex}`} className="px-4 py-3 text-slate-700">{value || <span className="text-slate-300">-</span>}</td>)}</tr>
                            )) : <tr><td colSpan={Math.max(1, selectedFieldDefinitions.length)} className="px-4 py-8 text-center text-slate-500">No hay filas para mostrar.</td></tr>}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center"><div className="max-w-md"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-slate-500 shadow-sm"><Download size={28} /></div><h4 className="mt-5 text-lg font-semibold text-slate-900">Vista previa pendiente</h4><p className="mt-2 text-sm leading-6 text-slate-500">Selecciona los campos y genera la vista previa para revisar como saldra tu exportacion.</p></div></div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showImportModal ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm">
          <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[30px] border border-white/50 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
              <div><h3 className="text-xl font-semibold text-slate-950">Importar {moduleLabelPlural}</h3><p className="mt-1 text-sm text-slate-500">Sube un CSV, revisa la previsualizacion y confirma solo cuando estes listo.</p></div>
              <button type="button" onClick={() => { setSelectedFile(null); setPreview(null); setShowImportModal(false); }} className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"><X size={18} /></button>
            </div>

            <div className="grid gap-6 overflow-y-auto px-6 py-6 lg:grid-cols-[320px_minmax(0,1fr)]">
              <div className="space-y-4">
                <div className="rounded-3xl border border-slate-200 bg-[linear-gradient(180deg,#fff,#f8fafc)] p-5 shadow-sm">
                  <div className="flex items-center gap-3"><div className="rounded-2xl bg-red-50 p-3 text-red-600"><UploadCloud size={22} /></div><div><p className="font-medium text-slate-900">Archivo CSV</p><p className="text-sm text-slate-500">Solo se aceptan archivos `.csv`.</p></div></div>
                  <label className="mt-5 block cursor-pointer rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-center transition hover:border-red-300 hover:bg-red-50/40">
                    <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(event) => { const file = event.target.files?.[0] ?? null; setSelectedFile(file); setPreview(null); }} />
                    <div className="text-sm font-medium text-slate-700">{selectedFile ? selectedFile.name : `Seleccionar CSV de ${moduleLabelPlural.toLowerCase()}`}</div>
                    <div className="mt-1 text-xs text-slate-500">{selectedFile ? `${Math.round(selectedFile.size / 1024)} KB` : 'Haz clic para elegir un archivo'}</div>
                  </label>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button type="button" onClick={handleImportPreview} disabled={!selectedFile || isPreviewing} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"><RefreshCcw size={16} />{isPreviewing ? 'Analizando...' : 'Previsualizar'}</button>
                    <button type="button" onClick={handleImport} disabled={!preview || importableRows === 0 || isImporting} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"><UploadCloud size={16} />{isImporting ? 'Importando...' : 'Confirmar importacion'}</button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {preview ? (
                  <>
                    <div className="grid gap-3 md:grid-cols-4">
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4"><div className="text-xs uppercase tracking-[0.2em] text-emerald-700">Nuevos</div><div className="mt-2 text-2xl font-semibold text-emerald-900">{preview.summary.toCreate}</div></div>
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><div className="text-xs uppercase tracking-[0.2em] text-amber-700">Actualizar</div><div className="mt-2 text-2xl font-semibold text-amber-900">{preview.summary.toUpdate}</div></div>
                      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4"><div className="text-xs uppercase tracking-[0.2em] text-rose-700">Omitidos</div><div className="mt-2 text-2xl font-semibold text-rose-900">{preview.summary.skipped}</div></div>
                      <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4"><div className="text-xs uppercase tracking-[0.2em] text-sky-700">Duplicados</div><div className="mt-2 text-2xl font-semibold text-sky-900">{preview.summary.duplicatesInDatabase + preview.summary.duplicatesInFile}</div></div>
                    </div>
                    <div className="rounded-3xl border border-slate-200">
                      <div className="border-b border-slate-200 px-5 py-4"><h4 className="font-medium text-slate-900">Resumen de importacion</h4><p className="text-sm text-slate-500">{preview.summary.totalRows} filas revisadas para {moduleLabelPlural.toLowerCase()}.</p></div>
                      <div className="max-h-[420px] overflow-auto">
                        <table className="min-w-full text-sm">
                          <thead className="bg-slate-50 text-left text-slate-600"><tr><th className="px-4 py-3 font-medium">Fila</th><th className="px-4 py-3 font-medium">Registro</th><th className="px-4 py-3 font-medium">Accion</th><th className="px-4 py-3 font-medium">Coincidencia</th><th className="px-4 py-3 font-medium">Detalle</th></tr></thead>
                          <tbody className="divide-y divide-slate-200 bg-white">
                            {preview.rows.map((row) => (
                              <tr key={`${row.rowNumber}-${row.summary}`}>
                                <td className="px-4 py-3 align-top text-slate-500">{row.rowNumber}</td>
                                <td className="px-4 py-3 align-top"><div className="font-medium text-slate-900">{row.summary || `${moduleLabel} sin descripcion`}</div><div className="mt-1 text-xs text-slate-500">{row.duplicate ? row.duplicateSource === 'database' ? 'Duplicado encontrado en base de datos' : 'Duplicado dentro del archivo' : 'Sin coincidencias detectadas'}</div></td>
                                <td className="px-4 py-3 align-top"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${row.action === 'create' ? 'bg-emerald-100 text-emerald-800' : row.action === 'update' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'}`}>{row.action}</span></td>
                                <td className="px-4 py-3 align-top text-slate-600">{row.matchLabel || 'Nuevo registro'}</td>
                                <td className="px-4 py-3 align-top text-slate-600">{row.errors.length > 0 ? row.errors.join(' ') : 'Listo para procesarse.'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex min-h-[360px] items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center"><div className="max-w-md"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-slate-500 shadow-sm"><FileSpreadsheet size={28} /></div><h4 className="mt-5 text-lg font-semibold text-slate-900">Previsualizacion pendiente</h4><p className="mt-2 text-sm leading-6 text-slate-500">Cuando subas tu archivo y lo analices, aqui veras que {moduleLabelPlural.toLowerCase()} se crean, cuales se actualizan y que filas se van a omitir.</p></div></div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <OperationProgressOverlay open={busy.open} title={busy.title} description={busy.description} progress={progress} />
    </>
  );
}
