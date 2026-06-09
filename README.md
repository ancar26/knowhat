# KnoWhat

A mobile app that lets you point your phone at any food product label and get a plain-English explanation of what's in it — personalised to your diet, allergies, and health goals, read aloud in your language.

---

## What it does

Most people can't decode ingredient labels. E471, sodium benzoate, maltodextrin — these mean nothing without a chemistry degree. KnoWhat solves this by sending a photo of the label to Claude (Anthropic's vision AI) and getting back a structured, jargon-free breakdown instantly.

The result is split into two layers:

- **Simple layer** — shown immediately. A one-line headline, a 2-sentence summary, and a few "worth knowing" bullets covering anything surprising (high sugar, allergens, artificial sweeteners, etc.). Zero technical terms.
- **Detail layer** — hidden behind a tap. Every ingredient explained in plain English, plus a contextual nutritional summary.

Everything is read aloud automatically. You can stop, replay, or read just the ingredients or nutrition section separately.

---

## Main features

### Personalised scanning

Before you scan anything, you set up a profile:

- **Name and language** — explanations are returned in your chosen language (English, Romanian, Spanish, French, German, Italian, Portuguese, Polish, Dutch, Arabic)
- **Diet type** — Vegan, Vegetarian, Keto, Halal, Kosher, Gluten-free
- **Allergies** — Gluten, Dairy, Eggs, Nuts, Peanuts, Soy, Fish, Shellfish, Sesame, Sulphites
- **Custom restrictions** — free text for anything not covered (e.g. "avoid palm oil", "allergic to peaches")
- **Health goals** — Reduce sugar, Lose weight, Build muscle, Avoid additives, Heart health, Manage diabetes
- **Voice tone** — Friendly (warm, conversational) or Professional (factual, precise), with live audio samples so you can hear the difference before choosing

All of this is fed into the prompt sent to Claude. Allergen conflicts are flagged at the top with a ⚠️. Goal alignment or conflicts are mentioned in the summary.

### Camera or gallery

You can either take a live photo of a label or pick one from your gallery. Both paths go through the same analysis pipeline.

### Voice readout

Results are read aloud automatically using the device's built-in text-to-speech (expo-speech) in your chosen language. You can stop mid-read, replay the full summary, or trigger voice separately for the ingredients or nutritional notes sections.

### Scan history

Every successful scan is saved locally. The history screen shows all past scans newest-first, with the product headline and date. Tap any card to expand the full result — summary, worth knowing, ingredients, nutrition — all with voice readout available. Individual scans can be deleted, or you can clear all history at once. Useful for:

- Revisiting a product you scanned in the shop
- Comparing two similar products side by side
- Tracking what you've been buying over time

History is capped at 50 records and stored entirely on-device.

### Editable profile

Your profile is accessible at any time from both the home screen and the result screen. Changes apply to the next scan — no need to go through onboarding again. Unsaved changes are discarded if you cancel.

---

## How it was built

### Stack

- **React Native + Expo SDK 56** — cross-platform mobile, targeting Android (tested on Samsung Galaxy A53)
- **TypeScript** throughout
- **No navigation library** — screen state is managed with a simple `useState<Screen>` in `App.tsx`. With only a handful of screens this is cleaner than installing React Navigation.

### AI integration

Analysis is done by calling the **Anthropic Messages API** directly from the client using `fetch`. The image is passed as a base64-encoded JPEG in a vision message alongside a carefully structured prompt.

The prompt instructs Claude to:

- Respond only in the user's chosen language
- Return a strict JSON object (no markdown, no extra text)
- Separate output into a simple layer and a detail layer
- Flag allergen conflicts clearly with ⚠️
- Never invent product details — only describe what it can actually see

The response is parsed with a fallback JSON cleaner that handles stray newlines or tab characters inside string values before throwing.

The model used is `claude-sonnet-4-6` with `max_tokens: 900`.

The API key is stored in `.env` with the `EXPO_PUBLIC_` prefix, which is how Expo exposes environment variables to client-side code at bundle time.

### Data persistence

All data is stored locally using `@react-native-async-storage/async-storage`. There are two keys:

- `knowhat_profile` — the user's profile object
- `knowhat_history` — array of scan records, each containing the full analysis and an ISO timestamp

Nothing is sent to any server other than the Anthropic API call. No analytics, no accounts, no cloud sync.

### Project structure

```
knowhat/
├── App.tsx                  # Root component, screen state machine
├── index.ts                 # Expo entry point (registerRootComponent)
├── app.json                 # Expo config (OTA updates disabled)
├── .env                     # API keys (not committed)
│
├── types/
│   ├── profile.ts           # UserProfile type, LANGUAGES, DIET_TYPES, ALLERGIES, GOALS constants
│   ├── analysis.ts          # Analysis type (shared between Scanner and History)
│   └── history.ts           # ScanRecord type
│
├── utils/
│   ├── storage.ts           # saveProfile, loadProfile, clearProfile
│   └── history.ts           # appendScan, loadHistory, deleteRecord, clearHistory
│
├── screens/
│   ├── Onboarding1.tsx      # Name + language (step 1 of 3)
│   ├── Onboarding2.tsx      # Diet types + allergies + custom restriction (step 2 of 3)
│   ├── Onboarding3.tsx      # Health goals + voice tone (step 3 of 3)
│   ├── Scanner.tsx          # Main screen: camera/gallery → Claude API → result display
│   ├── Profile.tsx          # Editable profile (all 3 onboarding sections in one scroll)
│   └── History.tsx          # Past scans list with expandable full results
│
└── assets/                  # App icons and splash screen
```

### Key design decisions

**No barcode scanner** — the app reads ingredient labels visually, not barcodes. This means it works on any product globally without needing a product database, and it can handle handwritten labels, unusual formats, or products not in any database.

**Prompt engineering over post-processing** — the prompt is designed to return valid JSON directly, with a fallback cleaner for edge cases. This avoids a separate parsing step and keeps the response compact within the token budget.

**Two-layer result** — the simple layer (headline, summary, worth knowing) is shown immediately so the user gets value in under 2 seconds of reading. The detail layer (ingredients, nutrition) is behind a tap to avoid overwhelming people who just want a quick verdict.

**Local-only storage** — no user accounts, no server, no syncing. This keeps the app simple, keeps data private, and means it works offline for history viewing.

**No navigation library** — with six screens and linear flows, a `type Screen` union and a switch in `App.tsx` is easier to reason about and eliminates a significant dependency.

---

## Running locally

### Prerequisites

- Node.js 20+
- Expo Go installed on your Android or iOS device
- An Anthropic API key

### Setup

```bash
git clone <repo>
cd knowhat
npm install
```

Create a `.env` file in the project root:

```
EXPO_PUBLIC_ANTHROPIC_API_KEY=your_key_here
```

### Start

```bash
npx expo start --tunnel
```

Scan the QR code with Expo Go. Use `--tunnel` if your phone and computer are on different networks or if you hit connection issues.

### First run

On first launch the app shows a 3-step onboarding to collect your profile. After that it goes straight to the scanner on every subsequent launch.

To reset onboarding (e.g. to test it), clear the app's storage in Android Settings → Apps → KnoWhat → Storage → Clear Data, or call `clearProfile()` from `utils/storage.ts` during development.

---

## Dependencies

| Package                                     | Purpose                                                                |
| ------------------------------------------- | ---------------------------------------------------------------------- |
| `expo` ~56                                  | SDK, build tooling, dev server                                         |
| `expo-image-picker`                         | Camera and gallery access                                              |
| `expo-speech`                               | Text-to-speech voice readout                                           |
| `expo-localization`                         | Auto-detect device language on first launch                            |
| `expo-camera`                               | Installed (camera permissions), image capture handled via image-picker |
| `expo-file-system`                          | Installed as a peer dependency                                         |
| `@react-native-async-storage/async-storage` | Local persistence for profile and history                              |
| `react-native` 0.85                         | Core mobile framework                                                  |
| `typescript` ~6                             | Type safety                                                            |

---

## Notes on the API key

The Anthropic API key is embedded in the client bundle via `EXPO_PUBLIC_`. This is intentional for a development/personal-use app — Expo has no server-side runtime to proxy through. If you distribute this app publicly, you should proxy the Anthropic call through your own backend to keep the key secret.

## Ideas for future

1. Scan history (high value, natural next step)
   Save past scans locally (product name + date + headline). Let users tap to re-read without re-scanning. Useful for shopping habits and comparing similar products.

2. Traffic-light score / safety badge (high visual impact)
   A simple colored indicator (green/amber/red) derived from the AI response — "safe for your profile", "has warnings", "conflicts with your diet". Makes the result instantly scannable at a glance.

3. Product comparison (differentiator)
   "Compare with last scan" — side-by-side cards showing two products' scores and key differences. Very useful in a supermarket aisle.

4. Barcode scanning (reduces friction)
   Use expo-barcode-scanner or expo-camera barcode mode to scan a product barcode → look up nutritional data via Open Food Facts API → pass to Claude for personalized analysis. Avoids having to photograph the label at all.

5. Share / export result
   Share the analysis as text (for messaging a family member) or save as an image card.

6. "Ask a follow-up" chat (power feature)
   After a scan result, a small text input to ask Claude a follow-up: "is this safe for a 3-year-old?", "what's the additive E471?". Turns it from a one-shot tool into a food coach.

7. Favorites / "avoid list"
   Let users bookmark products as "buy again" or "avoid this". Persisted locally, shown in a dedicated tab.
