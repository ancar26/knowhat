import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Speech from 'expo-speech';
import { GOALS, UserProfile, VoiceTone } from '../types/profile';

type Props = {
  profile: UserProfile;
  onChange: (patch: Partial<UserProfile>) => void;
  onFinish: () => void;
  onBack: () => void;
};

const VOICE_SAMPLES: Record<VoiceTone, string> = {
  friendly: "Hey! I just scanned your crisps. They look tasty but watch out — they're quite high in salt. Still, mostly natural ingredients!",
  professional: "Analysis complete. This product contains elevated sodium levels. Ingredients are predominantly natural with no artificial preservatives detected.",
};

function toggle(arr: string[], item: string): string[] {
  return arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];
}

export default function Onboarding3({ profile, onChange, onFinish, onBack }: Props) {
  const playSample = (tone: VoiceTone) => {
    Speech.stop();
    Speech.speak(VOICE_SAMPLES[tone], { language: 'en', rate: tone === 'friendly' ? 1.0 : 0.85 });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <Text style={styles.step}>Step 3 of 3</Text>
      <Text style={styles.title}>Goals & voice</Text>
      <Text style={styles.subtitle}>Almost done — just two more preferences</Text>

      <Text style={styles.label}>Health goals</Text>
      <Text style={styles.hint}>We'll highlight what matters to you when you scan</Text>
      <View style={styles.goalGrid}>
        {GOALS.map(goal => {
          const selected = profile.goals.includes(goal.id);
          return (
            <TouchableOpacity
              key={goal.id}
              style={[styles.goalCard, selected && styles.goalCardSelected]}
              onPress={() => onChange({ goals: toggle(profile.goals, goal.id) })}
            >
              <Text style={styles.goalIcon}>{goal.icon}</Text>
              <Text style={[styles.goalLabel, selected && styles.goalLabelSelected]}>
                {goal.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[styles.label, { marginTop: 8 }]}>Voice tone</Text>
      <Text style={styles.hint}>Tap a sample to hear the difference</Text>
      <View style={styles.toneRow}>
        {(['friendly', 'professional'] as VoiceTone[]).map(tone => (
          <View key={tone} style={styles.toneColumn}>
            <TouchableOpacity
              style={[styles.toneCard, profile.voiceTone === tone && styles.toneCardSelected]}
              onPress={() => onChange({ voiceTone: tone })}
            >
              <Text style={styles.toneIcon}>{tone === 'friendly' ? '😊' : '🎩'}</Text>
              <Text style={[styles.toneLabel, profile.voiceTone === tone && styles.toneLabelSelected]}>
                {tone.charAt(0).toUpperCase() + tone.slice(1)}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sampleBtn} onPress={() => playSample(tone)}>
              <Text style={styles.sampleBtnText}>▶ Hear sample</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={styles.navRow}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.finishBtn} onPress={onFinish}>
          <Text style={styles.finishBtnText}>Let's go 🚀</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  scroll: { padding: 28, paddingTop: 60, paddingBottom: 40 },
  step: { fontSize: 13, color: '#2a9d8f', fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 6 },
  subtitle: { fontSize: 15, color: '#666', marginBottom: 28 },
  label: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 4 },
  hint: { fontSize: 13, color: '#999', marginBottom: 12 },
  goalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  goalCard: {
    width: '30%', alignItems: 'center', paddingVertical: 14, borderRadius: 14,
    borderWidth: 1.5, borderColor: '#ddd', backgroundColor: 'white',
  },
  goalCardSelected: { borderColor: '#2a9d8f', backgroundColor: '#e8f5f3' },
  goalIcon: { fontSize: 22, marginBottom: 6 },
  goalLabel: { fontSize: 12, color: '#555', fontWeight: '500', textAlign: 'center' },
  goalLabelSelected: { color: '#2a9d8f', fontWeight: '700' },
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
  sampleBtn: { alignItems: 'center', paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', backgroundColor: 'white' },
  sampleBtnText: { fontSize: 13, color: '#2a9d8f', fontWeight: '600' },
  navRow: { flexDirection: 'row', gap: 12 },
  backBtn: { flex: 1, borderWidth: 2, borderColor: '#2a9d8f', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  backBtnText: { color: '#2a9d8f', fontWeight: '700', fontSize: 16 },
  finishBtn: { flex: 2, backgroundColor: '#2a9d8f', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  finishBtnText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
});
