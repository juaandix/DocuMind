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
    auth.user = data; saved.value = true
    setTimeout(() => { saved.value = false }, 2500)
  } catch (e: unknown) {
    error.value = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Failed'
  } finally { saving.value = false }
}

const initials = () => (auth.user?.full_name ?? '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
</script>

<template>
  <div class="p-8 max-w-lg">
    <h1 class="text-3xl font-black uppercase tracking-tight text-black dark:text-white mb-6">Profile</h1>

    <div class="relative">
      <div class="absolute inset-0 translate-x-2 translate-y-2 bg-black dark:bg-yellow-400"></div>
      <div class="relative bg-white dark:bg-neutral-900 border-2 border-black dark:border-white p-6 space-y-5">
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 bg-black dark:bg-yellow-400 border-2 border-black shadow-[4px_4px_0_0_#facc15] dark:shadow-[4px_4px_0_0_#000] flex items-center justify-center text-2xl font-black text-yellow-400 dark:text-black">
            {{ initials() }}
          </div>
          <div>
            <p class="font-black text-black dark:text-white uppercase">{{ auth.user?.full_name }}</p>
            <p class="text-sm font-medium text-black/50 dark:text-white/50">{{ auth.user?.email }}</p>
            <span class="inline-block mt-1.5 text-[10px] font-black uppercase tracking-widest bg-yellow-400 text-black border border-black px-2 py-0.5">
              {{ auth.user?.role }}
            </span>
          </div>
        </div>

        <div class="border-t-2 border-black/10 dark:border-white/10 pt-5 space-y-4">
          <div>
            <label class="block text-[10px] font-black uppercase tracking-widest text-black/50 dark:text-white/50 mb-1.5">Full Name</label>
            <input v-model="fullName" type="text"
              class="w-full border-2 border-black dark:border-white bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm font-medium text-black dark:text-white focus:outline-none focus:shadow-[4px_4px_0_0_#000] dark:focus:shadow-[4px_4px_0_0_#fff] focus:-translate-x-0.5 focus:-translate-y-0.5"
            />
          </div>
          <div>
            <label class="block text-[10px] font-black uppercase tracking-widest text-black/50 dark:text-white/50 mb-1.5">Email</label>
            <input :value="auth.user?.email" type="email" disabled
              class="w-full border-2 border-black/20 dark:border-white/20 bg-black/5 dark:bg-white/5 px-4 py-2.5 text-sm font-medium text-black/40 dark:text-white/40 cursor-not-allowed"
            />
          </div>
        </div>

        <p v-if="error" class="text-sm font-bold text-red-700 dark:text-red-400">{{ error }}</p>

        <div class="flex items-center gap-3">
          <button @click="save" :disabled="saving || !fullName.trim()"
            class="bg-yellow-400 text-black font-black text-xs uppercase tracking-widest px-5 py-2.5 border-2 border-black shadow-[4px_4px_0_0_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-50">
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </button>
          <span v-if="saved" class="text-sm font-black uppercase text-green-700 dark:text-green-400">✓ Saved</span>
        </div>
      </div>
    </div>
  </div>
</template>
