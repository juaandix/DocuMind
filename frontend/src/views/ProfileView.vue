<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import api from '@/services/api'

const auth = useAuthStore()

const fullName = ref('')
const saving = ref(false)
const saved = ref(false)
const nameError = ref('')

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const changingPw = ref(false)
const pwSaved = ref(false)
const pwError = ref('')

onMounted(() => { fullName.value = auth.user?.full_name ?? '' })

async function saveName() {
  if (!fullName.value.trim()) return
  saving.value = true; saved.value = false; nameError.value = ''
  try {
    const { data } = await api.patch('/api/v1/auth/me', { full_name: fullName.value.trim() })
    auth.user = data; saved.value = true
    setTimeout(() => { saved.value = false }, 2500)
  } catch (e: unknown) {
    nameError.value = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Failed to save'
  } finally { saving.value = false }
}

async function savePassword() {
  pwError.value = ''
  if (newPassword.value.length < 8) { pwError.value = 'New password must be at least 8 characters'; return }
  if (newPassword.value !== confirmPassword.value) { pwError.value = 'Passwords do not match'; return }
  changingPw.value = true; pwSaved.value = false
  try {
    await api.post('/api/v1/auth/me/password', {
      current_password: currentPassword.value,
      new_password: newPassword.value,
    })
    pwSaved.value = true
    currentPassword.value = ''; newPassword.value = ''; confirmPassword.value = ''
    setTimeout(() => { pwSaved.value = false }, 2500)
  } catch (e: unknown) {
    pwError.value = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Failed to change password'
  } finally { changingPw.value = false }
}

const initials = () => (auth.user?.full_name ?? '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
</script>

<template>
  <div class="p-8 max-w-lg space-y-5">
    <h1 class="text-2xl font-semibold text-[#1d1d1f]">Profile</h1>

    <!-- Identity -->
    <div class="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-6 space-y-5">
      <div class="flex items-center gap-4 pb-5 border-b border-black/[0.06]">
        <div class="w-14 h-14 rounded-full bg-[#0071e3] flex items-center justify-center text-xl font-semibold text-white shadow-[0_4px_12px_rgba(0,113,227,0.3)]">
          {{ initials() }}
        </div>
        <div>
          <p class="font-semibold text-[#1d1d1f]">{{ auth.user?.full_name }}</p>
          <p class="text-sm text-[#6e6e73]">{{ auth.user?.email }}</p>
          <span class="inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#0071e3]/[0.08] text-[#0071e3]">
            {{ auth.user?.role }}
          </span>
        </div>
      </div>

      <div class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-[#6e6e73] uppercase tracking-wider mb-1.5">Full Name</label>
          <input v-model="fullName" type="text"
            class="w-full rounded-lg border border-black/[0.12] bg-[#f5f5f7] px-3.5 py-2.5 text-sm text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/40 focus:border-[#0071e3]"
          />
        </div>
        <div>
          <label class="block text-xs font-semibold text-[#6e6e73] uppercase tracking-wider mb-1.5">Email</label>
          <input :value="auth.user?.email" type="email" disabled
            class="w-full rounded-lg border border-black/[0.06] bg-black/[0.02] px-3.5 py-2.5 text-sm text-[#6e6e73] cursor-not-allowed"
          />
        </div>
      </div>

      <p v-if="nameError" class="text-sm text-red-600">{{ nameError }}</p>

      <div class="flex items-center gap-3 pt-1">
        <button @click="saveName" :disabled="saving || !fullName.trim()"
          class="bg-[#0071e3] hover:bg-[#0077ed] disabled:opacity-60 text-white text-sm font-medium rounded-lg px-5 py-2.5 shadow-[0_1px_3px_rgba(0,113,227,0.4)] transition-colors">
          {{ saving ? 'Saving…' : 'Save Changes' }}
        </button>
        <span v-if="saved" class="text-sm text-[#34c759] font-medium">✓ Saved</span>
      </div>
    </div>

    <!-- Change password -->
    <div class="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-6 space-y-4">
      <h2 class="text-sm font-semibold text-[#1d1d1f]">Change Password</h2>

      <div>
        <label class="block text-xs font-semibold text-[#6e6e73] uppercase tracking-wider mb-1.5">Current Password</label>
        <input v-model="currentPassword" type="password" autocomplete="current-password"
          class="w-full rounded-lg border border-black/[0.12] bg-[#f5f5f7] px-3.5 py-2.5 text-sm text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/40 focus:border-[#0071e3]"
        />
      </div>
      <div>
        <label class="block text-xs font-semibold text-[#6e6e73] uppercase tracking-wider mb-1.5">New Password</label>
        <input v-model="newPassword" type="password" autocomplete="new-password"
          class="w-full rounded-lg border border-black/[0.12] bg-[#f5f5f7] px-3.5 py-2.5 text-sm text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/40 focus:border-[#0071e3]"
        />
      </div>
      <div>
        <label class="block text-xs font-semibold text-[#6e6e73] uppercase tracking-wider mb-1.5">Confirm New Password</label>
        <input v-model="confirmPassword" type="password" autocomplete="new-password"
          class="w-full rounded-lg border border-black/[0.12] bg-[#f5f5f7] px-3.5 py-2.5 text-sm text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/40 focus:border-[#0071e3]"
        />
      </div>

      <p v-if="pwError" class="text-sm text-red-600">{{ pwError }}</p>

      <div class="flex items-center gap-3 pt-1">
        <button @click="savePassword" :disabled="changingPw || !currentPassword || !newPassword || !confirmPassword"
          class="bg-[#1d1d1f] hover:bg-black disabled:opacity-60 text-white text-sm font-medium rounded-lg px-5 py-2.5 transition-colors">
          {{ changingPw ? 'Updating…' : 'Update Password' }}
        </button>
        <span v-if="pwSaved" class="text-sm text-[#34c759] font-medium">✓ Password updated</span>
      </div>
    </div>
  </div>
</template>
