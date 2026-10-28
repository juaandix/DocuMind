import { intlLocale } from '@/i18n'

export function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString(intlLocale(), { month: 'short', day: 'numeric' })
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(intlLocale(), { hour: '2-digit', minute: '2-digit', hour12: false })
}

const TYPES: Record<string, string> = {
  'application/pdf': 'PDF',
  'text/csv': 'CSV',
  'text/plain': 'TXT',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
}

export function docType(mime: string, name = '') {
  return TYPES[mime] ?? name.split('.').pop()?.toUpperCase() ?? 'FILE'
}

export function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(intlLocale(), { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatDateTime(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(intlLocale(), { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
