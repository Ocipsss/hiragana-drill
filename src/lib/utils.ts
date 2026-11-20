// src/lib/utils.ts
import type { HiraganaChar } from '../types';

export const shuffleArray = (array: HiraganaChar[]): HiraganaChar[] => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

export const isSameOrder = (arr1: HiraganaChar[], arr2: HiraganaChar[]): boolean => {
  if (arr1.length !== arr2.length) return false;
  return arr1.every((val, index) => val.id === arr2[index].id);
};