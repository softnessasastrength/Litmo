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
      "Solitude restores your battery.",
    ],
    [
      "one",
      "One gentle person nearby",
      "Low demand company",
      "steady",
      "Soft company can still feel like rest.",
    ],
    [
      "move",
      "A walk or playful reset",
      "Shake the day off",
      "expressive",
      "A little motion can shake the day loose.",
    ],
  ]),
  q("sc2", "Yes vs maybe", "When you are unsure about a plan, you usually…", [
    [
      "pause",
      "Ask for time",
      "I need to feel it first",
      "spacious",
      "You protect decisions with a little breathing room.",
    ],
    [
      "soft-yes",
      "Say a soft yes with an exit",
      "I can come for a bit",
      "steady",
      "You like showing up while still keeping an easy out.",
    ],
    [
      "curious",
      "Lean toward yes if it sparks",
      "If it lights me up",
      "expressive",
      "Curiosity often tips you toward yes.",
    ],
  ]),
  q("sc3", "Signals", "You can tell you are peopled-out when…", [
    [
      "quiet",
      "Words get shorter",
      "The chat fades first",
      "spacious",
      "Quiet is information, not rejection.",
    ],
    [
      "care",
      "You crave a familiar comfort",
      "Tea, home, ritual",
      "steady",
      "Known rituals help you downshift.",
    ],
    [
      "redirect",
      "You want a change of scene",
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
      "Empty space is a gift you actually keep.",
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
      "Joy can be part of how you recover.",
    ],
  ]),
  q("sc5", "Asking for space", "How do you prefer to name low capacity?", [
    [
      "clear",
      "Clear and kind",
      "I need quiet until evening",
      "steady",
      "Clarity saves everyone from guessing.",
    ],
    [
      "brief",
      "Brief and private",
      "Low words, still warm",
      "spacious",
      "You do not perform a long explanation.",
    ],
    [
      "with-plan",
      "With a return plan",
      "After a walk I can reconnect",
      "expressive",
      "A soft path back keeps the door open.",
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
      "You turn up the volume only as needed.",
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
      "A ready phrase keeps you from blanking.",
    ],
    [
      "safe-person",
      "You try it with a trusted person first",
      "Low stakes",
      "spacious",
      "Friendly practice makes the real moment easier.",
    ],
    [
      "play",
      "You role-play lightly",
      "Make it less scary",
      "expressive",
      "Play can take the edge off.",
    ],
  ]),
  q("bv3", "Pushback", "If someone keeps pressing after a no…", [
    [
      "repeat",
      "Repeat the no without debate",
      "Still no",
      "steady",
      "You do not owe a courtroom.",
    ],
    [
      "exit",
      "Leave the moment if you need to",
      "Step away is allowed",
      "spacious",
      "Leaving can be the whole boundary.",
    ],
    [
      "ally",
      "Find an ally or change the setting",
      "Do not stay cornered",
      "expressive",
      "You widen the circle when pressure rises.",
    ],
  ]),
  q("bv4", "Afterglow of a no", "After holding a boundary, you often need…", [
    [
      "reassure",
      "A little self-kindness",
      "Caring for myself is allowed",
      "steady",
      "You coach yourself gently afterward.",
    ],
    [
      "space",
      "Quiet to settle",
      "No more processing",
      "spacious",
      "Settle first; the story can wait.",
    ],
    [
      "share",
      "To tell a trusted person",
      "A kind ear helps",
      "expressive",
      "Being seen softens the guilt spiral.",
    ],
  ]),
  q("bv5", "Yes energy", "Your clearest yes usually feels like…", [
    [
      "calm",
      "Calm and steady",
      "Settled all the way through",
      "steady",
      "You trust yeses that feel unhurried.",
    ],
    [
      "soft",
      "Soft openness",
      "Room to breathe",
      "spacious",
      "Spaciousness can still be enthusiasm.",
    ],
    [
      "spark",
      "A clear spark",
      "Energy rises",
      "expressive",
      "Aliveness is part of how you know.",
    ],
  ]),
];

export const comfortCareQuestions: QuizQuestion[] = [
  q("cc1", "Comfort", "When you walk in drained, what lands best?", [
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
      "Reliability is one of your love languages.",
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
      "Delight counts as nurture too.",
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
      "Creating can be comfort.",
    ],
  ]),
  q("cc4", "Offering care", "You most naturally offer…", [
    [
      "logistics",
      "Practical help",
      "Meals, rides, plans",
      "steady",
      "Useful care is one of your gifts.",
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
      "You like bringing a weather change.",
    ],
  ]),
  q("cc5", "Too much care", "When care starts to feel like pressure…", [
    [
      "name",
      "Name the pressure kindly",
      "I need lighter contact",
      "steady",
      "You can renegotiate care without drama.",
    ],
    [
      "less",
      "Reduce contact for a bit",
      "Protect the bond by pausing",
      "spacious",
      "Space can protect the connection.",
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
      "A soft cadence helps you settle in.",
    ],
    [
      "slow",
      "Unfolds slowly",
      "Small moments add up",
      "spacious",
      "Slow trust fits how you open.",
    ],
    [
      "spark",
      "Follows a bright spark",
      "Stories come easy",
      "expressive",
      "Momentum can feel honest for you.",
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
      "When it is mutual",
      "Warmth both ways",
      "steady",
      "Matching warmth opens the door.",
    ],
    [
      "later",
      "After more familiarity",
      "Ease first",
      "spacious",
      "You let vulnerability take its time.",
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
      "Rituals bridge the gap.",
    ],
    [
      "slow",
      "Slow and low pressure",
      "No instant deep dive",
      "spacious",
      "You warm the channel first.",
    ],
    [
      "burst",
      "With catch-up joy",
      "Then settle",
      "expressive",
      "You often start bright, then soften.",
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
