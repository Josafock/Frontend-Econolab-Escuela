"use client";

import { clearQueryCacheByPrefix } from "@/hooks/_lib/clientQueryCache";

export const SERVICES_CATALOGS_CACHE_KEY = "services:catalogs";

let servicesCatalogRevision = 0;

export function getServicesCatalogRevision(): number {
  return servicesCatalogRevision;
}

export function invalidateServicesCatalogsCache(): number {
  servicesCatalogRevision += 1;
  clearQueryCacheByPrefix(SERVICES_CATALOGS_CACHE_KEY);
  return servicesCatalogRevision;
}
