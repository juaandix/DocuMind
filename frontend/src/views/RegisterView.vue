<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const router = useRouter()
const auth = useAuthStore()
const form = ref({ email: '', password: '', full_name: '', workspace_name: '' })
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await auth.register(form.value)
    router.push('/dashboard')
  } catch (e: unknown) {
    error.value = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Registration failed'
  } finally { loading.value = false }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-amber-50 dark:bg-neutral-950 p-6">
    <div class="pointer-events-none fixed inset-0" style="background-image: linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px); background-size: 40px 40px;" aria-hidden="true"></div>

    <div class="relative w-full max-w-sm">
      <div class="absolute inset-0 translate-x-2 translate-y-2 bg-black dark:bg-yellow-400"></div>

      <div class="relative bg-white dark:bg-neutral-900 border-2 border-black dark:border-white p-8">
        <div class="mb-6">
          <div class="inline-block bg-black dark:bg-yellow-400 px-3 py-1.5 mb-4">
            <span class="text-xs font-black tracking-widest uppercase text-yellow-400 dark:text-black">DOCU</span><span class="text-xs font-black tracking-widest uppercase text-white dark:text-black">MIND</span>
          </div>
          <h1 class="text-3xl font-black uppercase tracking-tight text-black dark:text-white leading-none">Create<br/>Workspace.</h1>
          <p class="text-sm font-medium text-black/50 dark:text-white/50 mt-2">Start analyzing documents with AI</p>
        </div>

        <form @submit.prevent="submit" class="space-y-3">
          <div v-for="field in [
            { key: 'full_name', label: 'Full name', type: 'text', placeholder: 'Jane Smith' },
            { key: 'email', label: 'Email', type: 'email', placeholder: 'you@company.com' },
            { key: 'password', label: 'Password', type: 'password', placeholder: 'Min 8 characters' },
            { key: 'workspace_name', label: 'Workspace', type: 'text', placeholder: 'Acme Corp' },
          ]" :key="field.key">
            <label class="block text-xs font-black text-black dark:text-white mb-1 uppercase tracking-widest">{{ field.label }}</label>
            <input
              v-model="(form as Record<string, string>)[field.key]"
              :type="field.type"
              :placeholder="field.placeholder"
              required
              class="w-full border-2 border-black dark:border-white bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm font-medium text-black dark:text-white placeholder-black/30 dark:placeholder-white/30 focus:outline-none focus:shadow-[4px_4px_0_0_#000] dark:focus:shadow-[4px_4px_0_0_#fff] focus:-translate-x-0.5 focus:-translate-y-0.5"
            />
          </div>

          <div v-if="error" class="border-2 border-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-3 flex items-center gap-2">
            <svg class="w-4 h-4 text-red-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
            <p class="text-sm font-bold text-red-700 dark:text-red-400">{{ error }}</p>
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-yellow-400 text-black font-black text-sm uppercase tracking-widest px-6 py-3.5 border-2 border-black shadow-[4px_4px_0_0_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed mt-1"
          >
            {{ loading ? 'Creating...' : 'Create Workspace →' }}
          </button>
        </form>

        <p class="mt-5 text-sm font-medium text-black/60 dark:text-white/60">
          Have an account?
          <router-link to="/login" class="font-black text-black dark:text-yellow-400 underline underline-offset-2">Sign in</router-link>
        </p>
      </div>
    </div>
  </div>
</template>
