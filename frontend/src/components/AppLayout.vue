<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

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
  <div class="flex h-screen bg-[#e8e8ed] p-3 gap-3 overflow-hidden">

    <!-- Floating sidebar card -->
    <aside class="w-52 flex-shrink-0 bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] flex flex-col overflow-hidden">

      <!-- Logo -->
      <div class="px-4 pt-5 pb-4">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-[#0071e3] flex items-center justify-center shadow-[0_2px_8px_rgba(0,113,227,0.35)]">
            <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
          <div>
            <p class="text-sm font-semibold text-[#1d1d1f] leading-tight tracking-tight">DocuMind</p>
            <p class="text-[10px] text-[#6e6e73] leading-tight">Workspace</p>
          </div>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 overflow-y-auto px-2 space-y-0.5">
        <template v-for="item in navMain" :key="item.to">
          <router-link :to="item.to"
            :class="[
              'flex items-center gap-2.5 px-3 py-2 text-sm rounded-xl transition-colors',
              isActive(item.to)
                ? 'bg-[#0071e3] text-white font-medium shadow-[0_2px_8px_rgba(0,113,227,0.3)]'
                : 'text-[#1d1d1f] hover:bg-[#f5f5f7] font-normal'
            ]"
          >
            <svg v-if="item.icon === 'grid'" :class="['w-4 h-4 flex-shrink-0', isActive(item.to) ? 'opacity-100' : 'opacity-50']" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
            <svg v-else-if="item.icon === 'file'" :class="['w-4 h-4 flex-shrink-0', isActive(item.to) ? 'opacity-100' : 'opacity-50']" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
            </svg>
            <svg v-else-if="item.icon === 'chat'" :class="['w-4 h-4 flex-shrink-0', isActive(item.to) ? 'opacity-100' : 'opacity-50']" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
            {{ item.label }}
          </router-link>
        </template>

        <!-- Settings section -->
        <div class="pt-4 pb-1 px-3">
          <p class="text-[10px] font-semibold text-[#6e6e73] uppercase tracking-widest">Settings</p>
        </div>

        <template v-for="item in navSettings" :key="item.to">
          <router-link :to="item.to"
            :class="[
              'flex items-center gap-2.5 px-3 py-2 text-sm rounded-xl transition-colors',
              isActive(item.to)
                ? 'bg-[#0071e3] text-white font-medium shadow-[0_2px_8px_rgba(0,113,227,0.3)]'
                : 'text-[#1d1d1f] hover:bg-[#f5f5f7] font-normal'
            ]"
          >
            <svg v-if="item.icon === 'building'" :class="['w-4 h-4 flex-shrink-0', isActive(item.to) ? 'opacity-100' : 'opacity-50']" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
            </svg>
            <svg v-else-if="item.icon === 'users'" :class="['w-4 h-4 flex-shrink-0', isActive(item.to) ? 'opacity-100' : 'opacity-50']" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
            </svg>
            <svg v-else-if="item.icon === 'user'" :class="['w-4 h-4 flex-shrink-0', isActive(item.to) ? 'opacity-100' : 'opacity-50']" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
            {{ item.label }}
          </router-link>
        </template>
      </nav>

      <!-- User footer -->
      <div class="p-3 mt-2">
        <div class="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#f5f5f7] hover:bg-[#ebebf0] transition-colors cursor-default">
          <div class="w-7 h-7 rounded-full bg-[#0071e3] flex items-center justify-center text-xs font-semibold text-white flex-shrink-0">
            {{ initials }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-xs font-medium text-[#1d1d1f] truncate leading-tight">{{ auth.user?.full_name }}</p>
            <p class="text-[10px] text-[#6e6e73] truncate leading-tight">{{ auth.user?.role }}</p>
          </div>
          <button @click="handleLogout" class="p-1 rounded-lg text-[#6e6e73] hover:text-red-500 hover:bg-white transition-colors flex-shrink-0" title="Sign out">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
          </button>
        </div>
      </div>
    </aside>

    <!-- Main content card -->
    <main class="flex-1 bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-y-auto">
      <router-view />
    </main>
  </div>
</template>
