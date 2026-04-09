"use client";

import type { ApiResult } from "@/actions/_lib/api";
import type { FilePayload } from "@/lib/files/file-service";

export type ServiceResultsPdfOptions = {
  signature: "with" | "without";
  categoryLayout: "continuous" | "page-per-category";
  studyLayout: "continuous" | "page-per-study";
};

function buildFilePayload(
  url: string,
  filename: string,
  contentType = "application/pdf",
): ApiResult<FilePayload> {
  return {
    ok: true,
    data: {
      url,
      filename,
      contentType,
    },
  };
}

export function getServiceResultsPdfPath(
  serviceId: number,
  options: ServiceResultsPdfOptions,
) {
  const params = new URLSearchParams({
    signature: options.signature,
    categoryLayout: options.categoryLayout,
    studyLayout: options.studyLayout,
  });

  return `/api/files/results/service-order/${serviceId}/pdf?${params.toString()}`;
}

export async function getServiceReceiptFile(serviceId: number) {
  return buildFilePayload(
    `/api/files/services/${serviceId}/receipt`,
    `recibo-${serviceId}.pdf`,
  );
}

export async function getServiceTicketFile(serviceId: number) {
  return buildFilePayload(
    `/api/files/services/${serviceId}/ticket`,
    `ticket-${serviceId}.pdf`,
  );
}

export async function getServiceLabelsFile(serviceId: number) {
  return buildFilePayload(
    `/api/files/services/${serviceId}/labels`,
    `etiquetas-${serviceId}.pdf`,
  );
}

export async function getServiceResultsPdfFile(
  serviceId: number,
  options: ServiceResultsPdfOptions,
) {
  return buildFilePayload(
    getServiceResultsPdfPath(serviceId, options),
    `resultado-servicio-${serviceId}.pdf`,
  );
}
