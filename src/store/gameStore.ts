// src/store/gameStore.ts
import { createStore } from 'zustand/vanilla';
import type { GameState } from '../types';
import { HIRAGANA_DATA } from '../lib/constants';
import { getFilteredWords, shuffleArray } from '../lib/utils';
import { getHistory } from '../lib/db';

export const gameStore = createStore<GameState>((set, get) => ({
  mode: 'char',
  maxChars: 5,
  maxWords: 5,
  wordLengthFilter: 'all',
  selectedItems: HIRAGANA_DATA.slice(0, 5),
  activeItems: [],
  showRomaji: false,
  useCardStyle: true,
  isShuffleEnabled: true,
  timeInput: 10,
  timeLeft: 10,
  isPlaying: false,
  isPaused: false,
  
  timerMode: 'countdown',
  startTimestamp: 0,
  elapsedMs: 0,
  pausedAccumMs: 0,
  pauseStartTimestamp: 0,
  history: [],
  lastRecord: null,

  setMode: (mode) => set((state) => {
    const sourceData = mode === 'char' ? HIRAGANA_DATA : getFilteredWords(state.wordLengthFilter);
    const limit = mode === 'char' ? state.maxChars : state.maxWords;
    const newMax = Math.min(limit, sourceData.length);
    return { mode, selectedItems: sourceData.slice(0, newMax), activeItems: [], isPlaying: false, isPaused: false, lastRecord: null, timeLeft: state.timeInput };
  }),

  setMaxItems: (num) => set((state) => {
    const sourceData = state.mode === 'char' ? HIRAGANA_DATA : getFilteredWords(state.wordLengthFilter);
    const validNum = Math.max(1, Math.min(num, sourceData.length));
    if (state.mode === 'char') {
      return { maxChars: validNum, selectedItems: state.selectedItems.slice(0, validNum), lastRecord: null };
    } else {
      return { maxWords: validNum, selectedItems: state.selectedItems.slice(0, validNum), lastRecord: null };
    }
  }),

  setWordLengthFilter: (filter) => set((state) => {
    if (state.mode !== 'word') return { wordLengthFilter: filter };
    const sourceData = getFilteredWords(filter);
    const newMax = Math.min(state.maxWords, sourceData.length);
    return { wordLengthFilter: filter, selectedItems: sourceData.slice(0, newMax), lastRecord: null };
  }),

  setTimerMode: (mode) => set((state) => ({ timerMode: mode, timeLeft: state.timeInput, lastRecord: null })),

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

  loadHistory: async () => {
    const hist = await getHistory();
    set({ history: hist });
  },

  setHistoryData: (history, lastRecord) => set({ history, lastRecord }),

  stopAndSetRecord: (record) => set({ isPlaying: false, isPaused: false, lastRecord: record }),

  startGame: () => {
    const state = get();
    if (state.selectedItems.length === 0) return false;
    set({ 
      isPlaying: true, 
      isPaused: false, 
      timeLeft: state.timeInput, 
      startTimestamp: Date.now(),
      elapsedMs: 0,
      pausedAccumMs: 0,
      pauseStartTimestamp: 0,
      lastRecord: null
    });
    return true;
  },

  // ACTION BARU: Restart Game (Mulai Ulang)
  restartGame: () => {
    const state = get();
    if (!state.isPlaying) return;
    
    // Jika shuffle ON, acak ulang dan pastikan beda dari yang sebelumnya
    let newActive = state.activeItems;
    if (state.isShuffleEnabled) {
      newActive = shuffleArray(state.selectedItems);
      // (Anti-duplikat bisa ditambahkan di App.vue, tapi di sini cukup reset saja)
    }

    set({
      activeItems: newActive,
      timeLeft: state.timeInput,
      startTimestamp: Date.now(),
      elapsedMs: 0,
      pausedAccumMs: 0,
      pauseStartTimestamp: 0,
      isPaused: false,
      lastRecord: null
    });
  },

  tickTimer: () => set((state) => {
    if (state.isPaused || !state.isPlaying) return state;
    const now = Date.now();
    const realElapsed = now - state.startTimestamp - state.pausedAccumMs;

    if (state.timerMode === 'countdown') {
      const remaining = Math.max(0, state.timeInput - Math.floor(realElapsed / 1000));
      if (remaining === 0) {
        return { timeLeft: 0, isPlaying: false };
      }
      return { timeLeft: remaining };
    } else {
      return { elapsedMs: realElapsed };
    }
  }),

  togglePause: () => set((state) => {
    if (!state.isPlaying || (state.timerMode === 'countdown' && state.timeLeft === 0)) return state;
    if (state.isPaused) {
      const pauseDuration = Date.now() - state.pauseStartTimestamp;
      return { isPaused: false, pausedAccumMs: state.pausedAccumMs + pauseDuration, pauseStartTimestamp: 0 };
    } else {
      return { isPaused: true, pauseStartTimestamp: Date.now() };
    }
  }),

  resetGame: () => set((state) => ({ 
    isPlaying: false, 
    isPaused: false,
    timeLeft: state.timeInput,
    elapsedMs: 0,
    startTimestamp: 0,
    pausedAccumMs: 0,
    pauseStartTimestamp: 0,
    lastRecord: null,
    activeItems: [] 
  })),
}));