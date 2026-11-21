<!-- src/components/FinishScreen.vue -->
<script setup lang="ts">
import { Trophy, RotateCcw, History } from 'lucide-vue-next';
import type { HistoryEntry } from '../types';

defineProps<{
  stats: HistoryEntry;
}>();

const emit = defineEmits<{
  (e: 'replay'): void;
  (e: 'viewHistory'): void;
}>();

// Helper format waktu
const formatTime = (ms: number) => {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  const mm = Math.floor(ms % 1000);
  return `${m > 0 ? m + ':' : ''}${s.toString().padStart(2, '0')}.${mm.toString().padStart(3, '0')}s`;
};
</script>

<template>
  <div class="text-center mt-8 animate-in fade-in zoom-in duration-300">
    <div class="inline-block bg-white p-6 sm:p-8 rounded-2xl shadow-lg max-w-sm w-full mx-auto">
      
      <h2 class="text-3xl font-bold text-slate-800 mb-2">Selesai! 🏁</h2>
      
      <!-- Badge PB -->
      <div v-if="stats.isPersonalBest" class="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-bold mb-4 shadow-sm">
        <Trophy :size="16" /> Rekor Baru!
      </div>

      <!-- Statistik Utama -->
      <div class="bg-slate-50 rounded-xl p-4 mb-6">
        <p class="text-sm text-slate-500 mb-1">Total Waktu</p>
        <p class="text-3xl font-mono font-bold text-blue-600 mb-3">{{ formatTime(stats.durationMs) }}</p>
        
        <div class="flex justify-between text-sm border-t border-slate-200 pt-2">
          <span class="text-slate-500">Rata-rata / item</span>
          <span class="font-mono font-bold text-slate-700">{{ (stats.avgMsPerItem / 1000).toFixed(2) }}s</span>
        </div>
        <div class="flex justify-between text-sm mt-1">
          <span class="text-slate-500">Jumlah item</span>
          <span class="font-bold text-slate-700">{{ stats.itemCount }} item</span>
        </div>
      </div>

      <!-- Tombol Aksi -->
      <div class="flex flex-col gap-2">
        <button @click="emit('replay')" class="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors w-full">
          <RotateCcw :size="18" /> Main Lagi
        </button>
        <button @click="emit('viewHistory')" class="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-4 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors w-full">
          <History :size="18" /> Lihat Semua History
        </button>
      </div>
      
    </div>
  </div>
</template>