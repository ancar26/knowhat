export type VoiceTone = 'friendly' | 'professional';

export type UserProfile = {
  name: string;
  language: string;
  dietTypes: string[];
  allergies: string[];
  customRestriction: string;
  goals: string[];
  voiceTone: VoiceTone;
};

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ro', label: 'Romanian' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'it', label: 'Italian' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'pl', label: 'Polish' },
  { code: 'nl', label: 'Dutch' },
  { code: 'ar', label: 'Arabic' },
];

export const DIET_TYPES = [
  { id: 'vegan', label: 'Vegan', icon: '🌱' },
  { id: 'vegetarian', label: 'Vegetarian', icon: '🥗' },
  { id: 'keto', label: 'Keto', icon: '🥩' },
  { id: 'halal', label: 'Halal', icon: '☪️' },
  { id: 'kosher', label: 'Kosher', icon: '✡️' },
  { id: 'gluten_free', label: 'Gluten-free', icon: '🌾' },
];

export const ALLERGIES = [
  'Gluten', 'Dairy', 'Eggs', 'Nuts', 'Peanuts',
  'Soy', 'Fish', 'Shellfish', 'Sesame', 'Sulphites',
];

export const GOALS = [
  { id: 'reduce_sugar', label: 'Reduce sugar', icon: '🍬' },
  { id: 'lose_weight', label: 'Lose weight', icon: '⚖️' },
  { id: 'build_muscle', label: 'Build muscle', icon: '💪' },
  { id: 'avoid_additives', label: 'Avoid additives', icon: '🚫' },
  { id: 'heart_health', label: 'Heart health', icon: '❤️' },
  { id: 'manage_diabetes', label: 'Manage diabetes', icon: '🩸' },
];

export const EMPTY_PROFILE: UserProfile = {
  name: '',
  language: 'en',
  dietTypes: [],
  allergies: [],
  customRestriction: '',
  goals: [],
  voiceTone: 'friendly',
};
