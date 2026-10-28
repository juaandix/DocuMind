<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import api from '@/services/api'
import { Check } from 'lucide-vue-next'
import PageHeader from '@/components/ui/PageHeader.vue'
import SettingsTabs from '@/components/ui/SettingsTabs.vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiInput from '@/components/ui/UiInput.vue'
import UiAvatar from '@/components/ui/UiAvatar.vue'
import { useI18n } from 'vue-i18n'

const auth = useAuthStore()
const { t } = useI18n()

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
    nameError.value = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? t('profile.saveFailed')
  } finally { saving.value = false }
}

async function savePassword() {
  pwError.value = ''
  if (newPassword.value.length < 8) { pwError.value = t('profile.tooShort'); return }
  if (newPassword.value !== confirmPassword.value) { pwError.value = t('profile.mismatch'); return }
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
    pwError.value = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? t('profile.failed')
  } finally { changingPw.value = false }
}

</script>

<template>
  <div class="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-8">
    <PageHeader :title="$t('settings.title')" />
    <SettingsTabs />

    <form class="flex flex-col gap-5 rounded-pass bg-surface p-5 shadow-pass" @submit.prevent="saveName">
      <div class="flex items-center gap-4">
        <UiAvatar :name="auth.user?.full_name ?? '?'" class="!size-12 !text-[15px]" />
        <div class="min-w-0 flex-1">
          <p class="truncate text-[16px] font-semibold text-ink">{{ auth.user?.full_name }}</p>
          <p class="truncate text-[13px] text-ink-2">{{ auth.user?.email }}</p>
        </div>
        <span class="rounded-[4px] border border-line-strong px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-ink">{{ auth.user?.role ? $t(`roles.${auth.user.role}`) : '' }}</span>
      </div>
      <div class="grid gap-4 sm:grid-cols-2">
        <UiInput v-model="fullName" :label="$t('common.fullName')" autocomplete="name" :error="nameError || undefined" />
        <div class="flex flex-col gap-1.5">
          <span class="label">{{ $t('common.email') }}</span>
          <p class="flex min-h-11 items-center rounded-[5px] border border-line bg-sunken px-3.5 text-[15px] text-ink-2">{{ auth.user?.email }}</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <UiButton type="submit" :disabled="saving || !fullName.trim()">{{ saving ? $t('common.saving') : $t('common.saveChanges') }}</UiButton>
        <span v-if="saved" class="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink" role="status"><Check class="size-4" />{{ $t('common.saved') }}</span>
      </div>
    </form>

    <form class="flex flex-col gap-5 rounded-pass bg-surface p-5 shadow-pass" @submit.prevent="savePassword">
      <div>
        <h2 class="text-[15px] font-semibold text-ink">{{ $t('profile.passwordTitle') }}</h2>
        <p class="text-[13px] text-ink-2">{{ $t('profile.passwordSub') }}</p>
      </div>
      <UiInput v-model="currentPassword" :label="$t('profile.current')" type="password" autocomplete="current-password" />
      <div class="grid gap-4 sm:grid-cols-2">
        <UiInput v-model="newPassword" :label="$t('profile.new')" type="password" autocomplete="new-password" />
        <UiInput v-model="confirmPassword" :label="$t('profile.confirm')" type="password" autocomplete="new-password" />
      </div>
      <p v-if="pwError" class="rounded-[5px] border border-danger bg-danger-soft px-3 py-2 text-[13px] text-danger" role="alert">{{ pwError }}</p>
      <div class="flex items-center gap-3">
        <UiButton type="submit" variant="secondary" :disabled="changingPw || !currentPassword || !newPassword">{{ changingPw ? $t('profile.updating') : $t('profile.update') }}</UiButton>
        <span v-if="pwSaved" class="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink" role="status"><Check class="size-4" />{{ $t('profile.updated') }}</span>
      </div>
    </form>
  </div>
</template>
