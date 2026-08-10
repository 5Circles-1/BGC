import { downloadFile } from './storage'

function esc(v: unknown): string {
  const s = v == null ? '' : String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function toCSV(headers: string[], rows: (string | number | null | undefined)[][]): string {
  return [headers.map(esc).join(','), ...rows.map(r => r.map(esc).join(','))].join('\n')
}

export async function downloadCSV(name: string, headers: string[], rows: (string | number | null | undefined)[][]): Promise<void> {
  await downloadFile(`${name}.csv`, toCSV(headers, rows), 'text/csv')
}
