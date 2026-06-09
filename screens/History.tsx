import * as Speech from 'expo-speech';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { Analysis } from '../types/analysis';
import { ScanRecord } from '../types/history';
import { UserProfile } from '../types/profile';
import { clearHistory, deleteRecord, loadHistory } from '../utils/history';

type Props = {
  profile: UserProfile;
  onBack: () => void;
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) +
    '  ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function ResultDetail({ analysis, profile }: { analysis: Analysis; profile: UserProfile }) {
  const [speaking, setSpeaking] = useState(false);
  const [showIngredients, setShowIngredients] = useState(false);
  const [showNutrition, setShowNutrition] = useState(false);

  const speak = (text: string) => {
    setSpeaking(true);
    Speech.speak(text, {
      language: profile.language,
      rate: profile.voiceTone === 'friendly' ? 1.0 : 0.85,
      onDone: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  };

  const stopSpeech = () => { Speech.stop(); setSpeaking(false); };

  const summary = `${analysis.headline}. ${analysis.summary}. ${analysis.worthKnowing.join('. ')}`;

  return (
    <View style={detail.container}>
      <Text style={detail.summary}>{analysis.summary}</Text>

      {analysis.worthKnowing.length > 0 && (
        <View style={detail.section}>
          <Text style={detail.sectionTitle}>Worth knowing</Text>
          {analysis.worthKnowing.map((item, i) => (
            <Text key={i} style={detail.bullet}>{item}</Text>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={[detail.voiceBtn, speaking && detail.voiceBtnStop]}
        onPress={speaking ? stopSpeech : () => speak(summary)}
      >
        <Text style={detail.voiceBtnText}>{speaking ? '⏹ Stop' : '🔊 Read aloud'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={detail.expandBtn} onPress={() => setShowIngredients(v => !v)}>
        <Text style={detail.expandBtnText}>{showIngredients ? '▲ Hide ingredients' : '▼ View ingredients'}</Text>
      </TouchableOpacity>
      {showIngredients && (
        <View style={detail.section}>
          {analysis.ingredients.map((item, i) => (
            <Text key={i} style={detail.bullet}>• {item}</Text>
          ))}
          <TouchableOpacity style={detail.inlineVoice} onPress={() => speak(analysis.ingredients.join('. '))}>
            <Text style={detail.inlineVoiceText}>🔊 Read ingredients aloud</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={detail.expandBtn} onPress={() => setShowNutrition(v => !v)}>
        <Text style={detail.expandBtnText}>{showNutrition ? '▲ Hide nutritional notes' : '▼ View nutritional notes'}</Text>
      </TouchableOpacity>
      {showNutrition && (
        <View style={detail.section}>
          <Text style={detail.bodyText}>{analysis.nutritionalNotes}</Text>
          <TouchableOpacity style={detail.inlineVoice} onPress={() => speak(analysis.nutritionalNotes)}>
            <Text style={detail.inlineVoiceText}>🔊 Read nutrition aloud</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function History({ profile, onBack }: Props) {
  const [records, setRecords] = useState<ScanRecord[] | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadHistory().then(setRecords);
  }, []);

  const handleDelete = (id: string) => {
    Alert.alert('Remove scan', 'Remove this scan from your history?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          await deleteRecord(id);
          setRecords(prev => prev ? prev.filter(r => r.id !== id) : []);
          if (expandedId === id) setExpandedId(null);
        },
      },
    ]);
  };

  const handleClearAll = () => {
    Alert.alert('Clear all history', 'This will delete all saved scans. Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear all', style: 'destructive',
        onPress: async () => { await clearHistory(); setRecords([]); setExpandedId(null); },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Scan history</Text>
        {records && records.length > 0 && (
          <TouchableOpacity onPress={handleClearAll}>
            <Text style={styles.clearText}>Clear all</Text>
          </TouchableOpacity>
        )}
        {(!records || records.length === 0) && <View style={{ width: 60 }} />}
      </View>

      {records === null && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2a9d8f" />
        </View>
      )}

      {records !== null && records.length === 0 && (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>🧾</Text>
          <Text style={styles.emptyTitle}>No scans yet</Text>
          <Text style={styles.emptySubtitle}>Your scanned products will appear here</Text>
        </View>
      )}

      {records !== null && records.length > 0 && (
        <ScrollView contentContainerStyle={styles.list}>
          {records.map(record => {
            const isExpanded = expandedId === record.id;
            return (
              <View key={record.id} style={styles.card}>
                <TouchableOpacity
                  style={styles.cardHeader}
                  onPress={() => setExpandedId(isExpanded ? null : record.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardMeta}>
                    <Text style={styles.cardHeadline} numberOfLines={isExpanded ? undefined : 2}>
                      {record.analysis.headline}
                    </Text>
                    <Text style={styles.cardDate}>{formatDate(record.date)}</Text>
                  </View>
                  <View style={styles.cardActions}>
                    <Text style={styles.chevron}>{isExpanded ? '▲' : '▼'}</Text>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDelete(record.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.deleteBtnText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>

                {isExpanded && (
                  <ResultDetail analysis={record.analysis} profile={profile} />
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 52, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: 'white',
  },
  backText: { color: '#2a9d8f', fontWeight: '600', fontSize: 15, width: 60 },
  title: { fontSize: 17, fontWeight: 'bold', color: '#1a1a1a' },
  clearText: { color: '#e76f51', fontWeight: '600', fontSize: 14, width: 60, textAlign: 'right' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: '#888', textAlign: 'center' },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: 'white', borderRadius: 14,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'flex-start',
    padding: 16, gap: 12,
  },
  cardMeta: { flex: 1 },
  cardHeadline: { fontSize: 15, fontWeight: '600', color: '#1a1a1a', lineHeight: 22, marginBottom: 4 },
  cardDate: { fontSize: 12, color: '#999' },
  cardActions: { alignItems: 'center', gap: 10 },
  chevron: { fontSize: 12, color: '#aaa' },
  deleteBtn: { padding: 2 },
  deleteBtnText: { fontSize: 14, color: '#ccc', fontWeight: '600' },
});

const detail = StyleSheet.create({
  container: {
    borderTopWidth: 1, borderTopColor: '#f0f0f0',
    padding: 16, gap: 12,
  },
  summary: { fontSize: 14, lineHeight: 22, color: '#555' },
  section: {
    backgroundColor: '#f8f9fa', borderRadius: 10,
    padding: 12, gap: 6,
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#333', marginBottom: 4 },
  bullet: { fontSize: 14, lineHeight: 22, color: '#444' },
  bodyText: { fontSize: 14, lineHeight: 22, color: '#444' },
  voiceBtn: {
    backgroundColor: '#2a9d8f', borderRadius: 10,
    paddingVertical: 10, alignItems: 'center',
  },
  voiceBtnStop: { backgroundColor: '#e76f51' },
  voiceBtnText: { color: 'white', fontWeight: '600', fontSize: 14 },
  expandBtn: {
    borderWidth: 1.5, borderColor: '#eee', borderRadius: 10,
    paddingVertical: 10, alignItems: 'center', backgroundColor: '#fafafa',
  },
  expandBtnText: { color: '#555', fontSize: 13, fontWeight: '600' },
  inlineVoice: {
    marginTop: 8, borderTopWidth: 1, borderTopColor: '#eee',
    paddingTop: 10, alignItems: 'center',
  },
  inlineVoiceText: { color: '#2a9d8f', fontWeight: '600', fontSize: 13 },
});
