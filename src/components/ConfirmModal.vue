<!-- src/components/ConfirmModal.vue -->
<script setup lang="ts">
import { AlertTriangle } from 'lucide-vue-next';
import type { Component } from 'vue';

defineProps<{
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'red' | 'orange' | 'blue' | 'green';
  icon?: Component;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'confirm'): void;
}>();

// Helper untuk warna tombol
const getConfirmColorClass = (color: string) => {
  switch (color) {
    case 'red': return 'bg-red-600 hover:bg-red-700';
    case 'orange': return 'bg-orange-500 hover:bg-orange-600';
    case 'green': return 'bg-green-600 hover:bg-green-700';
    default: return 'bg-blue-600 hover:bg-blue-700';
  }
};
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div 
        v-if="isOpen" 
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        @click.self="emit('close')"
      >
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-white/20 transform transition-all">
          
          <!-- Icon -->
          <div class="pt-6 flex justify-center">
            <div class="w-16 h-16 rounded-full flex items-center justify-center bg-orange-100 text-orange-600">
              <component :is="icon || AlertTriangle" :size="32" />
            </div>
          </div>

          <!-- Body -->
          <div class="p-5 text-center">
            <h3 class="text-xl font-bold text-slate-800 mb-2">{{ title }}</h3>
            <p class="text-slate-500 text-sm leading-relaxed">{{ message }}</p>
          </div>

          <!-- Footer -->
          <div class="p-4 bg-slate-50 flex gap-2">
            <button 
              @click="emit('close')" 
              class="flex-1 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors font-medium active:scale-95"
            >
              {{ cancelText || 'Batal' }}
            </button>
            <button 
              @click="emit('confirm')" 
              class="flex-1 text-white px-4 py-2.5 rounded-xl transition-colors font-medium active:scale-95 flex items-center justify-center gap-2"
              :class="getConfirmColorClass(confirmColor || 'blue')"
            >
              {{ confirmText || 'Ya' }}
            </button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active, .modal-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.modal-enter-from, .modal-leave-to {
  opacity: 0;
}
.modal-enter-from .bg-white, .modal-leave-to .bg-white {
  transform: scale(0.95) translateY(10px);
}
</style>