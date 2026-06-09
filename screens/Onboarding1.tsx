import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import * as Localization from 'expo-localization';
import { LANGUAGES, UserProfile } from '../types/profile';

type Props = {
  profile: UserProfile;
  onChange: (patch: Partial<UserProfile>) => void;
  onNext: () => void;
};

export default function Onboarding1({ profile, onChange, onNext }: Props) {
  useEffect(() => {
    // auto-detect device language on first render if not set
    const deviceLang = Localization.getLocales()[0]?.languageCode ?? 'en';
    const match = LANGUAGES.find(l => l.code === deviceLang);
    if (match && !profile.name) onChange({ language: match.code });
  }, []);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.step}>Step 1 of 3</Text>
        <Text style={styles.title}>Let's get to know you</Text>
        <Text style={styles.subtitle}>This helps us personalise your experience</Text>

        <Text style={styles.label}>Your name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Maria"
          placeholderTextColor="#aaa"
          value={profile.name}
          onChangeText={name => onChange({ name })}
          autoCapitalize="words"
          returnKeyType="done"
        />

        <Text style={styles.label}>Language</Text>
        <Text style={styles.hint}>Explanations will be shown in this language</Text>
        <View style={styles.langGrid}>
          {LANGUAGES.map(lang => (
            <TouchableOpacity
              key={lang.code}
              style={[styles.langCard, profile.language === lang.code && styles.langCardSelected]}
              onPress={() => onChange({ language: lang.code })}
            >
              <Text style={[styles.langText, profile.language === lang.code && styles.langTextSelected]}>
                {lang.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.nextBtn, !profile.name.trim() && styles.nextBtnDisabled]}
          onPress={onNext}
          disabled={!profile.name.trim()}
        >
          <Text style={styles.nextBtnText}>Next →</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  scroll: { padding: 28, paddingTop: 60 },
  step: { fontSize: 13, color: '#2a9d8f', fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 6 },
  subtitle: { fontSize: 15, color: '#666', marginBottom: 32 },
  label: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 4 },
  hint: { fontSize: 13, color: '#999', marginBottom: 10 },
  input: {
    backgroundColor: 'white', borderRadius: 12, padding: 14,
    fontSize: 16, color: '#1a1a1a', marginBottom: 28,
    borderWidth: 1.5, borderColor: '#e0e0e0',
  },
  langGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 36 },
  langCard: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#ddd', backgroundColor: 'white',
  },
  langCardSelected: { borderColor: '#2a9d8f', backgroundColor: '#e8f5f3' },
  langText: { fontSize: 14, color: '#555' },
  langTextSelected: { color: '#2a9d8f', fontWeight: '700' },
  nextBtn: { backgroundColor: '#2a9d8f', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  nextBtnDisabled: { backgroundColor: '#b2d8d3' },
  nextBtnText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
});
