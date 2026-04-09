"use client";

export type FilePayload = {
  url?: string;
  blob?: Blob;
  filename: string;
  contentType: string;
};

export interface FileService {
  open(file: FilePayload): Promise<void>;
  download(file: FilePayload): Promise<void>;
}

function openUrl(url: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.open(url, "_blank", "noopener,noreferrer");
}

function resolveObjectUrl(file: FilePayload) {
  if (file.blob) {
    return URL.createObjectURL(file.blob);
  }

  return file.url ?? "";
}

function downloadUrl(file: FilePayload) {
  if (typeof document === "undefined") {
    return;
  }

  const url = resolveObjectUrl(file);
  if (!url) {
    return;
  }

  const link = document.createElement("a");
  link.href = url;
  link.download = file.filename;
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  if (file.blob) {
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

export const appFileService: FileService = {
  async open(file) {
    const url = resolveObjectUrl(file);
    if (!url) {
      return;
    }

    openUrl(url);

    if (file.blob) {
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    }
  },
  async download(file) {
    downloadUrl(file);
  },
};
