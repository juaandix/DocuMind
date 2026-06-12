import { ref, onMounted } from 'vue'

type Theme = 'light' | 'dark'

const theme = ref<Theme>('light')

function applyTheme(t: Theme) {
  document.documentElement.classList.toggle('dark', t === 'dark')
  localStorage.setItem('theme', t)
  theme.value = t
}

export function useTheme() {
  onMounted(() => {
    const saved = localStorage.getItem('theme') as Theme | null
    const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    applyTheme(saved ?? (sysDark ? 'dark' : 'light'))

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) applyTheme(e.matches ? 'dark' : 'light')
    })
  })

  function toggle() {
    applyTheme(theme.value === 'dark' ? 'light' : 'dark')
  }

  return { theme, toggle }
}
