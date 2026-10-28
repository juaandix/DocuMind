<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { onClickOutside, useEventListener } from '@vueuse/core'
import {
  Bell, LogOut, Moon, Sun, Menu, X, CircleCheck, CircleAlert, Download, UserPlus, TriangleAlert, Search,
  UserRound, Building2, ChevronDown,
} from 'lucide-vue-next'
import type { Component } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useNotificationsStore } from '@/stores/notifications.store'
import { useTheme } from '@/composables/useTheme'
import BrandMark from '@/components/ui/BrandMark.vue'
import type { NotificationType } from '@/types/notification'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const wsStore = useWorkspaceStore()
const notifStore = useNotificationsStore()
const { theme, toggle: toggleTheme } = useTheme()

const workspaceName = computed(() => wsStore.workspace?.name ?? 'Workspace')

const nav = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/documents', label: 'Documents' },
  { to: '/rooms', label: 'Chat Rooms' },
  { to: '/settings/members', label: 'Members' },
  { to: '/settings/workspace', label: 'Settings', match: ['/settings/workspace', '/settings/profile'] },
]

function isActive(item: { to: string; match?: string[] }) {
  const paths = item.match ?? [item.to]
  return paths.some(p => route.path === p || (p !== '/dashboard' && route.path.startsWith(p)))
}

async function handleLogout() {
  await auth.logout()
  router.push('/login')
}

const initials = computed(() => {
  const name = auth.user?.full_name ?? ''
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
})

// Global search jumps to the documents list, filtered. The documents page has its own field.
const searchInput = ref<HTMLInputElement | null>(null)
const query = ref('')
function submitSearch() {
  router.push({ path: '/documents', query: query.value.trim() ? { q: query.value.trim() } : {} })
  searchInput.value?.blur()
}

// Menus
const mobileOpen = ref(false)
const userMenuOpen = ref(false)
const userMenu = ref<HTMLElement | null>(null)
onClickOutside(userMenu, () => { userMenuOpen.value = false })
watch(() => route.path, () => { mobileOpen.value = false; userMenuOpen.value = false })

const drawerOpen = ref(false)

useEventListener(window, 'keydown', (e: KeyboardEvent) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    const field = searchInput.value ?? document.querySelector<HTMLInputElement>('main input[type="search"]')
    field?.focus()
    return
  }
  if (e.key !== 'Escape') return
  drawerOpen.value = false
  mobileOpen.value = false
  userMenuOpen.value = false
})

onMounted(() => { notifStore.init(); wsStore.fetchWorkspace() })
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

const notifStyle: Record<NotificationType, { icon: Component; tone: string }> = {
  document_ready:   { icon: CircleCheck,   tone: 'text-ink' },
  document_error:   { icon: CircleAlert,   tone: 'text-danger' },
  export_ready:     { icon: Download,      tone: 'text-ink' },
  workspace_invite: { icon: UserPlus,      tone: 'text-ink' },
  storage_warning:  { icon: TriangleAlert, tone: 'text-ink' },
}
</script>

<template>
  <div class="flex h-dvh flex-col overflow-hidden bg-ground">

    <!-- Top bar -->
    <header class="relative z-30 flex h-14 shrink-0 items-center gap-2 bg-rail px-4 text-rail-ink lg:px-8">
      <button class="-ml-1 rounded p-2 text-rail-ink-2 hover:text-white md:hidden" :aria-expanded="mobileOpen" aria-label="Open menu" @click="mobileOpen = !mobileOpen">
        <X v-if="mobileOpen" class="size-5" /><Menu v-else class="size-5" />
      </button>

      <router-link to="/dashboard" class="mr-6 flex items-center gap-2.5" aria-label="DocuMind, go to dashboard">
        <BrandMark :size="28" />
        <span class="font-display text-[20px] font-bold uppercase leading-none tracking-[0.06em] text-white">DocuMind</span>
      </router-link>

      <nav aria-label="Main" class="hidden h-full items-stretch gap-6 md:flex">
        <router-link v-for="item in nav" :key="item.to" :to="item.to"
          :aria-current="isActive(item) ? 'page' : undefined"
          :class="[
            'flex items-center text-[14px]',
            isActive(item) ? 'font-semibold text-white shadow-[inset_0_-2px_0_var(--dm-alert)]' : 'font-medium text-rail-ink-2 hover:text-white',
          ]">{{ item.label }}</router-link>
      </nav>

      <form v-if="route.path !== '/documents'" role="search" class="ml-auto hidden lg:block" @submit.prevent="submitSearch">
        <label class="relative flex w-72 items-center">
          <span class="sr-only">Search documents</span>
          <Search class="pointer-events-none absolute left-3 size-4 text-rail-ink-2" />
          <input ref="searchInput" v-model="query" type="search" placeholder="Search documents"
            class="h-9 w-full rounded-[5px] border border-rail-2 bg-rail-2 pr-12 pl-9 text-[14px] text-white placeholder:text-rail-ink-2 focus:border-rail-ink-2 focus:ring-2 focus:ring-alert focus:outline-none" />
          <kbd class="pointer-events-none absolute right-2 rounded-[3px] border border-rail-ink-2/40 px-1.5 font-mono text-[11px] text-rail-ink-2">⌘K</kbd>
        </label>
      </form>

      <div :class="['flex items-center gap-1', route.path === '/documents' ? 'ml-auto' : 'ml-auto lg:ml-3']">
        <button class="press rounded p-2 text-rail-ink-2 hover:bg-rail-2 hover:text-white"
          :aria-label="theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'" @click="toggleTheme">
          <Sun v-if="theme === 'dark'" class="size-[18px]" /><Moon v-else class="size-[18px]" />
        </button>
        <button class="press relative rounded p-2 text-rail-ink-2 hover:bg-rail-2 hover:text-white"
          :aria-label="notifStore.unread > 0 ? `Notifications, ${notifStore.unread} unread` : 'Notifications'"
          title="Notifications" @click="drawerOpen = true">
          <Bell class="size-[18px]" :stroke-width="1.75" />
          <span v-if="notifStore.unread > 0"
            class="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-[3px] bg-alert px-1 font-mono text-[11px] font-bold leading-none text-on-alert">
            {{ notifStore.unread > 9 ? '9+' : notifStore.unread }}
          </span>
        </button>

        <div ref="userMenu" class="relative ml-2">
          <button class="press flex items-center gap-2 rounded-[5px] py-1 pr-1.5 pl-1 hover:bg-rail-2" :aria-expanded="userMenuOpen" aria-haspopup="menu"
            :aria-label="`Account menu for ${auth.user?.full_name ?? 'you'}`" @click="userMenuOpen = !userMenuOpen">
            <span class="flex size-8 items-center justify-center rounded-[5px] bg-rail-2 font-mono text-[12px] font-semibold text-white">{{ initials }}</span>
            <ChevronDown class="size-3.5 text-rail-ink-2" />
          </button>
          <Transition name="menu">
          <div v-if="userMenuOpen" role="menu"
            class="absolute top-full right-0 mt-2 w-64 origin-top-right overflow-hidden rounded-pass bg-surface text-ink shadow-raised">
            <div class="border-b border-line px-4 py-3">
              <p class="truncate text-[14px] font-semibold">{{ auth.user?.full_name }}</p>
              <p class="truncate text-[13px] text-ink-2">{{ auth.user?.email }}</p>
              <p class="label mt-1.5">{{ workspaceName }} · {{ auth.user?.role }}</p>
            </div>
            <router-link to="/settings/profile" role="menuitem" class="flex items-center gap-3 px-4 py-2.5 text-[14px] hover:bg-sunken">
              <UserRound class="size-4 text-ink-2" />Profile
            </router-link>
            <router-link to="/settings/workspace" role="menuitem" class="flex items-center gap-3 px-4 py-2.5 text-[14px] hover:bg-sunken">
              <Building2 class="size-4 text-ink-2" />Workspace settings
            </router-link>
            <button role="menuitem" class="flex w-full items-center gap-3 border-t border-line px-4 py-2.5 text-left text-[14px] hover:bg-sunken" @click="handleLogout">
              <LogOut class="size-4 text-ink-2" />Sign out
            </button>
          </div>
          </Transition>
        </div>
      </div>

      <!-- Mobile navigation -->
      <Transition name="menu">
      <nav v-if="mobileOpen" aria-label="Main" class="origin-top absolute inset-x-0 top-full flex flex-col border-t border-rail-2 bg-rail px-4 pb-4 md:hidden">
        <router-link v-for="item in nav" :key="item.to" :to="item.to"
          :aria-current="isActive(item) ? 'page' : undefined"
          :class="['flex min-h-11 items-center gap-3 border-b border-rail-2 text-[15px]', isActive(item) ? 'font-semibold text-white' : 'text-rail-ink-2']">
          <span :class="['size-1.5 rounded-full', isActive(item) ? 'bg-alert' : 'bg-transparent']" />{{ item.label }}
        </router-link>
      </nav>
      </Transition>
    </header>

    <main class="min-h-0 flex-1 overflow-y-auto">
      <router-view />
    </main>

    <!-- Notification drawer -->
    <Transition name="drawer" :duration="{ enter: 300, leave: 200 }">
      <div v-if="drawerOpen" class="fixed inset-0 z-50 flex justify-end">
        <div class="flex-1 bg-black/30" @click="drawerOpen = false" />

        <section class="drawer-panel flex h-full w-full max-w-sm flex-col bg-surface shadow-raised" role="dialog" aria-modal="true" aria-labelledby="notif-title">
          <div class="flex items-center justify-between border-b border-line px-5 py-4">
            <div class="flex items-center gap-2">
              <h2 id="notif-title" class="text-base font-semibold text-ink">Notifications</h2>
              <span v-if="notifStore.unread > 0"
                class="rounded-[3px] bg-alert px-1.5 py-0.5 font-mono text-[11px] font-bold leading-none text-on-alert">{{ notifStore.unread }}</span>
            </div>
            <div class="flex items-center gap-2">
              <button v-if="notifStore.unread > 0" class="text-[13px] font-semibold text-ink underline-offset-4 hover:underline"
                @click="notifStore.markAllRead()">Mark all read</button>
              <button class="rounded p-1.5 text-ink-2 hover:bg-sunken hover:text-ink" aria-label="Close notifications" @click="drawerOpen = false">
                <X class="size-4" />
              </button>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto">
            <div v-if="notifStore.items.length === 0" class="flex h-full flex-col items-center justify-center px-6 py-12 text-center">
              <Bell class="mb-3 size-6 text-ink-3" :stroke-width="1.5" />
              <p class="text-sm font-semibold text-ink">All caught up</p>
              <p class="mt-1 text-[13px] text-ink-3">No notifications yet</p>
            </div>

            <div v-for="n in notifStore.items" :key="n._id"
              :class="['flex gap-3 border-b border-line px-5 py-4 last:border-0', !n.read && 'bg-alert-soft']">
              <component :is="notifStyle[n.type]?.icon ?? Bell" :class="['mt-0.5 size-[18px] shrink-0', notifStyle[n.type]?.tone ?? 'text-ink']" :stroke-width="1.75" />
              <div class="min-w-0 flex-1">
                <p class="text-sm font-semibold leading-snug text-ink">{{ n.title }}</p>
                <p class="mt-0.5 text-[13px] leading-relaxed text-ink-2">{{ n.body }}</p>
                <p class="mt-1 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-3">{{ formatRelTime(n.created_at) }}</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Transition>
  </div>
</template>
