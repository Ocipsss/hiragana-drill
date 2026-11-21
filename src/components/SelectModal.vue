<!-- src/components/SelectModal.vue -->
<script setup lang="ts">
import { X, Check } from 'lucide-vue-next';

interface Option {
  label: string;
  value: string;
}

defineProps<{
  isOpen: boolean;
  title: string;
  options: Option[];
  selectedValue: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'select', value: string): void;
}>();
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div 
        v-if="isOpen" 
        class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
        @click.self="emit('close')"
      >
        <div class="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all">
          
          <div class="flex justify-between items-center p-4 border-b border-gray-100">
            <h3 class="font-bold text-lg text-gray-800">{{ title }}</h3>
            <button @click="emit('close')" class="p-1 hover:bg-gray-100 rounded-full transition-colors">
              <X :size="20" class="text-gray-500" />
            </button>
          </div>
          
          <div class="p-2 max-h-[60vh] overflow-y-auto">
            <button
              v-for="opt in options"
              :key="opt.value"
              @click="emit('select', opt.value)"
              class="w-full flex items-center justify-between p-4 mb-1 rounded-lg transition-colors"
              :class="selectedValue === opt.value ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'"
            >
              <span class="font-medium">{{ opt.label }}</span>
              <Check v-if="selectedValue === opt.value" :size="20" class="text-blue-600" />
            </button>
          </div>
          
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>