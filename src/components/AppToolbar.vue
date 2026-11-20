<!-- src/components/AppToolbar.vue -->
<script setup lang="ts">
import { Play, Shuffle, Eye, EyeOff, Timer, LayoutGrid, AlignJustify } from 'lucide-vue-next';
import type { GameState } from '../types';

// Kita menerima state dan fungsi dari App.vue
defineProps<{
  state: GameState;
  onStart: () => void;
  onShuffle: () => void;
}>();

// Kita emit perubahan state ke App.vue
const emit = defineEmits<{
  (e: 'update:maxCards', val: number): void;
  (e: 'update:timeInput', val: number): void;
  (e: 'toggleRomaji'): void;
  (e: 'toggleCardStyle'): void;
}>();

const handleMaxCardsChange = (e: Event) => {
  emit('update:maxCards', Number((e.target as HTMLSelectElement).value));
};

const handleTimeInputChange = (e: Event) => {
  emit('update:timeInput', Number((e.target as HTMLInputElement).value));
};
</script>

<template>
  <div class="bg-white p-4 rounded-xl shadow-sm mb-6 flex flex-wrap gap-2 items-center justify-center max-w-4xl mx-auto">
    
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

    <!-- Tombol Mulai -->
    <button 
      @click="onStart" 
      :disabled="state.isPlaying"
      class="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm font-medium"
    >
      <Play :size="16" /> Mulai
    </button>

    <!-- Tombol Acak -->
    <button 
      @click="onShuffle" 
      :disabled="!state.isPlaying"
      class="flex items-center gap-1 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors text-sm font-medium"
    >
      <Shuffle :size="16" /> Acak
    </button>

    <!-- Toggle Romaji -->
    <button 
      @click="emit('toggleRomaji')" 
      class="flex items-center gap-1 bg-gray-200 text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
      title="Sembunyikan/Tampilkan Romaji"
    >
      <component :is="state.showRomaji ? EyeOff : Eye" :size="16" />
    </button>

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