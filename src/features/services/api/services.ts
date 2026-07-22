"use server";

import { fetchApi, type ApiResult } from "@/actions/_lib/api";

export type ServiceStatus =
  | "pending"
  | "in_progress"
  | "delayed"
  | "completed"
  | "cancelled";

export type ServiceItemPriceType =
  | "normal"
  | "dif"
  | "special"
  | "hospital"
  | "other";

export type ServiceItem = {
  id: number;
  studyId: number;
  studyNameSnapshot: string;
  sourcePackageId?: number | null;
  sourcePackageNameSnapshot?: string | null;
  priceType: ServiceItemPriceType;
  unitPrice: number;
  quantity: number;
  discountPercent: number;
  subtotalAmount: number;
};

export type ServiceOrder = {
  id: number;
  folio: string;
  patientId: number;
  doctorId?: number | null;
  branchName?: string | null;
  sampleAt?: string | null;
  deliveryAt?: string | null;
  completedAt?: string | null;
  status: ServiceStatus;
  subtotalAmount: number;
  courtesyPercent: number;
  discountAmount: number;
  totalAmount: number;
  notes?: string | null;
  createdAt: string;
  patient?: {
    id: number;
    firstName: string;
    lastName: string;
    middleName?: string | null;
    phone?: string | null;
  };
  doctor?: {
    id: number;
    firstName: string;
    lastName: string;
    middleName?: string | null;
  } | null;
  items: ServiceItem[];
};

export type CreateServicePayload = {
  folio: string;
  autoGenerateFolio?: boolean;
  patientId: number;
  doctorId?: number;
  branchName?: string;
  sampleAt?: string;
  deliveryAt?: string;
  status?: ServiceStatus;
  courtesyPercent?: number;
  notes?: string;
  items: {
    studyId: number;
    priceType: ServiceItemPriceType;
    quantity: number;
    discountPercent?: number;
  }[];
};

export type UpdateServicePayload = Partial<CreateServicePayload>;

export type ServiceOutcome =
  | "completed_on_time"
  | "delayed"
  | "cancelled";

export type ServiceOutcomeProbability = {
  outcome: ServiceOutcome;
  label: string;
  probability: number;
};

export type ServiceOutcomePredictionModel = {
  version: string;
};

export type ServiceOutcomePrediction =
  | {
      available: false;
      message: string;
      model?: ServiceOutcomePredictionModel;
    }
  | {
      available: true;
      predictedOutcome: ServiceOutcome;
      label: string;
      confidence: number;
      probabilities: ServiceOutcomeProbability[];
      model: ServiceOutcomePredictionModel;
    };

export type ServiceOutcomePredictionPayload = Pick<
  CreateServicePayload,
  "branchName" | "sampleAt" | "deliveryAt" | "courtesyPercent" | "items"
>;

export type ServiceOutcomePredictionResponse = {
  message: string;
  data: ServiceOutcomePrediction;
};

export type ServiceOutcomePredictionsBatchPayload = {
  serviceIds: number[];
};

export type ServiceOutcomePredictionsBatchResponse = {
  message: string;
  data: {
    predictions: Array<{
      serviceId: number;
      prediction: ServiceOutcomePrediction;
    }>;
  };
};

export type ServicesSearchResponse = {
  data: ServiceOrder[];
  meta: { page: number; limit: number; total: number };
};

export type ServiceMutationResponse = {
  message: string;
  data: ServiceOrder;
};

export async function getServices(params?: {
  search?: string;
  status?: ServiceStatus;
  branchName?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResult<ServicesSearchResponse>> {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.status) query.set("status", params.status);
  if (params?.branchName) query.set("branchName", params.branchName);
  if (params?.fromDate) query.set("fromDate", params.fromDate);
  if (params?.toDate) query.set("toDate", params.toDate);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  const suffix = query.toString() ? `?${query.toString()}` : "";
  return fetchApi<ServicesSearchResponse>(`/services${suffix}`);
}

export async function createService(
  payload: CreateServicePayload,
): Promise<ApiResult<ServiceMutationResponse>> {
  return fetchApi<ServiceMutationResponse>("/services", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getSuggestedServiceFolio(): Promise<
  ApiResult<{ folio: string }>
> {
  return fetchApi<{ folio: string }>("/services/next-folio");
}

export async function getServiceById(
  id: number,
): Promise<ApiResult<ServiceOrder>> {
  return fetchApi<ServiceOrder>(`/services/${id}`);
}

export async function updateService(
  id: number,
  payload: UpdateServicePayload,
): Promise<ApiResult<ServiceMutationResponse>> {
  return fetchApi<ServiceMutationResponse>(`/services/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function updateServiceStatus(
  id: number,
  status: ServiceStatus,
): Promise<ApiResult<ServiceMutationResponse>> {
  return fetchApi<ServiceMutationResponse>(`/services/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}

export async function predictServiceOutcome(
  payload: ServiceOutcomePredictionPayload,
): Promise<ApiResult<ServiceOutcomePredictionResponse>> {
  // FORMULARIO -> BACKEND: manda los datos capturados al endpoint individual.
  return fetchApi<ServiceOutcomePredictionResponse>(
    "/services/outcome-prediction",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export async function predictServiceOutcomesBatch(
  payload: ServiceOutcomePredictionsBatchPayload,
): Promise<ApiResult<ServiceOutcomePredictionsBatchResponse>> {
  // LISTADO -> BACKEND: manda varios IDs al endpoint por lote.
  return fetchApi<ServiceOutcomePredictionsBatchResponse>(
    "/services/outcome-predictions/batch",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}
