import AsyncStorage from '@react-native-async-storage/async-storage';
import { Analysis } from '../types/analysis';
import { OFFProduct } from './openFoodFacts';

const TTL = 30 * 24 * 60 * 60 * 1000; // 30 days

type Entry<T> = { data: T; savedAt: number };

async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const entry: Entry<T> = JSON.parse(raw);
    if (Date.now() - entry.savedAt > TTL) return null;
    return entry.data;
  } catch {
    return null;
  }
}

async function cacheSet<T>(key: string, data: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify({ data, savedAt: Date.now() }));
  } catch {}
}

// Raw Open Food Facts data — keyed by barcode only
export const offCache = {
  get: (barcode: string) => cacheGet<OFFProduct>(`kw_off:${barcode}`),
  set: (barcode: string, product: OFFProduct) => cacheSet(`kw_off:${barcode}`, product),
};

// Personalised Claude analysis — keyed by barcode + profile hash
export const analysisCache = {
  get: (barcode: string, profileHash: string) =>
    cacheGet<Analysis>(`kw_analysis:${barcode}:${profileHash}`),
  set: (barcode: string, profileHash: string, analysis: Analysis) =>
    cacheSet(`kw_analysis:${barcode}:${profileHash}`, analysis),
};
