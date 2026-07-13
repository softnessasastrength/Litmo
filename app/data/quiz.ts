/**
 * Playful Vibe Profile quiz content.
 *
 * This is a conversational personality / social-weather quiz, not a clinical
 * instrument, attachment diagnosis, safety rating, or consent system.
 * Results may start conversation; they never grant permission to touch.
 */

export const archetypes = {
  hearth: {
    id: "hearth",
    eyebrow: "Your vibe is",
    name: "The Gentle Hearth",
    symbol: "✦",
    tagline: "Warm company, room to breathe.",
    description:
      "You may gravitate toward steady presence, familiar rituals, and connection that never needs to hurry. People often feel held by your reliability without feeling crowded.",
    howYouMightShowUp: [
      "You notice when someone needs a softer landing after a hard day.",
      "Consistency feels caring to you: same chair, same mug, same kindness.",
      "You may prefer a few trusted people over a wide, sparkling social field.",
    ],
    traits: ["softly social", "steady-paced", "comfort-led", "ritual-friendly"],
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
      "You may enjoy a little surprise, a little sparkle, and people who can wander into a good conversation with you. Playfulness is part of how you feel close.",
    howYouMightShowUp: [
      "You often bring energy, questions, or a delightful detour.",
      "Newness can feel like oxygen—so long as there is somewhere soft to land.",
      "You may warm up by sharing stories, jokes, or unexpected observations.",
    ],
    traits: ["curious", "playful", "open-hearted", "story-led"],
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
      "You may prefer spacious connection, sensory gentleness, and people who understand that quiet can be companionable. Depth arrives without performance.",
    howYouMightShowUp: [
      "You often listen longer before speaking—and notice details others miss.",
      "Overstimulation may ask you to step aside for a minute, not forever.",
      "Closeness can grow through parallel calm as much as through chatter.",
    ],
    traits: ["observant", "unhurried", "sensory-soft", "depth-seeking"],
    color: "#3F6658",
    softColor: "#DDE9DF",
  },
} as const;

export type ArchetypeId = keyof typeof archetypes;
export type Scores = Record<ArchetypeId, number>;

/** Conversational preference areas—never clinical scales. */
export type QuizDimension =
  | "environment"
  | "regulation"
  | "comfort"
  | "conversation"
  | "sensory"
  | "pacing"
  | "initiation"
  | "closeness"
  | "play"
  | "repair";

export const quizDimensionLabels: Record<QuizDimension, string> = {
  environment: "Places that feel like home",
  regulation: "How you settle after intensity",
  comfort: "What comfort looks like",
  conversation: "How talk and silence mix",
  sensory: "Sensory weather you prefer",
  pacing: "Tempo of new connection",
  initiation: "Who moves first",
  closeness: "How closeness grows",
  play: "Humor and lightness",
  repair: "After a small mismatch",
};

export type QuizAnswer = {
  id: string;
  label: string;
  detail: string;
  glyph: string;
  scores: Partial<Scores>;
  /** Short preference note shown when this answer is chosen. */
  insight: string;
};

export type QuizQuestion = {
  id: string;
  dimension: QuizDimension;
  kicker: string;
  prompt: string;
  answers: QuizAnswer[];
};

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
        insight: "Shared ordinary care feels like belonging.",
      },
      {
        id: "attic",
        glyph: "✦",
        label: "The curious attic",
        detail: "Old records and odd treasures",
        scores: { lantern: 2, tidepool: 1 },
        insight: "Discovery spaces wake up your social spark.",
      },
      {
        id: "porch",
        glyph: "○",
        label: "The half-open porch",
        detail: "Outside air, inside option",
        scores: { tidepool: 1, lantern: 1, hearth: 1 },
        insight: "You like thresholds—connected, not trapped.",
      },
    ],
  },
  {
    id: "rain",
    dimension: "regulation",
    kicker: "A free afternoon appears",
    prompt: "The weather has cancelled every plan. What now?",
    answers: [
      {
        id: "nest",
        glyph: "☁",
        label: "Build a tiny nest",
        detail: "Tea, book, phone on silent",
        scores: { tidepool: 2, hearth: 1 },
        insight: "Solitude with soft texture restores you.",
      },
      {
        id: "soup",
        glyph: "♨",
        label: "Make too much soup",
        detail: "Invite one favorite person",
        scores: { hearth: 2 },
        insight: "Caretaking rituals help your system settle.",
      },
      {
        id: "puddle",
        glyph: "☂",
        label: "Go find the puddles",
        detail: "The day just got interesting",
        scores: { lantern: 2 },
        insight: "Movement and novelty can be regulation for you.",
      },
      {
        id: "window-watch",
        glyph: "◎",
        label: "Watch the storm do its job",
        detail: "No agenda, just weather",
        scores: { tidepool: 2 },
        insight: "Non-doing can be your most honest rest.",
      },
    ],
  },
  {
    id: "movie",
    dimension: "conversation",
    kicker: "Movie night etiquette",
    prompt: "The opening credits roll. Where are you?",
    answers: [
      {
        id: "commentary",
        glyph: "“ ”",
        label: "Offering commentary",
        detail: "Tasteful, obviously",
        scores: { lantern: 2, hearth: 1 },
        insight: "Talk is part of how you share the experience.",
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
        insight: "Deep focus is how you show respect for the moment.",
      },
      {
        id: "check-in",
        glyph: "?",
        label: "Quietly checking everyone’s comfort",
        detail: "Lights, volume, blanket situation",
        scores: { hearth: 2, tidepool: 1 },
        insight: "You track the group climate as carefully as the plot.",
      },
    ],
  },
  {
    id: "sound",
    dimension: "sensory",
    kicker: "Choose a background sound",
    prompt: "Which sound makes your shoulders drop a little?",
    answers: [
      {
        id: "fire",
        glyph: "♨",
        label: "A sleepy fireplace",
        detail: "Soft crackle, warm edges",
        scores: { hearth: 2 },
        insight: "Warm, contained sensory cues soothe you.",
      },
      {
        id: "waves",
        glyph: "≈",
        label: "Waves behind a wall",
        detail: "Rhythm without interruption",
        scores: { tidepool: 2 },
        insight: "Predictable rhythm helps your nervous system unclench.",
      },
      {
        id: "cafe",
        glyph: "♪",
        label: "A faraway café",
        detail: "Life humming just nearby",
        scores: { lantern: 2, hearth: 1 },
        insight: "Gentle human buzz can feel companionable, not loud.",
      },
      {
        id: "rain-roof",
        glyph: "☂",
        label: "Rain on a good roof",
        detail: "Outside drama, inside dry",
        scores: { tidepool: 1, hearth: 1 },
        insight: "Safety plus weather theater is your sweet spot.",
      },
    ],
  },
  {
    id: "hard-day",
    dimension: "comfort",
    kicker: "After a difficult day",
    prompt: "What kind of welcome sounds most like relief?",
    answers: [
      {
        id: "quiet",
        glyph: "…",
        label: "Quiet company",
        detail: "No fixing, no performance",
        scores: { tidepool: 2, hearth: 1 },
        insight: "Presence without pressure is medicine for you.",
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
        insight: "A gentle redirect can lift the whole day.",
      },
      {
        id: "alone-first",
        glyph: "◌",
        label: "Twenty quiet minutes alone first",
        detail: "Then I can rejoin the world",
        scores: { tidepool: 2 },
        insight: "You often regulate best before you reconnect.",
      },
    ],
  },
  {
    id: "pace",
    dimension: "pacing",
    kicker: "Your social weather",
    prompt: "A new friendship is beginning. What pace feels lovely?",
    answers: [
      {
        id: "slow",
        glyph: "◌",
        label: "Let it unfold slowly",
        detail: "Small moments add up",
        scores: { tidepool: 2 },
        insight: "Slow accumulation of trust fits you.",
      },
      {
        id: "rhythm",
        glyph: "↟",
        label: "Find a gentle rhythm",
        detail: "A little consistency feels good",
        scores: { hearth: 2 },
        insight: "Reliable cadence helps closeness stick.",
      },
      {
        id: "spark",
        glyph: "✺",
        label: "Follow the spark",
        detail: "Why wait to trade weird stories?",
        scores: { lantern: 2 },
        insight: "Momentum and mutual curiosity energize you.",
      },
      {
        id: "seasonal",
        glyph: "☾",
        label: "Waves of near and far",
        detail: "Close for a season, then space",
        scores: { lantern: 1, tidepool: 1 },
        insight: "You may bond in chapters rather than a straight line.",
      },
    ],
  },
  {
    id: "unexpected-visit",
    dimension: "initiation",
    kicker: "Someone you trust appears",
    prompt: "They stop by unannounced. What happens first?",
    answers: [
      {
        id: "kettle",
        glyph: "☕",
        label: "Kettle on, shoes off",
        detail: "Of course you’re staying a while",
        scores: { hearth: 2, lantern: 1 },
        insight: "You often initiate care through hospitality.",
      },
      {
        id: "porch-sit",
        glyph: "○",
        label: "Suggest the porch or a short walk",
        detail: "Easy, no deep dive yet",
        scores: { tidepool: 1, hearth: 1 },
        insight: "You may open the door gradually, not all at once.",
      },
      {
        id: "story-first",
        glyph: "✺",
        label: "Launch into whatever’s alive",
        detail: "Catch me up, I want the good parts",
        scores: { lantern: 2 },
        insight: "You often lead with engagement and curiosity.",
      },
      {
        id: "honest-capacity",
        glyph: "…",
        label: "Name your capacity kindly",
        detail: "Happy to see you—short visit works best",
        scores: { tidepool: 2, hearth: 1 },
        insight: "Clear boundaries can be how you stay warm.",
      },
    ],
  },
  {
    id: "group-circle",
    dimension: "closeness",
    kicker: "A small gathering",
    prompt: "Six people, one living room. Where do you settle?",
    answers: [
      {
        id: "middle-couch",
        glyph: "⌂",
        label: "Middle of the couch",
        detail: "Part of the shared weather",
        scores: { hearth: 2, lantern: 1 },
        insight: "You often choose the social center when it feels safe.",
      },
      {
        id: "one-corner",
        glyph: "◌",
        label: "A soft corner with one person",
        detail: "Depth over volume",
        scores: { tidepool: 2 },
        insight: "One-to-one depth may feel more real than the full room.",
      },
      {
        id: "host-loop",
        glyph: "↻",
        label: "Looping between groups",
        detail: "A little of everyone’s spark",
        scores: { lantern: 2 },
        insight: "You may circulate energy rather than plant in one spot.",
      },
      {
        id: "helper-edge",
        glyph: "◇",
        label: "Near the snacks / coats / door",
        detail: "Useful, present, not on stage",
        scores: { hearth: 2, tidepool: 1 },
        insight: "Helping roles can be your comfortable form of closeness.",
      },
    ],
  },
  {
    id: "humor",
    dimension: "play",
    kicker: "Humor as weather",
    prompt: "What kind of playfulness feels like home?",
    answers: [
      {
        id: "gentle-roast",
        glyph: "♪",
        label: "Gentle, knowing jokes",
        detail: "Inside references, soft edges",
        scores: { hearth: 2, lantern: 1 },
        insight: "Shared history makes your humor land best.",
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
        detail: "Humor that doesn’t demand a stage",
        scores: { tidepool: 2 },
        insight: "Subtle play can feel more intimate than loud comedy.",
      },
      {
        id: "co-create",
        glyph: "↝",
        label: "Building a bit together",
        detail: '"Yes, and..." energy',
        scores: { lantern: 2, hearth: 1 },
        insight: "Collaborative silliness helps you bond.",
      },
    ],
  },
  {
    id: "overstimulated",
    dimension: "sensory",
    kicker: "When the room gets loud",
    prompt: "Music up, lights bright, too many voices. What do you need?",
    answers: [
      {
        id: "step-out",
        glyph: "◌",
        label: "A short step outside",
        detail: "Air, then return if I want",
        scores: { tidepool: 2 },
        insight: "Exit ramps protect your ability to stay connected.",
      },
      {
        id: "anchor-person",
        glyph: "⌂",
        label: "One steady person nearby",
        detail: "A known face is enough",
        scores: { hearth: 2 },
        insight: "A social anchor can make intensity tolerable.",
      },
      {
        id: "reframe-play",
        glyph: "✺",
        label: "Turn it into a game",
        detail: "Find the interesting angle",
        scores: { lantern: 2 },
        insight: "Play can re-regulate you when the room spikes.",
      },
      {
        id: "earlier-leave",
        glyph: "☾",
        label: "Leave a little earlier than planned",
        detail: "Preserve tomorrow’s capacity",
        scores: { tidepool: 1, hearth: 1 },
        insight: "Protecting future-you is part of your care system.",
      },
    ],
  },
  {
    id: "text-rhythm",
    dimension: "pacing",
    kicker: "Messages and timing",
    prompt: "With someone you like, what texting weather feels best?",
    answers: [
      {
        id: "slow-thoughtful",
        glyph: "…",
        label: "Thoughtful, not constant",
        detail: "Good replies when ready",
        scores: { tidepool: 2 },
        insight: "Asynchronous depth may suit you better than rapid-fire chat.",
      },
      {
        id: "steady-checkins",
        glyph: "↟",
        label: "Small steady check-ins",
        detail: "A gentle daily thread",
        scores: { hearth: 2 },
        insight: "Light consistency builds safety for you.",
      },
      {
        id: "burst-then-quiet",
        glyph: "✺",
        label: "Bursts of delight, then quiet",
        detail: "Seasons of chat energy",
        scores: { lantern: 2, tidepool: 1 },
        insight:
          "You may connect in bright chapters rather than constant stream.",
      },
      {
        id: "prefer-voice",
        glyph: "♪",
        label: "Voice notes or a call later",
        detail: "Tone matters more than speed",
        scores: { hearth: 1, lantern: 1 },
        insight: "Hearing a person may feel more real than text alone.",
      },
    ],
  },
  {
    id: "first-invite",
    dimension: "initiation",
    kicker: "Making a plan",
    prompt: "You want to spend time with someone. How do you usually begin?",
    answers: [
      {
        id: "specific-plan",
        glyph: "⌂",
        label: "A clear, low-pressure plan",
        detail: "Tea Tuesday? Easy out if needed",
        scores: { hearth: 2 },
        insight: "Specific and kind invitations reduce ambiguity for you.",
      },
      {
        id: "open-offer",
        glyph: "↝",
        label: "An open window of possibility",
        detail: "This week is flexible—want to find something?",
        scores: { lantern: 2 },
        insight: "Open-ended invitations leave room for mutual invention.",
      },
      {
        id: "wait-signal",
        glyph: "◌",
        label: "Wait for a clear mutual signal",
        detail: "I like knowing interest is two-way",
        scores: { tidepool: 2 },
        insight: "Reciprocity cues matter before you step forward.",
      },
      {
        id: "activity-first",
        glyph: "◇",
        label: "Suggest a shared activity",
        detail: "Something to do, not only talk",
        scores: { lantern: 1, hearth: 1, tidepool: 1 },
        insight:
          "Side-by-side plans can feel safer than face-to-face intensity.",
      },
    ],
  },
  {
    id: "mismatch",
    dimension: "repair",
    kicker: "A small social mismatch",
    prompt: "Someone misreads your energy. What helps most?",
    answers: [
      {
        id: "name-it",
        glyph: "“ ”",
        label: "Name it simply",
        detail: "I’m quieter today—still glad you’re here",
        scores: { hearth: 1, tidepool: 1 },
        insight: "Plain language repair can restore safety quickly.",
      },
      {
        id: "reset-ritual",
        glyph: "☕",
        label: "A soft reset ritual",
        detail: "Walk, tea, try again in ten",
        scores: { hearth: 2 },
        insight: "Embodied resets help you re-enter connection.",
      },
      {
        id: "humor-bridge",
        glyph: "♪",
        label: "A light, honest joke",
        detail: "We can laugh and re-aim",
        scores: { lantern: 2 },
        insight: "Humor can be a bridge back without heavy processing.",
      },
      {
        id: "space-then-return",
        glyph: "☾",
        label: "Space, then a clear return",
        detail: "I need a pause—I’ll rejoin at 8",
        scores: { tidepool: 2 },
        insight:
          "Predictable return times make space feel safe, not rejecting.",
      },
    ],
  },
  {
    id: "touch-adjacent",
    dimension: "closeness",
    kicker: "Nearness without a script",
    prompt:
      "You’re side by side on a couch with someone you like. What feels nicest?",
    answers: [
      {
        id: "shared-blanket-space",
        glyph: "⌂",
        label: "Shared blanket territory",
        detail: "Close, still optional",
        scores: { hearth: 2 },
        insight: "Optional nearness with clear ease may suit you.",
      },
      {
        id: "parallel-quiet",
        glyph: "≈",
        label: "Parallel quiet",
        detail: "Each with a book, same room",
        scores: { tidepool: 2 },
        insight: "Companionable silence can be your intimacy.",
      },
      {
        id: "story-swap",
        glyph: "✺",
        label: "A meandering story swap",
        detail: "How did we get onto bees?",
        scores: { lantern: 2 },
        insight: "Conversation may be how your body settles into closeness.",
      },
      {
        id: "ask-first",
        glyph: "?",
        label: "Check before any closer",
        detail: "Is this distance okay for you?",
        scores: { hearth: 1, tidepool: 1 },
        insight: "Explicit check-ins can make nearness feel freer, not colder.",
      },
    ],
  },
  {
    id: "celebration",
    dimension: "play",
    kicker: "Good news arrives",
    prompt: "You want to celebrate with a friend. What sounds right?",
    answers: [
      {
        id: "home-toast",
        glyph: "☕",
        label: "A quiet toast at home",
        detail: "Just us, something warm",
        scores: { hearth: 2, tidepool: 1 },
        insight: "Private celebration can feel more real than a big scene.",
      },
      {
        id: "adventure",
        glyph: "↝",
        label: "A tiny adventure",
        detail: "New bakery, night walk, train ride",
        scores: { lantern: 2 },
        insight: "Novelty can be how you mark meaning.",
      },
      {
        id: "letter",
        glyph: "…",
        label: "A careful message first",
        detail: "Words that land, then plans",
        scores: { tidepool: 2 },
        insight: "You may prefer emotional precision before logistics.",
      },
      {
        id: "invite-circle",
        glyph: "⌂",
        label: "A small circle of favorites",
        detail: "Three people who already get it",
        scores: { hearth: 2, lantern: 1 },
        insight: "A trusted micro-community may be your party.",
      },
    ],
  },
  {
    id: "morning-after",
    dimension: "regulation",
    kicker: "The morning after social time",
    prompt: "You had a lovely evening with people. Today you mostly need…",
    answers: [
      {
        id: "slow-alone",
        glyph: "◌",
        label: "A slow alone morning",
        detail: "No messages until I’m back online",
        scores: { tidepool: 2 },
        insight:
          "Recovery time is part of how you keep connection sustainable.",
      },
      {
        id: "one-thanks",
        glyph: "◇",
        label: "One warm thank-you text",
        detail: "Then ordinary day energy",
        scores: { hearth: 2 },
        insight:
          "A clean appreciation loop helps you close the social chapter.",
      },
      {
        id: "keep-going",
        glyph: "✺",
        label: "More of the good thread",
        detail: "Send the meme, make the next plan",
        scores: { lantern: 2 },
        insight: "Social afterglow may fuel more connection for you.",
      },
      {
        id: "body-reset",
        glyph: "≈",
        label: "A body reset",
        detail: "Walk, stretch, water, light",
        scores: { tidepool: 1, hearth: 1 },
        insight: "Physical reset can complete the social cycle for you.",
      },
    ],
  },
];

export const QUIZ_QUESTION_COUNT = quizQuestions.length;
