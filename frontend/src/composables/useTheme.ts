import { ref } from 'vue'

type Theme = 'light' | 'dark'

// index.html applies the saved/system theme before first paint; start from it.
const theme = ref<Theme>(document.documentElement.classList.contains('dark') ? 'dark' : 'light')

function applyTheme(t: Theme, persist: boolean) {
  document.documentElement.classList.toggle('dark', t === 'dark')
  if (persist) {
    try { localStorage.setItem('theme', t) } catch { /* storage unavailable */ }
  }
  theme.value = t
}

const media = window.matchMedia('(prefers-color-scheme: dark)')
media.addEventListener('change', (e) => {
  let saved: string | null = null
  try { saved = localStorage.getItem('theme') } catch { /* storage unavailable */ }
  if (!saved) applyTheme(e.matches ? 'dark' : 'light', false)
})

export function useTheme() {
  function toggle() {
    applyTheme(theme.value === 'dark' ? 'light' : 'dark', true)
  }
  return { theme, toggle }
}
