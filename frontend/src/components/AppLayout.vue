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
  <div class="flex h-screen bg-amber-50 dark:bg-neutral-950 overflow-hidden">
    <!-- Sidebar -->
    <aside class="w-56 flex-shrink-0 bg-white dark:bg-neutral-900 border-r-2 border-black dark:border-white flex flex-col">
      <!-- Logo -->
      <div class="h-14 flex items-center px-4 border-b-2 border-black dark:border-white bg-black dark:bg-yellow-400">
        <span class="text-sm font-bold tracking-widest uppercase text-yellow-400 dark:text-black">DOCU</span>
        <span class="text-sm font-bold tracking-widest uppercase text-white dark:text-black">MIND</span>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <template v-for="item in navMain" :key="item.to">
          <router-link
            :to="item.to"
            :class="[
              'flex items-center gap-2.5 px-3 py-2 text-sm font-bold uppercase tracking-wide border-2 transition-none',
              isActive(item.to)
                ? 'bg-black dark:bg-yellow-400 text-yellow-400 dark:text-black border-black dark:border-yellow-400 shadow-[3px_3px_0_0] shadow-yellow-400 dark:shadow-black'
                : 'bg-transparent text-black dark:text-white border-transparent hover:border-black dark:hover:border-white hover:bg-yellow-400 dark:hover:bg-neutral-800 hover:shadow-[3px_3px_0_0] hover:shadow-black dark:hover:shadow-white'
            ]"
          >
            <svg v-if="item.icon === 'grid'" class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
            </svg>
            <svg v-else-if="item.icon === 'file'" class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
            </svg>
            <svg v-else-if="item.icon === 'chat'" class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
            {{ item.label }}
          </router-link>
        </template>

        <div class="my-3 border-t-2 border-black dark:border-neutral-700"></div>
        <p class="px-3 text-[9px] font-bold text-black/40 dark:text-white/30 uppercase tracking-widest mb-1">Settings</p>

        <template v-for="item in navSettings" :key="item.to">
          <router-link
            :to="item.to"
            :class="[
              'flex items-center gap-2.5 px-3 py-2 text-sm font-bold uppercase tracking-wide border-2 transition-none',
              isActive(item.to)
                ? 'bg-black dark:bg-yellow-400 text-yellow-400 dark:text-black border-black dark:border-yellow-400 shadow-[3px_3px_0_0] shadow-yellow-400 dark:shadow-black'
                : 'bg-transparent text-black dark:text-white border-transparent hover:border-black dark:hover:border-white hover:bg-yellow-400 dark:hover:bg-neutral-800 hover:shadow-[3px_3px_0_0] hover:shadow-black dark:hover:shadow-white'
            ]"
          >
            <svg v-if="item.icon === 'building'" class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
            </svg>
            <svg v-else-if="item.icon === 'users'" class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
            </svg>
            <svg v-else-if="item.icon === 'user'" class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
            {{ item.label }}
          </router-link>
        </template>
      </nav>

      <!-- Footer -->
      <div class="border-t-2 border-black dark:border-white p-3 space-y-1">
        <!-- Theme toggle -->
        <button
          @click="toggle"
          class="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold uppercase tracking-wide text-black dark:text-white border-2 border-transparent hover:border-black dark:hover:border-white hover:bg-yellow-400 dark:hover:bg-neutral-800 hover:shadow-[3px_3px_0_0] hover:shadow-black dark:hover:shadow-white"
        >
          <svg v-if="theme === 'dark'" class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
          </svg>
          <svg v-else class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
          </svg>
          {{ theme === 'dark' ? 'Light mode' : 'Dark mode' }}
        </button>

        <!-- User row -->
        <div class="flex items-center gap-2.5 px-3 py-2 border-2 border-black dark:border-white bg-yellow-400 dark:bg-neutral-800 shadow-[3px_3px_0_0] shadow-black dark:shadow-white">
          <div class="w-7 h-7 bg-black dark:bg-white flex items-center justify-center text-xs font-black text-yellow-400 dark:text-black flex-shrink-0">
            {{ initials }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-xs font-bold text-black dark:text-white truncate uppercase">{{ auth.user?.full_name }}</p>
            <p class="text-[10px] font-semibold text-black/60 dark:text-white/60 truncate">{{ auth.user?.role }}</p>
          </div>
          <button
            @click="handleLogout"
            class="p-1 text-black dark:text-white hover:text-red-600 transition-colors"
            title="Sign out"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
          </button>
        </div>
      </div>
    </aside>

    <!-- Main content -->
    <main class="flex-1 overflow-y-auto bg-amber-50 dark:bg-neutral-950">
      <router-view />
    </main>
  </div>
</template>
