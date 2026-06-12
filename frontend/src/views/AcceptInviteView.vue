<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'

interface InviteInfo {
  email: string
  role: string
  workspace_name: string
  inviter_name: string
}

const route = useRoute()
const router = useRouter()

const token = route.params.token as string
const info = ref<InviteInfo | null>(null)
const loading = ref(true)
const notFound = ref(false)

const fullName = ref('')
const password = ref('')
const submitting = ref(false)
const error = ref('')

onMounted(async () => {
  try {
    const { data } = await api.get<InviteInfo>(`/api/v1/workspace/invite/${token}`)
    info.value = data
  } catch {
    notFound.value = true
  } finally {
    loading.value = false
  }
})

async function handleAccept() {
  error.value = ''
  submitting.value = true
  try {
    const { data } = await api.post<{ access_token: string; refresh_token: string }>(
      `/api/v1/workspace/invite/${token}/accept`,
      { full_name: fullName.value, password: password.value }
    )
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)
    router.push('/dashboard')
  } catch (e: unknown) {
    const err = e as { response?: { data?: { detail?: string } } }
    error.value = err.response?.data?.detail ?? 'Failed to accept invitation'
  } finally {
    submitting.value = false
  }
}

const roleLabel: Record<string, string> = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  MEMBER: 'Member',
}
</script>

<template>
  <div class="min-h-screen bg-[#e8e8ed] flex items-center justify-center p-6">
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="flex items-center justify-center gap-2.5 mb-8">
        <div class="w-9 h-9 rounded-xl bg-[#0071e3] flex items-center justify-center shadow-[0_2px_10px_rgba(0,113,227,0.35)]">
          <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
        </div>
        <span class="text-lg font-semibold text-[#1d1d1f] tracking-tight">DocuMind</span>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] p-10 flex justify-center">
        <div class="w-6 h-6 border-2 border-[#0071e3]/30 border-t-[#0071e3] rounded-full animate-spin"></div>
      </div>

      <!-- Not found -->
      <div v-else-if="notFound" class="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] p-10 text-center">
        <div class="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
          <svg class="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
        </div>
        <p class="text-base font-semibold text-[#1d1d1f]">Invite not found</p>
        <p class="text-sm text-[#6e6e73] mt-1">This invite link has expired or already been used.</p>
        <router-link to="/login" class="inline-block mt-5 text-sm font-medium text-[#0071e3] hover:underline">
          Back to login
        </router-link>
      </div>

      <!-- Invite card -->
      <div v-else-if="info" class="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] overflow-hidden">
        <!-- Header -->
        <div class="px-8 pt-8 pb-6 border-b border-black/[0.06]">
          <p class="text-xs font-medium text-[#6e6e73] uppercase tracking-widest mb-1">You've been invited</p>
          <h1 class="text-xl font-semibold text-[#1d1d1f] leading-snug">
            Join <span class="text-[#0071e3]">{{ info.workspace_name }}</span>
          </h1>
          <p class="text-sm text-[#6e6e73] mt-1.5">
            <span class="font-medium text-[#1d1d1f]">{{ info.inviter_name }}</span> invited you as
            <span :class="[
              'font-medium px-1.5 py-0.5 rounded-full text-xs ml-0.5',
              info.role === 'ADMIN' ? 'bg-[#0071e3]/[0.08] text-[#0071e3]' : 'bg-black/[0.04] text-[#6e6e73]'
            ]">{{ roleLabel[info.role] ?? info.role }}</span>
          </p>
        </div>

        <form @submit.prevent="handleAccept" class="px-8 py-6 space-y-4">
          <!-- Email (readonly) -->
          <div>
            <label class="block text-xs font-medium text-[#1d1d1f] mb-1.5">Email</label>
            <input
              :value="info.email"
              readonly
              class="w-full px-3 py-2.5 text-sm rounded-lg border border-black/[0.12] bg-[#f5f5f7] text-[#6e6e73] cursor-not-allowed"
            />
          </div>

          <!-- Full name -->
          <div>
            <label class="block text-xs font-medium text-[#1d1d1f] mb-1.5">Full name</label>
            <input
              v-model="fullName"
              type="text"
              required
              placeholder="Your name"
              class="w-full px-3 py-2.5 text-sm rounded-lg border border-black/[0.12] bg-[#f5f5f7] text-[#1d1d1f] placeholder-[#a0a0a5] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/40 focus:border-[#0071e3] transition-colors"
            />
          </div>

          <!-- Password -->
          <div>
            <label class="block text-xs font-medium text-[#1d1d1f] mb-1.5">Password</label>
            <input
              v-model="password"
              type="password"
              required
              minlength="8"
              placeholder="At least 8 characters"
              class="w-full px-3 py-2.5 text-sm rounded-lg border border-black/[0.12] bg-[#f5f5f7] text-[#1d1d1f] placeholder-[#a0a0a5] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/40 focus:border-[#0071e3] transition-colors"
            />
          </div>

          <p v-if="error" class="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{{ error }}</p>

          <button
            type="submit"
            :disabled="submitting"
            class="w-full bg-[#0071e3] hover:bg-[#0077ed] disabled:opacity-50 text-white text-sm font-medium rounded-lg py-2.5 shadow-[0_1px_3px_rgba(0,113,227,0.4)] transition-colors flex items-center justify-center gap-2"
          >
            <svg v-if="submitting" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            {{ submitting ? 'Joining…' : 'Accept invitation' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
