<!-- src/components/AppToolbar.vue -->
<script setup lang="ts">
import { Play, Pause, Check, LayoutGrid, AlignJustify, Timer, Filter, RotateCcw } from 'lucide-vue-next';
import type { GameState, TimerMode } from '../types';

defineProps<{
  state: GameState;
  maxAvailable: number;
  onStart: () => void;
  onStop: () => void;
  onTogglePause: () => void;
  onRestart: () => void;
}>();

const emit = defineEmits<{
  (e: 'update:maxItems', val: number): void;
  (e: 'update:timeInput', val: number): void;
  (e: 'toggleRomaji'): void;
  (e: 'toggleCardStyle'): void;
  (e: 'toggleShuffle'): void;
  (e: 'openFilterModal'): void;
  (e: 'setTimerMode', mode: TimerMode): void;
}>();

const handleMaxItemsChange = (e: Event) => {
  const val = Number((e.target as HTMLInputElement).value);
  if (val > 0) emit('update:maxItems', val);
};

const handleTimeInputChange = (e: Event) => {
  emit('update:timeInput', Number((e.target as HTMLInputElement).value));
};
</script>

<template>
  <div class="bg-white p-3 sm:p-4 rounded-xl shadow-sm mb-6 flex flex-wrap gap-3 sm:gap-4 items-center justify-center max-w-5xl mx-auto">
    
    <!-- Input Jumlah -->
    <div class="flex items-center gap-1 border border-gray-300 rounded-lg px-2 bg-gray-50" :class="{ 'opacity-50': state.isPlaying }">
      <span class="text-xs font-semibold text-gray-500">Jml</span>
      <input 
        type="number" 
        :value="state.mode === 'char' ? state.maxChars : state.maxWords" 
        @change="handleMaxItemsChange"
        :disabled="state.isPlaying"
        class="w-12 sm:w-14 p-2 bg-transparent outline-none text-center text-sm font-bold text-gray-700"
        min="1"
        :max="maxAvailable"
      />
    </div>

    <!-- Toggle Timer Mode -->
    <div class="flex items-center border border-gray-300 rounded-lg p-1 bg-gray-50" :class="{ 'opacity-50': state.isPlaying }">
      <button 
        @click="emit('setTimerMode', 'countdown')"
        :disabled="state.isPlaying"
        class="px-2 py-1 rounded text-xs font-medium transition-colors"
        :class="state.timerMode === 'countdown' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'"
      >
        Countdown
      </button>
      <button 
        @click="emit('setTimerMode', 'stopwatch')"
        :disabled="state.isPlaying"
        class="px-2 py-1 rounded text-xs font-medium transition-colors"
        :class="state.timerMode === 'stopwatch' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'"
      >
        Stopwatch
      </button>
    </div>

    <!-- Input Timer (Hanya Countdown) -->
    <div v-if="state.timerMode === 'countdown'" class="flex items-center gap-1 border border-gray-300 rounded-lg px-2 bg-gray-50" :class="{ 'opacity-50': state.isPlaying }">
      <Timer :size="16" class="text-gray-500" />
      <input 
        type="number" 
        :value="state.timeInput" 
        @change="handleTimeInputChange"
        :disabled="state.isPlaying"
        class="w-12 sm:w-14 p-2 bg-transparent outline-none text-center text-sm"
        min="5"
      />
      <span class="text-gray-500 text-xs">dtk</span>
    </div>

    <!-- TOMBOL DINAMIS -->
    <template v-if="!state.isPlaying">
      <button 
        @click="onStart" 
        class="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
      >
        <Play :size="16" /> Mulai
      </button>
    </template>

    <template v-else>
      <!-- Tombol Restart (Mulai Ulang) -->
      <button 
        @click="onRestart" 
        :disabled="state.timerMode === 'countdown' && state.timeLeft === 0"
        class="flex items-center gap-1 bg-orange-500 text-white px-3 py-2 rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium disabled:opacity-50"
        title="Mulai Ulang"
      >
        <RotateCcw :size="16" />
      </button>

      <button 
        @click="onTogglePause" 
        class="flex items-center gap-1 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
        :class="state.isPaused ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-500 hover:bg-yellow-600'"
      >
        <component :is="state.isPaused ? Play : Pause" :size="16" /> 
        {{ state.isPaused ? 'Resume' : 'Pause' }}
      </button>

      <button 
        @click="onStop" 
        class="flex items-center gap-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
      >
        <Check :size="16" /> Selesai
      </button>
    </template>

    <!-- Tombol Filter Kata -->
    <button 
      v-if="state.mode === 'word'"
      @click="emit('openFilterModal')"
      :disabled="state.isPlaying"
      class="flex items-center gap-1 bg-purple-100 text-purple-700 px-3 py-2 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium disabled:opacity-50"
    >
      <Filter :size="16" /> 
      {{ state.wordLengthFilter === 'all' ? 'Semua Kata' : state.wordLengthFilter + ' Huruf' }}
    </button>

    <div class="h-6 w-px bg-gray-300 mx-1 hidden md:block"></div>

    <!-- TOGGLE SWITCH: Acak -->
    <label class="flex items-center gap-2 cursor-pointer select-none">
      <span class="text-xs sm:text-sm font-medium text-gray-700">Acak</span>
      <div class="relative">
        <input 
          type="checkbox" 
          class="sr-only" 
          :checked="state.isShuffleEnabled"
          @change="emit('toggleShuffle')"
          :disabled="state.isPlaying"
        >
        <div 
          class="w-10 h-5 rounded-full transition-colors duration-200"
          :class="[state.isShuffleEnabled ? 'bg-orange-500' : 'bg-gray-300', state.isPlaying ? 'opacity-50' : '']"
        ></div>
        <div 
          class="absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 shadow-sm"
          :class="state.isShuffleEnabled ? 'translate-x-5' : 'translate-x-0'"
        ></div>
      </div>
    </label>

    <!-- TOGGLE SWITCH: Romaji -->
    <label class="flex items-center gap-2 cursor-pointer select-none">
      <span class="text-xs sm:text-sm font-medium text-gray-700">Romaji</span>
      <div class="relative">
        <input 
          type="checkbox" 
          class="sr-only" 
          :checked="state.showRomaji"
          @change="emit('toggleRomaji')"
          :disabled="state.isPlaying && !state.isPaused"
        >
        <div 
          class="w-10 h-5 rounded-full transition-colors duration-200"
          :class="[
            state.showRomaji ? 'bg-blue-500' : 'bg-gray-300',
            (state.isPlaying && !state.isPaused) ? 'opacity-50' : ''
          ]"
        ></div>
        <div 
          class="absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 shadow-sm"
          :class="state.showRomaji ? 'translate-x-5' : 'translate-x-0'"
        ></div>
      </div>
    </label>

    <!-- Toggle Card Style -->
    <button 
      @click="emit('toggleCardStyle')" 
      class="flex items-center gap-1 bg-gray-200 text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
      title="Ganti Tampilan"
    >
      <component :is="state.useCardStyle ? AlignJustify : LayoutGrid" :size="16" />
    </button>

  </div>
</template>