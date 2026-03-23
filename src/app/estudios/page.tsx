'use client';

import DataTransferPanel from '@/components/data-transfer/DataTransferPanel';
import { getStudies, type Study } from '@/actions/studies/studiesActions';
import { createStudy, type CreateStudyPayload } from '@/actions/studies/studiesActions';
import { Search, Plus, Filter, Edit, Trash2, Eye, Tag, DollarSign, Hash, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import AddStudyModal from '@/components/estudios/AddStudyModal';
import PaginationControls from '@/components/ui/PaginationControls';

const STUDY_TEMPLATE_HEADERS = [
  'name',
  'code',
  'description',
  'durationMinutes',
  'type',
  'normalPrice',
  'difPrice',
  'specialPrice',
  'hospitalPrice',
  'otherPrice',
  'defaultDiscountPercent',
  'method',
  'indicator',
  'status',
];

const STUDY_EXPORT_FIELDS = [
  { key: 'name', label: 'Nombre' },
  { key: 'code', label: 'Clave' },
  { key: 'description', label: 'Descripcion' },
  { key: 'durationMinutes', label: 'Duracion' },
  { key: 'type', label: 'Tipo' },
  { key: 'normalPrice', label: 'Precio normal' },
  { key: 'difPrice', label: 'Precio DIF' },
  { key: 'specialPrice', label: 'Precio especial' },
  { key: 'hospitalPrice', label: 'Precio hospital' },
  { key: 'otherPrice', label: 'Otro precio' },
  { key: 'defaultDiscountPercent', label: 'Descuento default' },
  { key: 'method', label: 'Metodo' },
  { key: 'indicator', label: 'Indicador' },
  { key: 'status', label: 'Estatus' },
];

export default function EstudiosPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | 'active' | 'suspended'>('');
  const [typeFilter, setTypeFilter] = useState<'' | 'study' | 'package' | 'other'>('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [estudios, setEstudios] = useState<Study[]>([]);

  const fetchStudies = async () => {
    setLoading(true);
    const response = await getStudies({
      search: searchTerm.trim(),
      status: statusFilter || undefined,
      type: typeFilter || undefined,
      page,
      limit,
    });
    if (!response.ok) {
      toast.error(response.errors[0] ?? 'No se pudieron cargar estudios.');
      setEstudios([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    setEstudios(response.data.data);
    setTotal(response.data.meta.total);
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchStudies();
    }, 350);

    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter, typeFilter, page, limit]);

  const addStudy = async (payload: CreateStudyPayload) => {
    setSaving(true);
    const response = await createStudy(payload);
    if (!response.ok) {
      toast.error(response.errors[0] ?? 'No se pudo crear el estudio.');
      setSaving(false);
      return;
    }

    toast.success('Estudio registrado con exito.');
    setOpenAddModal(false);
    await fetchStudies();
    setSaving(false);
  };

  const getStatusColor = (estatus: string): string => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800 border-green-200',
      suspended: 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[estatus] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getCategoryColor = (tipo: string): string => {
    const colors: Record<string, string> = {
      study: 'bg-blue-100 text-blue-800',
      package: 'bg-purple-100 text-purple-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return colors[tipo] || 'bg-gray-100 text-gray-800';
  };

  const activos = useMemo(() => estudios.filter((e) => e.status === 'active').length, [estudios]);
  const inactivos = useMemo(() => estudios.filter((e) => e.status === 'suspended').length, [estudios]);
  const precioPromedio = useMemo(() => {
    if (!estudios.length) return 0;
    return Math.round(estudios.reduce((acc, e) => acc + Number(e.normalPrice), 0) / estudios.length);
  }, [estudios]);

  return (
    <div className="p-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Estudios</h1>
          <p className="text-gray-600">Catalogo de estudios y analisis medicos</p>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 lg:mt-0">
          <DataTransferPanel
            moduleKey="studies"
            moduleLabel="estudio"
            moduleLabelPlural="Estudios"
            templateHeaders={STUDY_TEMPLATE_HEADERS}
            fieldOptions={STUDY_EXPORT_FIELDS}
            onImported={fetchStudies}
          />
          <button
            onClick={() => setOpenAddModal(true)}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <Plus size={20} />
            Nuevo Estudio
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nombre o clave..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
            <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-3">
              <Filter size={18} className="text-gray-400" />
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value as typeof typeFilter);
                  setPage(1);
                }}
                className="bg-transparent text-sm text-gray-900 outline-none"
              >
                <option value="">Todos los tipos</option>
                <option value="study">Estudio</option>
                <option value="package">Paquete</option>
                <option value="other">Otro</option>
              </select>
            </div>
            <div className="rounded-lg border border-gray-300 bg-white px-3 py-3">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as typeof statusFilter);
                  setPage(1);
                }}
                className="bg-transparent text-sm text-gray-900 outline-none"
              >
                <option value="">Todos los estatus</option>
                <option value="active">Activo</option>
                <option value="suspended">Suspendido</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Estudios</p>
              <p className="text-2xl font-bold text-gray-900">{total}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Hash size={20} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Activos</p>
              <p className="text-2xl font-bold text-gray-900">{activos}</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <Tag size={20} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Inactivos</p>
              <p className="text-2xl font-bold text-gray-900">{inactivos}</p>
            </div>
            <div className="p-2 bg-red-100 rounded-lg">
              <Tag size={20} className="text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Precio Promedio</p>
              <p className="text-2xl font-bold text-gray-900">${precioPromedio}</p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign size={20} className="text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-10 flex items-center justify-center gap-3 text-gray-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          Cargando estudios...
        </div>
      ) : estudios.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-10 text-center text-gray-600">
          No hay estudios registrados.
        </div>
      ) : (
        <>
          <div className="hidden lg:block bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-700">
              <div className="col-span-4">Nombre del Estudio</div>
              <div className="col-span-1">Clave</div>
              <div className="col-span-2">Tipo</div>
              <div className="col-span-2">Precio</div>
              <div className="col-span-2">Estatus</div>
              <div className="col-span-1">Acciones</div>
            </div>

            <div className="divide-y divide-gray-200">
              {estudios.map((estudio) => (
                <div key={estudio.id} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="col-span-4">
                    <h3 className="font-medium text-gray-900 text-sm mb-1">{estudio.name}</h3>
                    <p className="text-xs text-gray-500 line-clamp-2">{estudio.description || 'Sin descripcion'}</p>
                  </div>

                  <div className="col-span-1">
                    <span className="font-mono text-sm font-medium text-gray-900 bg-gray-100 px-2 py-1 rounded">
                      {estudio.code}
                    </span>
                  </div>

                  <div className="col-span-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(estudio.type)}`}>
                      {estudio.type}
                    </span>
                  </div>

                  <div className="col-span-2">
                    <div className="flex items-center gap-2">
                      <DollarSign size={16} className="text-green-600" />
                      <span className="text-lg font-semibold text-gray-900">${Number(estudio.normalPrice).toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-gray-500">MXN</p>
                  </div>

                  <div className="col-span-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(estudio.status)}`}>
                      {estudio.status}
                    </span>
                  </div>

                  <div className="col-span-1">
                    <div className="flex items-center justify-end space-x-1">
                      <button className="p-1 text-gray-400 hover:text-blue-600 transition-colors" title="Ver detalles">
                        <Eye size={16} />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-green-600 transition-colors" title="Editar">
                        <Edit size={16} />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-red-600 transition-colors" title="Eliminar">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <PaginationControls
              page={page}
              limit={limit}
              total={total}
              itemLabel="estudios"
              onPageChange={setPage}
              onLimitChange={(nextLimit) => {
                setLimit(nextLimit);
                setPage(1);
              }}
            />
          </div>

          <div className="lg:hidden space-y-4">
            {estudios.map((estudio) => (
              <div key={estudio.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <span className="font-mono text-sm font-medium text-gray-900 bg-gray-100 px-2 py-1 rounded">{estudio.code}</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(estudio.status)}`}>
                    {estudio.status}
                  </span>
                </div>

                <div className="mb-3">
                  <h3 className="font-medium text-gray-900 text-sm mb-2">Estudio:</h3>
                  <p className="text-sm text-gray-700">{estudio.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{estudio.description || 'Sin descripcion'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                  <div>
                    <p className="text-gray-500 text-xs">Tipo</p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(estudio.type)}`}>
                      {estudio.type}
                    </span>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Precio</p>
                    <div className="flex items-center gap-1">
                      <DollarSign size={14} className="text-green-600" />
                      <p className="text-gray-900 font-bold">${Number(estudio.normalPrice).toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                  <div className="text-xs text-gray-500">ID: {estudio.id}</div>
                  <div className="flex space-x-2">
                    <button className="p-1 text-gray-400 hover:text-blue-600 transition-colors">
                      <Eye size={14} />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-green-600 transition-colors">
                      <Edit size={14} />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-red-600 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      {openAddModal && (
        <AddStudyModal setOpen={setOpenAddModal} addStudy={addStudy} isSaving={saving} />
      )}
      {!loading && estudios.length > 0 ? (
        <div className="mt-6 lg:hidden">
          <PaginationControls
            page={page}
            limit={limit}
            total={total}
            itemLabel="estudios"
            onPageChange={setPage}
            onLimitChange={(nextLimit) => {
              setLimit(nextLimit);
              setPage(1);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
