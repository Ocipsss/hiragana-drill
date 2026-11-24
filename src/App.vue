<!-- src/App.vue -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { gameStore } from './store/gameStore';
import { HIRAGANA_DATA } from './lib/constants';
import { shuffleArray, isSameOrder, getFilteredWords, formatTime } from './lib/utils';
import { saveHistory, getHistory, checkPersonalBest, clearAllHistory, deleteHistoryEntry } from './lib/db';
import { toCSV, toJSON, downloadFile, generateFilename } from './lib/export';
import type { GameState, StudyItem, RowType } from './types';
import { RotateCcw, Filter } from 'lucide-vue-next';
import AppToolbar from './components/AppToolbar.vue';
import HiraganaItem from './components/HiraganaItem.vue';
import AppModal from './components/AppModal.vue';
import SelectModal from './components/SelectModal.vue';
import FinishScreen from './components/FinishScreen.vue';
import HistoryModal from './components/HistoryModal.vue';
import ExportModal from './components/ExportModal.vue';
import ConfirmModal from './components/ConfirmModal.vue';
import RowFilterModal from './components/RowFilterModal.vue';

const state = ref<GameState>(gameStore.getState());

const unsubscribe = gameStore.subscribe((newState) => {
  state.value = newState;
});

let timerInterval: ReturnType<typeof setInterval> | null = null;
const isModalOpen = ref(false);
const isFilterModalOpen = ref(false);
const isHistoryModalOpen = ref(false);
const isExportModalOpen = ref(false);
const isRestartModalOpen = ref(false);
const isRowFilterModalOpen = ref(false);

onMounted(async () => {
  state.value = gameStore.getState();
  await gameStore.getState().loadHistory();
});

onUnmounted(() => {
  unsubscribe();
  if (timerInterval) clearInterval(timerInterval);
});

const currentData = computed(() => {
  return state.value.mode === 'char' ? HIRAGANA_DATA : getFilteredWords(state.value.wordLengthFilter);
});

const maxAvailable = computed(() => currentData.value.length);

const isSelected = (id: string) => state.value.selectedItems.some(c => c.id === id);
const isDisabled = (id: string) => {
  const limit = state.value.mode === 'char' ? state.value.maxChars : state.value.maxWords;
  return !isSelected(id) && state.value.selectedItems.length >= limit;
};

const handleToggleItem = (item: StudyItem) => {
  gameStore.getState().toggleItem(item);
};

// Handler untuk multi-select filter
const handleToggleRow = (row: RowType) => {
  gameStore.getState().toggleRowFilter(row);
};

const startTimer = () => {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (!gameStore.getState().isPlaying) {
      if (timerInterval) clearInterval(timerInterval);
      return;
    }
    gameStore.getState().tickTimer();
  }, 16);
};

const handleStart = () => {
  if (state.value.selectedItems.length === 0) {
    isModalOpen.value = true;
    return;
  }
  
  let initialItems: StudyItem[] = [];
  if (state.value.isShuffleEnabled) {
    initialItems = shuffleArray(state.value.selectedItems);
    if (state.value.activeItems.length > 0) {
      while (isSameOrder(initialItems, state.value.activeItems)) {
        initialItems = shuffleArray(state.value.selectedItems);
      }
    }
  } else {
    initialItems = [...state.value.selectedItems];
  }
  
  gameStore.getState().setActiveItems(initialItems);
  gameStore.getState().startGame();
  startTimer();
};

const handleRestartClick = () => {
  isRestartModalOpen.value = true;
};

const confirmRestart = () => {
  isRestartModalOpen.value = false;
  
  if (state.value.isShuffleEnabled) {
    let newItems = shuffleArray(state.value.selectedItems);
    while (isSameOrder(newItems, state.value.activeItems)) {
      newItems = shuffleArray(state.value.selectedItems);
    }
    gameStore.getState().setActiveItems(newItems);
  }
  
  gameStore.getState().restartGame();
  startTimer();
};

const handleFinish = async () => {
  if (timerInterval) clearInterval(timerInterval);
  const currentState = gameStore.getState();
  if (!currentState.isPlaying) return;

  const now = Date.now();
  const realDurationMs = now - currentState.startTimestamp - currentState.pausedAccumMs;
  const itemCount = currentState.activeItems.length;
  const avgMsPerItem = itemCount > 0 ? realDurationMs / itemCount : 0;
  const wordFilter = currentState.mode === 'word' ? currentState.wordLengthFilter : undefined;

  const isPB = await checkPersonalBest(
    currentState.mode, 
    currentState.timerMode, 
    itemCount, 
    wordFilter, 
    avgMsPerItem
  );

  const entry = {
    timestamp: Date.now(),
    mode: currentState.mode,
    timerMode: currentState.timerMode,
    itemCount,
    wordFilter,
    durationMs: realDurationMs,
    avgMsPerItem,
    items: JSON.parse(JSON.stringify(currentState.activeItems)), 
    isPersonalBest: isPB
  };

  const saved = await saveHistory(entry);
  const updatedHistory = await getHistory();

  gameStore.getState().stopAndSetRecord(saved);
  gameStore.getState().setHistoryData(updatedHistory, saved);
};

const handleTogglePause = () => {
  gameStore.getState().togglePause();
};

const handleReset = () => {
  if (timerInterval) clearInterval(timerInterval);
  gameStore.getState().resetGame();
};

const handleDeleteHistory = async (id: number) => {
  await deleteHistoryEntry(id);
  const updatedHistory = await getHistory();
  gameStore.getState().setHistoryData(updatedHistory, state.value.lastRecord);
};

const handleClearAllHistory = async () => {
  await clearAllHistory();
  gameStore.getState().setHistoryData([], null);
};

const handleExport = (payload: { format: 'csv' | 'json'; filteredHistory: any[] }) => {
  const { format, filteredHistory } = payload;
  if (format === 'csv') {
    const csv = toCSV(filteredHistory);
    downloadFile(csv, generateFilename('csv'), 'text/csv;charset=utf-8;');
  } else {
    const json = toJSON(filteredHistory);
    downloadFile(json, generateFilename('json'), 'application/json');
  }
  isExportModalOpen.value = false;
};

const filterOptions = [
  { label: 'Semua Kata', value: 'all' },
  { label: '2 Huruf', value: '2' },
  { label: '3 Huruf', value: '3' },
  { label: '4+ Huruf', value: '4+' },
];

const handleSelectFilter = (val: string) => {
  gameStore.getState().setWordLengthFilter(val as any);
  isFilterModalOpen.value = false;
};

// Data chip filter untuk desktop (multi-select)
const desktopChips = computed(() => {
  if (state.value.mode === 'word') {
    return [{ label: 'Semua Kata', value: 'all' as RowType }];
  }
  return [
    { label: 'A', value: 'a' as RowType },
    { label: 'K', value: 'k' as RowType },
    { label: 'S', value: 's' as RowType },
    { label: 'T', value: 't' as RowType },
    { label: 'N', value: 'n' as RowType },
    { label: 'H', value: 'h' as RowType },
    { label: 'M', value: 'm' as RowType },
    { label: 'Y', value: 'y' as RowType },
    { label: 'R', value: 'r' as RowType },
    { label: 'W', value: 'w' as RowType },
    { label: 'ん', value: 'nn' as RowType },
    { label: 'Semua', value: 'all' as RowType },
  ];
});

// Label untuk tombol filter di mobile
const mobileFilterLabel = computed(() => {
  const rows = state.value.selectedRows;
  if (state.value.mode === 'word') {
    return rows.includes('all') && state.value.selectedItems.length > 0 ? 'Semua Kata' : 'Tidak ada';
  }
  if (rows.length === 0) return 'Tidak ada';
  if (rows.length === 11) return 'Semua';
  return rows.map(r => {
    const found = desktopChips.value.find(c => c.value === r);
    return found ? found.label : r;
  }).join(', ');
});

const isChipActive = (chipValue: RowType) => {
  if (state.value.mode === 'word') {
    return chipValue === 'all' && state.value.selectedRows.includes('all') && state.value.selectedItems.length > 0;
  }
  return chipValue === 'all'
    ? state.value.selectedRows.length === 11
    : state.value.selectedRows.includes(chipValue);
};

const personalBest = computed(() => {
  const currentState = state.value;
  if (currentState.history.length === 0) return null;
  
  const relevant = currentState.history.filter(h => {
    return h.mode === currentState.mode && 
           h.timerMode === currentState.timerMode && 
           h.itemCount === (currentState.mode === 'char' ? currentState.maxChars : currentState.maxWords) &&
           (currentState.mode === 'char' || h.wordFilter === currentState.wordLengthFilter);
  });
  
  if (relevant.length === 0) return null;
  return Math.min(...relevant.map(h => h.avgMsPerItem));
});

const fontClass = computed(() => {
  const isWord = state.value.mode === 'word';
  const count = state.value.activeItems.length;
  if (isWord) {
    if (count <= 10) return 'text-3xl md:text-4xl lg:text-5xl';
    if (count <= 25) return 'text-2xl md:text-3xl lg:text-4xl';
    return 'text-xl md:text-2xl lg:text-3xl';
  }
  if (count <= 10) return 'text-5xl md:text-6xl';
  if (count <= 25) return 'text-4xl md:text-5xl';
  return 'text-3xl md:text-4xl';
});

const gridClass = computed(() => {
  if (state.value.mode === 'word') {
    return state.value.useCardStyle
      ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
      : 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6';
  }
  return state.value.useCardStyle
    ? 'grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8'
    : 'grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10';
});
</script>

<template>
  <div class="min-h-screen bg-slate-50 p-3 sm:p-4 md:p-8 font-sans">
    
    <header class="text-center mb-4 sm:mb-6">
      <h1 class="text-2xl md:text-3xl font-bold text-slate-800 mb-1">Hiragana Drill</h1>
      <p class="text-slate-500 text-xs sm:text-sm">Latihan membaca cepat</p>
      
      <div 
        v-if="state.isPlaying" 
        class="mt-3 text-2xl sm:text-3xl font-mono font-bold inline-block px-4 py-1 rounded-full transition-colors duration-300"
        :class="[
          state.isPaused 
            ? 'text-green-600 bg-green-50' 
            : (state.timerMode === 'countdown' && state.timeLeft <= 10)
              ? 'text-red-600 bg-red-50 animate-pulse' 
              : 'text-blue-600 bg-blue-50'
        ]"
      >
        <template v-if="state.timerMode === 'countdown'">
          ⏱ {{ state.timeLeft }} dtk
        </template>
        <template v-else>
          ⏱ {{ formatTime(state.elapsedMs) }}
        </template>
        <span v-if="state.isPaused" class="text-xs sm:text-sm font-sans font-normal ml-2 text-green-700">(Paused)</span>
      </div>
    </header>

    <div class="flex justify-center mb-4 sm:mb-6">
      <div class="bg-white rounded-lg shadow-sm p-1 inline-flex border border-gray-100">
        <button 
          @click="gameStore.getState().setMode('char')"
          class="px-4 py-2 rounded-md text-sm font-medium transition-colors"
          :class="state.mode === 'char' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'"
          :disabled="state.isPlaying"
        >
          Huruf
        </button>
        <button 
          @click="gameStore.getState().setMode('word')"
          class="px-4 py-2 rounded-md text-sm font-medium transition-colors"
          :class="state.mode === 'word' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'"
          :disabled="state.isPlaying"
        >
          Kata
        </button>
      </div>
    </div>

    <AppToolbar 
      :state="state"
      :maxAvailable="maxAvailable"
      :on-start="handleStart"
      :on-stop="handleFinish" 
      :on-toggle-pause="handleTogglePause"
      :on-restart="handleRestartClick" 
      @update:max-items="(val) => gameStore.getState().setMaxItems(val)"
      @update:time-input="(val) => gameStore.getState().setTimeInput(val)"
      @toggle-romaji="() => gameStore.getState().toggleRomaji()"
      @toggle-card-style="() => gameStore.getState().toggleCardStyle()"
      @toggle-shuffle="() => gameStore.getState().toggleShuffle()"
      @open-filter-modal="isFilterModalOpen = true"
      @set-timer-mode="(mode) => gameStore.getState().setTimerMode(mode)"
    />

    <main class="max-w-6xl mx-auto">
      
      <FinishScreen 
        v-if="state.lastRecord" 
        :stats="state.lastRecord"
        @replay="handleReset"
        @viewHistory="isHistoryModalOpen = true"
      />

      <div v-if="!state.isPlaying && !state.lastRecord && state.timeLeft > 0" class="bg-white p-3 sm:p-4 md:p-6 rounded-xl shadow-sm mb-6">
        
        <!-- Header Checklist + Filter -->
        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
          <h2 class="font-semibold text-slate-700 text-sm sm:text-base">
            Pilih {{ state.mode === 'char' ? 'Huruf' : 'Kata' }}
            <span class="ml-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-md">
              {{ state.selectedItems.length }} / {{ state.mode === 'char' ? state.maxChars : state.maxWords }}
            </span>
          </h2>

          <!-- Tombol Filter (Mobile) -->
          <button 
            @click="isRowFilterModalOpen = true"
            class="sm:hidden flex items-center gap-1 text-sm bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-200"
          >
            <Filter :size="14" /> 
            {{ mobileFilterLabel }}
          </button>

          <!-- Chip Filter (Desktop/Tablet) - Multi-select -->
          <div class="hidden sm:flex flex-wrap gap-1">
            <button
              v-for="chip in desktopChips"
              :key="chip.value"
              @click="handleToggleRow(chip.value)"
              class="px-2 py-1 rounded-md text-xs font-medium transition-colors border"
              :class="isChipActive(chip.value)
                ? 'bg-blue-100 text-blue-700 border-blue-300' 
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'"
            >
              {{ chip.label }}
            </button>
          </div>
        </div>
        
        <div class="flex flex-wrap gap-1.5 sm:gap-2">
          <button
            v-for="item in currentData"
            :key="item.id"
            @click="handleToggleItem(item)"
            :disabled="isDisabled(item.id)"
            class="rounded-lg border-2 font-bold transition-all duration-200"
            :class="[
              state.mode === 'char' ? 'w-10 h-10 sm:w-12 sm:h-12 text-lg sm:text-xl' : 'px-2 py-1.5 sm:px-3 sm:py-2 text-sm sm:text-base',
              isSelected(item.id) 
                ? 'border-blue-500 bg-blue-50 text-blue-600 shadow-sm' 
                : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white',
              isDisabled(item.id) ? 'opacity-30 cursor-not-allowed' : ''
            ]"
          >
            {{ item.text }}
          </button>
        </div>
      </div>

      <div 
        v-if="state.isPlaying" 
        class="grid gap-2 md:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500"
        :class="gridClass"
      >
        <HiraganaItem 
          v-for="item in state.activeItems" 
          :key="item.id" 
          :data="item" 
          :show-romaji="state.showRomaji"
          :use-card-style="state.useCardStyle"
          :class="fontClass"
        />
      </div>

      <div v-if="!state.isPlaying && !state.lastRecord && state.timeLeft === 0 && state.timerMode === 'countdown'" class="text-center mt-12 animate-in fade-in zoom-in duration-300">
        <div class="inline-block bg-white p-6 sm:p-8 rounded-2xl shadow-lg">
          <h2 class="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">Waktu Habis! ⏰</h2>
          <p class="text-slate-500 mb-6 text-sm sm:text-base">Latihan gagal (tidak disimpan).</p>
          <button 
            @click="handleReset" 
            class="bg-blue-600 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-md shadow-blue-200"
          >
            Main Lagi
          </button>
        </div>
      </div>

      <div v-if="!state.isPlaying && !state.lastRecord && state.timeLeft > 0" class="mt-8 text-center animate-in fade-in duration-500">
        <button @click="isHistoryModalOpen = true" class="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
          📜 History ({{ state.history.length }})
          <span v-if="personalBest" class="text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded text-xs font-bold">🏆 Rekor: {{ (personalBest / 1000).toFixed(2) }}s/item</span>
        </button>
      </div>

    </main>

    <AppModal 
      :is-open="isModalOpen" 
      title="Peringatan" 
      message="Pilih minimal satu item sebelum memulai latihan!"
      @close="isModalOpen = false"
    />

    <SelectModal 
      :is-open="isFilterModalOpen"
      title="Filter Panjang Kata"
      :options="filterOptions"
      :selected-value="state.wordLengthFilter"
      @close="isFilterModalOpen = false"
      @select="handleSelectFilter"
    />

    <HistoryModal 
      :is-open="isHistoryModalOpen" 
      :history="state.history" 
      @close="isHistoryModalOpen = false"
      @delete="handleDeleteHistory"
      @clearAll="handleClearAllHistory"
      @open-export="isExportModalOpen = true"
    />

    <ExportModal 
      :is-open="isExportModalOpen"
      :history="state.history"
      @close="isExportModalOpen = false"
      @export="handleExport"
    />

    <ConfirmModal 
      :is-open="isRestartModalOpen"
      title="Mulai Ulang Latihan?"
      message="Timer akan direset dan urutan kartu akan diacak ulang (jika mode acak aktif). Latihan saat ini tidak akan disimpan."
      confirmText="Ya, Mulai Ulang"
      cancelText="Batal"
      confirmColor="orange"
      :icon="RotateCcw"
      @close="isRestartModalOpen = false"
      @confirm="confirmRestart"
    />

    <!-- Modal Filter Baris BARU (Multi-select) -->
    <RowFilterModal 
      :is-open="isRowFilterModalOpen"
      :selected-rows="state.selectedRows"
      :is-word-mode="state.mode === 'word'"
      @close="isRowFilterModalOpen = false"
      @toggle="handleToggleRow"
    />
  </div>
</template>

<style>
@keyframes slide-in-bottom {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
.animate-in {
  animation: slide-in-bottom 0.5s ease-out forwards;
}
</style>
