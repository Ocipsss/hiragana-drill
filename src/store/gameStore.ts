// src/store/gameStore.ts
import { createStore } from 'zustand/vanilla';
import type { GameState } from '../types';
import { HIRAGANA_DATA } from '../lib/constants';
import { getFilteredWords } from '../lib/utils';

export const gameStore = createStore<GameState>((set, get) => ({
  mode: 'char',
  maxChars: 5,
  maxWords: 5,
  wordLengthFilter: 'all',
  selectedItems: HIRAGANA_DATA.slice(0, 5),
  activeItems: [],
  showRomaji: false, // Default OFF
  useCardStyle: true,
  isShuffleEnabled: false,
  timeInput: 10, // Default 10 detik
  timeLeft: 10,
  isPlaying: false,
  isPaused: false,

  setMode: (mode) => set((state) => {
    const sourceData = mode === 'char' ? HIRAGANA_DATA : getFilteredWords(state.wordLengthFilter);
    const limit = mode === 'char' ? state.maxChars : state.maxWords;
    const newMax = Math.min(limit, sourceData.length);
    
    return {
      mode,
      selectedItems: sourceData.slice(0, newMax),
      activeItems: [],
      isPlaying: false,
      isPaused: false
    };
  }),

  setMaxItems: (num) => set((state) => {
    const sourceData = state.mode === 'char' ? HIRAGANA_DATA : getFilteredWords(state.wordLengthFilter);
    const validNum = Math.max(1, Math.min(num, sourceData.length));
    
    if (state.mode === 'char') {
      return { maxChars: validNum, selectedItems: state.selectedItems.slice(0, validNum) };
    } else {
      return { maxWords: validNum, selectedItems: state.selectedItems.slice(0, validNum) };
    }
  }),

  setWordLengthFilter: (filter) => set((state) => {
    if (state.mode !== 'word') return { wordLengthFilter: filter };
    
    const sourceData = getFilteredWords(filter);
    const newMax = Math.min(state.maxWords, sourceData.length);
    
    return {
      wordLengthFilter: filter,
      selectedItems: sourceData.slice(0, newMax) // Reset checklist sesuai filter baru
    };
  }),

  toggleItem: (item) => set((state) => {
    const isSelected = state.selectedItems.find((c) => c.id === item.id);
    if (isSelected) {
      return { selectedItems: state.selectedItems.filter((c) => c.id !== item.id) };
    }
    
    const limit = state.mode === 'char' ? state.maxChars : state.maxWords;
    if (state.selectedItems.length >= limit) return state;
    
    return { selectedItems: [...state.selectedItems, item] };
  }),

  toggleRomaji: () => set((state) => ({ showRomaji: !state.showRomaji })),
  toggleCardStyle: () => set((state) => ({ useCardStyle: !state.useCardStyle })),
  toggleShuffle: () => set((state) => ({ isShuffleEnabled: !state.isShuffleEnabled })),

  setTimeInput: (time) => set({ timeInput: time, timeLeft: time }),
  setActiveItems: (items) => set({ activeItems: items }),

  startGame: () => {
    const state = get();
    if (state.selectedItems.length === 0) return false;
    set({ isPlaying: true, timeLeft: state.timeInput, isPaused: false });
    return true;
  },

  tickTimer: () => set((state) => {
    if (state.isPaused) return state;
    if (state.timeLeft <= 1) {
      return { timeLeft: 0, isPlaying: false };
    }
    return { timeLeft: state.timeLeft - 1 };
  }),

  togglePause: () => set((state) => {
    if (!state.isPlaying || state.timeLeft === 0) return state;
    return { isPaused: !state.isPaused };
  }),

  resetGame: () => set((state) => ({ 
    isPlaying: false, 
    isPaused: false,
    timeLeft: state.timeInput,
    activeItems: [] 
  })),
}));