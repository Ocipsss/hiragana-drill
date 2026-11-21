<!-- src/App.vue -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { gameStore } from './store/gameStore';
import { HIRAGANA_DATA } from './lib/constants';
import { shuffleArray, isSameOrder, getFilteredWords, formatTime } from './lib/utils';
import { saveHistory, getHistory, checkPersonalBest, clearAllHistory, deleteHistoryEntry } from './lib/db';
import type { GameState, StudyItem } from './types';
import AppToolbar from './components/AppToolbar.vue';
import HiraganaItem from './components/HiraganaItem.vue';
import AppModal from './components/AppModal.vue';
import SelectModal from './components/SelectModal.vue';
import FinishScreen from './components/FinishScreen.vue';
import HistoryModal from './components/HistoryModal.vue';

const state = ref<GameState>(gameStore.getState());

const unsubscribe = gameStore.subscribe((newState) => {
  state.value = newState;
});

let timerInterval: ReturnType<typeof setInterval> | null = null;
const isModalOpen = ref(false);
const isFilterModalOpen = ref(false);
const isHistoryModalOpen = ref(false);

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

  if (timerInterval) clearInterval(timerInterval);
  // 16ms interval untuk presisi stopwatch (60fps)
  timerInterval = setInterval(() => {
    if (!gameStore.getState().isPlaying) {
      if (timerInterval) clearInterval(timerInterval);
      return;
    }
    gameStore.getState().tickTimer();
  }, 16);
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
    // PERBAIKAN: Ubah ke objek polos (Deep Clone) untuk menghindari DataCloneError dari Proxy Vue
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

// Compute PB untuk History Bar
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
      
      <!-- Timer Display -->
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

    <!-- Tab Mode -->
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
      @update:max-items="(val) => gameStore.getState().setMaxItems(val)"
      @update:time-input="(val) => gameStore.getState().setTimeInput(val)"
      @toggle-romaji="() => gameStore.getState().toggleRomaji()"
      @toggle-card-style="() => gameStore.getState().toggleCardStyle()"
      @toggle-shuffle="() => gameStore.getState().toggleShuffle()"
      @open-filter-modal="isFilterModalOpen = true"
      @set-timer-mode="(mode) => gameStore.getState().setTimerMode(mode)"
    />

    <main class="max-w-6xl mx-auto">
      
      <!-- AREA 0: Finish Screen -->
      <FinishScreen 
        v-if="state.lastRecord" 
        :stats="state.lastRecord"
        @replay="handleReset"
        @viewHistory="isHistoryModalOpen = true"
      />

      <!-- AREA 1: Checklist Item (IDLE) -->
      <div v-if="!state.isPlaying && !state.lastRecord && state.timeLeft > 0" class="bg-white p-3 sm:p-4 md:p-6 rounded-xl shadow-sm mb-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="font-semibold text-slate-700 text-sm sm:text-base">
            Pilih {{ state.mode === 'char' ? 'Huruf' : 'Kata' }}
            <span class="ml-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-md">
              {{ state.selectedItems.length }} / {{ state.mode === 'char' ? state.maxChars : state.maxWords }}
            </span>
          </h2>
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

      <!-- AREA 2: Grid Kartu (PLAYING) -->
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

      <!-- AREA 3: Waktu Habis (TIMEOUT) -->
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

      <!-- AREA 4: History Bar (IDLE only) -->
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