<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useDocumentsStore } from '@/stores/documents.store'
import { useRoomsStore } from '@/stores/rooms.store'

const auth = useAuthStore()
const docsStore = useDocumentsStore()
const roomsStore = useRoomsStore()

onMounted(() => {
  docsStore.fetchDocuments()
  roomsStore.fetchRooms()
})
</script>

<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold text-gray-900 mb-6">
      Welcome back, {{ auth.user?.full_name }}
    </h1>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-white rounded-xl border p-6">
        <p class="text-sm text-gray-500">Documents</p>
        <p class="text-3xl font-bold text-indigo-600">{{ docsStore.documents.length }}</p>
        <router-link to="/documents" class="text-sm text-indigo-600 hover:underline mt-2 block">View all →</router-link>
      </div>
      <div class="bg-white rounded-xl border p-6">
        <p class="text-sm text-gray-500">Chat rooms</p>
        <p class="text-3xl font-bold text-indigo-600">{{ roomsStore.rooms.length }}</p>
        <router-link to="/rooms" class="text-sm text-indigo-600 hover:underline mt-2 block">View all →</router-link>
      </div>
      <div class="bg-white rounded-xl border p-6">
        <p class="text-sm text-gray-500">Ready documents</p>
        <p class="text-3xl font-bold text-green-600">
          {{ docsStore.documents.filter(d => d.status === 'READY').length }}
        </p>
      </div>
    </div>
  </div>
</template>
