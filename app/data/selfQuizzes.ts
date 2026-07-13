/**
 * Additional self-understanding quizzes.
 * Playful and reflective — never clinical, never consent, never a safety score.
 */

import type { QuizAnswer, QuizQuestion, Scores } from "./quiz.ts";

export type SelfQuizId =
  "soft-capacity" | "boundary-voice" | "comfort-care" | "connection-pace";

type SelfArchetype = "steady" | "expressive" | "spacious";

const selfToVibe: Record<SelfArchetype, Partial<Scores>> = {
  steady: { hearth: 2 },
  expressive: { lantern: 2 },
  spacious: { tidepool: 2 },
};

function answers(
  triple: [string, string, string, SelfArchetype, string][],
): QuizAnswer[] {
  return triple.map(([id, label, detail, arch, insight]) => ({
    id,
    label,
    detail,
    glyph: arch === "steady" ? "⌂" : arch === "expressive" ? "✺" : "◌",
    scores: selfToVibe[arch],
    insight,
  }));
}

function q(
  id: string,
  kicker: string,
  prompt: string,
  opts: [string, string, string, SelfArchetype, string][],
): QuizQuestion {
  return {
    id,
    dimension: "comfort",
    kicker,
    prompt,
    answers: answers(opts),
  };
}

export const softCapacityQuestions: QuizQuestion[] = [
  q("sc1", "Energy check", "After a full social day, what helps most?", [
    [
      "rest",
      "Quiet alone time",
      "No more inputs",
      "spacious",
      "Solitude restores your capacity.",
    ],
    [
      "one",
      "One gentle person nearby",
      "Low demand company",
      "steady",
      "Soft company can still be rest.",
    ],
    [
      "move",
      "A walk or playful reset",
      "Shake the day off",
      "expressive",
      "Movement metabolizes social load.",
    ],
  ]),
  q("sc2", "Yes vs maybe", "When you are unsure about a plan, you usually…", [
    [
      "pause",
      "Ask for time",
      "I need to feel it first",
      "spacious",
      "You protect decisions with space.",
    ],
    [
      "soft-yes",
      "Say a soft yes with an exit",
      "I can come for a bit",
      "steady",
      "You value showing up with boundaries.",
    ],
    [
      "curious",
      "Lean toward yes if it sparks",
      "If it lights me up",
      "expressive",
      "Curiosity often leads you forward.",
    ],
  ]),
  q("sc3", "Signals", "Your body often says “enough” by…", [
    [
      "quiet",
      "Going quiet",
      "Words get shorter",
      "spacious",
      "Quiet is information, not rejection.",
    ],
    [
      "care",
      "Needing a familiar comfort",
      "Tea, home, ritual",
      "steady",
      "Rituals help you downshift.",
    ],
    [
      "redirect",
      "Wanting a change of scene",
      "Different energy please",
      "expressive",
      "A redirect can be self-care.",
    ],
  ]),
  q("sc4", "Recovery", "The kindest next-day plan is…", [
    [
      "empty",
      "Mostly empty",
      "Protect the calendar",
      "spacious",
      "You treat capacity as real data.",
    ],
    [
      "gentle",
      "One gentle plan max",
      "Known people only",
      "steady",
      "You right-size rather than cancel everything.",
    ],
    [
      "light",
      "Something light and fun",
      "If energy allows",
      "expressive",
      "Joy can be part of recovery.",
    ],
  ]),
  q("sc5", "Asking for space", "How do you prefer to name low capacity?", [
    [
      "clear",
      "Clear and kind",
      "I need quiet until evening",
      "steady",
      "Clarity reduces guesswork.",
    ],
    [
      "brief",
      "Brief and private",
      "Low words, still warm",
      "spacious",
      "You do not perform explanation.",
    ],
    [
      "with-plan",
      "With a return plan",
      "After a walk I can reconnect",
      "expressive",
      "A path back keeps connection safe.",
    ],
  ]),
];

export const boundaryVoiceQuestions: QuizQuestion[] = [
  q("bv1", "Naming a limit", "When something is off-limits, you…", [
    [
      "direct",
      "Name it directly and warmly",
      "That does not work for me",
      "steady",
      "You trust plain language.",
    ],
    [
      "soft",
      "Name it softly, then firmer if needed",
      "Start gentle",
      "spacious",
      "You escalate only as needed.",
    ],
    [
      "redirect",
      "Redirect with an alternative",
      "Not that — how about this?",
      "expressive",
      "You offer another path when you can.",
    ],
  ]),
  q("bv2", "Practice", "Practicing a boundary feels best when…", [
    [
      "script",
      "You have a simple phrase ready",
      "Short and reusable",
      "steady",
      "Scripts reduce freeze.",
    ],
    [
      "safe-person",
      "You practice with a safe person first",
      "Low stakes",
      "spacious",
      "Safety unlocks voice.",
    ],
    [
      "play",
      "You role-play lightly",
      "Make it less scary",
      "expressive",
      "Play can lower the stakes.",
    ],
  ]),
  q("bv3", "Pushback", "If someone pushes after a no…", [
    [
      "repeat",
      "Repeat the no without debate",
      "Still no",
      "steady",
      "You do not owe a courtroom.",
    ],
    [
      "exit",
      "Exit the moment if needed",
      "Protect the body first",
      "spacious",
      "Leaving can be the boundary.",
    ],
    [
      "ally",
      "Find an ally or change the setting",
      "Do not stay isolated",
      "expressive",
      "You widen support when pressure rises.",
    ],
  ]),
  q("bv4", "Guilt", "After holding a boundary, you often need…", [
    [
      "reassure",
      "Self-reassurance",
      "Caring is allowed",
      "steady",
      "You coach yourself kindly.",
    ],
    [
      "space",
      "Quiet to settle",
      "No more processing",
      "spacious",
      "Regulation first, story later.",
    ],
    [
      "share",
      "To tell a trusted person",
      "Witness helps",
      "expressive",
      "Being seen softens guilt.",
    ],
  ]),
  q("bv5", "Yes energy", "A full-body yes feels like…", [
    [
      "calm",
      "Calm and steady",
      "No alarm in the body",
      "steady",
      "You trust settled yeses.",
    ],
    [
      "soft",
      "Soft openness",
      "Room to breathe",
      "spacious",
      "Spaciousness can be enthusiasm.",
    ],
    [
      "spark",
      "A clear spark",
      "Energy rises",
      "expressive",
      "Aliveness is part of your yes.",
    ],
  ]),
];

export const comfortCareQuestions: QuizQuestion[] = [
  q("cc1", "Comfort", "After a hard day, best welcome?", [
    [
      "ritual",
      "A familiar ritual",
      "Same mug, same chair",
      "steady",
      "Known rituals help you downshift.",
    ],
    [
      "quiet",
      "Quiet company",
      "No fixing",
      "spacious",
      "Presence without pressure lands best.",
    ],
    [
      "detour",
      "A delightful detour",
      "Something surprising and kind",
      "expressive",
      "A gentle redirect can lift the day.",
    ],
  ]),
  q("cc2", "Care received", "You feel most cared for when someone…", [
    [
      "shows-up",
      "Shows up consistently",
      "Reliable small acts",
      "steady",
      "Reliability is love language.",
    ],
    [
      "listens",
      "Listens without rushing",
      "No advice dump",
      "spacious",
      "Attention is care.",
    ],
    [
      "delights",
      "Brings a spark of delight",
      "Joke, song, treat",
      "expressive",
      "Delight is also nurture.",
    ],
  ]),
  q("cc3", "Alone comfort", "Solo comfort looks like…", [
    [
      "home",
      "Home nest",
      "Blankets, tea, low light",
      "steady",
      "Home is your restoration dock.",
    ],
    [
      "nature",
      "Quiet outdoors",
      "Air and horizon",
      "spacious",
      "Wide quiet soothes you.",
    ],
    [
      "create",
      "Making or exploring",
      "Hands or feet busy",
      "expressive",
      "Creation can be comfort.",
    ],
  ]),
  q("cc4", "Offering care", "You most naturally offer…", [
    [
      "logistics",
      "Practical help",
      "Meals, rides, plans",
      "steady",
      "Useful care is your gift.",
    ],
    [
      "presence",
      "Steady presence",
      "I can sit with you",
      "spacious",
      "Being-with is enough.",
    ],
    [
      "lift",
      "A lift in mood",
      "Humor, adventure, ideas",
      "expressive",
      "You bring weather change.",
    ],
  ]),
  q("cc5", "Too much care", "When care feels like pressure…", [
    [
      "name",
      "Name the pressure kindly",
      "I need lighter contact",
      "steady",
      "You can renegotiate care.",
    ],
    [
      "less",
      "Reduce contact for a bit",
      "Protect the bond by pausing",
      "spacious",
      "Space can protect connection.",
    ],
    [
      "shift",
      "Shift the form of care",
      "Different kind of support",
      "expressive",
      "You redesign rather than cut off.",
    ],
  ]),
];

export const connectionPaceQuestions: QuizQuestion[] = [
  q("cp1", "Beginning", "A new friendship feels best when it…", [
    [
      "rhythm",
      "Finds a gentle rhythm",
      "A little consistency",
      "steady",
      "Cadence builds safety.",
    ],
    [
      "slow",
      "Unfolds slowly",
      "Small moments add up",
      "spacious",
      "Slow trust fits you.",
    ],
    [
      "spark",
      "Follows a bright spark",
      "Stories come easy",
      "expressive",
      "Momentum can feel honest.",
    ],
  ]),
  q("cp2", "Texting", "Preferred texting weather?", [
    [
      "steady",
      "Small steady check-ins",
      "Light daily thread",
      "steady",
      "Light consistency soothes you.",
    ],
    [
      "async",
      "Thoughtful, not constant",
      "When ready",
      "spacious",
      "Async depth beats rapid-fire.",
    ],
    [
      "bursts",
      "Bursts then quiet",
      "Seasons of chat",
      "expressive",
      "You connect in bright chapters.",
    ],
  ]),
  q("cp3", "Depth timing", "Sharing something tender works best…", [
    [
      "mutual",
      "When mutual",
      "Tit-for-tat warmth",
      "steady",
      "Reciprocity gates depth.",
    ],
    [
      "later",
      "After more safety",
      "Trust first",
      "spacious",
      "You pace vulnerability.",
    ],
    [
      "when-spark",
      "When the spark is clean",
      "Honesty as invitation",
      "expressive",
      "You sometimes lead with realness.",
    ],
  ]),
  q("cp4", "Time apart", "After time apart, reentry feels best…", [
    [
      "ritual",
      "With a small ritual",
      "Same walk, same cafe",
      "steady",
      "Rituals bridge absence.",
    ],
    [
      "slow",
      "Slow and low pressure",
      "No instant deep dive",
      "spacious",
      "You warm the channel.",
    ],
    [
      "burst",
      "With catch-up joy",
      "Then settle",
      "expressive",
      "You often start high, then soften.",
    ],
  ]),
  q("cp5", "Ending a good night", "You prefer to…", [
    [
      "natural",
      "Let it end naturally",
      "No rush out",
      "steady",
      "You dislike abrupt exits.",
    ],
    [
      "early",
      "Leave a little early",
      "On a high note",
      "spacious",
      "You protect the aftertaste.",
    ],
    [
      "one-more",
      "One more tiny thing",
      "Story, song, dessert",
      "expressive",
      "You stretch sweetness carefully.",
    ],
  ]),
];

export const selfQuizQuestions: Record<SelfQuizId, QuizQuestion[]> = {
  "soft-capacity": softCapacityQuestions,
  "boundary-voice": boundaryVoiceQuestions,
  "comfort-care": comfortCareQuestions,
  "connection-pace": connectionPaceQuestions,
};
