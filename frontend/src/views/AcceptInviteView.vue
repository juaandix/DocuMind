<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import { Loader, TriangleAlert } from 'lucide-vue-next'
import AuthShell from '@/components/ui/AuthShell.vue'
import UiInput from '@/components/ui/UiInput.vue'
import UiButton from '@/components/ui/UiButton.vue'
import { useI18n } from 'vue-i18n'

interface InviteInfo {
  email: string
  role: string
  workspace_name: string
  inviter_name: string
}

const route = useRoute()
const { t } = useI18n()
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
    error.value = err.response?.data?.detail ?? t('invite.failed')
  } finally {
    submitting.value = false
  }
}

const roleLabel = (role: string) => (['OWNER', 'ADMIN', 'MEMBER'].includes(role) ? t(`roles.${role}`) : role)
</script>

<template>
  <AuthShell>
    <div v-if="loading" class="flex items-center gap-3 text-ink-2" role="status"><Loader class="size-5 animate-spin" />{{ $t('invite.checking') }}</div>

    <div v-else-if="notFound">
      <TriangleAlert class="mb-4 size-7 text-ink" :stroke-width="1.75" />
      <h1 class="text-[26px] font-semibold tracking-[-0.015em] text-ink">{{ $t('invite.invalidTitle') }}</h1>
      <p class="mt-1 text-[15px] text-ink-2">{{ $t('invite.invalidBody') }}</p>
      <UiButton to="/login" variant="secondary" class="mt-6">{{ $t('invite.toSignIn') }}</UiButton>
    </div>

    <template v-else-if="info">
      <p class="label">{{ $t('invite.label') }}</p>
      <h1 class="mt-1 text-[26px] font-semibold tracking-[-0.015em] text-ink">{{ $t('invite.join', { workspace: info.workspace_name }) }}</h1>
      <p class="mt-1 text-[15px] text-ink-2">
        {{ $t('invite.invitedAs', { inviter: info.inviter_name }) }}
        <span class="rounded-[4px] border border-line-strong px-1.5 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-ink">{{ roleLabel(info.role) }}</span>
      </p>

      <form class="mt-8 flex flex-col gap-4" @submit.prevent="handleAccept">
        <p v-if="error" class="rounded-[5px] border border-danger bg-danger-soft px-3.5 py-2.5 text-[14px] text-danger" role="alert">{{ error }}</p>
        <div class="flex flex-col gap-1.5">
          <span class="label">{{ $t('common.email') }}</span>
          <p class="flex min-h-11 items-center rounded-[5px] border border-line bg-sunken px-3.5 text-[15px] text-ink-2">{{ info.email }}</p>
        </div>
        <UiInput v-model="fullName" :label="$t('common.fullName')" autocomplete="name" required />
        <UiInput v-model="password" :label="$t('common.password')" type="password" autocomplete="new-password" :hint="$t('auth.passwordHint')" required />
        <UiButton type="submit" :disabled="submitting" class="mt-2 w-full min-h-11">
          <Loader v-if="submitting" class="size-4 animate-spin" />{{ submitting ? $t('invite.joining') : $t('invite.accept') }}
        </UiButton>
      </form>
    </template>
  </AuthShell>
</template>
