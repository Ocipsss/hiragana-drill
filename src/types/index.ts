// src/types/index.ts

export interface StudyItem {
  id: string;
  text: string;
  romaji: string;
  meaning?: string;
}

export type GameMode = 'char' | 'word';
export type WordLengthFilter = 'all' | '2' | '3' | '4+';
export type TimerMode = 'countdown' | 'stopwatch';
export type RowType = 'all' | 'a' | 'k' | 's' | 't' | 'n' | 'h' | 'm' | 'y' | 'r' | 'w' | 'nn';

export interface HistoryEntry {
  id?: number;
  timestamp: number;
  mode: GameMode;
  timerMode: TimerMode;
  itemCount: number;
  wordFilter?: WordLengthFilter;
  durationMs: number;
  avgMsPerItem: number;
  items: StudyItem[];
  isPersonalBest: boolean;
}

export interface GameState {
  mode: GameMode;
  maxChars: number;
  maxWords: number;
  wordLengthFilter: WordLengthFilter;
  selectedRows: RowType[]; // Ubah dari selectedRow (single) ke selectedRows (array)
  selectedItems: StudyItem[];
  activeItems: StudyItem[];
  showRomaji: boolean;
  useCardStyle: boolean;
  isShuffleEnabled: boolean;
  timeInput: number;
  timeLeft: number;
  isPlaying: boolean;
  isPaused: boolean;
  
  timerMode: TimerMode;
  startTimestamp: number;
  elapsedMs: number;
  pausedAccumMs: number;
  pauseStartTimestamp: number;
  history: HistoryEntry[];
  lastRecord: HistoryEntry | null;

  setMode: (mode: GameMode) => void;
  setMaxItems: (num: number) => void;
  setWordLengthFilter: (filter: WordLengthFilter) => void;
  toggleRowFilter: (row: RowType) => void; // Action baru (multi-select)
  setTimerMode: (mode: TimerMode) => void;
  toggleItem: (item: StudyItem) => void;
  toggleRomaji: () => void;
  toggleCardStyle: () => void;
  toggleShuffle: () => void;
  setTimeInput: (time: number) => void;
  setActiveItems: (items: StudyItem[]) => void;
  startGame: () => boolean;
  tickTimer: () => void;
  togglePause: () => void;
  resetGame: () => void;
  restartGame: () => void;
  loadHistory: () => Promise<void>;
  setHistoryData: (history: HistoryEntry[], lastRecord: HistoryEntry | null) => void;
  stopAndSetRecord: (record: HistoryEntry) => void;
}