export const SUPPORTED = {
  pages: ['docx', 'rtf', 'pdf'],
  numbers: ['xlsx', 'csv', 'pdf'],
  keynote: ['pptx', 'pdf'],
} as const;

export type IWorkKind = keyof typeof SUPPORTED;

export function getExt(name: string): string {
  const m = /\.([^.]+)$/.exec(name);
  return (m?.[1] || '').toLowerCase();
}

export function inferTypeFromName(name: string): IWorkKind {
  const ext = getExt(name);
  if (ext === 'pages') return 'pages';
  if (ext === 'numbers') return 'numbers';
  if (ext === 'key') return 'keynote';
  return 'pages';
}

export function isValidMapping(type: IWorkKind, target: string): boolean {
  return SUPPORTED[type].includes(target as any);
}

export function targetMime(target: string): string {
  switch (target) {
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'rtf':
      return 'application/rtf';
    case 'pdf':
      return 'application/pdf';
    case 'xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'csv':
      return 'text/csv';
    case 'pptx':
      return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    default:
      return 'application/octet-stream';
  }
}

export function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

