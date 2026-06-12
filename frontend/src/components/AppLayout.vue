<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useNotificationsStore } from '@/stores/notifications.store'
import type { NotificationType } from '@/types/notification'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const notifStore = useNotificationsStore()

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

// Notifications
const drawerOpen = ref(false)

onMounted(() => notifStore.init())
onUnmounted(() => notifStore.cleanup())

function formatRelTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

const notifStyle: Record<NotificationType, { icon: string; bg: string; color: string }> = {
  document_ready:   { icon: 'check', bg: 'bg-[#34c759]/[0.1]', color: 'text-[#34c759]' },
  document_error:   { icon: 'x',     bg: 'bg-red-50',           color: 'text-red-500' },
  export_ready:     { icon: 'down',  bg: 'bg-[#0071e3]/[0.08]', color: 'text-[#0071e3]' },
  workspace_invite: { icon: 'user',  bg: 'bg-[#af52de]/[0.1]',  color: 'text-[#af52de]' },
  storage_warning:  { icon: 'warn',  bg: 'bg-[#ff9f0a]/[0.1]',  color: 'text-[#ff9f0a]' },
}
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
    <main class="flex-1 bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] flex flex-col overflow-hidden">

      <!-- Persistent header with notification bell -->
      <div class="flex items-center justify-end px-5 h-12 border-b border-black/[0.04] flex-shrink-0">
        <button @click="drawerOpen = true"
          class="relative p-2 rounded-lg text-[#6e6e73] hover:bg-[#f5f5f7] transition-colors"
          title="Notifications">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
          </svg>
          <span v-if="notifStore.unread > 0"
            class="absolute top-1 right-1 bg-[#ff3b30] text-white text-[9px] font-bold rounded-full min-w-[14px] h-3.5 px-0.5 flex items-center justify-center leading-none">
            {{ notifStore.unread > 9 ? '9+' : notifStore.unread }}
          </span>
        </button>
      </div>

      <!-- Scrollable view content -->
      <div class="flex-1 overflow-y-auto">
        <router-view />
      </div>
    </main>

    <!-- Notification drawer -->
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-150"
      leave-to-class="opacity-0"
    >
      <div v-if="drawerOpen" class="fixed inset-0 z-50 flex justify-end">
        <!-- Backdrop -->
        <div class="flex-1 bg-black/[0.15]" @click="drawerOpen = false"/>

        <!-- Panel (slide from right) -->
        <div class="w-80 bg-white h-full shadow-[-4px_0_24px_rgba(0,0,0,0.08)] flex flex-col">

          <!-- Drawer header -->
          <div class="flex items-center justify-between px-5 py-4 border-b border-black/[0.06] flex-shrink-0">
            <div class="flex items-center gap-2">
              <h2 class="text-base font-semibold text-[#1d1d1f]">Notifications</h2>
              <span v-if="notifStore.unread > 0"
                class="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#ff3b30] text-white leading-none">
                {{ notifStore.unread }}
              </span>
            </div>
            <div class="flex items-center gap-2">
              <button v-if="notifStore.unread > 0"
                @click="notifStore.markAllRead()"
                class="text-xs font-medium text-[#0071e3] hover:underline">
                Mark all read
              </button>
              <button @click="drawerOpen = false"
                class="p-1 rounded-lg text-[#6e6e73] hover:bg-[#f5f5f7] transition-colors">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Notification list -->
          <div class="flex-1 overflow-y-auto">
            <div v-if="notifStore.items.length === 0"
              class="flex flex-col items-center justify-center h-full text-center px-6 py-12">
              <div class="w-10 h-10 rounded-xl bg-[#0071e3]/[0.06] flex items-center justify-center mb-3">
                <svg class="w-5 h-5 text-[#0071e3]/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                </svg>
              </div>
              <p class="text-sm font-medium text-[#1d1d1f]">All caught up</p>
              <p class="text-xs text-[#6e6e73] mt-1">No notifications yet</p>
            </div>

            <div v-for="n in notifStore.items" :key="n._id"
              :class="['flex gap-3 px-4 py-3.5 border-b border-black/[0.04] last:border-0 transition-colors', !n.read && 'bg-[#0071e3]/[0.025]']">

              <!-- Icon -->
              <div :class="['w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5', notifStyle[n.type]?.bg ?? 'bg-[#f5f5f7]']">
                <!-- check -->
                <svg v-if="notifStyle[n.type]?.icon === 'check'" :class="['w-4 h-4', notifStyle[n.type]?.color]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
                <!-- x -->
                <svg v-else-if="notifStyle[n.type]?.icon === 'x'" :class="['w-4 h-4', notifStyle[n.type]?.color]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
                <!-- down arrow (export) -->
                <svg v-else-if="notifStyle[n.type]?.icon === 'down'" :class="['w-4 h-4', notifStyle[n.type]?.color]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                </svg>
                <!-- user (invite) -->
                <svg v-else-if="notifStyle[n.type]?.icon === 'user'" :class="['w-4 h-4', notifStyle[n.type]?.color]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
                </svg>
                <!-- warn -->
                <svg v-else :class="['w-4 h-4', notifStyle[n.type]?.color]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-2">
                  <p class="text-sm font-medium text-[#1d1d1f] leading-snug">{{ n.title }}</p>
                  <div v-if="!n.read" class="w-1.5 h-1.5 rounded-full bg-[#0071e3] flex-shrink-0 mt-1.5"/>
                </div>
                <p class="text-xs text-[#6e6e73] mt-0.5 leading-relaxed">{{ n.body }}</p>
                <p class="text-[10px] text-[#a0a0a5] mt-1">{{ formatRelTime(n.created_at) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>
