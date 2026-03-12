"use client";

import { useEffect, useState } from "react";
import { getDbTopics, type DbTopic } from "@/actions/db-admin/dbAdminActions";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";

type TopicStatus = "planned" | "partial" | "implemented";
type BackupItem = {
  name: string;
  size: number;
  createdAt: string;
};

const statusLabel: Record<TopicStatus, string> = {
  planned: "Planeado",
  partial: "Parcial",
  implemented: "Implementado",
};

const statusColor: Record<TopicStatus, string> = {
  planned: "bg-gray-100 text-gray-800 border-gray-300",
  partial: "bg-amber-100 text-amber-800 border-amber-300",
  implemented: "bg-green-100 text-green-800 border-green-300",
};

export default function DatabaseAdminPage() {
  const [loading, setLoading] = useState(true);
  const [loadingBackups, setLoadingBackups] = useState(true);
  const [loadingTableBackups, setLoadingTableBackups] = useState(true);
  const [loadingTables, setLoadingTables] = useState(true);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [creatingTableBackup, setCreatingTableBackup] = useState(false);
  const [restoringBackup, setRestoringBackup] = useState<string>("");
  const [moduleName, setModuleName] = useState("");
  const [checkedAt, setCheckedAt] = useState("");
  const [topics, setTopics] = useState<DbTopic[]>([]);
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [tableBackups, setTableBackups] = useState<BackupItem[]>([]);
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const response = await getDbTopics();

      if (!response.ok) {
        toast.error(response.errors[0] ?? "No se pudo cargar el modulo de base de datos.");
        setTopics([]);
        setLoading(false);
        return;
      }

      setModuleName(response.data.module);
      setCheckedAt(response.data.checkedAt);
      setTopics(response.data.topics);
      setLoading(false);
    };

    void load();
  }, []);

  const loadBackups = async () => {
    setLoadingBackups(true);
    const res = await fetch("/api/db-admin/backups/list", { method: "GET", cache: "no-store" });
    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      const msg = Array.isArray(json?.errors) ? json.errors[0] : "No se pudieron cargar los backups.";
      toast.error(msg);
      setBackups([]);
      setLoadingBackups(false);
      return;
    }

    const items = Array.isArray(json)
      ? json
          .map((row: unknown) => {
            if (!row || typeof row !== "object") return null;
            const item = row as { name?: unknown; size?: unknown; createdAt?: unknown };
            if (
              typeof item.name !== "string" ||
              typeof item.size !== "number" ||
              typeof item.createdAt !== "string"
            ) {
              return null;
            }
            return {
              name: item.name,
              size: item.size,
              createdAt: item.createdAt,
            } satisfies BackupItem;
          })
          .filter((item): item is BackupItem => item !== null)
      : [];

    setBackups(items);
    setLoadingBackups(false);
  };

  const loadTableBackups = async () => {
    setLoadingTableBackups(true);
    const res = await fetch("/api/db-admin/backups/table/list", {
      method: "GET",
      cache: "no-store",
    });
    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      const msg =
        Array.isArray(json?.errors) && typeof json.errors[0] === "string"
          ? json.errors[0]
          : typeof json?.message === "string"
          ? json.message
          : "No se pudieron cargar los backups de tabla.";
      toast.error(msg);
      setTableBackups([]);
      setLoadingTableBackups(false);
      return;
    }

    const items = Array.isArray(json)
      ? json
          .map((row: unknown) => {
            if (!row || typeof row !== "object") return null;
            const item = row as { name?: unknown; size?: unknown; createdAt?: unknown };
            if (
              typeof item.name !== "string" ||
              typeof item.size !== "number" ||
              typeof item.createdAt !== "string"
            ) {
              return null;
            }
            return {
              name: item.name,
              size: item.size,
              createdAt: item.createdAt,
            } satisfies BackupItem;
          })
          .filter((item): item is BackupItem => item !== null)
      : [];

    setTableBackups(items);
    setLoadingTableBackups(false);
  };

  const loadTables = async () => {
    setLoadingTables(true);
    const res = await fetch("/api/db-admin/tables", { method: "GET", cache: "no-store" });
    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      const msg =
        Array.isArray(json?.errors) && typeof json.errors[0] === "string"
          ? json.errors[0]
          : typeof json?.message === "string"
          ? json.message
          : "No se pudieron cargar las tablas.";
      toast.error(msg);
      setTables([]);
      setLoadingTables(false);
      return;
    }

    const values = Array.isArray(json?.tables)
      ? json.tables
          .map((table: unknown) => {
            if (typeof table === "string") return table;
            if (table && typeof table === "object" && "qualifiedName" in table) {
              const q = (table as { qualifiedName?: unknown }).qualifiedName;
              return typeof q === "string" ? q : "";
            }
            return "";
          })
          .filter((value: string) => value.length > 0)
      : [];

    setTables(values);
    if (!selectedTable && values.length > 0) {
      setSelectedTable(values[0]);
    }
    setLoadingTables(false);
  };

  useEffect(() => {
    void loadBackups();
    void loadTableBackups();
    void loadTables();
  }, []);

  const handleCreateBackup = async () => {
    setCreatingBackup(true);
    const res = await fetch("/api/db-admin/backups", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      const message =
        Array.isArray(json?.errors) && typeof json.errors[0] === "string"
          ? json.errors[0]
          : typeof json?.message === "string"
          ? json.message
          : "No se pudo generar el backup.";
      toast.error(message);
      setCreatingBackup(false);
      return;
    }

    toast.success(json?.message ?? "Backup generado correctamente.");
    await loadBackups();
    setCreatingBackup(false);
  };

  const handleRestoreBackup = async (fileName: string) => {
    const ok = window.confirm(`Esta accion restaurara la base de datos con: ${fileName}. ¿Deseas continuar?`);
    if (!ok) return;

    setRestoringBackup(fileName);
    const res = await fetch("/api/db-admin/backups/restore", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fileName }),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const message =
        Array.isArray(json?.errors) && typeof json.errors[0] === "string"
          ? json.errors[0]
          : typeof json?.message === "string"
          ? json.message
          : "No se pudo restaurar el backup.";
      toast.error(message);
      setRestoringBackup("");
      return;
    }

    toast.success(json?.message ?? "Restauracion ejecutada correctamente.");
    setRestoringBackup("");
  };

  const handleCreateTableBackup = async () => {
    if (!selectedTable) {
      toast.error("Selecciona una tabla.");
      return;
    }

    setCreatingTableBackup(true);
    const res = await fetch("/api/db-admin/backups/table", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tableName: selectedTable }),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      const message =
        Array.isArray(json?.errors) && typeof json.errors[0] === "string"
          ? json.errors[0]
          : typeof json?.message === "string"
          ? json.message
          : "No se pudo generar el backup de tabla.";
      toast.error(message);
      setCreatingTableBackup(false);
      return;
    }

    toast.success(json?.message ?? "Backup de tabla generado correctamente.");
    await loadTableBackups();
    setCreatingTableBackup(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Modulo de Base de Datos</h1>
        <p className="text-sm text-gray-600 mt-2">
          {moduleName || "Administracion de Base de Datos"}
        </p>
        {checkedAt ? (
          <p className="text-xs text-gray-500 mt-1">
            Ultima revision: {new Date(checkedAt).toLocaleString()}
          </p>
        ) : null}
      </div>

      <section className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Backups</h2>
            <p className="text-sm text-gray-600 mt-1">
              Los respaldos se almacenan localmente en el backend y pueden restaurarse desde aqui.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCreateBackup}
            disabled={creatingBackup}
            className="rounded-lg border border-red-500 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-600 hover:text-white disabled:opacity-50 transition-colors"
          >
            {creatingBackup ? "Generando..." : "Generar backup"}
          </button>
        </div>

        <div className="mt-5">
          {loadingBackups ? (
            <div className="text-sm text-gray-600">Cargando backups...</div>
          ) : backups.length === 0 ? (
            <div className="text-sm text-gray-600">No hay backups disponibles.</div>
          ) : (
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Archivo</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Tamaño</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Creado</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {backups.map((backup) => (
                    <tr key={backup.name}>
                      <td className="px-4 py-3 font-mono text-xs text-gray-800">{backup.name}</td>
                      <td className="px-4 py-3 text-gray-700">{(backup.size / 1024).toFixed(2)} KB</td>
                      <td className="px-4 py-3 text-gray-700">
                        {new Date(backup.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleRestoreBackup(backup.name)}
                          disabled={restoringBackup === backup.name}
                          className="rounded-lg border border-red-500 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-600 hover:text-white disabled:opacity-50 transition-colors"
                        >
                          {restoringBackup === backup.name ? "Restaurando..." : "Restaurar"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Backups por Tabla</h2>
            <p className="text-sm text-gray-600 mt-1">
              Respalda una tabla especifica y guarda los archivos en una carpeta separada del backend.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              disabled={loadingTables || creatingTableBackup}
              className="min-w-[260px] rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white disabled:bg-gray-100"
            >
              {loadingTables ? (
                <option value="">Cargando tablas...</option>
              ) : tables.length === 0 ? (
                <option value="">Sin tablas disponibles</option>
              ) : (
                tables.map((table) => (
                  <option key={table} value={table}>
                    {table}
                  </option>
                ))
              )}
            </select>
            <button
              type="button"
              onClick={handleCreateTableBackup}
              disabled={creatingTableBackup || loadingTables || tables.length === 0}
              className="rounded-lg border border-red-500 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-600 hover:text-white disabled:opacity-50 transition-colors"
            >
              {creatingTableBackup ? "Generando..." : "Generar backup de tabla"}
            </button>
          </div>
        </div>

        <div className="mt-5">
          {loadingTableBackups ? (
            <div className="text-sm text-gray-600">Cargando backups de tabla...</div>
          ) : tableBackups.length === 0 ? (
            <div className="text-sm text-gray-600">No hay backups de tabla disponibles.</div>
          ) : (
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Archivo</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Tamaño</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Creado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {tableBackups.map((backup) => (
                    <tr key={backup.name}>
                      <td className="px-4 py-3 font-mono text-xs text-gray-800">{backup.name}</td>
                      <td className="px-4 py-3 text-gray-700">{(backup.size / 1024).toFixed(2)} KB</td>
                      <td className="px-4 py-3 text-gray-700">
                        {new Date(backup.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {loading ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm flex items-center justify-center gap-3 text-gray-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          Cargando temas del modulo...
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {topics.map((topic) => (
            <section key={topic.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-lg font-semibold text-gray-900">{topic.title}</h2>
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusColor[
                    topic.status as TopicStatus
                  ]}`}
                >
                  {statusLabel[topic.status as TopicStatus]}
                </span>
              </div>

              <p className="text-sm text-gray-700 mt-3">{topic.summary}</p>

              <div className="mt-4">
                <h3 className="text-sm font-semibold text-gray-900">Implementado</h3>
                <ul className="mt-2 space-y-1 text-sm text-gray-700 list-disc list-inside">
                  {topic.implemented.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="mt-4">
                <h3 className="text-sm font-semibold text-gray-900">Pendiente</h3>
                <ul className="mt-2 space-y-1 text-sm text-gray-700 list-disc list-inside">
                  {topic.pending.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              {topic.recommendation ? (
                <p className="mt-4 text-xs text-blue-800 bg-blue-50 border border-blue-200 rounded-md p-3">
                  Recomendacion: {topic.recommendation}
                </p>
              ) : null}

              {topic.data ? (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Datos tecnicos</h3>
                  <pre className="text-xs bg-gray-900 text-gray-100 rounded-md p-3 overflow-auto">
                    {JSON.stringify(topic.data, null, 2)}
                  </pre>
                </div>
              ) : null}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
