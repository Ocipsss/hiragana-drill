// src/types/index.ts

export interface StudyItem {
  id: string;
  text: string;
  romaji: string;
  meaning?: string;
}

export type GameMode = 'char' | 'word';
export type WordLengthFilter = 'all' | '2' | '3' | '4+';

export interface GameState {
  mode: GameMode;
  maxChars: number; // State terpisah untuk huruf
  maxWords: number; // State terpisah untuk kata
  wordLengthFilter: WordLengthFilter;
  selectedItems: StudyItem[];
  activeItems: StudyItem[];
  showRomaji: boolean;
  useCardStyle: boolean;
  isShuffleEnabled: boolean;
  timeInput: number;
  timeLeft: number;
  isPlaying: boolean;
  isPaused: boolean;

  // Actions
  setMode: (mode: GameMode) => void;
  setMaxItems: (num: number) => void;
  setWordLengthFilter: (filter: WordLengthFilter) => void;
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
}