<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import AuthShell from '@/components/ui/AuthShell.vue'
import UiInput from '@/components/ui/UiInput.vue'
import UiButton from '@/components/ui/UiButton.vue'

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
    const detail = (e as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail
    if (Array.isArray(detail)) {
      error.value = (detail[0] as { msg?: string })?.msg ?? 'Registration failed'
    } else {
      error.value = (detail as string) ?? 'Registration failed'
    }
  } finally { loading.value = false }
}
</script>

<template>
  <AuthShell>
    <h1 class="text-[26px] font-semibold tracking-[-0.015em] text-ink">Create your workspace</h1>
    <p class="mt-1 text-[15px] text-ink-2">You will be its owner and can invite your team next.</p>

    <form class="mt-8 flex flex-col gap-4" @submit.prevent="handleRegister">
      <p v-if="error" class="rounded-[5px] border border-danger bg-danger-soft px-3.5 py-2.5 text-[14px] text-danger" role="alert">{{ error }}</p>
      <UiInput v-model="fullName" label="Full name" placeholder="Ana García" autocomplete="name" required />
      <UiInput v-model="email" label="Work email" type="email" placeholder="you@example.com" autocomplete="email" required />
      <UiInput v-model="password" label="Password" type="password" placeholder="••••••••" autocomplete="new-password" hint="At least 8 characters." required />
      <UiInput v-model="workspaceName" label="Workspace name" placeholder="Acme Legal" autocomplete="organization" required />
      <UiButton type="submit" :disabled="loading" class="mt-2 w-full min-h-11">{{ loading ? 'Creating…' : 'Create workspace' }}</UiButton>
    </form>

    <p class="mt-6 text-[14px] text-ink-2">
      Already have an account?
      <router-link to="/login" class="font-semibold text-ink underline underline-offset-4">Sign in</router-link>
    </p>
  </AuthShell>
</template>
