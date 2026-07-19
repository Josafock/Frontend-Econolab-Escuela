"use server";

import { fetchApi, type ApiResult } from "@/actions/_lib/api";

export type StudyType = "study" | "package" | "other";
export type StudyStatus = "active" | "suspended";
export type StudyStatusFilter = StudyStatus | "all";
export type StudyTypeFilter = StudyType | "all";
export type StudyDetailDataType = "category" | "parameter";

export type Study = {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  durationMinutes: number;
  type: StudyType;
  normalPrice: number;
  difPrice: number;
  specialPrice: number;
  hospitalPrice: number;
  otherPrice: number;
  defaultDiscountPercent: number;
  method?: string | null;
  indicator?: string | null;
  packageStudyIds?: number[];
  status: StudyStatus;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type StudyDetail = {
  id: number;
  studyId: number;
  parentId?: number | null;
  dataType: StudyDetailDataType;
  name: string;
  sortOrder: number;
  unit?: string | null;
  referenceValue?: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateStudyPayload = {
  name: string;
  code?: string;
  autoGenerateCode?: boolean;
  description?: string;
  durationMinutes: number;
  type: StudyType;
  normalPrice: number;
  difPrice: number;
  specialPrice: number;
  hospitalPrice: number;
  otherPrice: number;
  defaultDiscountPercent: number;
  method?: string;
  indicator?: string;
  packageStudyIds?: number[];
  status?: StudyStatus;
};

export type UpdateStudyPayload = Partial<CreateStudyPayload>;

export type CreateStudyDetailPayload = {
  dataType: StudyDetailDataType;
  name: string;
  sortOrder: number;
  unit?: string;
  referenceValue?: string;
  parentId?: number;
};

export type UpdateStudyDetailPayload = Partial<{
  dataType: StudyDetailDataType;
  name: string;
  sortOrder: number;
  unit?: string;
  referenceValue?: string;
  parentId: number | null;
}>;

export type StudiesSearchResponse = {
  data: Study[];
  meta: { page: number; limit: number; total: number };
};

export type StudyMutationResponse = {
  message: string;
  data: Study;
};

export type StudyDetailMutationResponse = {
  message: string;
  data: StudyDetail;
};

export type StudyEstimationPayload = {
  type: StudyType;
  parameterCount: number;
  method?: string;
};

export type StudyEstimation = {
  suggestedNormalPrice: number;
  suggestedDurationMinutes: number;
  priceRange: { min: number; max: number };
  durationRangeMinutes: { min: number; max: number };
  model: {
    algorithm: "linear_regression";
    version: string;
    trainingSamples: number;
    priceMeanAbsoluteError: number;
    durationMeanAbsoluteError: number;
    featuresUsed: string[];
  };
  warnings: string[];
};

type StudyEstimationResponse = {
  message: string;
  data: StudyEstimation;
};

export async function getStudies(params?: {
  search?: string;
  page?: number;
  limit?: number;
  type?: StudyType;
  status?: StudyStatus;
}): Promise<ApiResult<StudiesSearchResponse>> {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.type) query.set("type", params.type);
  if (params?.status) query.set("status", params.status);

  const suffix = query.toString() ? `?${query.toString()}` : "";
  return fetchApi<StudiesSearchResponse>(`/studies${suffix}`);
}

export async function createStudy(
  payload: CreateStudyPayload,
): Promise<ApiResult<StudyMutationResponse>> {
  return fetchApi<StudyMutationResponse>("/studies", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getSuggestedStudyCode(
  type: StudyType = "study",
): Promise<ApiResult<{ code: string }>> {
  return fetchApi<{ code: string }>(
    `/studies/next-code?type=${encodeURIComponent(type)}`,
  );
}

/** Manda los datos del formulario al modelo de regresion del backend. */
export async function estimateStudy(
  payload: StudyEstimationPayload,
): Promise<ApiResult<StudyEstimationResponse>> {
  return fetchApi<StudyEstimationResponse>("/studies/estimate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getStudyById(id: number): Promise<ApiResult<Study>> {
  return fetchApi<Study>(`/studies/${id}`);
}

export async function updateStudy(
  id: number,
  payload: UpdateStudyPayload,
): Promise<ApiResult<StudyMutationResponse>> {
  return fetchApi<StudyMutationResponse>(`/studies/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function updateStudyStatus(
  id: number,
  status: StudyStatus,
): Promise<ApiResult<StudyMutationResponse>> {
  return updateStudy(id, { status });
}

export async function removeStudy(
  id: number,
): Promise<ApiResult<{ message: string }>> {
  return fetchApi<{ message: string }>(`/studies/${id}`, {
    method: "DELETE",
  });
}

export async function getStudyDetails(
  id: number,
): Promise<ApiResult<StudyDetail[]>> {
  return fetchApi<StudyDetail[]>(`/studies/${id}/details`);
}

export async function createStudyDetail(
  studyId: number,
  payload: CreateStudyDetailPayload,
): Promise<ApiResult<StudyDetailMutationResponse>> {
  return fetchApi<StudyDetailMutationResponse>(`/studies/${studyId}/details`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateStudyDetail(
  detailId: number,
  payload: UpdateStudyDetailPayload,
): Promise<ApiResult<StudyDetailMutationResponse>> {
  return fetchApi<StudyDetailMutationResponse>(`/studies/details/${detailId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function updateStudyDetailStatus(
  detailId: number,
  isActive: boolean,
): Promise<ApiResult<StudyDetailMutationResponse>> {
  return fetchApi<StudyDetailMutationResponse>(
    `/studies/details/${detailId}/status`,
    {
      method: "PUT",
      body: JSON.stringify({ isActive }),
    },
  );
}

export async function removeStudyDetail(
  detailId: number,
): Promise<ApiResult<{ message: string }>> {
  return fetchApi<{ message: string }>(`/studies/details/${detailId}`, {
    method: "DELETE",
  });
}
