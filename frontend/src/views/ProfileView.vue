<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import api from '@/services/api'

const auth = useAuthStore()
const fullName = ref('')
const saving = ref(false)
const saved = ref(false)
const error = ref('')

onMounted(() => { fullName.value = auth.user?.full_name ?? '' })

async function save() {
  if (!fullName.value.trim()) return
  saving.value = true; saved.value = false; error.value = ''
  try {
    const { data } = await api.patch('/api/v1/auth/me', { full_name: fullName.value.trim() })
    auth.user = data
    saved.value = true
    setTimeout(() => { saved.value = false }, 2500)
  } catch (e: unknown) {
    error.value = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Failed to save'
  } finally { saving.value = false }
}

const initials = () =>
  (auth.user?.full_name ?? '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
</script>

<template>
  <div class="p-8 max-w-lg">
    <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">Profile</h1>

    <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-400 to-cyan-400 flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-violet-500/20">
          {{ initials() }}
        </div>
        <div>
          <p class="font-semibold text-slate-900 dark:text-slate-100">{{ auth.user?.full_name }}</p>
          <p class="text-sm text-slate-500 dark:text-slate-400">{{ auth.user?.email }}</p>
          <span class="inline-block mt-1.5 text-xs bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 border border-violet-100 dark:border-violet-500/20 px-2.5 py-0.5 rounded-full font-semibold">
            {{ auth.user?.role }}
          </span>
        </div>
      </div>

      <div class="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-4">
        <div>
          <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Full name</label>
          <input
            v-model="fullName"
            type="text"
            class="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-colors"
          />
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Email</label>
          <input
            :value="auth.user?.email"
            type="email"
            disabled
            class="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 cursor-not-allowed"
          />
          <p class="text-xs text-slate-400 dark:text-slate-500 mt-1">Email cannot be changed</p>
        </div>
      </div>

      <p v-if="error" class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>

      <div class="flex items-center gap-3">
        <button
          @click="save"
          :disabled="saving || !fullName.trim()"
          class="bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-violet-500/20 disabled:opacity-50 transition-all"
        >
          {{ saving ? 'Saving…' : 'Save changes' }}
        </button>
        <span v-if="saved" class="text-sm text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
          </svg>
          Saved
        </span>
      </div>
    </div>
  </div>
</template>
