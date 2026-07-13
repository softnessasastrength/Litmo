/**
 * Playful Vibe Profile quiz — light social weather, not a clinical instrument.
 * Results may start conversation; they never grant consent.
 */

export const archetypes = {
  hearth: {
    id: "hearth",
    eyebrow: "Your vibe is",
    name: "The Gentle Hearth",
    symbol: "✦",
    tagline: "Warm company, room to breathe.",
    description:
      "You may gravitate toward steady presence, familiar rituals, and connection that never needs to hurry.",
    howYouMightShowUp: [
      "You offer soft reliability without crowding people.",
      "Small rituals (tea, same chair) help you feel close.",
    ],
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
    howYouMightShowUp: [
      "You bring questions, stories, or a delightful detour.",
      "Playfulness is one way you feel close.",
    ],
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
    howYouMightShowUp: [
      "You notice details and let depth arrive without a performance.",
      "Quiet togetherness can feel as close as talk.",
    ],
    traits: ["observant", "unhurried", "sensory-soft"],
    color: "#3F6658",
    softColor: "#DDE9DF",
  },
} as const;

export type ArchetypeId = keyof typeof archetypes;
export type Scores = Record<ArchetypeId, number>;

/** Light preference themes—never clinical scales. */
export type QuizDimension =
  | "environment"
  | "regulation"
  | "conversation"
  | "sensory"
  | "comfort"
  | "pacing"
  | "initiation"
  | "play"
  | "closeness";

export const quizDimensionLabels: Record<QuizDimension, string> = {
  environment: "Place",
  regulation: "Rest",
  conversation: "Talk",
  sensory: "Senses",
  comfort: "Comfort",
  pacing: "Pace",
  initiation: "First step",
  play: "Play",
  closeness: "Nearness",
};

export type QuizAnswer = {
  id: string;
  label: string;
  detail: string;
  glyph: string;
  scores: Partial<Scores>;
  insight: string;
};

export type QuizQuestion = {
  id: string;
  dimension: QuizDimension;
  kicker: string;
  prompt: string;
  answers: QuizAnswer[];
};

/** Nine breezy scenes — more texture than the original six, still short. */
export const quizQuestions: QuizQuestion[] = [
  {
    id: "room",
    dimension: "environment",
    kicker: "Pick a place to land",
    prompt: "Which room quietly says “stay awhile”?",
    answers: [
      {
        id: "window",
        glyph: "◒",
        label: "The window nook",
        detail: "Rain tapping, blanket nearby",
        scores: { tidepool: 2, hearth: 1 },
        insight: "Edge-of-the-room calm helps you arrive.",
      },
      {
        id: "kitchen",
        glyph: "⌂",
        label: "The warm kitchen",
        detail: "Something simmering, easy chatter",
        scores: { hearth: 2, lantern: 1 },
        insight: "Shared ordinary care feels like home.",
      },
      {
        id: "attic",
        glyph: "✦",
        label: "The curious attic",
        detail: "Old records and odd treasures",
        scores: { lantern: 2, tidepool: 1 },
        insight: "A little discovery wakes up your spark.",
      },
    ],
  },
  {
    id: "rain",
    dimension: "regulation",
    kicker: "A free afternoon appears",
    prompt: "Plans cancelled. What sounds nicest?",
    answers: [
      {
        id: "nest",
        glyph: "☁",
        label: "Build a tiny nest",
        detail: "Tea, book, phone on silent",
        scores: { tidepool: 2, hearth: 1 },
        insight: "Soft solitude restores you.",
      },
      {
        id: "soup",
        glyph: "♨",
        label: "Make too much soup",
        detail: "Invite one favorite person",
        scores: { hearth: 2 },
        insight: "Care rituals help you settle.",
      },
      {
        id: "puddle",
        glyph: "☂",
        label: "Go find the puddles",
        detail: "The day just got interesting",
        scores: { lantern: 2 },
        insight: "A little movement can reset you.",
      },
    ],
  },
  {
    id: "movie",
    dimension: "conversation",
    kicker: "Movie night",
    prompt: "The opening credits roll. Where are you?",
    answers: [
      {
        id: "commentary",
        glyph: "“ ”",
        label: "Offering commentary",
        detail: "Tasteful, obviously",
        scores: { lantern: 2, hearth: 1 },
        insight: "Talk is part of how you share the night.",
      },
      {
        id: "snacks",
        glyph: "◇",
        label: "Managing the snacks",
        detail: "Everyone has what they need",
        scores: { hearth: 2 },
        insight: "You tend the room so others can relax.",
      },
      {
        id: "absorbed",
        glyph: "◎",
        label: "Already fully absorbed",
        detail: "We can discuss it afterward",
        scores: { tidepool: 2 },
        insight: "Deep focus is its own kind of company.",
      },
    ],
  },
  {
    id: "sound",
    dimension: "sensory",
    kicker: "Background sound",
    prompt: "Which sound lets your shoulders drop?",
    answers: [
      {
        id: "fire",
        glyph: "♨",
        label: "A sleepy fireplace",
        detail: "Soft crackle, warm edges",
        scores: { hearth: 2 },
        insight: "Warm, contained cues soothe you.",
      },
      {
        id: "waves",
        glyph: "≈",
        label: "Waves behind a wall",
        detail: "Rhythm without interruption",
        scores: { tidepool: 2 },
        insight: "Gentle rhythm helps you unclench.",
      },
      {
        id: "cafe",
        glyph: "♪",
        label: "A faraway café",
        detail: "Life humming just nearby",
        scores: { lantern: 2, hearth: 1 },
        insight: "Soft human buzz can feel companionable.",
      },
    ],
  },
  {
    id: "hard-day",
    dimension: "comfort",
    kicker: "After a hard day",
    prompt: "What kind of welcome sounds like relief?",
    answers: [
      {
        id: "quiet",
        glyph: "…",
        label: "Quiet company",
        detail: "No fixing, no performance",
        scores: { tidepool: 2, hearth: 1 },
        insight: "Presence without pressure lands best.",
      },
      {
        id: "ritual",
        glyph: "☕",
        label: "A familiar ritual",
        detail: "Same mug, same chair, exhale",
        scores: { hearth: 2 },
        insight: "Known rituals help you downshift.",
      },
      {
        id: "detour",
        glyph: "↝",
        label: "A delightful detour",
        detail: "Show me something surprising",
        scores: { lantern: 2 },
        insight: "A gentle redirect can lift the day.",
      },
    ],
  },
  {
    id: "pace",
    dimension: "pacing",
    kicker: "New friendship weather",
    prompt: "What pace feels lovely at the start?",
    answers: [
      {
        id: "slow",
        glyph: "◌",
        label: "Let it unfold slowly",
        detail: "Small moments add up",
        scores: { tidepool: 2 },
        insight: "Slow trust fits you.",
      },
      {
        id: "rhythm",
        glyph: "↟",
        label: "A gentle rhythm",
        detail: "A little consistency feels good",
        scores: { hearth: 2 },
        insight: "Steady cadence helps closeness stick.",
      },
      {
        id: "spark",
        glyph: "✺",
        label: "Follow the spark",
        detail: "Why wait to trade weird stories?",
        scores: { lantern: 2 },
        insight: "Momentum and curiosity energize you.",
      },
    ],
  },
  {
    id: "unexpected-visit",
    dimension: "initiation",
    kicker: "Someone you trust appears",
    prompt: "They stop by unannounced. What first?",
    answers: [
      {
        id: "kettle",
        glyph: "☕",
        label: "Kettle on, shoes off",
        detail: "Of course you’re staying a while",
        scores: { hearth: 2, lantern: 1 },
        insight: "Hospitality is often how you open.",
      },
      {
        id: "story-first",
        glyph: "✺",
        label: "Launch into what’s alive",
        detail: "Catch me up—I want the good parts",
        scores: { lantern: 2 },
        insight: "You lead with engagement and curiosity.",
      },
      {
        id: "honest-capacity",
        glyph: "…",
        label: "Name your capacity kindly",
        detail: "Happy you’re here—short visit works",
        scores: { tidepool: 2, hearth: 1 },
        insight: "Clear warmth keeps you present.",
      },
    ],
  },
  {
    id: "humor",
    dimension: "play",
    kicker: "Playfulness",
    prompt: "What kind of humor feels like home?",
    answers: [
      {
        id: "gentle-roast",
        glyph: "♪",
        label: "Gentle, knowing jokes",
        detail: "Inside references, soft edges",
        scores: { hearth: 2, lantern: 1 },
        insight: "Shared history makes humor land.",
      },
      {
        id: "absurd",
        glyph: "✺",
        label: "Delightful absurdity",
        detail: "Surprise is the punchline",
        scores: { lantern: 2 },
        insight: "Whimsy is a love language for you.",
      },
      {
        id: "quiet-smile",
        glyph: "…",
        label: "Quiet smiles and dry asides",
        detail: "Humor that doesn’t need a stage",
        scores: { tidepool: 2 },
        insight: "Subtle play can feel intimate.",
      },
    ],
  },
  {
    id: "couch",
    dimension: "closeness",
    kicker: "Side by side",
    prompt: "Couch time with someone you like. Nicest option?",
    answers: [
      {
        id: "shared-blanket",
        glyph: "⌂",
        label: "Shared blanket territory",
        detail: "Close, still optional",
        scores: { hearth: 2 },
        insight: "Easy nearness suits you.",
      },
      {
        id: "parallel-quiet",
        glyph: "≈",
        label: "Parallel quiet",
        detail: "Each with a book, same room",
        scores: { tidepool: 2 },
        insight: "Quiet company can be closeness.",
      },
      {
        id: "story-swap",
        glyph: "✺",
        label: "A meandering story swap",
        detail: "How did we get onto bees?",
        scores: { lantern: 2 },
        insight: "Conversation is how you settle in.",
      },
    ],
  },
];

export const QUIZ_QUESTION_COUNT = quizQuestions.length;
