<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useTheme } from '@/composables/useTheme'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const { theme, toggle } = useTheme()

const navMain = [
  { to: '/dashboard', label: 'Dashboard', icon: 'grid' },
  { to: '/documents', label: 'Documents', icon: 'file' },
  { to: '/rooms', label: 'Chat Rooms', icon: 'chat' },
]

const navSettings = [
  { to: '/settings/workspace', label: 'Workspace', icon: 'building' },
  { to: '/settings/members', label: 'Members', icon: 'users' },
  { to: '/settings/profile', label: 'Profile', icon: 'user' },
]

function isActive(to: string) {
  return route.path === to || (to !== '/dashboard' && route.path.startsWith(to))
}

async function handleLogout() {
  await auth.logout()
  router.push('/login')
}

const initials = computed(() => {
  const name = auth.user?.full_name ?? ''
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
})
</script>

<template>
  <div class="flex h-screen bg-[#f5f5f7] dark:bg-[#1d1d1f] overflow-hidden">
    <!-- Sidebar -->
    <aside class="w-56 flex-shrink-0 bg-white/80 dark:bg-[#1c1c1e]/90 backdrop-blur-xl border-r border-black/[0.08] dark:border-white/[0.08] flex flex-col">
      <!-- Logo -->
      <div class="h-14 flex items-center px-5 border-b border-black/[0.06] dark:border-white/[0.06]">
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-lg bg-[#0071e3] flex items-center justify-center">
            <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
          <span class="text-sm font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] tracking-tight">DocuMind</span>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        <template v-for="item in navMain" :key="item.to">
          <router-link :to="item.to"
            :class="[
              'flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors',
              isActive(item.to)
                ? 'bg-[#0071e3]/[0.12] dark:bg-[#2997ff]/[0.15] text-[#0071e3] dark:text-[#2997ff] font-medium'
                : 'text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] font-normal'
            ]"
          >
            <svg v-if="item.icon === 'grid'" class="w-4 h-4 flex-shrink-0 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
            <svg v-else-if="item.icon === 'file'" class="w-4 h-4 flex-shrink-0 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
            </svg>
            <svg v-else-if="item.icon === 'chat'" class="w-4 h-4 flex-shrink-0 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
            {{ item.label }}
          </router-link>
        </template>

        <div class="my-3 px-3">
          <p class="text-[10px] font-semibold text-[#6e6e73] dark:text-[#98989d] uppercase tracking-widest mb-1">Settings</p>
        </div>

        <template v-for="item in navSettings" :key="item.to">
          <router-link :to="item.to"
            :class="[
              'flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors',
              isActive(item.to)
                ? 'bg-[#0071e3]/[0.12] dark:bg-[#2997ff]/[0.15] text-[#0071e3] dark:text-[#2997ff] font-medium'
                : 'text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] font-normal'
            ]"
          >
            <svg v-if="item.icon === 'building'" class="w-4 h-4 flex-shrink-0 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
            </svg>
            <svg v-else-if="item.icon === 'users'" class="w-4 h-4 flex-shrink-0 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
            </svg>
            <svg v-else-if="item.icon === 'user'" class="w-4 h-4 flex-shrink-0 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
            {{ item.label }}
          </router-link>
        </template>
      </nav>

      <!-- Footer -->
      <div class="border-t border-black/[0.06] dark:border-white/[0.06] p-3 space-y-1">
        <button @click="toggle"
          class="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#6e6e73] dark:text-[#98989d] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] rounded-lg transition-colors">
          <svg v-if="theme === 'dark'" class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
          </svg>
          <svg v-else class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
          </svg>
          {{ theme === 'dark' ? 'Light mode' : 'Dark mode' }}
        </button>

        <!-- User row -->
        <div class="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.06] cursor-default">
          <div class="w-7 h-7 rounded-full bg-[#0071e3] flex items-center justify-center text-xs font-semibold text-white flex-shrink-0">
            {{ initials }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] truncate">{{ auth.user?.full_name }}</p>
            <p class="text-[10px] text-[#6e6e73] dark:text-[#98989d] truncate">{{ auth.user?.role }}</p>
          </div>
          <button @click="handleLogout" class="p-1 text-[#6e6e73] dark:text-[#98989d] hover:text-red-500 transition-colors" title="Sign out">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
          </button>
        </div>
      </div>
    </aside>

    <!-- Main content -->
    <main class="flex-1 overflow-y-auto bg-[#f5f5f7] dark:bg-[#1d1d1f]">
      <router-view />
    </main>
  </div>
</template>
