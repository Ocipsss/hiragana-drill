// src/lib/db.ts
import Dexie, { type Table } from 'dexie';
import type { HistoryEntry, TimerMode, GameMode, WordLengthFilter } from '../types';

// 1. Inisialisasi Database
class HiraganaDB extends Dexie {
  histories!: Table<HistoryEntry, number>;

  constructor() {
    super('HiraganaDrillDB');
    this.version(1).stores({
      // Index yang sering dipakai untuk query PB
      histories: '++id, timestamp, mode, timerMode, itemCount, wordFilter' 
    });
  }
}

export const db = new HiraganaDB();

// 2. Fungsi Menyimpan History (dengan batas 100)
export const saveHistory = async (entry: Omit<HistoryEntry, 'id'>): Promise<HistoryEntry> => {
  const id = await db.histories.add(entry as HistoryEntry);
  
  // Cek jika lebih dari 100, hapus yang paling lama
  const count = await db.histories.count();
  if (count > 100) {
    const oldest = await db.histories.orderBy('timestamp').first();
    if (oldest && oldest.id) {
      await db.histories.delete(oldest.id);
    }
  }
  
  return { ...entry, id } as HistoryEntry;
};

// 3. Fungsi Mengambil Semua History (Terbaru di atas)
export const getHistory = async (): Promise<HistoryEntry[]> => {
  return await db.histories.orderBy('timestamp').reverse().toArray();
};

// 4. Fungsi Menghapus 1 Entri
export const deleteHistoryEntry = async (id: number) => {
  await db.histories.delete(id);
};

// 5. Fungsi Menghapus Semua History
export const clearAllHistory = async () => {
  await db.histories.clear();
};

// 6. Fungsi Cek Personal Best (PB)
export const checkPersonalBest = async (
  mode: GameMode,
  timerMode: TimerMode,
  itemCount: number,
  wordFilter: WordLengthFilter | undefined,
  currentAvgMs: number
): Promise<boolean> => {
  
  // Ambil semua history dengan kriteria yang sama
  const filtered = await db.histories
    .where({ mode, timerMode, itemCount })
    .toArray();

  // Filter wordFilter (karena Dexie tidak bisa query undefined dengan mudah)
  const relevant = filtered.filter(h => h.wordFilter === wordFilter);

  if (relevant.length === 0) return true; // Jika belum ada history, berarti PB pertama

  // Cari waktu rata-rata terbaik (terkecil)
  const bestAvg = Math.min(...relevant.map(h => h.avgMsPerItem));
  
  return currentAvgMs < bestAvg;
};