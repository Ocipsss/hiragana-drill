<!-- src/components/RowFilterModal.vue -->
<script setup lang="ts">
import { X, Check } from 'lucide-vue-next';
import type { RowType } from '../types';

defineProps<{
  isOpen: boolean;
  selectedRows: RowType[];
  isWordMode: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'toggle', row: RowType): void;
}>();

const charRows: { label: string; value: RowType }[] = [
  { label: 'Semua Huruf', value: 'all' },
  { label: 'Baris A (あ-お)', value: 'a' },
  { label: 'Baris K (か-こ)', value: 'k' },
  { label: 'Baris S (さ-そ)', value: 's' },
  { label: 'Baris T (た-と)', value: 't' },
  { label: 'Baris N (な-の)', value: 'n' },
  { label: 'Baris H (は-ほ)', value: 'h' },
  { label: 'Baris M (ま-も)', value: 'm' },
  { label: 'Baris Y (や-よ)', value: 'y' },
  { label: 'Baris R (ら-ろ)', value: 'r' },
  { label: 'Baris W (わ-を)', value: 'w' },
  { label: 'Huruf N (ん)', value: 'nn' },
];

const wordRows: { label: string; value: RowType }[] = [
  { label: 'Semua Kata', value: 'all' },
];

// Cek apakah baris aktif (untuk 'all', aktif jika semua baris terpilih)
const isActive = (row: RowType, selected: RowType[]) => {
  if (row === 'all') {
    return selected.includes('all') || selected.length === 11; // Total 11 baris (a sampai nn)
  }
  return selected.includes(row);
};
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="isOpen" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4" @click.self="emit('close')">
        <div class="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all">
          
          <div class="flex justify-between items-center p-4 border-b border-gray-100">
            <h3 class="font-bold text-lg text-gray-800">Pilih Filter</h3>
            <button @click="emit('close')" class="p-1 hover:bg-gray-100 rounded-full transition-colors">
              <X :size="20" class="text-gray-500" />
            </button>
          </div>
          
          <div class="p-2 max-h-[60vh] overflow-y-auto">
            <button
              v-for="opt in (isWordMode ? wordRows : charRows)"
              :key="opt.value"
              @click="emit('toggle', opt.value)"
              class="w-full flex items-center justify-between p-3.5 mb-1 rounded-lg transition-colors"
              :class="isActive(opt.value, selectedRows) ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'"
            >
              <span class="font-medium">{{ opt.label }}</span>
              <Check v-if="isActive(opt.value, selectedRows)" :size="20" class="text-blue-600" />
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
