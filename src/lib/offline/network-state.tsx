"use client";

export type OfflineContextValue = {
  isOnline: boolean;
  isOfflineMode: boolean;
  lastChangedAt: number;
  hasInternetConnection: boolean;
  hasBackendConnection: boolean;
  isDesktop: boolean;
  isOfflineCapable: boolean;
  queuedItems: unknown[];
  pendingItems: unknown[];
  queuedCount: number;
  localPendingCount: number;
  localFailedCount: number;
  pendingCount: number;
  failedCount: number;
  backendSyncStatus: null;
  backendOutboxSummary: null;
  backendPendingCount: number;
  backendFailedCount: number;
  backendProcessingCount: number;
  refreshQueue: () => void;
  refreshSyncState: () => Promise<void>;
  runBackendSync: () => Promise<{ ok: true; result: null }>;
};

export function useOffline(): OfflineContextValue {
  return {
    isOnline: true,
    isOfflineMode: false,
    lastChangedAt: Date.now(),
    hasInternetConnection: true,
    hasBackendConnection: true,
    isDesktop: false,
    isOfflineCapable: false,
    queuedItems: [],
    pendingItems: [],
    queuedCount: 0,
    localPendingCount: 0,
    localFailedCount: 0,
    pendingCount: 0,
    failedCount: 0,
    backendSyncStatus: null,
    backendOutboxSummary: null,
    backendPendingCount: 0,
    backendFailedCount: 0,
    backendProcessingCount: 0,
    refreshQueue: () => {},
    refreshSyncState: async () => {},
    runBackendSync: async () => ({ ok: true, result: null }),
  };
}
