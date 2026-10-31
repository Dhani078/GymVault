# GymVault Voice Workout Logger Specification

Author: Dhani078  
Version: 2.5.0  
Status: Production Certified  
Last Updated: 2026-10-31  

---

## 1. Executive Summary

Lifting heavy barbells and dumbbells requires chalked hands and physical grip stability. Touching mobile screens or typing on keyboards between exhaustive sets disrupts focus and wastes valuable rest intervals.

The GymVault Voice Workout Logger allows athletes to speak commands hands-free to record load, update reps, mark sets completed, and trigger automated rest timers.

---

## 2. Audio Capture Architecture

### Web Platform (Desktop & Mobile Browser)
- Engine: Web Speech Recognition API (SpeechRecognition / webkitSpeechRecognition)
- Language Locale: id-ID (Indonesian primary) with fallback support for universal metric notation.
- Mode: Continuous = false, Interim Results = true, Max Alternatives = 1.
- Microphone Permissions: Handled gracefully via navigator.mediaDevices.getUserMedia with fallback warning logging.

### Mobile Platform (Expo / React Native)
- Speech Engine: expo-speech for synthetic bilingual audio feedback cues.
- Audio Focus: expo-av audio session configured to duck background gym music during voice feedback prompts.

---

## 3. Natural Language Grammar & Intent Extraction

The parser function parseVoiceWorkoutCommand in utils/fitnessMath.js extracts target metrics using regular expression patterns:

### Supported Grammars

1. Indonesian Conversational Syntax
- Phrase: "Coach, catat 80 kilo 8 repetisi"
- Regex Pattern: /(?:catat|beban|tambah)?\s*(\d+(?:\.\d+)?)\s*(?:kg|kilo|kilogram)\s*(?:sebanyak|repetisi|rep)?\s*(\d+)\s*(?:rep|repetisi|kali)?/i
- Extraction: Weight = 80kg, Reps = 8

2. Terse Shorthand Metric Notation
- Phrase: "75kg 10 rep"
- Regex Pattern: /(\d+(?:\.\d+)?)\s*(?:kg|kilo)\s*(\d+)\s*(?:rep|repetisi)?/i
- Extraction: Weight = 75kg, Reps = 10

3. Inverted Order Syntax
- Phrase: "beban 25 kilo repetisi 12"
- Extraction: Weight = 25kg, Reps = 12

### Validation & Bounds Enforcement
- Valid Weight Range: 0.5kg to 500kg. Values outside this range are rejected to prevent acoustic noise corruption.
- Valid Rep Range: 1 to 100 reps.
- Rejection Output: { success: false, rawText: input }

---

## 4. Voice Guide Audio Feedback Loop

When a voice command is successfully parsed:
1. Active set row in LoggerScreen updates immediately.
2. Set is marked completed.
3. Optimal rest countdown timer is launched based on exercise type and RPE.
4. Voice coach confirms aloud via TTS:
   - ID: "Set selesai! Beban 80 kilogram, 8 repetisi. Istirahat 2 menit dimulai."
   - EN: "Set complete! 80 kilograms for 8 reps. 2 minute rest started."
5. When rest timer reaches zero, a loud bell chime sounds and TTS speaks:
   - "Waktu istirahat selesai! Siap untuk set berikutnya."
