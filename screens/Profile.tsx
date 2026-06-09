import { useState } from 'react';
import {
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import * as Speech from 'expo-speech';
import {
  ALLERGIES, DIET_TYPES, GOALS, LANGUAGES,
  UserProfile, VoiceTone,
} from '../types/profile';
import { saveProfile } from '../utils/storage';

type Props = {
  profile: UserProfile;
  onSave: (updated: UserProfile) => void;
  onBack: () => void;
};

function toggle(arr: string[], item: string): string[] {
  return arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];
}

const VOICE_SAMPLES: Record<VoiceTone, string> = {
  friendly: "Hey! I just scanned your crisps. They look tasty but watch out — they're quite high in salt. Still, mostly natural ingredients!",
  professional: "Analysis complete. This product contains elevated sodium levels. Ingredients are predominantly natural with no artificial preservatives detected.",
};

export default function Profile({ profile, onSave, onBack }: Props) {
  const [draft, setDraft] = useState<UserProfile>({ ...profile });
  const patch = (p: Partial<UserProfile>) => setDraft(prev => ({ ...prev, ...p }));

  const handleSave = async () => {
    await saveProfile(draft);
    onSave(draft);
  };

  const playSample = (tone: VoiceTone) => {
    Speech.stop();
    Speech.speak(VOICE_SAMPLES[tone], { language: 'en', rate: tone === 'friendly' ? 1.0 : 0.85 });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <TouchableOpacity style={styles.backLink} onPress={onBack}>
          <Text style={styles.backLinkText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Your profile</Text>
        <Text style={styles.subtitle}>Changes apply to your next scan</Text>

        {/* ── Name & language ── */}
        <Text style={styles.sectionTitle}>About you</Text>

        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Maria"
          placeholderTextColor="#aaa"
          value={draft.name}
          onChangeText={name => patch({ name })}
          autoCapitalize="words"
          returnKeyType="done"
        />

        <Text style={styles.label}>Language</Text>
        <Text style={styles.hint}>Explanations will be shown in this language</Text>
        <View style={styles.langGrid}>
          {LANGUAGES.map(lang => (
            <TouchableOpacity
              key={lang.code}
              style={[styles.langCard, draft.language === lang.code && styles.langCardSelected]}
              onPress={() => patch({ language: lang.code })}
            >
              <Text style={[styles.langText, draft.language === lang.code && styles.langTextSelected]}>
                {lang.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Diet & restrictions ── */}
        <Text style={styles.sectionTitle}>Diet & restrictions</Text>

        <Text style={styles.label}>Diet type</Text>
        <Text style={styles.hint}>Select all that apply</Text>
        <View style={styles.cardGrid}>
          {DIET_TYPES.map(diet => {
            const selected = draft.dietTypes.includes(diet.id);
            return (
              <TouchableOpacity
                key={diet.id}
                style={[styles.dietCard, selected && styles.dietCardSelected]}
                onPress={() => patch({ dietTypes: toggle(draft.dietTypes, diet.id) })}
              >
                <Text style={styles.dietIcon}>{diet.icon}</Text>
                <Text style={[styles.dietLabel, selected && styles.dietLabelSelected]}>
                  {diet.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.label}>Allergies</Text>
        <View style={styles.checkGrid}>
          {ALLERGIES.map(allergy => {
            const selected = draft.allergies.includes(allergy);
            return (
              <TouchableOpacity
                key={allergy}
                style={[styles.checkItem, selected && styles.checkItemSelected]}
                onPress={() => patch({ allergies: toggle(draft.allergies, allergy) })}
              >
                <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                  {selected && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={[styles.checkLabel, selected && styles.checkLabelSelected]}>
                  {allergy}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.label, { marginTop: 20 }]}>Anything else?</Text>
        <TextInput
          style={styles.textArea}
          placeholder="e.g. allergic to peaches, avoid palm oil..."
          placeholderTextColor="#aaa"
          value={draft.customRestriction}
          onChangeText={customRestriction => patch({ customRestriction })}
          multiline
          numberOfLines={2}
        />

        {/* ── Goals & voice ── */}
        <Text style={styles.sectionTitle}>Goals & voice</Text>

        <Text style={styles.label}>Health goals</Text>
        <Text style={styles.hint}>We'll highlight what matters to you when you scan</Text>
        <View style={styles.cardGrid}>
          {GOALS.map(goal => {
            const selected = draft.goals.includes(goal.id);
            return (
              <TouchableOpacity
                key={goal.id}
                style={[styles.dietCard, selected && styles.dietCardSelected]}
                onPress={() => patch({ goals: toggle(draft.goals, goal.id) })}
              >
                <Text style={styles.dietIcon}>{goal.icon}</Text>
                <Text style={[styles.dietLabel, selected && styles.dietLabelSelected]}>
                  {goal.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.label}>Voice tone</Text>
        <Text style={styles.hint}>Tap a sample to hear the difference</Text>
        <View style={styles.toneRow}>
          {(['friendly', 'professional'] as VoiceTone[]).map(tone => (
            <View key={tone} style={styles.toneColumn}>
              <TouchableOpacity
                style={[styles.toneCard, draft.voiceTone === tone && styles.toneCardSelected]}
                onPress={() => patch({ voiceTone: tone })}
              >
                <Text style={styles.toneIcon}>{tone === 'friendly' ? '😊' : '🎩'}</Text>
                <Text style={[styles.toneLabel, draft.voiceTone === tone && styles.toneLabelSelected]}>
                  {tone.charAt(0).toUpperCase() + tone.slice(1)}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sampleBtn} onPress={() => playSample(tone)}>
                <Text style={styles.sampleBtnText}>▶ Hear sample</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* ── Actions ── */}
        <TouchableOpacity
          style={[styles.saveBtn, !draft.name.trim() && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!draft.name.trim()}
        >
          <Text style={styles.saveBtnText}>Save changes</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={onBack}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  scroll: { padding: 24, paddingTop: 56, paddingBottom: 48 },

  backLink: { marginBottom: 16 },
  backLinkText: { color: '#2a9d8f', fontWeight: '600', fontSize: 15 },

  title: { fontSize: 28, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 4 },
  subtitle: { fontSize: 15, color: '#666', marginBottom: 28 },

  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: '#2a9d8f',
    textTransform: 'uppercase', letterSpacing: 1,
    marginTop: 8, marginBottom: 16,
    borderTopWidth: 1, borderTopColor: '#e8e8e8', paddingTop: 20,
  },

  label: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 4 },
  hint: { fontSize: 13, color: '#999', marginBottom: 10 },

  input: {
    backgroundColor: 'white', borderRadius: 12, padding: 14,
    fontSize: 16, color: '#1a1a1a', marginBottom: 20,
    borderWidth: 1.5, borderColor: '#e0e0e0',
  },
  textArea: {
    backgroundColor: 'white', borderRadius: 12, padding: 14,
    fontSize: 15, color: '#1a1a1a', marginBottom: 8,
    borderWidth: 1.5, borderColor: '#e0e0e0', minHeight: 60,
    textAlignVertical: 'top',
  },

  langGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  langCard: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#ddd', backgroundColor: 'white',
  },
  langCardSelected: { borderColor: '#2a9d8f', backgroundColor: '#e8f5f3' },
  langText: { fontSize: 14, color: '#555' },
  langTextSelected: { color: '#2a9d8f', fontWeight: '700' },

  cardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  dietCard: {
    width: '30%', alignItems: 'center', paddingVertical: 14, borderRadius: 14,
    borderWidth: 1.5, borderColor: '#ddd', backgroundColor: 'white',
  },
  dietCardSelected: { borderColor: '#2a9d8f', backgroundColor: '#e8f5f3' },
  dietIcon: { fontSize: 24, marginBottom: 6 },
  dietLabel: { fontSize: 13, color: '#555', fontWeight: '500', textAlign: 'center' },
  dietLabelSelected: { color: '#2a9d8f', fontWeight: '700' },

  checkGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  checkItem: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#ddd', backgroundColor: 'white',
  },
  checkItemSelected: { borderColor: '#2a9d8f', backgroundColor: '#e8f5f3' },
  checkbox: {
    width: 18, height: 18, borderRadius: 4, borderWidth: 1.5,
    borderColor: '#ccc', alignItems: 'center', justifyContent: 'center',
  },
  checkboxSelected: { backgroundColor: '#2a9d8f', borderColor: '#2a9d8f' },
  checkmark: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  checkLabel: { fontSize: 14, color: '#555' },
  checkLabelSelected: { color: '#2a9d8f', fontWeight: '600' },

  toneRow: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  toneColumn: { flex: 1, gap: 8 },
  toneCard: {
    alignItems: 'center', paddingVertical: 16, borderRadius: 14,
    borderWidth: 1.5, borderColor: '#ddd', backgroundColor: 'white',
  },
  toneCardSelected: { borderColor: '#2a9d8f', backgroundColor: '#e8f5f3' },
  toneIcon: { fontSize: 28, marginBottom: 6 },
  toneLabel: { fontSize: 14, color: '#555', fontWeight: '500' },
  toneLabelSelected: { color: '#2a9d8f', fontWeight: '700' },
  sampleBtn: {
    alignItems: 'center', paddingVertical: 8, borderRadius: 10,
    borderWidth: 1, borderColor: '#ddd', backgroundColor: 'white',
  },
  sampleBtnText: { fontSize: 13, color: '#2a9d8f', fontWeight: '600' },

  saveBtn: {
    backgroundColor: '#2a9d8f', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginBottom: 12,
  },
  saveBtnDisabled: { backgroundColor: '#b2d8d3' },
  saveBtnText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  cancelBtn: {
    borderWidth: 2, borderColor: '#ccc', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  cancelBtnText: { color: '#888', fontSize: 16, fontWeight: '600' },
});
