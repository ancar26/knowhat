import { UserProfile } from '../types/profile';

export function profileHash(profile: UserProfile): string {
  const key = [
    profile.language,
    profile.voiceTone,
    [...profile.dietTypes].sort().join(','),
    [...profile.allergies].sort().join(','),
    profile.customRestriction,
    [...profile.goals].sort().join(','),
  ].join('|');
  let hash = 5381;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) + hash) ^ key.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}
