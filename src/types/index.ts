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
  useCardStyle: boolean; // Toggle untuk Card vs Plain Text
  timeInput: number;
  timeLeft: number;
  isPlaying: boolean;

  // Actions
  setMaxCards: (num: number) => void;
  toggleChar: (char: HiraganaChar) => void;
  toggleRomaji: () => void;
  toggleCardStyle: () => void;
  setTimeInput: (time: number) => void;
  setActiveCards: (cards: HiraganaChar[]) => void;
  startGame: () => boolean;
  tickTimer: () => void;
  resetGame: () => void;
}