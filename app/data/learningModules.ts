export type LearningStep = {
  id: string;
  title: string;
  body: string;
  takeaway: string;
  scenario?: {
    prompt: string;
    options: Array<{ label: string; feedback: string }>;
  };
};

export type LearningModule = {
  id: string;
  title: string;
  summary: string;
  minutes: number;
  requiredBeforeFirstSession?: boolean;
  steps: LearningStep[];
};

export const learningModules: LearningModule[] = [
  {
    id: "consent-snapshots",
    title: "Consent Snapshots",
    summary:
      "Learn why both people confirm the same current boundaries before a session can begin.",
    minutes: 4,
    requiredBeforeFirstSession: true,
    steps: [
      {
        id: "snapshot-not-assumption",
        title: "Nothing is inferred",
        body: "A match, a prior session, or a compatible profile never means consent. A Consent Snapshot records the exact overlap both people are willing to affirm right now.",
        takeaway:
          "Compatibility can begin a conversation. It cannot begin a session.",
      },
      {
        id: "strictest-boundary",
        title: "The strictest boundary wins",
        body: "Litmo includes only the shared intersection of both people’s current limits. If either person excludes something, it is excluded from the snapshot.",
        takeaway: "A boundary never needs to be negotiated upward.",
      },
      {
        id: "same-snapshot",
        title: "Confirm the same thing",
        body: "Both people review and affirm the same immutable snapshot. If a profile changes, the old snapshot is no longer current and must not be reused.",
        takeaway: "Consent is current, specific, and shared.",
      },
    ],
  },
  {
    id: "soft-signal",
    title: "The Soft Signal",
    summary:
      "Practice ending a session immediately, without explanation or negotiation.",
    minutes: 3,
    requiredBeforeFirstSession: true,
    steps: [
      {
        id: "stop-is-unilateral",
        title: "Stopping takes one person",
        body: "Starting requires mutual agreement. Stopping does not. Either participant can use the Soft Signal at any time.",
        takeaway: "A stop is effective immediately.",
      },
      {
        id: "no-explanation",
        title: "No explanation required",
        body: "The person stopping never owes a reason. Litmo intentionally does not reveal whether the reason was discomfort, changed intent, safety, or something private.",
        takeaway: "Respect the stop, not the story behind it.",
      },
      {
        id: "scenario-response",
        title: "Responding well",
        body: "A Soft Signal has ended the session. Your job is not to solve or debate it.",
        takeaway: "Calm acceptance protects both people.",
        scenario: {
          prompt:
            "The other person uses the Soft Signal. What is the safest response?",
          options: [
            {
              label: "Stop and give them space",
              feedback:
                "Yes. The session is over, and no explanation is required.",
            },
            {
              label: "Ask what you did wrong",
              feedback:
                "That can create pressure. Stop first and do not require a conversation.",
            },
            {
              label: "Explain that you meant well",
              feedback:
                "Intent does not override the stop. End the interaction without negotiation.",
            },
          ],
        },
      },
    ],
  },
  {
    id: "touch-language",
    title: "Understanding Touch Language",
    summary:
      "Describe preferences clearly without turning them into permanent promises.",
    minutes: 5,
    steps: [
      {
        id: "preferences-contextual",
        title: "Preferences are contextual",
        body: "Pressure, duration, body zones, environment, and nervous-system state can all change what feels comfortable on a particular day.",
        takeaway: "A profile describes patterns, not obligations.",
      },
      {
        id: "clear-specific",
        title: "Clear beats polite ambiguity",
        body: "Specific language helps both people. ‘Light pressure for a short side hug’ is safer than hoping someone interprets ‘I’m flexible’ correctly.",
        takeaway: "Clarity is kindness.",
      },
      {
        id: "change-anytime",
        title: "You can change your mind",
        body: "Editing a Touch Language profile changes future compatibility. During a session, either person can still withdraw immediately regardless of what the profile says.",
        takeaway: "Your current choice outranks your saved profile.",
      },
    ],
  },
];

export function findLearningModule(id: string | undefined) {
  return learningModules.find((module) => module.id === id);
}
