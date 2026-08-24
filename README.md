# Piko - Voice Command Shopping Assistant

Piko is a mobile-first, local-first shopping assistant for English, Hindi, and Hinglish commands. It combines real browser speech recognition with the same deterministic parser used by its text fallback. No audio is recorded and no backend is required.

**Live app:** [https://rhythm-gandhi.github.io/unthinkable-VOICE-COMMAND/](https://rhythm-gandhi.github.io/unthinkable-VOICE-COMMAND/)

## Features

- Real Web Speech API input with permission, listening, processing, timeout, error, unsupported, and manual-stop states
- English (`en-IN`), Hindi (`hi-IN`), and mixed Hinglish vocabulary
- Shared deterministic parser for natural add, partial/whole removal, set quantity, quantity/list/total queries, search, recommendations, price filters, and substitutes
- Low-confidence confirmation with Confirm, Edit, Retry, and Cancel
- Categorized shopping list, compatible duplicate merging, inline editing, purchase completion, totals, and undo
- Local catalog search by product, category, tags, size, price, and stock
- Purchase history and explainable history/seasonal/sale suggestions
- Responsive 320px layout, keyboard focus, semantic controls, reduced motion, and live feedback
- Versioned `localStorage` recovery and an error boundary
- Multi-product commands, canonical `kg`/`g`/`l`/packet measurements, multilingual product IDs and aliases, short-lived follow-up context, and recommendation routing that never mutates the cart
- Integer-paise cart pricing with item subtotals, estimated savings, stable totals, and category fallback estimates
- Auto detect plus manual locales for English, Hindi/Hinglish, Bengali, Marathi, Gujarati, Punjabi, Tamil, Telugu, Kannada, Malayalam, and Urdu grocery vocabulary
- Data-driven native digits, number words, fractions, currency ranges, canonical flour/coriander taxonomy, and brand/size catalog variants
- Compact local WebP product-photo sprite with descriptive lazy-loaded images and an accessible failure fallback
- Native share/clipboard, PNG list export, print/PDF output, and persisted light/dark themes

Catalog prices, sale flags, stock, and seasonal metadata are bundled sample data, not live retailer information. Suggestions are rule-based; speech recognition is browser-powered.

## Technology and architecture

React, strict TypeScript, and Vite keep the static deployment small. `src/domain.ts` owns parsing, normalization, catalog queries, list merging, persistence, and suggestion rules. `src/voice.ts` wraps the native Web Speech API. `src/data.ts` contains the local Indian-grocery catalog. `src/App.tsx` connects those modules to accessible UI and browser storage. Vitest checks business logic.

The parser retains the original transcript while normalizing punctuation, speech variants such as `1K ATA`, multilingual grocery aliases, number words, plurals, units, filler phrases, brands, sizes, attributes, and price constraints into a validated structured command. Uncertain or materially ambiguous mutations are never silently executed.

## Local setup

```bash
npm install
npm run dev
```

Open the printed local URL. Microphone access requires `localhost` or HTTPS.

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

## Supported commands

- `Add milk`
- `Add 2 bottles of water`
- `Doodh add karo`
- `Do packet doodh chahiye`
- `Meri list mein 5 ande add karo`
- `Remove milk`
- `Remove two packets of milk`
- `Milk ke do packet kam kar do`
- `I only need three milk packets`
- `How much milk do I have?`
- `दूध कितना है?`
- `Tell me my entire list`
- `मेरी पूरी सूची बताओ`
- `Chini ki quantity teen kar do`
- `Change water to 4 bottles`
- `Find toothpaste under ₹200`
- `100 rupaye ke andar toothpaste dikhao`
- `Show Colgate toothpaste`
- `Suggest an alternative to regular milk`
- `Choose the second one`
- `Buy five pieces of oranges`
- `What is the cost of toothbrush?`
- `₹50 se ₹100 ke beech toothpaste dikhao`
- `Find me dhaniya`

## Deployment

Pushes to `main` run the official GitHub Pages workflow in `.github/workflows/deploy-pages.yml`. It verifies tests, lint, types, and the production build, then uploads the ignored `dist/` output as a Pages artifact. Vite uses the repository base path and no client-side router. HTTPS supports microphone access; no secret or environment variable is needed.

## Browser compatibility and privacy

Chromium-based browsers offer the best Speech Recognition support. Safari/Firefox support varies; the complete text-command path remains available. The Web Speech API cannot reliably identify an unknown spoken language before transcription: **Auto detect** starts recognition with the browser/device locale, then performs transcript-level language detection and multilingual normalization. For better recognition, select the intended language locale explicitly. Recognition may use the browser vendor’s speech service. Piko does not store audio. Lists, history, preferences, and a short recent transcript log remain only in this browser’s `localStorage` until cleared.

## Known limitations

- The catalog is deliberately small and offline; price and availability are illustrative.
- The project has no configured AI service, so validated deterministic parsing and catalog ranking are the offline path; arbitrary phrasing outside the data-driven vocabulary may require confirmation or editing.
- Browser speech recognition language quality and service availability vary by platform.
- Repeat-purchase suggestions use a simple seven-day threshold after two purchases.

## Project structure

```text
src/
  App.tsx          UI, actions, and state coordination
  data.ts          Sample product catalog and categorization
  domain.ts        Parser, search, list, suggestions, persistence
  voice.ts         Web Speech API wrapper
  types.ts         Domain types
  domain.test.ts   Business-logic tests
  styles.css       Responsive accessible presentation
```

## Submission approach (under 200 words)

I built Piko as a static, local-first React application so the assessment’s core workflows remain usable without accounts, API keys, or a backend. Voice and typed commands share one deterministic TypeScript parser, preventing behavior drift and making multilingual intent handling directly testable. The parser preserves the original transcript, normalizes only internally, supports English/Hindi/Hinglish aliases and number words, and routes low-confidence input through an explicit confirmation step.

Shopping list, history, dismissed suggestions, and preferences use versioned localStorage with corrupt-data fallback. Version 2 migrates any legacy Pantry products into the shopping list once, merging compatible duplicates without discarding quantities or price data. A bundled Indian grocery catalog powers product, brand, size, attribute, price, stock, sale, seasonality, and substitute behavior; the interface clearly labels those values as sample data. Suggestions are explainable rules based on repeat history, seasonal metadata, or explicit sale flags—never random or presented as AI.

The UI is mobile-first and keyboard-accessible, with responsive navigation, large controls, visible focus, live status messaging, and reduced-motion support. Native Web Speech and Speech Synthesis APIs keep dependencies minimal, while the text path ensures the app still works when microphone permission or browser support is unavailable.
