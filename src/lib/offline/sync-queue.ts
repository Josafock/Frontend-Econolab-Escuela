"use client";

import { SYNC_QUEUE_EVENT, type SyncQueueEventDetail } from "@/lib/offline/sync-runner";

export type SyncQueueItem = {
  id: string;
  scope: string;
  entityType: string;
  entityId: number;
  operation: string;
  payload: unknown;
  status: "pending" | "completed" | "failed";
  createdAt: number;
};

const queue: SyncQueueItem[] = [];

function emit(detail: SyncQueueEventDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(SYNC_QUEUE_EVENT, { detail }));
}

export function getSyncQueue() {
  return [...queue];
}

export function getPendingSyncQueueItems() {
  return queue.filter((item) => item.status === "pending");
}

export function getFailedSyncQueueItems() {
  return queue.filter((item) => item.status === "failed");
}

export function subscribeToSyncQueue(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handler = () => callback();
  window.addEventListener(SYNC_QUEUE_EVENT, handler);
  return () => window.removeEventListener(SYNC_QUEUE_EVENT, handler);
}

export function enqueueSyncItem(input: Omit<SyncQueueItem, "id" | "createdAt" | "status">) {
  const item: SyncQueueItem = {
    ...input,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    status: "pending",
    createdAt: Date.now(),
  };

  queue.push(item);
  emit({
    status: "queued",
    item,
  });

  return item;
}
