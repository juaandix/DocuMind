<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import api from '@/services/api'

const auth = useAuthStore()
const fullName = ref('')
const saving = ref(false)
const saved = ref(false)
const error = ref('')

onMounted(() => {
  fullName.value = auth.user?.full_name ?? ''
})

async function save() {
  if (!fullName.value.trim()) return
  saving.value = true
  saved.value = false
  error.value = ''
  try {
    const { data } = await api.patch('/api/v1/auth/me', { full_name: fullName.value.trim() })
    auth.user = data
    saved.value = true
    setTimeout(() => { saved.value = false }, 2500)
  } catch (e: unknown) {
    error.value = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Failed to save'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="p-8 max-w-lg">
    <h1 class="text-2xl font-bold text-gray-900 mb-6">Profile</h1>

    <div class="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
      <!-- Avatar placeholder -->
      <div class="flex items-center gap-4">
        <div class="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-700">
          {{ (auth.user?.full_name ?? '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() }}
        </div>
        <div>
          <p class="font-semibold text-gray-900">{{ auth.user?.full_name }}</p>
          <p class="text-sm text-gray-500">{{ auth.user?.email }}</p>
          <span class="inline-block mt-1 text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
            {{ auth.user?.role }}
          </span>
        </div>
      </div>

      <div class="border-t border-gray-100 pt-5 space-y-4">
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1.5">Full name</label>
          <input
            v-model="fullName"
            type="text"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
          <input
            :value="auth.user?.email"
            type="email"
            disabled
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
          />
          <p class="text-xs text-gray-400 mt-1">Email cannot be changed</p>
        </div>
      </div>

      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

      <div class="flex items-center gap-3">
        <button
          @click="save"
          :disabled="saving || !fullName.trim()"
          class="bg-indigo-600 text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {{ saving ? 'Saving…' : 'Save changes' }}
        </button>
        <span v-if="saved" class="text-sm text-green-600 font-medium">Saved ✓</span>
      </div>
    </div>
  </div>
</template>
