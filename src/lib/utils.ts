// src/lib/utils.ts
import type { StudyItem, WordLengthFilter } from '../types';
import { WORD_DATA } from './constants';

export const shuffleArray = (array: StudyItem[]): StudyItem[] => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

export const isSameOrder = (arr1: StudyItem[], arr2: StudyItem[]): boolean => {
  if (arr1.length !== arr2.length) return false;
  return arr1.every((val, index) => val.id === arr2[index].id);
};

// Fungsi baru untuk memfilter kata berdasarkan panjang
export const getFilteredWords = (filter: WordLengthFilter): StudyItem[] => {
  if (filter === 'all') return WORD_DATA;
  if (filter === '2') return WORD_DATA.filter((w) => w.text.length === 2);
  if (filter === '3') return WORD_DATA.filter((w) => w.text.length === 3);
  return WORD_DATA.filter((w) => w.text.length >= 4); // Untuk '4+'
};