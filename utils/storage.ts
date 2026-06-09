import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '../types/profile';

const KEY = 'knowhat_profile';

export async function saveProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(profile));
}

export async function loadProfile(): Promise<UserProfile | null> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return null;
  return JSON.parse(raw) as UserProfile;
}

export async function clearProfile(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
