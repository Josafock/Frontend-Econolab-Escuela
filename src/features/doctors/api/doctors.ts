"use server";

import { fetchApi, type ApiResult } from "@/actions/_lib/api";

export type DoctorStatusFilter = "all" | "active" | "inactive";

export type Doctor = {
  id: number;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  email?: string | null;
  phone?: string | null;
  specialty?: string | null;
  licenseNumber?: string | null;
  notes?: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateDoctorPayload = {
  firstName: string;
  lastName: string;
  middleName?: string;
  email?: string;
  phone?: string;
  specialty?: string;
  licenseNumber?: string;
  notes?: string;
};

export type UpdateDoctorPayload = Partial<CreateDoctorPayload>;

export type DoctorsSearchResponse = {
  data: Doctor[];
  meta: { page: number; limit: number; total: number };
};

export type DoctorMutationResponse = {
  message: string;
  data: Doctor;
};

export async function getDoctors(params?: {
  search?: string;
  page?: number;
  limit?: number;
  status?: DoctorStatusFilter;
}): Promise<ApiResult<DoctorsSearchResponse>> {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.status) query.set("status", params.status);

  const suffix = query.toString() ? `?${query.toString()}` : "";
  return fetchApi<DoctorsSearchResponse>(`/doctors${suffix}`);
}

export async function createDoctor(
  payload: CreateDoctorPayload,
): Promise<ApiResult<DoctorMutationResponse>> {
  return fetchApi<DoctorMutationResponse>("/doctors", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getDoctorById(id: number): Promise<ApiResult<Doctor>> {
  return fetchApi<Doctor>(`/doctors/${id}`);
}

export async function updateDoctor(
  id: number,
  payload: UpdateDoctorPayload,
): Promise<ApiResult<DoctorMutationResponse>> {
  return fetchApi<DoctorMutationResponse>(`/doctors/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function updateDoctorStatus(
  id: number,
  isActive: boolean,
): Promise<ApiResult<DoctorMutationResponse>> {
  return fetchApi<DoctorMutationResponse>(`/doctors/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ isActive }),
  });
}

export async function hardDeleteDoctor(
  id: number,
): Promise<ApiResult<{ message: string }>> {
  return fetchApi<{ message: string }>(`/doctors/${id}/hard`, {
    method: "DELETE",
  });
}
