<!-- src/components/HistoryModal.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import { X, Trash2, ChevronDown, ChevronUp, Trophy, Download } from 'lucide-vue-next';
import type { HistoryEntry } from '../types';

defineProps<{
  isOpen: boolean;
  history: HistoryEntry[];
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'delete', id: number): void;
  (e: 'clearAll'): void;
  (e: 'openExport'): void; // Emit baru
}>();

const expandedId = ref<number | null>(null);

const toggleExpand = (id: number | undefined) => {
  if (!id) return;
  expandedId.value = expandedId.value === id ? null : id;
};

const formatDate = (ts: number) => {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
};

const formatTime = (ms: number) => {
  return (ms / 1000).toFixed(3) + 's';
};
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden">
          
          <!-- Header -->
          <div class="flex justify-between items-center p-4 border-b border-gray-100">
            <h3 class="font-bold text-lg text-gray-800">Riwayat Latihan</h3>
            <div class="flex items-center gap-2">
              <button @click="emit('openExport')" class="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 bg-blue-50 rounded">
                <Download :size="12" /> Ekspor
              </button>
              <button @click="emit('clearAll')" class="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 bg-red-50 rounded">Hapus Semua</button>
              <button @click="emit('close')" class="p-1 hover:bg-gray-100 rounded-full transition-colors">
                <X :size="20" class="text-gray-500" />
              </button>
            </div>
          </div>

          <!-- List History -->
          <div class="overflow-y-auto p-2 flex-1">
            <div v-if="history.length === 0" class="text-center text-gray-500 py-8 text-sm">
              Belum ada riwayat latihan.
            </div>

            <div v-for="entry in history" :key="entry.id" class="mb-2 border border-gray-100 rounded-lg overflow-hidden transition-all">
              <div @click="toggleExpand(entry.id)" class="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="font-bold text-gray-800 text-sm">{{ formatDate(entry.timestamp) }}</span>
                    <span class="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">
                      {{ entry.mode === 'char' ? 'Huruf' : 'Kata' }}
                    </span>
                    <span class="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                      {{ entry.timerMode === 'stopwatch' ? '⏱' : '⏳' }}
                    </span>
                  </div>
                  <div class="text-xs text-gray-500">
                    {{ entry.itemCount }} item · {{ formatTime(entry.durationMs) }} · 
                    <span class="font-medium text-gray-700">{{ (entry.avgMsPerItem / 1000).toFixed(2) }}s/item</span>
                  </div>
                </div>
                
                <div class="flex items-center gap-2">
                  <Trophy v-if="entry.isPersonalBest" :size="16" class="text-yellow-500" />
                  <button @click.stop="entry.id && emit('delete', entry.id)" class="p-1 text-red-400 hover:text-red-600">
                    <Trash2 :size="14" />
                  </button>
                  <component :is="expandedId === entry.id ? ChevronUp : ChevronDown" :size="16" class="text-gray-400" />
                </div>
              </div>

              <div v-if="expandedId === entry.id" class="bg-slate-50 p-3 border-t border-gray-100">
                <p class="text-xs text-gray-500 mb-2 font-medium">Item yang dibaca:</p>
                <div class="flex flex-wrap gap-2">
                  <span v-for="(item, idx) in entry.items" :key="idx" class="px-2 py-1 bg-white border border-gray-200 rounded text-sm text-gray-700 font-medium shadow-sm">
                    {{ item.text }}
                  </span>
                </div>
              </div>
            </div>
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