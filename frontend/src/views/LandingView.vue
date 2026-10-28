<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowRight, Github } from 'lucide-vue-next'
import BrandMark from '@/components/ui/BrandMark.vue'
import LocaleSwitch from '@/components/ui/LocaleSwitch.vue'
import SourcePass from '@/components/ui/SourcePass.vue'
import UiAvatar from '@/components/ui/UiAvatar.vue'

const REPO = 'https://github.com/juaandix/DocuMind'

const router = useRouter()
const { t } = useI18n()

watchEffect(() => { document.title = t('landing.title') })

// The action in working form: the email travels into the register screen.
const email = ref('')
const closingEmail = ref('')
function start(value: string) {
  router.push({ path: '/register', query: value.trim() ? { email: value.trim() } : {} })
}

// Live answer: the visitor opens each citation. Sample data, labelled as such.
const active = ref(0)
const sources = computed(() => [
  { name: 'Contrato_Proveedor_Q3.pdf', page: 14, score: 0.91, excerpt: t('landing.demoS1') },
  { name: 'Contrato_Proveedor_Q3.pdf', page: 15, score: 0.87, excerpt: t('landing.demoS2') },
  { name: 'Informe_Auditoria_2026.docx', page: null, score: 0.79, excerpt: t('landing.demoS3') },
])
const answer = computed(() =>
  t('landing.demoAnswer').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>'),
)

const steps = [
  { text: 'landing.step1', status: 'landing.st1', tone: 'line', time: '15:02' },
  { text: 'landing.step2', status: 'landing.st2', tone: 'dashed', time: '15:02' },
  { text: 'landing.step3', status: 'landing.st3', tone: 'now', time: '15:04' },
  { text: 'landing.step4', status: 'landing.st4', tone: 'solid', time: '15:06' },
]

const facts = [
  { label: 'landing.factFormats', value: 'PDF · DOCX · CSV · TXT' },
  { label: 'landing.factLanguages', value: 'landing.factLanguagesValue', i18n: true },
  { label: 'landing.factRealtime', value: 'landing.factRealtimeValue', i18n: true },
  { label: 'landing.factTenancy', value: 'landing.factTenancyValue', i18n: true },
]
</script>

<template>
  <div class="min-h-dvh bg-rail text-rail-ink">
    <!-- Top bar -->
    <header class="mx-auto flex h-16 max-w-[1440px] items-center gap-6 px-4 sm:px-8 lg:px-14">
      <router-link to="/" class="flex items-center gap-2.5" aria-label="DocuMind">
        <BrandMark :size="30" />
        <span class="font-display text-[21px] font-bold uppercase leading-none tracking-[0.06em] text-white">DocuMind</span>
      </router-link>
      <nav :aria-label="$t('nav.main')" class="hidden items-center gap-6 text-[15px] md:flex">
        <a href="#how" class="text-rail-ink-2 hover:text-white">{{ $t('landing.navHow') }}</a>
        <a :href="REPO" target="_blank" rel="noopener" class="text-rail-ink-2 hover:text-white">{{ $t('landing.navCode') }}</a>
      </nav>
      <div class="ml-auto flex items-center gap-4">
        <LocaleSwitch on-ink />
        <router-link to="/login" class="press text-[15px] font-semibold text-white hover:underline">{{ $t('landing.signIn') }}</router-link>
      </div>
    </header>

    <main>
      <!-- First viewport: one boarding pass carrying the promise and the action -->
      <section class="mx-auto max-w-[1440px] px-4 pt-6 pb-16 sm:px-8 lg:px-14 lg:pt-10">
        <div class="landing-pass relative grid rounded-[14px] bg-surface text-ink shadow-raised lg:grid-cols-[minmax(0,1fr)_300px]">
          <div class="flex min-w-0 flex-col gap-8 px-5 py-6 sm:px-10 sm:py-9 lg:px-12">
            <dl class="flex flex-wrap gap-x-10 gap-y-3 border-b border-line pb-5">
              <div class="min-w-0"><dt class="label">{{ $t('landing.segDocument') }}</dt><dd class="truncate font-mono text-[16px] font-semibold">Contrato_Proveedor_Q3.pdf</dd></div>
              <div><dt class="label">{{ $t('landing.segPage') }}</dt><dd class="font-mono text-[16px] font-semibold">14</dd></div>
              <div><dt class="label">{{ $t('landing.segClause') }}</dt><dd class="font-mono text-[16px] font-semibold">§9.1</dd></div>
              <div><dt class="label">{{ $t('landing.segMatch') }}</dt><dd class="font-mono text-[16px] font-semibold">0.91</dd></div>
            </dl>

            <div>
              <h1 class="max-w-[16ch] font-display text-[clamp(48px,7.6vw,118px)] font-bold uppercase leading-[0.9] tracking-[-0.01em] text-balance">
                {{ $t('landing.headline') }}
              </h1>
              <p class="mt-6 max-w-[62ch] text-[18px] leading-relaxed text-ink-2 sm:text-[20px]">{{ $t('landing.sub') }}</p>
            </div>

            <form class="flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-end" @submit.prevent="start(email)">
              <label class="flex flex-col gap-1.5 sm:w-[360px]">
                <span class="label">{{ $t('landing.emailLabel') }}</span>
                <input v-model="email" type="email" autocomplete="email" :placeholder="$t('landing.emailPlaceholder')"
                  class="min-h-[52px] rounded-[5px] border border-line-strong bg-surface px-4 text-[16px] text-ink placeholder:text-ink-3 focus:ring-2 focus:ring-alert focus:outline-none" />
              </label>
              <button type="submit" class="press inline-flex min-h-[52px] items-center justify-center gap-2 rounded-[5px] bg-primary px-6 text-[16px] font-semibold text-on-primary hover:bg-primary-hover active:bg-alert active:text-on-alert">
                {{ $t('landing.create') }} <ArrowRight class="size-4" />
              </button>
              <router-link to="/login" class="press inline-flex min-h-[52px] items-center text-[16px] font-semibold text-ink underline-offset-4 hover:underline sm:ml-auto">{{ $t('landing.signIn') }}</router-link>
            </form>
          </div>

          <!-- Stub: on phones it folds to the bottom of the pass -->
          <div class="flex flex-col justify-between gap-6 border-dashed border-line px-5 py-6 max-lg:border-t-2 sm:px-10 lg:border-l-2 lg:px-8 lg:py-9">
            <div class="flex items-end justify-between gap-6 lg:flex-col lg:items-start">
              <div>
                <p class="label">{{ $t('landing.stubLabel') }}</p>
                <p class="font-display text-[clamp(96px,12vw,180px)] font-bold leading-[0.85]">S1</p>
              </div>
              <p class="max-w-[30ch] text-[15px] leading-relaxed text-ink-2">{{ $t('landing.stubNote') }}</p>
            </div>
            <div class="barcode h-16" aria-hidden="true"></div>
          </div>
        </div>
      </section>

      <!-- How it works: the departures board the app shows, as a sequence -->
      <section id="how" class="mx-auto max-w-[1440px] scroll-mt-6 px-4 pb-24 sm:px-8 lg:px-14">
        <div class="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div>
            <h2 class="font-display text-[clamp(36px,4.4vw,64px)] font-bold uppercase leading-[0.95] text-white">{{ $t('landing.howTitle') }}</h2>
            <p class="mt-5 max-w-[48ch] text-[18px] leading-relaxed text-rail-ink">{{ $t('landing.howSub') }}</p>
          </div>
          <ol class="overflow-hidden rounded-pass border border-rail-2">
            <li v-for="(s, i) in steps" :key="i"
              :class="['grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-t border-rail-2 px-5 py-4 first:border-t-0 sm:grid-cols-[minmax(0,1fr)_auto_56px]',
                s.tone === 'now' ? 'bg-alert text-on-alert' : 'text-white']">
              <span class="text-[17px] font-semibold">{{ $t(s.text) }}</span>
              <span :class="['rounded-[4px] border px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-[0.08em]',
                s.tone === 'now' ? 'border-on-alert' : s.tone === 'dashed' ? 'border-dashed border-rail-ink-2 text-rail-ink' : s.tone === 'solid' ? 'border-white' : 'border-rail-ink-2 text-rail-ink']">{{ $t(s.status) }}</span>
              <span :class="['hidden text-right font-mono text-[13px] sm:block', s.tone === 'now' ? 'text-on-alert' : 'text-rail-ink-2']">{{ s.time }}</span>
            </li>
          </ol>
        </div>
      </section>

      <!-- Live answer on the light ground, built from the app's own components -->
      <section class="bg-ground text-ink">
        <div class="mx-auto grid max-w-[1440px] gap-10 px-4 py-20 sm:px-8 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:px-14 lg:py-28">
          <div>
            <h2 class="font-display text-[clamp(36px,4.4vw,64px)] font-bold uppercase leading-[0.95]">{{ $t('landing.demoTitle') }}</h2>
            <p class="mt-5 max-w-[44ch] text-[18px] leading-relaxed text-ink-2">{{ $t('landing.demoSub') }}</p>
          </div>

          <div class="overflow-hidden rounded-pass bg-surface shadow-pass">
            <div class="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
              <p class="truncate text-[16px] font-semibold">{{ $t('landing.demoRoom') }}</p>
              <span class="rounded-[4px] border border-line px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-2">{{ $t('landing.sample') }}</span>
            </div>
            <div class="grid gap-6 p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
              <div class="flex flex-col gap-6">
                <div class="grid grid-cols-[32px_1fr] gap-x-3.5">
                  <UiAvatar name="María López" />
                  <div><p class="text-[14px] font-semibold">María López</p><p class="mt-1 text-[16px] leading-[1.6]">{{ $t('landing.demoQuestion') }}</p></div>
                </div>
                <div class="grid grid-cols-[32px_1fr] gap-x-3.5">
                  <UiAvatar name="DocuMind" ai />
                  <div>
                    <p class="text-[14px] font-semibold">DocuMind</p>
                    <p class="mt-1 text-[16px] leading-[1.6]" v-html="answer"></p>
                    <div class="mt-3 flex items-center gap-1.5" role="group" :aria-label="$t('room.sources')">
                      <span class="label mr-1">{{ $t('room.sources') }}</span>
                      <button v-for="(s, i) in sources" :key="i" type="button" :aria-pressed="active === i" :title="s.name"
                        :class="['press min-h-8 rounded-[4px] px-2.5 font-mono text-[12px] font-semibold',
                          active === i ? 'bg-alert text-on-alert' : 'bg-primary text-on-primary hover:bg-primary-hover']"
                        @click="active = i">S{{ i + 1 }}</button>
                    </div>
                  </div>
                </div>
              </div>
              <div class="flex flex-col gap-3" aria-live="polite">
                <SourcePass v-for="(s, i) in sources" :key="i" :index="i + 1" :document-name="s.name" :page="s.page" :score="s.score"
                  :excerpt="s.excerpt" :active="active === i" :class="active === i ? '' : 'max-md:hidden'" />
              </div>
            </div>
          </div>
        </div>

        <!-- Facts as one segmented strip: only what is true of the product -->
        <div class="mx-auto max-w-[1440px] px-4 pb-20 sm:px-8 lg:px-14 lg:pb-28">
          <h2 class="sr-only">{{ $t('landing.factsTitle') }}</h2>
          <dl class="grid overflow-hidden rounded-pass bg-surface shadow-pass sm:grid-cols-2 lg:grid-cols-5">
            <div v-for="f in facts" :key="f.label" class="border-line px-6 py-6 max-lg:border-b lg:border-r">
              <dt class="label">{{ $t(f.label) }}</dt>
              <dd class="mt-2 font-display text-[30px] font-bold uppercase leading-none">{{ f.i18n ? $t(f.value) : f.value }}</dd>
            </div>
            <a :href="REPO" target="_blank" rel="noopener" class="group flex flex-col justify-between gap-2 px-6 py-6 hover:bg-sunken">
              <span class="label">{{ $t('landing.factCode') }}</span>
              <span class="flex items-center gap-2 font-display text-[30px] font-bold uppercase leading-none">
                <Github class="size-6" />{{ $t('landing.factCodeValue') }}
                <ArrowRight class="size-5 transition-transform group-hover:translate-x-1" />
              </span>
            </a>
          </dl>
        </div>
      </section>

      <!-- Close: the action again, on the ink -->
      <section class="mx-auto max-w-[1440px] px-4 py-20 sm:px-8 lg:px-14 lg:py-28">
        <div class="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-end">
          <div>
            <h2 class="max-w-[18ch] font-display text-[clamp(40px,5.4vw,84px)] font-bold uppercase leading-[0.92] text-white">{{ $t('landing.closeTitle') }}</h2>
            <p class="mt-5 text-[18px] text-rail-ink">{{ $t('landing.closeSub') }}</p>
          </div>
          <form class="flex flex-col gap-3 sm:flex-row" @submit.prevent="start(closingEmail)">
            <label class="flex-1">
              <span class="sr-only">{{ $t('landing.emailLabel') }}</span>
              <input v-model="closingEmail" type="email" autocomplete="email" :placeholder="$t('landing.emailPlaceholder')"
                class="min-h-[52px] w-full rounded-[5px] border border-rail-2 bg-rail-2 px-4 text-[16px] text-white placeholder:text-rail-ink-2 focus:ring-2 focus:ring-alert focus:outline-none" />
            </label>
            <button type="submit" class="press inline-flex min-h-[52px] items-center justify-center gap-2 rounded-[5px] bg-alert px-6 text-[16px] font-semibold text-on-alert hover:brightness-95">
              {{ $t('landing.create') }} <ArrowRight class="size-4" />
            </button>
          </form>
        </div>
      </section>
    </main>

    <footer class="border-t border-rail-2">
      <div class="mx-auto flex max-w-[1440px] flex-col gap-8 px-4 py-10 sm:px-8 lg:px-14">
        <p class="font-display text-[clamp(64px,15vw,220px)] font-bold uppercase leading-[0.8] tracking-[0.02em] text-white" aria-hidden="true">DocuMind</p>
        <div class="flex flex-wrap items-center justify-between gap-4 text-[14px] text-rail-ink-2">
          <p>{{ $t('landing.footer') }}</p>
          <div class="flex gap-5">
            <a :href="REPO" target="_blank" rel="noopener" class="hover:text-white">GitHub</a>
            <router-link to="/login" class="hover:text-white">{{ $t('landing.signIn') }}</router-link>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* Perforation notches where the stub tears off. */
.landing-pass::before,
.landing-pass::after {
  content: '';
  position: absolute;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--dm-rail);
}
@media (min-width: 1024px) {
  .landing-pass::before { top: -12px; right: 289px; }
  .landing-pass::after { bottom: -12px; right: 289px; }
}
@media (max-width: 1023px) {
  .landing-pass::before, .landing-pass::after { display: none; }
}
.barcode {
  background: repeating-linear-gradient(90deg, var(--dm-ink) 0 3px, transparent 3px 5px, var(--dm-ink) 5px 6px, transparent 6px 10px);
}
/* The pass arrives once: rises and settles. */
.landing-pass {
  animation: pass-in 600ms var(--ease-out) both;
}
@keyframes pass-in {
  from { opacity: 0; transform: translateY(16px); }
}
</style>
