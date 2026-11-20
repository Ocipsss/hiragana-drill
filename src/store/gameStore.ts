// src/store/gameStore.ts
import { createStore } from 'zustand/vanilla';
import type { GameState } from '../types';
import { HIRAGANA_DATA } from '../lib/constants';

export const gameStore = createStore<GameState>((set, get) => ({
  maxCards: 5,
  selectedChars: HIRAGANA_DATA.slice(0, 5),
  activeCards: [],
  showRomaji: true,
  useCardStyle: true,
  isShuffleEnabled: false,
  timeInput: 60,
  timeLeft: 60,
  isPlaying: false,
  isPaused: false, // Default: tidak pause

  setMaxCards: (num) => set((state) => {
    const newSelected = state.selectedChars.slice(0, num);
    return { maxCards: num, selectedChars: newSelected };
  }),

  toggleChar: (char) => set((state) => {
    const isSelected = state.selectedChars.find((c) => c.id === char.id);
    if (isSelected) {
      return { selectedChars: state.selectedChars.filter((c) => c.id !== char.id) };
    }
    if (state.selectedChars.length >= state.maxCards) return state;
    return { selectedChars: [...state.selectedChars, char] };
  }),

  toggleRomaji: () => set((state) => ({ showRomaji: !state.showRomaji })),
  toggleCardStyle: () => set((state) => ({ useCardStyle: !state.useCardStyle })),
  toggleShuffle: () => set((state) => ({ isShuffleEnabled: !state.isShuffleEnabled })),

  setTimeInput: (time) => set({ timeInput: time, timeLeft: time }),
  setActiveCards: (cards) => set({ activeCards: cards }),

  startGame: () => {
    const state = get();
    if (state.selectedChars.length === 0) return false;
    set({ isPlaying: true, timeLeft: state.timeInput, isPaused: false });
    return true;
  },

  tickTimer: () => set((state) => {
    // Jika sedang pause, jangan kurangi waktu
    if (state.isPaused) return state;
    
    if (state.timeLeft <= 1) {
      return { timeLeft: 0, isPlaying: false };
    }
    return { timeLeft: state.timeLeft - 1 };
  }),

  // Action baru: Toggle Pause
  togglePause: () => set((state) => {
    // Hanya bisa pause jika sedang bermain dan waktu belum habis
    if (!state.isPlaying || state.timeLeft === 0) return state;
    return { isPaused: !state.isPaused };
  }),

  resetGame: () => set((state) => ({ 
    isPlaying: false, 
    isPaused: false,
    timeLeft: state.timeInput,
    activeCards: [] 
  })),
}));