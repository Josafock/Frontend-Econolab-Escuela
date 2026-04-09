"use client";

export const SYNC_QUEUE_EVENT = "econolab:sync-queue";

export type SyncQueueEventDetail = {
  status: "queued" | "completed" | "failed";
  item: {
    id: string;
    scope: string;
    entityType: string;
    entityId: number;
    operation: string;
  };
  result?: unknown;
};
