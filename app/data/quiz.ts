export const archetypes = {
  hearth: {
    id: "hearth",
    eyebrow: "Your vibe is",
    name: "The Gentle Hearth",
    symbol: "✦",
    tagline: "Warm company, room to breathe.",
    description:
      "You may gravitate toward steady presence, familiar rituals, and connection that never needs to hurry.",
    traits: ["softly social", "steady-paced", "comfort-led"],
    color: "#70536E",
    softColor: "#EEE2EC",
  },
  lantern: {
    id: "lantern",
    eyebrow: "Your vibe is",
    name: "The Wandering Lantern",
    symbol: "☼",
    tagline: "Curiosity with a cozy landing place.",
    description:
      "You may enjoy a little surprise, a little sparkle, and people who can wander into a good conversation with you.",
    traits: ["curious", "playful", "open-hearted"],
    color: "#B8833C",
    softColor: "#F9E4D4",
  },
  tidepool: {
    id: "tidepool",
    eyebrow: "Your vibe is",
    name: "The Quiet Tidepool",
    symbol: "≈",
    tagline: "A rich little world, revealed slowly.",
    description:
      "You may prefer spacious connection, sensory gentleness, and people who understand that quiet can be companionable.",
    traits: ["observant", "unhurried", "sensory-soft"],
    color: "#3F6658",
    softColor: "#DDE9DF",
  },
} as const;
export type ArchetypeId = keyof typeof archetypes;
export type Scores = Record<ArchetypeId, number>;
export type QuizAnswer = {
  id: string;
  label: string;
  detail: string;
  glyph: string;
  scores: Partial<Scores>;
};
export type QuizQuestion = {
  id: string;
  kicker: string;
  prompt: string;
  answers: QuizAnswer[];
};
export const quizQuestions: QuizQuestion[] = [
  {
    id: "room",
    kicker: "Pick a place to land",
    prompt: "Which room quietly says “stay awhile”?",
    answers: [
      {
        id: "window",
        glyph: "◒",
        label: "The window nook",
        detail: "Rain tapping, blanket nearby",
        scores: { tidepool: 2, hearth: 1 },
      },
      {
        id: "kitchen",
        glyph: "⌂",
        label: "The warm kitchen",
        detail: "Something simmering, easy chatter",
        scores: { hearth: 2, lantern: 1 },
      },
      {
        id: "attic",
        glyph: "✦",
        label: "The curious attic",
        detail: "Old records and odd treasures",
        scores: { lantern: 2, tidepool: 1 },
      },
    ],
  },
  {
    id: "rain",
    kicker: "A free afternoon appears",
    prompt: "The weather has cancelled every plan. What now?",
    answers: [
      {
        id: "nest",
        glyph: "☁",
        label: "Build a tiny nest",
        detail: "Tea, book, phone on silent",
        scores: { tidepool: 2, hearth: 1 },
      },
      {
        id: "soup",
        glyph: "♨",
        label: "Make too much soup",
        detail: "Invite one favorite person",
        scores: { hearth: 2 },
      },
      {
        id: "puddle",
        glyph: "☂",
        label: "Go find the puddles",
        detail: "The day just got interesting",
        scores: { lantern: 2 },
      },
    ],
  },
  {
    id: "movie",
    kicker: "Movie night etiquette",
    prompt: "The opening credits roll. Where are you?",
    answers: [
      {
        id: "commentary",
        glyph: "“ ”",
        label: "Offering commentary",
        detail: "Tasteful, obviously",
        scores: { lantern: 2, hearth: 1 },
      },
      {
        id: "snacks",
        glyph: "◇",
        label: "Managing the snacks",
        detail: "Everyone has what they need",
        scores: { hearth: 2 },
      },
      {
        id: "absorbed",
        glyph: "◎",
        label: "Already fully absorbed",
        detail: "We can discuss it afterward",
        scores: { tidepool: 2 },
      },
    ],
  },
  {
    id: "sound",
    kicker: "Choose a background sound",
    prompt: "Which sound makes your shoulders drop a little?",
    answers: [
      {
        id: "fire",
        glyph: "♨",
        label: "A sleepy fireplace",
        detail: "Soft crackle, warm edges",
        scores: { hearth: 2 },
      },
      {
        id: "waves",
        glyph: "≈",
        label: "Waves behind a wall",
        detail: "Rhythm without interruption",
        scores: { tidepool: 2 },
      },
      {
        id: "cafe",
        glyph: "♪",
        label: "A faraway café",
        detail: "Life humming just nearby",
        scores: { lantern: 2, hearth: 1 },
      },
    ],
  },
  {
    id: "hard-day",
    kicker: "After a difficult day",
    prompt: "What kind of welcome sounds most like relief?",
    answers: [
      {
        id: "quiet",
        glyph: "…",
        label: "Quiet company",
        detail: "No fixing, no performance",
        scores: { tidepool: 2, hearth: 1 },
      },
      {
        id: "ritual",
        glyph: "☕",
        label: "A familiar ritual",
        detail: "Same mug, same chair, exhale",
        scores: { hearth: 2 },
      },
      {
        id: "detour",
        glyph: "↝",
        label: "A delightful detour",
        detail: "Show me something surprising",
        scores: { lantern: 2 },
      },
    ],
  },
  {
    id: "pace",
    kicker: "Your social weather",
    prompt: "A new friendship is beginning. What pace feels lovely?",
    answers: [
      {
        id: "slow",
        glyph: "◌",
        label: "Let it unfold slowly",
        detail: "Small moments add up",
        scores: { tidepool: 2 },
      },
      {
        id: "rhythm",
        glyph: "↟",
        label: "Find a gentle rhythm",
        detail: "A little consistency feels good",
        scores: { hearth: 2 },
      },
      {
        id: "spark",
        glyph: "✺",
        label: "Follow the spark",
        detail: "Why wait to trade weird stories?",
        scores: { lantern: 2 },
      },
    ],
  },
];
