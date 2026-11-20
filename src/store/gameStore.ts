// src/store/gameStore.ts
import { createStore } from 'zustand/vanilla';
import type { GameState } from '../types';
import { HIRAGANA_DATA } from '../lib/constants';

export const gameStore = createStore<GameState>((set, get) => ({
  // --- State Awal ---
  maxCards: 5,
  selectedChars: HIRAGANA_DATA.slice(0, 5), // Default 5 huruf pertama
  activeCards: [],
  showRomaji: true,
  useCardStyle: true,
  timeInput: 60,
  timeLeft: 60,
  isPlaying: false,

  // --- Actions ---
  setMaxCards: (num) => set((state) => {
    // Jika batas dikurangi, potong array huruf yang sudah dipilih
    const newSelected = state.selectedChars.slice(0, num);
    return { maxCards: num, selectedChars: newSelected };
  }),

  toggleChar: (char) => set((state) => {
    const isSelected = state.selectedChars.find((c) => c.id === char.id);
    
    // Jika sudah dipilih, hapus dari list
    if (isSelected) {
      return { selectedChars: state.selectedChars.filter((c) => c.id !== char.id) };
    }
    
    // Jika belum dipilih tapi kuota sudah penuh, abaikan
    if (state.selectedChars.length >= state.maxCards) {
      return state; 
    }
    
    // Tambahkan ke list
    return { selectedChars: [...state.selectedChars, char] };
  }),

  toggleRomaji: () => set((state) => ({ showRomaji: !state.showRomaji })),
  
  toggleCardStyle: () => set((state) => ({ useCardStyle: !state.useCardStyle })),

  setTimeInput: (time) => set({ timeInput: time, timeLeft: time }),

  setActiveCards: (cards) => set({ activeCards: cards }),

  startGame: () => {
    const state = get();
    if (state.selectedChars.length === 0) return false;
    
    set({ isPlaying: true, timeLeft: state.timeInput });
    return true;
  },

  tickTimer: () => set((state) => {
    if (state.timeLeft <= 1) {
      return { timeLeft: 0, isPlaying: false };
    }
    return { timeLeft: state.timeLeft - 1 };
  }),

  resetGame: () => set((state) => ({ 
    isPlaying: false, 
    timeLeft: state.timeInput,
    activeCards: [] 
  })),
}));