<!-- src/App.vue -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { gameStore } from './store/gameStore';
import { HIRAGANA_DATA } from './lib/constants';
import { shuffleArray, isSameOrder } from './lib/utils';
import type { GameState, HiraganaChar } from './types';
import AppToolbar from './components/AppToolbar.vue';
import HiraganaItem from './components/HiraganaItem.vue';
import AppModal from './components/AppModal.vue';

// 1. Bridge Zustand ke Vue Reactivity
// Kita gunakan 'ref' agar Vue bisa melacak perubahan dari Zustand
const state = ref<GameState>(gameStore.getState());

// Subscribe ke Zustand: setiap ada perubahan state, update ref Vue
const unsubscribe = gameStore.subscribe((newState) => {
  state.value = newState;
});

// 2. Lifecycle Hooks
let timerInterval: ReturnType<typeof setInterval> | null = null;
const isModalOpen = ref(false);

onMounted(() => {
  // Sinkronisasi awal saat komponen dimuat
  state.value = gameStore.getState();
});

onUnmounted(() => {
  unsubscribe();
  if (timerInterval) clearInterval(timerInterval);
});

// 3. Helper Functions untuk UI
const isSelected = (id: string) => state.value.selectedChars.some(c => c.id === id);
const isDisabled = (id: string) => !isSelected(id) && state.value.selectedChars.length >= state.value.maxCards;

// 4. Actions & Handlers
const handleToggleChar = (char: HiraganaChar) => {
  gameStore.getState().toggleChar(char);
};

const handleStart = () => {
  // Cegah start jika belum ada huruf yang dipilih
  if (state.value.selectedChars.length === 0) {
    isModalOpen.value = true;
    return;
  }
  
  // Ambil huruf, acak, dan masukkan ke activeCards
  const shuffled = shuffleArray(state.value.selectedChars);
  gameStore.getState().setActiveCards(shuffled);
  gameStore.getState().startGame();

  // Jalankan Timer
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (!gameStore.getState().isPlaying) {
      if (timerInterval) clearInterval(timerInterval);
      return;
    }
    gameStore.getState().tickTimer();
  }, 1000);
};

const handleShuffle = () => {
  const currentCards = state.value.activeCards;
  if (currentCards.length === 0) return;
  
  let newArr = shuffleArray(currentCards);
  
  // Pastikan urutan baru TIDAK sama dengan yang lama
  while (isSameOrder(newArr, currentCards)) {
    newArr = shuffleArray(currentCards);
  }
  
  gameStore.getState().setActiveCards(newArr);
};

const handleReset = () => {
  if (timerInterval) clearInterval(timerInterval);
  gameStore.getState().resetGame();
};

// 5. Computed: Dynamic Font Size berdasarkan jumlah huruf
const fontClass = computed(() => {
  const count = state.value.activeCards.length;
  if (count <= 10) return 'text-5xl md:text-6xl';
  if (count <= 25) return 'text-4xl md:text-5xl';
  return 'text-3xl md:text-4xl';
});

// 6. Computed: Dynamic Grid Columns (Responsive)
const gridClass = computed(() => {
  // Kita atur kolom berdasarkan mode (Card vs Plain)
  if (state.value.useCardStyle) {
    return 'grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8';
  } else {
    // Mode Plain Text bisa lebih padat
    return 'grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10';
  }
});
</script>

<template>
  <div class="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
    
    <!-- Header -->
    <header class="text-center mb-6">
      <h1 class="text-2xl md:text-3xl font-bold text-slate-800 mb-1">Hiragana Drill</h1>
      <p class="text-slate-500 text-sm">Latihan membaca cepat</p>
      
      <!-- Timer Display (Hanya muncul saat bermain) -->
      <div 
        v-if="state.isPlaying" 
        class="mt-3 text-3xl font-mono font-bold inline-block px-4 py-1 rounded-full"
        :class="state.timeLeft <= 10 ? 'text-red-600 bg-red-50 animate-pulse' : 'text-blue-600 bg-blue-50'"
      >
        ⏱ {{ state.timeLeft }} dtk
      </div>
    </header>

    <!-- Toolbar Kontrol -->
    <AppToolbar 
      :state="state"
      :on-start="handleStart"
      :on-shuffle="handleShuffle"
      @update:max-cards="(val) => gameStore.getState().setMaxCards(val)"
      @update:time-input="(val) => gameStore.getState().setTimeInput(val)"
      @toggle-romaji="() => gameStore.getState().toggleRomaji()"
      @toggle-card-style="() => gameStore.getState().toggleCardStyle()"
    />

    <!-- Main Content -->
    <main class="max-w-6xl mx-auto">
      
      <!-- AREA 1: Checklist Huruf (Tampil saat IDLE) -->
      <div v-if="!state.isPlaying" class="bg-white p-4 md:p-6 rounded-xl shadow-sm mb-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="font-semibold text-slate-700">
            Pilih Huruf 
            <span class="ml-1 text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-md">
              {{ state.selectedChars.length }} / {{ state.maxCards }}
            </span>
          </h2>
          <button 
            v-if="state.selectedChars.length < state.maxCards" 
            class="text-sm text-blue-600 hover:underline"
            @click="() => { /* Fitur pilih semua bisa ditambahkan nanti */ }"
          >
            (Pilih manual)
          </button>
        </div>
        
        <div class="flex flex-wrap gap-2">
          <button
            v-for="char in HIRAGANA_DATA"
            :key="char.id"
            @click="handleToggleChar(char)"
            :disabled="isDisabled(char.id)"
            class="w-12 h-12 rounded-lg border-2 font-bold text-xl transition-all duration-200"
            :class="[
              isSelected(char.id) 
                ? 'border-blue-500 bg-blue-50 text-blue-600 shadow-sm' 
                : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white',
              isDisabled(char.id) ? 'opacity-30 cursor-not-allowed' : ''
            ]"
          >
            {{ char.char }}
          </button>
        </div>
      </div>

      <!-- AREA 2: Grid Kartu (Tampil saat PLAYING) -->
      <div 
        v-if="state.isPlaying && state.timeLeft > 0" 
        class="grid gap-2 md:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500"
        :class="gridClass"
      >
        <HiraganaItem 
          v-for="card in state.activeCards" 
          :key="card.id" 
          :data="card" 
          :show-romaji="state.showRomaji"
          :use-card-style="state.useCardStyle"
          :class="fontClass"
        />
      </div>

      <!-- AREA 3: Waktu Habis (Tampil saat FINISHED) -->
      <div v-if="state.isPlaying && state.timeLeft === 0" class="text-center mt-12 animate-in fade-in zoom-in duration-300">
        <div class="inline-block bg-white p-8 rounded-2xl shadow-lg">
          <h2 class="text-3xl font-bold text-slate-800 mb-2">Waktu Habis! ⏰</h2>
          <p class="text-slate-500 mb-6">Latihan selesai.</p>
          <button 
            @click="handleReset" 
            class="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-md shadow-blue-200"
          >
            Main Lagi
          </button>
        </div>
      </div>

    </main>

    <!-- Modal Kustom -->
    <AppModal 
      :is-open="isModalOpen" 
      title="Peringatan" 
      message="Pilih minimal satu huruf sebelum memulai latihan!"
      @close="isModalOpen = false"
    />
  </div>
</template>

<style>
/* Animasi kustom untuk transisi masuk */
@keyframes slide-in-bottom {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
.animate-in {
  animation: slide-in-bottom 0.5s ease-out forwards;
}
</style>