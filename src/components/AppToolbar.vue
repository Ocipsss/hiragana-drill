<!-- src/components/AppToolbar.vue -->
<script setup lang="ts">
import { Play, Square, Pause, LayoutGrid, AlignJustify, Timer } from 'lucide-vue-next';
import type { GameState } from '../types';

defineProps<{
  state: GameState;
  onStart: () => void;
  onStop: () => void;
  onTogglePause: () => void; // Prop baru
}>();

const emit = defineEmits<{
  (e: 'update:maxCards', val: number): void;
  (e: 'update:timeInput', val: number): void;
  (e: 'toggleRomaji'): void;
  (e: 'toggleCardStyle'): void;
  (e: 'toggleShuffle'): void;
}>();

const handleMaxCardsChange = (e: Event) => {
  emit('update:maxCards', Number((e.target as HTMLSelectElement).value));
};

const handleTimeInputChange = (e: Event) => {
  emit('update:timeInput', Number((e.target as HTMLInputElement).value));
};
</script>

<template>
  <div class="bg-white p-4 rounded-xl shadow-sm mb-6 flex flex-wrap gap-4 items-center justify-center max-w-5xl mx-auto">
    
    <!-- Pilih Jumlah -->
    <select 
      :value="state.maxCards" 
      @change="handleMaxCardsChange"
      :disabled="state.isPlaying"
      class="border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50 disabled:bg-gray-100"
    >
      <option v-for="num in [5, 10, 15, 20, 25, 46]" :key="num" :value="num">
        {{ num }} Huruf
      </option>
    </select>

    <!-- Input Timer -->
    <div class="flex items-center gap-1 border border-gray-300 rounded-lg px-2 bg-gray-50" :class="{ 'opacity-50': state.isPlaying }">
      <Timer :size="16" class="text-gray-500" />
      <input 
        type="number" 
        :value="state.timeInput" 
        @change="handleTimeInputChange"
        :disabled="state.isPlaying"
        class="w-14 p-2 bg-transparent outline-none text-center text-sm"
        min="5"
      />
      <span class="text-gray-500 text-xs">dtk</span>
    </div>

    <!-- TOMBOL DINAMIS: Mulai / Pause / Resume / Stop -->
    <template v-if="!state.isPlaying">
      <button 
        @click="onStart" 
        class="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
      >
        <Play :size="16" /> Mulai
      </button>
    </template>

    <template v-else>
      <!-- Tombol Pause / Resume -->
      <button 
        @click="onTogglePause" 
        class="flex items-center gap-1 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
        :class="state.isPaused ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-500 hover:bg-yellow-600'"
      >
        <component :is="state.isPaused ? Play : Pause" :size="16" /> 
        {{ state.isPaused ? 'Resume' : 'Pause' }}
      </button>

      <!-- Tombol Stop -->
      <button 
        @click="onStop" 
        class="flex items-center gap-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
      >
        <Square :size="16" /> Stop
      </button>
    </template>

    <div class="h-6 w-px bg-gray-300 mx-1 hidden md:block"></div>

    <!-- TOGGLE SWITCH: Acak (Shuffle) -->
    <label class="flex items-center gap-2 cursor-pointer select-none">
      <span class="text-sm font-medium text-gray-700">Acak</span>
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
    <!-- Disable saat PLAYING dan TIDAK PAUSE (agar tidak curang saat latihan) -->
    <label class="flex items-center gap-2 cursor-pointer select-none">
      <span class="text-sm font-medium text-gray-700">Romaji</span>
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