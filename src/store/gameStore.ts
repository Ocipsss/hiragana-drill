// src/store/gameStore.ts
import { createStore } from 'zustand/vanilla';
import type { GameState, RowType } from '../types';
import { HIRAGANA_DATA } from '../lib/constants';
import { getFilteredWords, shuffleArray } from '../lib/utils';
import { getHistory } from '../lib/db';

const ALL_CHAR_ROWS: RowType[] = ['a', 'k', 's', 't', 'n', 'h', 'm', 'y', 'r', 'w', 'nn'];

const getRowSlice = (row: RowType): [number, number] | null => {
  switch (row) {
    case 'a': return [0, 5];
    case 'k': return [5, 10];
    case 's': return [10, 15];
    case 't': return [15, 20];
    case 'n': return [20, 25];
    case 'h': return [25, 30];
    case 'm': return [30, 35];
    case 'y': return [35, 38];
    case 'r': return [38, 43];
    case 'w': return [43, 45];
    case 'nn': return [45, 46];
    default: return null;
  }
};

const getCharsFromRows = (rows: RowType[]): typeof HIRAGANA_DATA => {
  if (rows.length === 0) return [];
  if (rows.includes('all')) return HIRAGANA_DATA;
  const result: typeof HIRAGANA_DATA = [];
  for (const row of ALL_CHAR_ROWS) {
    if (rows.includes(row)) {
      const slice = getRowSlice(row);
      if (slice) {
        result.push(...HIRAGANA_DATA.slice(slice[0], slice[1]));
      }
    }
  }
  return result;
};

export const gameStore = createStore<GameState>((set, get) => ({
  mode: 'char',
  maxChars: 5,
  maxWords: 5,
  wordLengthFilter: 'all',
  selectedRows: ['a'],
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
    const sourceData = mode === 'char' ? getCharsFromRows(state.selectedRows) : getFilteredWords(state.wordLengthFilter);
    const limit = mode === 'char' ? state.maxChars : state.maxWords;
    const newMax = Math.min(limit, sourceData.length);
    return { 
      mode, 
      selectedRows: mode === 'char' ? state.selectedRows : (newMax > 0 ? ['all'] : []),
      selectedItems: sourceData.slice(0, newMax), 
      activeItems: [], 
      isPlaying: false, 
      isPaused: false, 
      lastRecord: null, 
      timeLeft: state.timeInput 
    };
  }),

  setMaxItems: (num) => set((state) => {
    const sourceData = state.mode === 'char' ? getCharsFromRows(state.selectedRows) : getFilteredWords(state.wordLengthFilter);
    const maxLimit = sourceData.length > 0 ? sourceData.length : (state.mode === 'char' ? HIRAGANA_DATA.length : getFilteredWords(state.wordLengthFilter).length);
    const validNum = Math.max(0, Math.min(num, maxLimit));
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
    return { 
      wordLengthFilter: filter, 
      selectedRows: newMax > 0 ? ['all'] : [], 
      selectedItems: sourceData.slice(0, newMax), 
      lastRecord: null 
    };
  }),

  toggleRowFilter: (row) => set((state) => {
    // Mode Kata: Toggle Semua Kata <-> Kosong
    if (state.mode === 'word') {
      const availableWords = getFilteredWords(state.wordLengthFilter);
      const isAllSelected = state.selectedRows.includes('all') && state.selectedItems.length === availableWords.length && availableWords.length > 0;

      if (isAllSelected) {
        return {
          selectedRows: [],
          maxWords: 0,
          selectedItems: [],
          lastRecord: null
        };
      }

      return {
        selectedRows: ['all'],
        maxWords: availableWords.length,
        selectedItems: [...availableWords],
        lastRecord: null
      };
    }

    // Mode Huruf
    const currentRows = state.selectedRows.filter(r => r !== 'all');
    let newRows: RowType[] = [];

    if (row === 'all') {
      const isAllSelected = currentRows.length === ALL_CHAR_ROWS.length;
      newRows = isAllSelected ? [] : [...ALL_CHAR_ROWS];
    } else if (currentRows.includes(row)) {
      newRows = currentRows.filter(r => r !== row);
    } else {
      newRows = [...currentRows, row];
    }

    const availableChars = getCharsFromRows(newRows);
    const newMax = availableChars.length;
    
    return {
      selectedRows: newRows,
      maxChars: newMax,
      selectedItems: availableChars.slice(0, newMax),
      lastRecord: null
    };
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

  restartGame: () => {
    const state = get();
    if (!state.isPlaying) return;
    
    let newActive = state.activeItems;
    if (state.isShuffleEnabled) {
      newActive = shuffleArray(state.selectedItems);
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
