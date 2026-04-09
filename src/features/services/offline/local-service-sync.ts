"use client";

export function buildLocalServiceDetailSnapshotKey(serviceId: number) {
  return `services:detail:${serviceId}`;
}

export function isLocalServiceId(id: number) {
  return Number(id) < 0;
}

export function mergeLocalServiceCreatePayload(
  _serviceId: number,
  _payload: unknown,
) {
  return null;
}
