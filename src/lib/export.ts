// src/lib/export.ts
import type { HistoryEntry } from '../types';

// Format detail untuk CSV: あ(a) い(i)
const formatItemsDetail = (items: HistoryEntry['items']): string => {
  return items.map(i => `${i.text}(${i.romaji})`).join(' ');
};

// Format tanggal: 2026-06-14 14:32:15
const formatTimestamp = (ts: number): string => {
  const d = new Date(ts);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

// Escape CSV: bungkus dengan quote jika mengandung koma/quote/newline
const escapeCSV = (val: string | number | boolean | undefined): string => {
  if (val === undefined || val === null) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

// CSV Header
const CSV_HEADER = [
  'Timestamp',
  'Mode',
  'TimerMode',
  'ItemCount',
  'DurationMs',
  'AvgMsPerItem',
  'DurationSec',
  'AvgSecPerItem',
  'IsPersonalBest',
  'WordFilter',
  'Items'
].join(',');

// Generate CSV dari history
export const toCSV = (history: HistoryEntry[]): string => {
  const rows = history.map(h => [
    escapeCSV(formatTimestamp(h.timestamp)),
    escapeCSV(h.mode === 'char' ? 'Huruf' : 'Kata'),
    escapeCSV(h.timerMode === 'countdown' ? 'Countdown' : 'Stopwatch'),
    escapeCSV(h.itemCount),
    escapeCSV(h.durationMs),
    escapeCSV(h.avgMsPerItem.toFixed(2)),
    escapeCSV((h.durationMs / 1000).toFixed(3)),
    escapeCSV((h.avgMsPerItem / 1000).toFixed(3)),
    escapeCSV(h.isPersonalBest ? 'Ya' : 'Tidak'),
    escapeCSV(h.wordFilter === 'all' ? 'Semua' : h.wordFilter || '-'),
    escapeCSV(formatItemsDetail(h.items))
  ].join(','));
  
  return [CSV_HEADER, ...rows].join('\n');
};

// Generate JSON dari history (raw, standar, mudah dianalisa AI)
export const toJSON = (history: HistoryEntry[]): string => {
  return JSON.stringify(history, null, 2);
};

// Trigger download file
export const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Nama file dengan timestamp: hiragana-history-2026-06-14_14-32.csv
export const generateFilename = (ext: 'csv' | 'json'): string => {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const time = `${pad(d.getHours())}-${pad(d.getMinutes())}`;
  return `hiragana-history-${date}_${time}.${ext}`;
};