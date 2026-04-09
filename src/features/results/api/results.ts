"use server";

import { fetchApi, type ApiResult } from "@/actions/_lib/api";

export type StudyResultValue = {
  id: number;
  studyResultId: number;
  studyDetailId?: number | null;
  label: string;
  unit?: string | null;
  referenceValue?: string | null;
  value?: string | null;
  sortOrder: number;
  visible: boolean;
};

export type StudyResult = {
  id: number;
  serviceOrderId: number;
  serviceOrderItemId: number;
  sampleAt?: string | null;
  reportedAt?: string | null;
  method?: string | null;
  observations?: string | null;
  isDraft: boolean;
  isActive: boolean;
  values: StudyResultValue[];
  createdAt?: string;
  updatedAt?: string;
};

export type StudyResultValuePayload = {
  studyDetailId?: number;
  label: string;
  unit?: string;
  referenceValue?: string;
  value?: string;
  sortOrder: number;
  visible: boolean;
};

export type UpdateStudyResultPayload = Partial<{
  serviceOrderId: number;
  serviceOrderItemId: number;
  sampleAt?: string;
  reportedAt?: string;
  method?: string;
  observations?: string;
  isDraft?: boolean;
  values: StudyResultValuePayload[];
}>;

export async function getOrCreateResultByServiceItem(
  serviceOrderItemId: number,
): Promise<ApiResult<StudyResult>> {
  return fetchApi<StudyResult>(`/results/service-item/${serviceOrderItemId}`);
}

export async function updateStudyResult(
  id: number,
  payload: UpdateStudyResultPayload,
): Promise<ApiResult<{ message: string; data: StudyResult }>> {
  return fetchApi<{ message: string; data: StudyResult }>(`/results/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
