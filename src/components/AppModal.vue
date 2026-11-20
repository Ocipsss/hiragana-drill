<!-- src/components/AppModal.vue -->
<script setup lang="ts">
import { X } from 'lucide-vue-next';

defineProps<{
  isOpen: boolean;
  title: string;
  message: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all">
          
          <!-- Header -->
          <div class="flex justify-between items-center p-4 border-b border-gray-100">
            <h3 class="font-bold text-lg text-gray-800">{{ title }}</h3>
            <button @click="emit('close')" class="p-1 hover:bg-gray-100 rounded-full transition-colors">
              <X :size="20" class="text-gray-500" />
            </button>
          </div>
          
          <!-- Body -->
          <div class="p-6 text-gray-600">
            {{ message }}
          </div>
          
          <!-- Footer -->
          <div class="p-4 border-t border-gray-100 flex justify-end">
            <button 
              @click="emit('close')" 
              class="bg-gray-800 text-white px-5 py-2 rounded-lg hover:bg-gray-700 transition-colors font-medium text-sm"
            >
              Tutup
            </button>
          </div>
          
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Animasi transisi modal */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>