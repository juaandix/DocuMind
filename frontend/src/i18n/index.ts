import { createI18n } from 'vue-i18n'
import en from './en'
import es from './es'

export type Locale = 'en' | 'es'
export const LOCALES: { code: Locale; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
]

function initialLocale(): Locale {
  try {
    const saved = localStorage.getItem('locale')
    if (saved === 'en' || saved === 'es') return saved
  } catch { /* storage unavailable */ }
  return navigator.language?.toLowerCase().startsWith('es') ? 'es' : 'en'
}

export const i18n = createI18n({
  legacy: false,
  locale: initialLocale(),
  fallbackLocale: 'en',
  messages: { en, es },
})

document.documentElement.lang = i18n.global.locale.value

export function setLocale(locale: Locale) {
  i18n.global.locale.value = locale
  document.documentElement.lang = locale
  try { localStorage.setItem('locale', locale) } catch { /* storage unavailable */ }
}

/** BCP 47 tag for Intl formatting of dates and numbers. */
export function intlLocale() {
  return i18n.global.locale.value === 'es' ? 'es-ES' : 'en-US'
}
