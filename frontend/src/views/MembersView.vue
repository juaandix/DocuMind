<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useAuthStore } from '@/stores/auth.store'
import { Copy, Check, UserMinus, Loader } from 'lucide-vue-next'
import PageHeader from '@/components/ui/PageHeader.vue'
import SettingsTabs from '@/components/ui/SettingsTabs.vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiAvatar from '@/components/ui/UiAvatar.vue'

const wsStore = useWorkspaceStore()
const auth = useAuthStore()

const canManage = computed(() => auth.user?.role === 'OWNER' || auth.user?.role === 'ADMIN')

onMounted(() => wsStore.fetchMembers())

const roleLabel: Record<string, string> = { OWNER: 'Owner', ADMIN: 'Admin', MEMBER: 'Member' }

async function handleRemove(userId: string, name: string) {
  if (!confirm(`Remove ${name} from this workspace?`)) return
  await wsStore.removeMember(userId)
}

const changingRole = ref<string | null>(null)

async function handleRoleChange(userId: string, newRole: string) {
  changingRole.value = userId
  try {
    await wsStore.updateMemberRole(userId, newRole)
  } finally {
    changingRole.value = null
  }
}

// Invite form
const inviteEmail = ref('')
const inviteRole = ref('MEMBER')
const inviting = ref(false)
const inviteError = ref('')
const inviteLink = ref('')

async function handleInvite() {
  inviteError.value = ''
  inviteLink.value = ''
  inviting.value = true
  try {
    const token = await wsStore.inviteMember(inviteEmail.value, inviteRole.value)
    inviteLink.value = `${window.location.origin}/invite/${token}`
    inviteEmail.value = ''
    inviteRole.value = 'MEMBER'
  } catch (e: unknown) {
    const err = e as { response?: { data?: { detail?: string } } }
    inviteError.value = err.response?.data?.detail ?? 'Failed to send invite'
  } finally {
    inviting.value = false
  }
}

const copied = ref(false)
async function copyLink() {
  await navigator.clipboard.writeText(inviteLink.value)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}
</script>

<template>
  <div class="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-8">
    <PageHeader title="Settings" />
    <SettingsTabs />

    <form v-if="canManage" class="flex flex-col gap-4 rounded-pass bg-surface p-5 shadow-pass" @submit.prevent="handleInvite">
      <div>
        <h2 class="text-[15px] font-semibold text-ink">Invite a member</h2>
        <p class="text-[13px] text-ink-2">They get an email with a link to join this workspace.</p>
      </div>
      <div class="flex flex-col gap-2 sm:flex-row">
        <label class="flex-1">
          <span class="sr-only">Email address</span>
          <input v-model="inviteEmail" type="email" required placeholder="colleague@company.com" autocomplete="off"
            class="min-h-10 w-full rounded-[5px] border border-line bg-surface px-3 text-[14px] text-ink placeholder:text-ink-3 focus:border-line-strong focus:ring-2 focus:ring-alert focus:outline-none" />
        </label>
        <label>
          <span class="sr-only">Role</span>
          <select v-model="inviteRole" class="min-h-10 rounded-[5px] border border-line bg-surface px-3 text-[14px] text-ink focus:border-line-strong focus:ring-2 focus:ring-alert focus:outline-none w-full sm:w-auto"><option value="MEMBER">Member</option><option value="ADMIN">Admin</option></select>
        </label>
        <UiButton type="submit" :disabled="inviting || !inviteEmail">
          <Loader v-if="inviting" class="size-4 animate-spin" />{{ inviting ? 'Inviting…' : 'Send invite' }}
        </UiButton>
      </div>
      <p v-if="inviteError" class="rounded-[5px] border border-danger bg-danger-soft px-3 py-2 text-[13px] text-danger" role="alert">{{ inviteError }}</p>
      <div v-if="inviteLink" class="flex items-center gap-3 rounded-[5px] bg-alert-soft px-3 py-2" role="status">
        <span class="label shrink-0 !text-ink">Invite link</span>
        <span class="min-w-0 flex-1 truncate font-mono text-[13px] text-ink">{{ inviteLink }}</span>
        <UiButton variant="secondary" size="sm" @click="copyLink">
          <Check v-if="copied" class="size-4" /><Copy v-else class="size-4" />{{ copied ? 'Copied' : 'Copy' }}
        </UiButton>
      </div>
    </form>

    <section class="overflow-hidden rounded-pass bg-surface shadow-pass" aria-labelledby="members-title">
      <div class="flex items-center justify-between border-b border-line px-5 py-4">
        <h2 id="members-title" class="text-[15px] font-semibold text-ink">Members</h2>
        <span class="font-mono text-[12px] text-ink-3">{{ wsStore.members.length }} in your workspace</span>
      </div>
      <div v-if="wsStore.members.length === 0" class="flex items-center justify-center gap-3 py-12 text-ink-2"><Loader class="size-5 animate-spin" />Loading members…</div>
      <ul v-else>
        <li v-for="member in wsStore.members" :key="member.id" class="flex items-center gap-4 border-t border-line px-5 py-3 first:border-t-0">
          <UiAvatar :name="member.full_name" />
          <div class="min-w-0 flex-1">
            <p class="truncate text-[14px] font-semibold text-ink">{{ member.full_name }}<span v-if="member.id === auth.user?.id" class="ml-1.5 font-normal text-ink-3">(you)</span></p>
            <p class="truncate text-[13px] text-ink-2">{{ member.email }}</p>
          </div>
          <template v-if="canManage && member.id !== auth.user?.id && member.role !== 'OWNER'">
            <label>
              <span class="sr-only">Role for {{ member.full_name }}</span>
              <select :value="member.role" :disabled="changingRole === member.id" class="min-h-10 rounded-[5px] border border-line bg-surface px-3 text-[14px] text-ink focus:border-line-strong focus:ring-2 focus:ring-alert focus:outline-none disabled:opacity-50"
                @change="handleRoleChange(member.id, ($event.target as HTMLSelectElement).value)">
                <option value="MEMBER">Member</option><option value="ADMIN">Admin</option>
              </select>
            </label>
            <button class="rounded p-2 text-ink-3 hover:bg-danger-soft hover:text-danger" :aria-label="`Remove ${member.full_name}`" :title="`Remove ${member.full_name}`"
              @click="handleRemove(member.id, member.full_name)"><UserMinus class="size-4" /></button>
          </template>
          <span v-else :class="['rounded-[4px] px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-[0.08em]',
            member.role === 'OWNER' ? 'bg-primary text-on-primary' : 'border border-line text-ink-2']">{{ roleLabel[member.role] ?? member.role }}</span>
        </li>
      </ul>
    </section>
  </div>
</template>
