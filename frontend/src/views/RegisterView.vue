<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const router = useRouter()
const auth = useAuthStore()
const fullName = ref('')
const email = ref('')
const password = ref('')
const workspaceName = ref('')
const loading = ref(false)
const error = ref('')

async function handleRegister() {
  loading.value = true; error.value = ''
  try {
    await auth.register({ full_name: fullName.value, email: email.value, password: password.value, workspace_name: workspaceName.value })
    router.push('/dashboard')
  } catch (e: unknown) {
    error.value = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Registration failed'
  } finally { loading.value = false }
}
</script>

<template>
  <div class="min-h-screen bg-[#f5f5f7] dark:bg-[#1d1d1f] flex items-center justify-center p-6">
    <div class="w-full max-w-sm">
      <div class="flex flex-col items-center mb-8">
        <div class="w-14 h-14 rounded-2xl bg-[#0071e3] flex items-center justify-center shadow-[0_8px_24px_rgba(0,113,227,0.35)] mb-4">
          <svg class="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
        </div>
        <h1 class="text-2xl font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] tracking-tight">Create your account</h1>
        <p class="text-sm text-[#6e6e73] dark:text-[#98989d] mt-1">Start your DocuMind workspace</p>
      </div>

      <div class="bg-white dark:bg-[#2c2c2e] rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_20px_rgba(0,0,0,0.4)] p-6">
        <div v-if="error" class="mb-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm rounded-xl px-4 py-3">
          {{ error }}
        </div>

        <form @submit.prevent="handleRegister" class="space-y-3">
          <div>
            <label class="block text-xs font-medium text-[#6e6e73] dark:text-[#98989d] mb-1.5">Full name</label>
            <input v-model="fullName" type="text" placeholder="Jane Appleseed" autocomplete="name" required
              class="w-full rounded-lg border border-black/[0.12] dark:border-white/[0.1] bg-[#f5f5f7] dark:bg-[#3a3a3c] px-3.5 py-2.5 text-sm text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-[#6e6e73] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/40 focus:border-[#0071e3] dark:focus:border-[#2997ff]"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-[#6e6e73] dark:text-[#98989d] mb-1.5">Email</label>
            <input v-model="email" type="email" placeholder="you@example.com" autocomplete="email" required
              class="w-full rounded-lg border border-black/[0.12] dark:border-white/[0.1] bg-[#f5f5f7] dark:bg-[#3a3a3c] px-3.5 py-2.5 text-sm text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-[#6e6e73] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/40 focus:border-[#0071e3] dark:focus:border-[#2997ff]"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-[#6e6e73] dark:text-[#98989d] mb-1.5">Password</label>
            <input v-model="password" type="password" placeholder="Min. 8 characters" autocomplete="new-password" required
              class="w-full rounded-lg border border-black/[0.12] dark:border-white/[0.1] bg-[#f5f5f7] dark:bg-[#3a3a3c] px-3.5 py-2.5 text-sm text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-[#6e6e73] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/40 focus:border-[#0071e3] dark:focus:border-[#2997ff]"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-[#6e6e73] dark:text-[#98989d] mb-1.5">Workspace name</label>
            <input v-model="workspaceName" type="text" placeholder="Acme Corp" required
              class="w-full rounded-lg border border-black/[0.12] dark:border-white/[0.1] bg-[#f5f5f7] dark:bg-[#3a3a3c] px-3.5 py-2.5 text-sm text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-[#6e6e73] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/40 focus:border-[#0071e3] dark:focus:border-[#2997ff]"
            />
          </div>
          <button type="submit" :disabled="loading"
            class="w-full mt-1 bg-[#0071e3] hover:bg-[#0077ed] active:bg-[#0068d0] disabled:opacity-60 text-white text-sm font-medium rounded-lg py-2.5 shadow-[0_1px_3px_rgba(0,113,227,0.4)] transition-colors">
            {{ loading ? 'Creating account…' : 'Create account' }}
          </button>
        </form>
      </div>

      <p class="text-center text-sm text-[#6e6e73] dark:text-[#98989d] mt-5">
        Already have an account?
        <router-link to="/login" class="text-[#0071e3] dark:text-[#2997ff] hover:underline font-medium">Sign in</router-link>
      </p>
    </div>
  </div>
</template>
