"use server";

import { fetchApi, type ApiResult } from "@/actions/_lib/api";

export type PatientGender = "male" | "female" | "other";
export type PatientStatusFilter = "all" | "active" | "inactive";

export type Patient = {
  id: number;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  gender: PatientGender;
  birthDate: string;
  phone?: string | null;
  email?: string | null;
  addressLine?: string | null;
  addressBetween?: string | null;
  addressCity?: string | null;
  addressState?: string | null;
  addressZip?: string | null;
  documentType?: string | null;
  documentNumber?: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type CreatePatientPayload = {
  firstName: string;
  lastName: string;
  middleName?: string;
  gender: PatientGender;
  birthDate: string;
  phone?: string;
  email?: string;
  addressLine?: string;
  addressBetween?: string;
  addressCity?: string;
  addressState?: string;
  addressZip?: string;
  documentType?: string;
  documentNumber?: string;
};

export type UpdatePatientPayload = Partial<CreatePatientPayload>;

export type PatientsSearchResponse = {
  data: Patient[];
  meta: { page: number; limit: number; total: number };
};

export type PatientMutationResponse = {
  message: string;
  data: Patient;
};

export async function getPatients(params?: {
  search?: string;
  page?: number;
  limit?: number;
  status?: PatientStatusFilter;
}): Promise<ApiResult<PatientsSearchResponse>> {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.status) query.set("status", params.status);

  const suffix = query.toString() ? `?${query.toString()}` : "";
  return fetchApi<PatientsSearchResponse>(`/patients${suffix}`);
}

export async function createPatient(
  payload: CreatePatientPayload,
): Promise<ApiResult<PatientMutationResponse>> {
  return fetchApi<PatientMutationResponse>("/patients", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getPatientById(id: number): Promise<ApiResult<Patient>> {
  return fetchApi<Patient>(`/patients/${id}`);
}

export async function updatePatient(
  id: number,
  payload: UpdatePatientPayload,
): Promise<ApiResult<PatientMutationResponse>> {
  return fetchApi<PatientMutationResponse>(`/patients/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function updatePatientStatus(
  id: number,
  isActive: boolean,
): Promise<ApiResult<PatientMutationResponse>> {
  return fetchApi<PatientMutationResponse>(`/patients/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ isActive }),
  });
}
