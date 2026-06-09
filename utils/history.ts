import AsyncStorage from '@react-native-async-storage/async-storage';
import { Analysis } from '../types/analysis';
import { ScanRecord } from '../types/history';

const KEY = 'knowhat_history';
const MAX_RECORDS = 50;

export async function appendScan(analysis: Analysis): Promise<void> {
  const existing = await loadHistory();
  const record: ScanRecord = {
    id: Date.now().toString(),
    date: new Date().toISOString(),
    analysis,
  };
  const updated = [record, ...existing].slice(0, MAX_RECORDS);
  await AsyncStorage.setItem(KEY, JSON.stringify(updated));
}

export async function loadHistory(): Promise<ScanRecord[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  return JSON.parse(raw) as ScanRecord[];
}

export async function deleteRecord(id: string): Promise<void> {
  const existing = await loadHistory();
  await AsyncStorage.setItem(KEY, JSON.stringify(existing.filter(r => r.id !== id)));
}

export async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
