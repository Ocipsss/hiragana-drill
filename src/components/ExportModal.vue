<!-- src/components/ExportModal.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue';
import { X, Download, FileJson, FileSpreadsheet } from 'lucide-vue-next';
import type { HistoryEntry } from '../types';

const props = defineProps<{
  isOpen: boolean;
  history: HistoryEntry[];
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'export', payload: { format: 'csv' | 'json'; filter: FilterType; filteredHistory: HistoryEntry[] }): void;
}>();

type FilterType = 'all' | 'char' | 'word' | 'countdown' | 'stopwatch';

const selectedFormat = ref<'csv' | 'json'>('csv');
const selectedFilter = ref<FilterType>('all');

const filterOptions: { label: string; value: FilterType }[] = [
  { label: 'Semua History', value: 'all' },
  { label: 'Hanya Mode Huruf', value: 'char' },
  { label: 'Hanya Mode Kata', value: 'word' },
  { label: 'Hanya Countdown', value: 'countdown' },
  { label: 'Hanya Stopwatch', value: 'stopwatch' },
];

const filteredHistory = computed(() => {
  if (selectedFilter.value === 'all') return props.history;
  if (selectedFilter.value === 'char') return props.history.filter(h => h.mode === 'char');
  if (selectedFilter.value === 'word') return props.history.filter(h => h.mode === 'word');
  if (selectedFilter.value === 'countdown') return props.history.filter(h => h.timerMode === 'countdown');
  if (selectedFilter.value === 'stopwatch') return props.history.filter(h => h.timerMode === 'stopwatch');
  return props.history;
});

const handleExport = () => {
  emit('export', {
    format: selectedFormat.value,
    filter: selectedFilter.value,
    filteredHistory: filteredHistory.value
  });
};
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
          
          <!-- Header -->
          <div class="flex justify-between items-center p-4 border-b border-gray-100">
            <h3 class="font-bold text-lg text-gray-800">Ekspor History</h3>
            <button @click="emit('close')" class="p-1 hover:bg-gray-100 rounded-full transition-colors">
              <X :size="20" class="text-gray-500" />
            </button>
          </div>

          <div class="p-4 space-y-4">
            
            <!-- Format -->
            <div>
              <p class="text-sm font-semibold text-gray-700 mb-2">Format</p>
              <div class="grid grid-cols-2 gap-2">
                <button
                  @click="selectedFormat = 'csv'"
                  class="flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-colors"
                  :class="selectedFormat === 'csv' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'"
                >
                  <FileSpreadsheet :size="18" /> CSV
                </button>
                <button
                  @click="selectedFormat = 'json'"
                  class="flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-colors"
                  :class="selectedFormat === 'json' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'"
                >
                  <FileJson :size="18" /> JSON
                </button>
              </div>
            </div>

            <!-- Filter -->
            <div>
              <p class="text-sm font-semibold text-gray-700 mb-2">Filter Data</p>
              <div class="space-y-1">
                <button
                  v-for="opt in filterOptions"
                  :key="opt.value"
                  @click="selectedFilter = opt.value"
                  class="w-full flex items-center justify-between p-2.5 rounded-lg text-sm transition-colors"
                  :class="selectedFilter === opt.value ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-gray-50 text-gray-700'"
                >
                  <span>{{ opt.label }}</span>
                  <span class="text-xs text-gray-400">
                    {{ opt.value === 'all' ? history.length : 
                       opt.value === 'char' ? history.filter(h => h.mode === 'char').length :
                       opt.value === 'word' ? history.filter(h => h.mode === 'word').length :
                       opt.value === 'countdown' ? history.filter(h => h.timerMode === 'countdown').length :
                       history.filter(h => h.timerMode === 'stopwatch').length }}
                  </span>
                </button>
              </div>
            </div>

            <!-- Preview -->
            <div class="bg-slate-50 rounded-lg p-3 text-sm">
              <p class="text-gray-600">
                Akan mengekspor <strong class="text-blue-600">{{ filteredHistory.length }} entri</strong> 
                dalam format <strong class="text-blue-600 uppercase">{{ selectedFormat }}</strong>.
              </p>
            </div>

          </div>

          <!-- Footer -->
          <div class="p-4 border-t border-gray-100 flex gap-2">
            <button
              @click="emit('close')"
              class="flex-1 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Batal
            </button>
            <button
              @click="handleExport"
              :disabled="filteredHistory.length === 0"
              class="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
            >
              <Download :size="16" /> Ekspor
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