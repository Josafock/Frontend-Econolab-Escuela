"use client";

type OfflineSnapshot<T> = {
  value: T;
  updatedAt: number;
};

const memoryStore = new Map<string, string>();

function getStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readRaw(key: string) {
  const storage = getStorage();
  return storage?.getItem(key) ?? memoryStore.get(key) ?? null;
}

function writeRaw(key: string, value: string) {
  const storage = getStorage();
  if (storage) {
    storage.setItem(key, value);
    return;
  }

  memoryStore.set(key, value);
}

export function readOfflineSnapshot<T>(key: string): OfflineSnapshot<T> | null {
  const raw = readRaw(key);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as OfflineSnapshot<T>;
  } catch {
    return null;
  }
}

export function writeOfflineSnapshot<T>(
  key: string,
  value: T,
): OfflineSnapshot<T> {
  const snapshot: OfflineSnapshot<T> = {
    value,
    updatedAt: Date.now(),
  };

  writeRaw(key, JSON.stringify(snapshot));
  return snapshot;
}
