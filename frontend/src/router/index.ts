import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: () => import('@/views/LoginView.vue'), meta: { public: true } },
    { path: '/register', component: () => import('@/views/RegisterView.vue'), meta: { public: true } },
    { path: '/invite/:token', component: () => import('@/views/AcceptInviteView.vue'), meta: { public: true } },
    {
      path: '/',
      component: () => import('@/components/AppLayout.vue'),
      children: [
        { path: '', redirect: '/dashboard' },
        { path: 'dashboard', component: () => import('@/views/DashboardView.vue') },
        { path: 'documents', component: () => import('@/views/DocumentsView.vue') },
        { path: 'documents/upload', component: () => import('@/views/DocumentUploadView.vue') },
        { path: 'documents/:id', component: () => import('@/views/DocumentDetailView.vue') },
        { path: 'rooms', component: () => import('@/views/RoomsView.vue') },
        { path: 'rooms/new', component: () => import('@/views/RoomCreateView.vue') },
        { path: 'rooms/:id', component: () => import('@/views/RoomView.vue') },
        { path: 'settings/profile', component: () => import('@/views/ProfileView.vue') },
        { path: 'settings/workspace', component: () => import('@/views/WorkspaceSettingsView.vue') },
        { path: 'settings/members', component: () => import('@/views/MembersView.vue') },
      ],
    },
    { path: '/:pathMatch(.*)*', component: () => import('@/views/NotFoundView.vue'), meta: { public: true } },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (to.meta.public) return true
  if (!auth.isAuthenticated()) return '/login'
  if (!auth.user) {
    try {
      await auth.fetchMe()
    } catch {
      return '/login'
    }
  }
  return true
})

export default router
