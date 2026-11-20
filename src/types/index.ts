// src/types/index.ts

export interface HiraganaChar {
  id: string;
  char: string;
  romaji: string;
}

export interface GameState {
  maxCards: number;
  selectedChars: HiraganaChar[];
  activeCards: HiraganaChar[];
  showRomaji: boolean;
  useCardStyle: boolean;
  isShuffleEnabled: boolean;
  timeInput: number;
  timeLeft: number;
  isPlaying: boolean;
  isPaused: boolean; // State baru

  // Actions
  setMaxCards: (num: number) => void;
  toggleChar: (char: HiraganaChar) => void;
  toggleRomaji: () => void;
  toggleCardStyle: () => void;
  toggleShuffle: () => void;
  setTimeInput: (time: number) => void;
  setActiveCards: (cards: HiraganaChar[]) => void;
  startGame: () => boolean;
  tickTimer: () => void;
  togglePause: () => void; // Action baru
  resetGame: () => void;
}