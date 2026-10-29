<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import AuthShell from '@/components/ui/AuthShell.vue'
import UiInput from '@/components/ui/UiInput.vue'
import UiButton from '@/components/ui/UiButton.vue'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const auth = useAuthStore()
const { t } = useI18n()
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  if (!email.value || !password.value) return
  loading.value = true; error.value = ''
  try {
    await auth.login(email.value, password.value)
    router.push('/dashboard')
  } catch (e: unknown) {
    const detail = (e as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail
    error.value = Array.isArray(detail) ? ((detail[0] as { msg?: string })?.msg ?? t('auth.invalid')) : ((detail as string) ?? t('auth.invalid'))
  } finally { loading.value = false }
}
</script>

<template>
  <AuthShell>
    <h1 class="text-[26px] font-semibold tracking-[-0.015em] text-ink">{{ $t('auth.signInTitle') }}</h1>
    <p class="mt-1 text-[15px] text-ink-2">{{ $t('auth.signInSub') }}</p>

    <form class="mt-8 flex flex-col gap-4" @submit.prevent="handleLogin">
      <p v-if="error" class="rounded-[5px] border border-danger bg-danger-soft px-3.5 py-2.5 text-[14px] text-danger" role="alert">{{ error }}</p>
      <UiInput v-model="email" :label="$t('common.email')" type="email" placeholder="you@example.com" autocomplete="email" required />
      <UiInput v-model="password" :label="$t('common.password')" type="password" placeholder="••••••••" autocomplete="current-password" required />
      <UiButton type="submit" :disabled="loading" class="mt-2 w-full min-h-11">{{ loading ? $t('auth.signingIn') : $t('auth.signIn') }}</UiButton>
    </form>

    <p class="mt-6 text-[14px] text-ink-2">
      {{ $t('auth.noAccount') }}
      <router-link to="/register" class="font-semibold text-ink underline underline-offset-4">{{ $t('auth.createOne') }}</router-link>
    </p>
  </AuthShell>
</template>
