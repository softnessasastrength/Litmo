/**
 * Local read-aloud helpers for Neurodivergent Mode.
 * Prefer system accessibility announcement; try expo-speech when present.
 * Never sends spoken content to Litmo servers.
 */

import { AccessibilityInfo, Platform } from "react-native";

let speechModule: {
  speak: (text: string, options?: Record<string, unknown>) => void;
  stop: () => void;
} | null = null;
let speechTried = false;

async function loadSpeech(): Promise<typeof speechModule> {
  if (speechTried) return speechModule;
  speechTried = true;
  try {
    // Optional dependency — Expo Go / bare may not have it installed.
    const mod = await import("expo-speech");
    speechModule = {
      speak: (text, options) => mod.speak(text, options),
      stop: () => mod.stop(),
    };
  } catch {
    speechModule = null;
  }
  return speechModule;
}

function sanitizeForSpeech(text: string): string {
  return text.replace(/\s+/g, " ").trim().slice(0, 800);
}

export const speechService = {
  async speak(text: string): Promise<"speech" | "announce" | "none"> {
    const clean = sanitizeForSpeech(text);
    if (!clean) return "none";

    const speech = await loadSpeech();
    if (speech) {
      try {
        speech.stop();
        speech.speak(clean, {
          language: "en-US",
          rate: Platform.OS === "ios" ? 0.92 : 0.9,
          pitch: 1.0,
        });
        return "speech";
      } catch {
        // fall through to announce
      }
    }

    try {
      AccessibilityInfo.announceForAccessibility(clean);
      return "announce";
    } catch {
      return "none";
    }
  },

  async stop(): Promise<void> {
    const speech = await loadSpeech();
    try {
      speech?.stop();
    } catch {
      // ignore
    }
  },
};
