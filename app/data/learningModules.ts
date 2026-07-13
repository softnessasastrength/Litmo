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
  {
    id: "full-session-practice",
    title: "A full practice session",
    summary:
      "Walk a fictional two-person path from request through Soft Signal and wrap-up — without creating a real session.",
    minutes: 8,
    requiredBeforeFirstSession: true,
    steps: [
      {
        id: "practice-frame",
        title: "This is practice, not a real match",
        body: "You will follow two fictional adults, River and Sam. Nothing here creates a real request, Consent Snapshot, or session. Completing this module is never proof that anyone is safe.",
        takeaway: "Practice teaches the map. It does not certify the traveler.",
      },
      {
        id: "practice-request",
        title: "Invitation is not consent",
        body: "River sends Sam a session request. Sam can accept, decline, or let it expire. A request is only an invitation to begin consent review — never permission to touch.",
        takeaway: "Asking is allowed. Assuming yes is not.",
        scenario: {
          prompt: "Sam is unsure. What should Sam do?",
          options: [
            {
              label: "Decline without explaining",
              feedback:
                "Yes. Decline is complete. Sam does not owe a reason, and River should not press.",
            },
            {
              label: "Accept so River does not feel rejected",
              feedback:
                "Accepting to manage someone else’s feelings is not free consent. Decline or wait until Sam truly wants to review boundaries.",
            },
            {
              label: "Ignore the request forever",
              feedback:
                "Letting a request expire is also valid. The safer teaching path is a clear decline when Sam already knows the answer is no.",
            },
          ],
        },
      },
      {
        id: "practice-profiles",
        title: "Profiles are inputs, not permission",
        body: "Both people have saved Touch Language and boundary preferences. Litmo will only ever show the overlapping, more restrictive set. A warm Vibe Profile still grants nothing.",
        takeaway: "Profiles describe. Snapshots decide what may be affirmed.",
      },
      {
        id: "practice-snapshot",
        title: "Read the Consent Snapshot",
        body: "After Sam accepts, both open the same immutable Consent Snapshot. They read every shared boundary. If either profile changes later, this snapshot is no longer current.",
        takeaway: "Both people must affirm the same current document.",
        scenario: {
          prompt:
            "River wants to add a body zone that is not on the snapshot. What happens?",
          options: [
            {
              label: "They improvise because they both seem comfortable",
              feedback:
                "No. Anything outside the confirmed snapshot is outside consent for this session.",
            },
            {
              label:
                "They stop, update profiles if they want, and create a new snapshot",
              feedback:
                "Yes. New intentions need a new, mutual snapshot — not mid-session expansion.",
            },
            {
              label: "River proceeds because Sam smiled",
              feedback:
                "Nonverbal cues never replace the snapshot. Smile is not a written boundary.",
            },
          ],
        },
      },
      {
        id: "practice-dual-confirm",
        title: "Both confirm independently",
        body: "River confirms first and waits. Sam confirms the same fingerprint. Only then can the session become ready and active. One confirmation never activates alone.",
        takeaway: "Mutual confirmation is the gate — not enthusiasm.",
      },
      {
        id: "practice-active",
        title: "During the active session",
        body: "While active, the Soft Signal stays easy to find. Either person can stop immediately. Reporting mid-session is available without ending first. Nothing requires negotiation to pause or leave.",
        takeaway: "Comfort can change after the session has started.",
      },
      {
        id: "practice-soft-signal",
        title: "Soft Signal ends it",
        body: "Sam uses Soft Signal. The session ends for both people. River’s job is to stop, give space, and not demand an explanation. Litmo does not publish why the stop happened.",
        takeaway: "A stop is the whole message.",
        scenario: {
          prompt: "River feels embarrassed after Soft Signal. Best next step?",
          options: [
            {
              label: "Ask Sam to explain so River can improve",
              feedback:
                "That pressures Sam. Improvement happens later, privately — never by demanding a reason at the stop.",
            },
            {
              label: "Complete wrap-up privately and leave Sam alone",
              feedback:
                "Yes. Private wrap-up is for River’s reflection. Sam owes nothing further.",
            },
            {
              label:
                "Send another session request immediately to smooth it over",
              feedback:
                "No. Immediate re-requests can feel like pressure. Wait and respect the stop.",
            },
          ],
        },
      },
      {
        id: "practice-wrap-up",
        title: "Private wrap-up, not a public review",
        body: "Each person can leave a private outcome and optional note for themselves. Wrap-ups are not ratings of the other person and never become a safety score. Serious concerns go through report and human review, not star ratings.",
        takeaway:
          "Reflection stays private. Harm reports use structured intake.",
      },
      {
        id: "practice-close",
        title: "What this practice did not do",
        body: "You did not create a real session, grant real consent, or prove readiness for strangers. When you use Litmo with a real account, every gate still applies: eligibility, request, dual snapshot confirm, Soft Signal, and the right to stop without explanation.",
        takeaway: "The real path still requires real, current consent.",
      },
    ],
  },
  {
    id: "blocking-and-reporting",
    title: "Blocking and reporting",
    summary:
      "Know what blocking actually does, when to report something, and what happens after you do.",
    minutes: 4,
    steps: [
      {
        id: "block-is-immediate-and-private",
        title: "Blocking is immediate and private",
        body: "Blocking someone takes effect right away. They are never told who blocked them or that a block happened. Any pending request between you is cancelled, and an open or active session between you ends.",
        takeaway:
          "You do not need permission, a reason, or a conversation to block.",
      },
      {
        id: "report-is-not-a-public-verdict",
        title: "Reporting starts a private, human review",
        body: "A report is a short, categorized note to Litmo — harassment, boundary violation, unsafe behavior, and similar categories — with an optional private note only you can write. The reported person is never shown who reported them or what was said.",
        takeaway:
          "Reporting is between you and human review, not a public dispute.",
      },
      {
        id: "block-vs-report-scenario",
        title: "Choosing block, report, or both",
        body: "Blocking removes someone from your discovery and requests. Reporting brings a concern to human staff who can restrict an account. They are independent — you can block without reporting, report without blocking, or do both.",
        takeaway:
          "Pick the tool that matches what you need: distance, review, or both.",
        scenario: {
          prompt:
            "Someone made you uncomfortable during a session, but you don’t think anyone else is in danger. What’s a reasonable first step?",
          options: [
            {
              label: "Block them and leave it there",
              feedback:
                "Often enough. Blocking ends contact immediately with no explanation owed to anyone.",
            },
            {
              label: "Report them so staff have the pattern on record",
              feedback:
                "Also reasonable, especially if you want it reviewed even without ongoing contact. You can report and not block.",
            },
            {
              label: "Wait and see if it happens again before doing anything",
              feedback:
                "You’re never required to wait out a pattern before you’re allowed to block or report. Acting the first time is not an overreaction.",
            },
          ],
        },
      },
      {
        id: "what-staff-can-and-cannot-do",
        title: "What review can and cannot do",
        body: "A human reviews every report — restrictions are never applied automatically just because a report exists or a rate limit was hit. If an account is restricted, that person can appeal, and a different human decides whether the restriction is upheld or lifted.",
        takeaway:
          "Restriction is a human decision with a human-reviewed appeal, not an algorithm.",
      },
    ],
  },
  {
    id: "trust-signals",
    title: "Your trust signals, not a score",
    summary:
      "Understand the handful of facts Litmo shows about account history — and why it deliberately stops there.",
    minutes: 4,
    steps: [
      {
        id: "facts-not-a-score",
        title: "Facts, not a score",
        body: "When you view someone in Discover, you may see how long their account has existed and how many sessions they’ve completed. That’s the whole list. There is no rating, ranking, percentage, or badge — because none of those would actually tell you whether a session will be safe.",
        takeaway:
          "A longer history is a fact about time, not a guarantee about a person.",
      },
      {
        id: "your-private-signals",
        title: "What only you can see about yourself",
        body: "In Settings, your own private signals show a little more: profile completeness, adult-eligibility status, and counts of completed, Soft Signaled, and safety-ended sessions. This view is self-only — it is never shown to anyone else, and it is still never a public score.",
        takeaway: "Your fuller history stays yours. No one else sees it.",
      },
      {
        id: "trust-signal-scenario",
        title: "Using signals responsibly",
        body: "Peer-visible facts can support a decision to request a session, but they cannot substitute for one. Every session still needs its own real, current Consent Snapshot.",
        takeaway: "History can inform a choice. It cannot authorize one.",
        scenario: {
          prompt:
            "Someone has a long account history and many completed sessions. What does that tell you?",
          options: [
            {
              label: "They’re verified as safe to be around",
              feedback:
                "No. Litmo never claims that a history — however long — proves safety. Treat it as one input, not a guarantee.",
            },
            {
              label:
                "They’ve used Litmo for a while and finished sessions before",
              feedback:
                "Yes — that’s the literal fact being shown, and nothing more than that.",
            },
            {
              label: "You can skip reviewing the Consent Snapshot with them",
              feedback:
                "No. Every session still requires its own current, mutual snapshot, regardless of anyone’s history.",
            },
          ],
        },
      },
      {
        id: "if-you-are-restricted",
        title: "If your account is restricted",
        body: "A restriction — a temporary matching hold or a permanent one — only happens after a human reviews a report. If it happens to you, Litmo tells you that matching is paused and lets you submit an appeal, which a different staff member reviews.",
        takeaway:
          "A restriction always comes with a human-reviewed way to respond.",
      },
    ],
  },
];

export function findLearningModule(id: string | undefined) {
  return learningModules.find((module) => module.id === id);
}
