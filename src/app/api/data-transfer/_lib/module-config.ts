export const DATA_TRANSFER_MODULES = {
  patients: '/patients',
  doctors: '/doctors',
  studies: '/studies',
} as const;

export type DataTransferModule = keyof typeof DATA_TRANSFER_MODULES;

export function resolveModulePath(moduleName: string) {
  if (moduleName in DATA_TRANSFER_MODULES) {
    return DATA_TRANSFER_MODULES[moduleName as DataTransferModule];
  }

  return null;
}
