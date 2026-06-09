import {
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { ALLERGIES, DIET_TYPES, UserProfile } from '../types/profile';

type Props = {
  profile: UserProfile;
  onChange: (patch: Partial<UserProfile>) => void;
  onNext: () => void;
  onBack: () => void;
};

function toggle(arr: string[], item: string): string[] {
  return arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];
}

export default function Onboarding2({ profile, onChange, onNext, onBack }: Props) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <Text style={styles.step}>Step 2 of 3</Text>
      <Text style={styles.title}>Diet & restrictions</Text>
      <Text style={styles.subtitle}>We'll flag anything that conflicts with your choices</Text>

      <Text style={styles.label}>Diet type</Text>
      <Text style={styles.hint}>Select all that apply</Text>
      <View style={styles.cardGrid}>
        {DIET_TYPES.map(diet => {
          const selected = profile.dietTypes.includes(diet.id);
          return (
            <TouchableOpacity
              key={diet.id}
              style={[styles.dietCard, selected && styles.dietCardSelected]}
              onPress={() => onChange({ dietTypes: toggle(profile.dietTypes, diet.id) })}
            >
              <Text style={styles.dietIcon}>{diet.icon}</Text>
              <Text style={[styles.dietLabel, selected && styles.dietLabelSelected]}>
                {diet.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[styles.label, { marginTop: 8 }]}>Allergies</Text>
      <View style={styles.checkGrid}>
        {ALLERGIES.map(allergy => {
          const selected = profile.allergies.includes(allergy);
          return (
            <TouchableOpacity
              key={allergy}
              style={[styles.checkItem, selected && styles.checkItemSelected]}
              onPress={() => onChange({ allergies: toggle(profile.allergies, allergy) })}
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
        style={styles.input}
        placeholder="e.g. allergic to peaches, avoid palm oil..."
        placeholderTextColor="#aaa"
        value={profile.customRestriction}
        onChangeText={customRestriction => onChange({ customRestriction })}
        multiline
        numberOfLines={2}
      />

      <View style={styles.navRow}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextBtn} onPress={onNext}>
          <Text style={styles.nextBtnText}>Next →</Text>
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
  cardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  dietCard: {
    width: '30%', alignItems: 'center', paddingVertical: 14, borderRadius: 14,
    borderWidth: 1.5, borderColor: '#ddd', backgroundColor: 'white',
  },
  dietCardSelected: { borderColor: '#2a9d8f', backgroundColor: '#e8f5f3' },
  dietIcon: { fontSize: 24, marginBottom: 6 },
  dietLabel: { fontSize: 13, color: '#555', fontWeight: '500', textAlign: 'center' },
  dietLabelSelected: { color: '#2a9d8f', fontWeight: '700' },
  checkGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  checkItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: '#ddd', backgroundColor: 'white' },
  checkItemSelected: { borderColor: '#2a9d8f', backgroundColor: '#e8f5f3' },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1.5, borderColor: '#ccc', alignItems: 'center', justifyContent: 'center' },
  checkboxSelected: { backgroundColor: '#2a9d8f', borderColor: '#2a9d8f' },
  checkmark: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  checkLabel: { fontSize: 14, color: '#555' },
  checkLabelSelected: { color: '#2a9d8f', fontWeight: '600' },
  input: {
    backgroundColor: 'white', borderRadius: 12, padding: 14,
    fontSize: 15, color: '#1a1a1a', marginBottom: 28,
    borderWidth: 1.5, borderColor: '#e0e0e0', minHeight: 60,
    textAlignVertical: 'top',
  },
  navRow: { flexDirection: 'row', gap: 12 },
  backBtn: { flex: 1, borderWidth: 2, borderColor: '#2a9d8f', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  backBtnText: { color: '#2a9d8f', fontWeight: '700', fontSize: 16 },
  nextBtn: { flex: 2, backgroundColor: '#2a9d8f', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  nextBtnText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
});
