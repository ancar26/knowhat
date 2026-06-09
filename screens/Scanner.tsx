import * as ImagePicker from 'expo-image-picker';
import * as Speech from 'expo-speech';
import { useState } from 'react';
import {
  ActivityIndicator, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { Analysis } from '../types/analysis';
import { LANGUAGES, UserProfile } from '../types/profile';
import { appendScan } from '../utils/history';
import { fetchOFFProduct, OFFProduct } from '../utils/openFoodFacts';
import { profileHash } from '../utils/profileHash';
import { analysisCache, offCache } from '../utils/scanCache';
import BarcodeScanner from './BarcodeScanner';

type AppState = 'home' | 'loading' | 'result' | 'error';

function parseAnalysis(text: string): Analysis {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error(`RAW RESPONSE: ${text}`);
  try { return JSON.parse(match[0]) as Analysis; } catch {}
  const cleaned = match[0].replace(/"((?:[^"\\]|\\.)*)"/g, (_full, inner: string) => {
    const safe = inner.replace(/\n/g, ' ').replace(/\r/g, '').replace(/\t/g, ' ');
    return `"${safe}"`;
  });
  try { return JSON.parse(cleaned) as Analysis; } catch {}
  throw new Error(`Could not parse response: ${text.slice(0, 300)}`);
}

function sharedInstructions(profile: UserProfile): string {
  const langLabel = LANGUAGES.find(l => l.code === profile.language)?.label ?? 'English';
  const restrictions = [
    ...profile.dietTypes,
    ...profile.allergies,
    profile.customRestriction,
  ].filter(Boolean).join(', ');
  const goals = profile.goals.join(', ');
  const tone = profile.voiceTone === 'friendly'
    ? 'Write in a warm, friendly, conversational tone — like a knowledgeable friend.'
    : 'Write in a clear, professional tone — factual and precise.';

  return `You are a food assistant helping ${profile.name || 'the user'} understand product labels.

${tone}
Always respond in ${langLabel}.

${restrictions ? `The user has the following dietary restrictions and allergies: ${restrictions}. Flag any conflicts clearly at the top of worthKnowing with a ⚠️.` : ''}
${goals ? `The user's health goals are: ${goals}. Mention briefly in summary if this product helps or conflicts with these goals.` : ''}

The app has two layers:
1. SIMPLE layer (headline, summary, worthKnowing) — shown immediately. Must be so simple a child understands. Zero technical terms. No explanations of ingredient names here.
2. DETAIL layer (ingredients, nutritionalNotes) — hidden behind a tap. Explain everything in depth here.

Return ONLY a valid JSON object, no markdown, no extra text:

{
  "headline": "One punchy sentence. What is this product, plain and simple. No weight, no packaging language, no country.",
  "summary": "2 sentences max. Describe the product naturally. No ingredient names, no technical terms.",
  "worthKnowing": ["Short bullets with emoji. Cover allergens, artificial sweeteners, very high sugar or fat, storage, anything truly surprising. One line each. No technical terms. Max 4 bullets."],
  "ingredients": ["One entry per ingredient. Format: name — plain English explanation of what it is and what it does. Explain every technical or chemical name simply."],
  "nutritionalNotes": "3 to 4 sentences. Cover calories, sugar, fat, protein in plain English. Put numbers in context. Say high, medium or low."
}`;
}

function buildImagePrompt(profile: UserProfile): string {
  return `${sharedInstructions(profile)}

Rules:
- Only describe what you can actually see. Never invent a product type.
- If the image is unclear, set headline to 'Could not read this label clearly' and say what to do.
- Return only the JSON object.`;
}

function buildTextPrompt(product: OFFProduct, profile: UserProfile): string {
  const { name, brand, ingredients, nutrients, allergens, nutriscore } = product;
  const nutriLines = [
    nutrients.calories != null && `Calories: ${nutrients.calories} kcal/100g`,
    nutrients.sugar != null && `Sugar: ${nutrients.sugar}g/100g`,
    nutrients.fat != null && `Fat: ${nutrients.fat}g/100g`,
    nutrients.saturatedFat != null && `Saturated fat: ${nutrients.saturatedFat}g/100g`,
    nutrients.protein != null && `Protein: ${nutrients.protein}g/100g`,
    nutrients.salt != null && `Salt: ${nutrients.salt}g/100g`,
    nutrients.fiber != null && `Fiber: ${nutrients.fiber}g/100g`,
  ].filter(Boolean).join('\n');

  return `${sharedInstructions(profile)}

Product data:
Name: ${name}${brand ? ` by ${brand}` : ''}
${nutriscore ? `Nutri-Score: ${nutriscore.toUpperCase()}` : ''}
Ingredients: ${ingredients || 'Not available'}
${allergens.length ? `Allergens: ${allergens.join(', ')}` : ''}
Nutrients per 100g:
${nutriLines || 'Not available'}

Rules:
- Only use the product data provided. Never invent information.
- Return only the JSON object.`;
}

async function callClaude(body: object): Promise<Analysis> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });
  const json = await response.json();
  if (json.error) throw new Error(`Claude error: ${json.error.message ?? JSON.stringify(json.error)}`);
  const text = json.content?.[0]?.text;
  if (!text) throw new Error(`Unexpected response: ${JSON.stringify(json)}`);
  return parseAnalysis(text);
}

async function analyzeFromImage(base64Image: string, profile: UserProfile): Promise<Analysis> {
  return callClaude({
    model: 'claude-sonnet-4-6',
    max_tokens: 900,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64Image } },
        { type: 'text', text: buildImagePrompt(profile) },
      ],
    }],
  });
}

// Text-only path uses Haiku — much cheaper since OFF already extracted the data
async function analyzeFromText(product: OFFProduct, profile: UserProfile): Promise<Analysis> {
  return callClaude({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 900,
    messages: [{ role: 'user', content: buildTextPrompt(product, profile) }],
  });
}

type Props = { profile: UserProfile; onOpenProfile: () => void; onOpenHistory: () => void };

export default function Scanner({ profile, onOpenProfile, onOpenHistory }: Props) {
  const [appState, setAppState] = useState<AppState>('home');
  const [statusMsg, setStatusMsg] = useState('');
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const [showIngredients, setShowIngredients] = useState(false);
  const [showNutrition, setShowNutrition] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [offNotFound, setOffNotFound] = useState(false);

  const speakResult = (result: Analysis) => {
    const toSpeak = `${result.headline}. ${result.summary}. ${result.worthKnowing.join('. ')}`;
    setSpeaking(true);
    Speech.speak(toSpeak, {
      language: profile.language,
      rate: profile.voiceTone === 'friendly' ? 1.0 : 0.85,
      onDone: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  };

  const showResult = (result: Analysis) => {
    setAnalysis(result);
    setShowIngredients(false);
    setShowNutrition(false);
    setAppState('result');
    speakResult(result);
  };

  const processBarcode = async (barcode: string) => {
    setShowBarcodeScanner(false);
    setAppState('loading');
    setOffNotFound(false);
    setStatusMsg('Looking up product...');
    try {
      // Fastest path: personalised analysis already cached for this barcode + profile
      const hash = profileHash(profile);
      const cached = await analysisCache.get(barcode, hash);
      if (cached) { showResult(cached); return; }

      // Second: raw OFF data (may be cached independently)
      let product = await offCache.get(barcode);
      if (!product) {
        setStatusMsg('Fetching product data...');
        product = await fetchOFFProduct(barcode);
        if (product) await offCache.set(barcode, product);
      }

      if (!product || !product.name) {
        setOffNotFound(true);
        setErrorMsg('This product isn\'t in the database yet. Try photographing the label instead.');
        setAppState('error');
        return;
      }

      setStatusMsg('Analysing ingredients...');
      const result = await analyzeFromText(product, profile);
      await analysisCache.set(barcode, hash, result);
      appendScan(result);
      showResult(result);
    } catch (e: any) {
      setErrorMsg(e.message ?? 'Something went wrong.');
      setAppState('error');
    }
  };

  const processImage = async (base64: string) => {
    setAppState('loading');
    setOffNotFound(false);
    setStatusMsg('Analysing label...');
    setShowIngredients(false);
    setShowNutrition(false);
    try {
      const result = await analyzeFromImage(base64, profile);
      appendScan(result);
      showResult(result);
    } catch (e: any) {
      setErrorMsg(e.message ?? 'Something went wrong.');
      setAppState('error');
    }
  };

  const handleCamera = async () => {
    const picked = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7, base64: true });
    if (picked.canceled || !picked.assets[0]?.base64) return;
    await processImage(picked.assets[0].base64);
  };

  const handleGallery = async () => {
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, base64: true });
    if (picked.canceled || !picked.assets[0]?.base64) return;
    await processImage(picked.assets[0].base64);
  };

  const reset = () => {
    Speech.stop();
    setSpeaking(false);
    setAnalysis(null);
    setOffNotFound(false);
    setAppState('home');
  };

  const replayVoice = () => {
    if (!analysis) return;
    speakResult(analysis);
  };

  return (
    <View style={styles.container}>

      {appState === 'home' && (
        <View style={styles.home}>
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.topBarBtn} onPress={onOpenHistory}>
              <Text style={styles.topBarBtnText}>🧾 History</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.topBarBtn} onPress={onOpenProfile}>
              <Text style={styles.topBarBtnText}>👤 Profile</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.greeting}>
            {profile.name ? `Hi, ${profile.name} 👋` : 'KnoWhat'}
          </Text>
          <Text style={styles.appTitle}>KnoWhat</Text>
          <Text style={styles.appSubtitle}>Scan a barcode or photograph a label for a plain-English explanation</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => setShowBarcodeScanner(true)}>
            <Text style={styles.primaryBtnText}>📷 Scan barcode</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={handleCamera}>
            <Text style={styles.secondaryBtnText}>📸 Photograph label</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tertiaryBtn} onPress={handleGallery}>
            <Text style={styles.tertiaryBtnText}>🖼 Choose from gallery</Text>
          </TouchableOpacity>
        </View>
      )}

      {appState === 'loading' && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2a9d8f" />
          <Text style={styles.statusMsg}>{statusMsg}</Text>
        </View>
      )}

      {appState === 'error' && (
        <View style={styles.center}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMsg}>{errorMsg}</Text>
          {offNotFound && (
            <TouchableOpacity style={[styles.primaryBtn, { marginTop: 16 }]} onPress={handleCamera}>
              <Text style={styles.primaryBtnText}>📸 Photograph the label</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.secondaryBtn, { marginTop: offNotFound ? 10 : 16 }]} onPress={reset}>
            <Text style={styles.secondaryBtnText}>Go back</Text>
          </TouchableOpacity>
        </View>
      )}

      {appState === 'result' && analysis && (
        <ScrollView contentContainerStyle={styles.resultContainer}>
          <View style={styles.resultTopBar}>
            <TouchableOpacity style={styles.topBarBtn} onPress={onOpenHistory}>
              <Text style={styles.topBarBtnText}>🧾 History</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.topBarBtn} onPress={onOpenProfile}>
              <Text style={styles.topBarBtnText}>👤 Profile</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.headline}>{analysis.headline}</Text>
          <View style={styles.card}>
            <Text style={styles.cardText}>{analysis.summary}</Text>
          </View>
          {analysis.worthKnowing.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Worth knowing</Text>
              {analysis.worthKnowing.map((item, i) => (
                <Text key={i} style={[styles.bullet, i < analysis.worthKnowing.length - 1 && styles.bulletSpaced]}>
                  {item}
                </Text>
              ))}
            </View>
          )}
          <TouchableOpacity
            style={[styles.primaryBtn, speaking && styles.stopBtn]}
            onPress={speaking ? () => { Speech.stop(); setSpeaking(false); } : replayVoice}
          >
            <Text style={styles.primaryBtnText}>{speaking ? '⏹ Stop reading' : '🔊 Read aloud'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.expandBtn} onPress={() => setShowIngredients(v => !v)}>
            <Text style={styles.expandBtnText}>{showIngredients ? '▲ Hide ingredients' : '▼ View ingredients'}</Text>
          </TouchableOpacity>
          {showIngredients && (
            <View style={styles.card}>
              {analysis.ingredients.map((item, i) => (
                <Text key={i} style={[styles.bullet, i < analysis.ingredients.length - 1 && styles.bulletSpaced]}>• {item}</Text>
              ))}
              <TouchableOpacity style={styles.inlineVoiceBtn} onPress={() => Speech.speak(analysis.ingredients.join('. '), { language: profile.language, rate: 0.85 })}>
                <Text style={styles.inlineVoiceBtnText}>🔊 Read ingredients aloud</Text>
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity style={styles.expandBtn} onPress={() => setShowNutrition(v => !v)}>
            <Text style={styles.expandBtnText}>{showNutrition ? '▲ Hide nutritional notes' : '▼ View nutritional notes'}</Text>
          </TouchableOpacity>
          {showNutrition && (
            <View style={styles.card}>
              <Text style={styles.cardText}>{analysis.nutritionalNotes}</Text>
              <TouchableOpacity style={styles.inlineVoiceBtn} onPress={() => Speech.speak(analysis.nutritionalNotes, { language: profile.language, rate: 0.85 })}>
                <Text style={styles.inlineVoiceBtnText}>🔊 Read nutrition aloud</Text>
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity style={styles.secondaryBtn} onPress={reset}>
            <Text style={styles.secondaryBtnText}>Scan another product</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {showBarcodeScanner && (
        <BarcodeScanner
          onScanned={processBarcode}
          onClose={() => setShowBarcodeScanner(false)}
        />
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  home: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 14 },
  greeting: { fontSize: 18, color: '#666', marginBottom: -4 },
  appTitle: { fontSize: 40, fontWeight: 'bold', color: '#2a9d8f', marginBottom: 8 },
  appSubtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 24, lineHeight: 24 },
  primaryBtn: { backgroundColor: '#2a9d8f', borderRadius: 14, paddingVertical: 16, width: '100%', alignItems: 'center' },
  primaryBtnText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  stopBtn: { backgroundColor: '#e76f51' },
  secondaryBtn: { borderWidth: 2, borderColor: '#2a9d8f', borderRadius: 14, paddingVertical: 16, width: '100%', alignItems: 'center' },
  secondaryBtnText: { color: '#2a9d8f', fontSize: 18, fontWeight: '600' },
  tertiaryBtn: { paddingVertical: 10, width: '100%', alignItems: 'center' },
  tertiaryBtnText: { color: '#999', fontSize: 15 },
  statusMsg: { marginTop: 20, fontSize: 16, color: '#555' },
  errorTitle: { fontSize: 20, fontWeight: 'bold', color: '#e63312', marginBottom: 12 },
  errorMsg: { fontSize: 14, color: '#555', textAlign: 'center', marginBottom: 8 },
  resultContainer: { padding: 24, paddingTop: 52, gap: 12 },
  headline: { fontSize: 22, fontWeight: 'bold', color: '#2a9d8f', marginBottom: 4, lineHeight: 30 },
  card: { backgroundColor: 'white', borderRadius: 14, padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  cardText: { fontSize: 15, lineHeight: 24, color: '#444' },
  bullet: { fontSize: 15, lineHeight: 24, color: '#444' },
  bulletSpaced: { marginBottom: 10 },
  expandBtn: { borderWidth: 1.5, borderColor: '#ccc', borderRadius: 12, paddingVertical: 12, alignItems: 'center', backgroundColor: 'white' },
  expandBtnText: { color: '#555', fontSize: 15, fontWeight: '600' },
  inlineVoiceBtn: { marginTop: 14, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 12, alignItems: 'center' },
  inlineVoiceBtnText: { color: '#2a9d8f', fontWeight: '600', fontSize: 15 },
  topBar: {
    position: 'absolute', top: 48, left: 24, right: 24,
    flexDirection: 'row', justifyContent: 'flex-end', gap: 10,
  },
  resultTopBar: {
    flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginBottom: 4,
  },
  topBarBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#2a9d8f', backgroundColor: 'white',
  },
  topBarBtnText: { color: '#2a9d8f', fontWeight: '600', fontSize: 14 },
});
