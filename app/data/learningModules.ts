import type { QuizCatalogId } from "./quizCatalog.ts";

/**
 * Guided Learning curriculum — foundations (product safety map) + lived lessons
 * (hard-earned relational skills). Completing modules never certifies safety,
 * readiness, or consent skill. Progress is device-local only.
 */

export type LearningStep = {
  id: string;
  title: string;
  body: string;
  takeaway: string;
  /** Optional private reflection shown in the player; never persisted. */
  reflection?: string;
  scenario?: {
    prompt: string;
    options: Array<{ label: string; feedback: string }>;
  };
};

/** Catalog tracks for the Learn hub. */
export type LearningTrack = "foundations" | "lived-lessons";

/** Soft themes for paths and filtering — never grades or safety scores. */
export type LearningTheme =
  | "consent"
  | "nervous-system"
  | "boundaries"
  | "recovery"
  | "communication"
  | "self-compassion"
  | "product-safety";

/** Optional product practice after a module — never required, never scored. */
export type LearningPracticeLink = {
  id: string;
  label: string;
  hint: string;
  /** Expo Router path (absolute within app). */
  href: string;
};

export type LearningModule = {
  id: string;
  title: string;
  summary: string;
  minutes: number;
  /** foundations = product safety map; lived-lessons = hard-earned relational skills. */
  track: LearningTrack;
  themes: LearningTheme[];
  requiredBeforeFirstSession?: boolean;
  /**
   * Optional private Vibe / self-quiz to try after the module.
   * Never required; never treated as competence or safety proof.
   */
  relatedQuizId?: QuizCatalogId;
  /** Soft invite copy for the related quiz card. */
  relatedQuizPrompt?: string;
  /** Optional product surfaces to practice the skill for real. */
  relatedPractice?: LearningPracticeLink[];
  steps: LearningStep[];
};

/** Curated sequences — recommendations only; never gates or certificates. */
export type LearningPath = {
  id: string;
  title: string;
  summary: string;
  /** Approximate total minutes if taken in order. */
  minutes: number;
  moduleIds: string[];
};

export const learningModules: LearningModule[] = [
  // ── Foundations ──────────────────────────────────────────────────────────
  {
    id: "consent-snapshots",
    title: "Consent Snapshots",
    summary:
      "Learn why both people confirm the same current boundaries before a session can begin.",
    minutes: 5,
    track: "foundations",
    themes: ["consent", "product-safety"],
    requiredBeforeFirstSession: true,
    relatedQuizId: "vibe-short",
    relatedQuizPrompt:
      "Optional: a short Vibe Quiz can name your social weather — never a consent substitute.",
    relatedPractice: [
      {
        id: "cs-prepare",
        label: "Prepare a Consent Snapshot",
        hint: "Practice the real pre-session declaration and dual seal (demo partner available).",
        href: "/consent-snapshot/prepare",
      },
    ],
    steps: [
      {
        id: "snapshot-not-assumption",
        title: "Nothing is inferred",
        body: "A match, a prior session, or a compatible profile never means consent. A Consent Snapshot records the exact overlap both people are willing to affirm right now — mood, energy, boundaries, safewords, aftercare, and Soft Signal acknowledgment included when you use the full prepare flow.",
        takeaway:
          "Compatibility can begin a conversation. It cannot begin a session.",
        reflection:
          "Where have you seen people treat history or chemistry as permission?",
      },
      {
        id: "strictest-boundary",
        title: "The strictest boundary wins",
        body: "Litmo includes only the shared intersection of both people’s current limits. If either person excludes something, it is excluded from the snapshot. Expanding later needs a new mutual yes — never mid-session improvisation.",
        takeaway: "A boundary never needs to be negotiated upward.",
      },
      {
        id: "same-snapshot",
        title: "Confirm the same thing",
        body: "Both people review and affirm the same immutable snapshot fingerprint. If a profile changes, the old snapshot is no longer current and must not be reused. One person’s enthusiasm cannot activate alone.",
        takeaway: "Consent is current, specific, and shared.",
        scenario: {
          prompt:
            "You both confirmed a snapshot an hour ago. One person edited their body map. What now?",
          options: [
            {
              label: "Create and dual-confirm a new snapshot before any contact",
              feedback:
                "Yes. Profile change invalidates the prior snapshot. Current mutual affirmation only.",
            },
            {
              label: "Use the old snapshot because you already agreed once",
              feedback:
                "No. Consent is current. An outdated fingerprint is not permission.",
            },
            {
              label: "Skip confirmation if the vibe still feels mutual",
              feedback:
                "Vibe is not a seal. Dual confirmation of the current document is the gate.",
            },
          ],
        },
      },
    ],
  },
  {
    id: "soft-signal",
    title: "The Soft Signal",
    summary:
      "Practice ending a session immediately, without explanation or negotiation.",
    minutes: 4,
    track: "foundations",
    themes: ["consent", "boundaries", "product-safety"],
    requiredBeforeFirstSession: true,
    relatedPractice: [
      {
        id: "ss-practice",
        label: "Practice Soft Signal (no peer)",
        hint: "Build muscle memory safely. Logged privately as practice only.",
        href: "/soft-signal/practice",
      },
      {
        id: "ss-log",
        label: "Open personal Soft Signal log",
        hint: "Private records only — never shared, never a score.",
        href: "/soft-signal/log",
      },
    ],
    steps: [
      {
        id: "stop-is-unilateral",
        title: "Stopping takes one person",
        body: "Starting requires mutual agreement. Stopping does not. Either participant can use the Soft Signal at any time. On Soft Edge hardware, the pattern is a warm descent — not an alarm — so exit can stay body-safe.",
        takeaway: "A stop is effective immediately.",
      },
      {
        id: "no-explanation",
        title: "No explanation required",
        body: "The person stopping never owes a reason. Litmo intentionally does not reveal whether the reason was discomfort, changed intent, safety, or something private. Asking “what did I do wrong?” at the stop can recreate pressure.",
        takeaway: "Respect the stop, not the story behind it.",
        reflection:
          "Can you imagine receiving a stop without fixing, defending, or probing?",
      },
      {
        id: "scenario-response",
        title: "Responding well",
        body: "A Soft Signal has ended the session. Your job is not to solve or debate it. Give space, complete your own wrap-up if you want, and do not re-request immediately to smooth feelings.",
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
    track: "foundations",
    themes: ["consent", "boundaries", "communication", "product-safety"],
    relatedQuizId: "vibe-short",
    relatedQuizPrompt:
      "Optional: notice how today’s social weather sits beside your Touch Language — both stay private.",
    relatedPractice: [
      {
        id: "tl-hub",
        label: "Open your Touch Language map",
        hint: "Pressure, zones, hard limits — editable anytime; never a contract.",
        href: "/touch-language",
      },
    ],
    steps: [
      {
        id: "preferences-contextual",
        title: "Preferences are contextual",
        body: "Pressure, duration, body zones, environment, and nervous-system state can all change what feels comfortable on a particular day. A Touch Language map is a living document, not a permanent promise.",
        takeaway: "A profile describes patterns, not obligations.",
      },
      {
        id: "clear-specific",
        title: "Clear beats polite ambiguity",
        body: "Specific language helps both people. ‘Light pressure for a short side hug’ is safer than hoping someone interprets ‘I’m flexible’ correctly. Off-limits zones and hard stops should be easy to find — not buried in small talk.",
        takeaway: "Clarity is kindness.",
        scenario: {
          prompt:
            "Someone says “I’m fine with whatever.” Language-first response?",
          options: [
            {
              label:
                "Invite specific preferences and still use a Consent Snapshot intersection",
              feedback:
                "Yes. Polite flexibility is not a map. Help name limits; never treat vagueness as open season.",
            },
            {
              label: "Treat it as permission for any contact",
              feedback:
                "No. Ambiguity is not a yes. Strictest mutual boundaries still apply.",
            },
            {
              label: "Skip their map because they seem easygoing",
              feedback:
                "Easygoing is not consent. Profiles and snapshots still matter.",
            },
          ],
        },
      },
      {
        id: "change-anytime",
        title: "You can change your mind",
        body: "Editing a Touch Language profile changes future compatibility. During a session, either person can still withdraw immediately regardless of what the profile says. Soft Signal outranks every saved preference.",
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
    track: "foundations",
    themes: ["consent", "product-safety", "boundaries"],
    requiredBeforeFirstSession: true,
    relatedPractice: [
      {
        id: "fsp-snapshot",
        label: "Try Consent Snapshot prepare",
        hint: "Real product path for dual seal (demo partner on one device).",
        href: "/consent-snapshot/prepare",
      },
      {
        id: "fsp-soft",
        label: "Practice Soft Signal",
        hint: "Muscle memory without a peer.",
        href: "/soft-signal/practice",
      },
    ],
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
    track: "foundations",
    themes: ["boundaries", "recovery", "product-safety"],
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
    track: "foundations",
    themes: ["product-safety", "communication"],
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

  // ── Lived lessons: hard-earned relational skills ─────────────────────────
  // Consent · nervous system · boundaries · recovery · communication · self-compassion
  // Completing them never certifies safety, readiness, or consent skill.

  {
    id: "consent-as-language",
    title: "Consent as Language",
    summary:
      "Treat consent as something you speak and hear — not a vibe, smile, or past yes. Words over weather.",
    minutes: 6,
    track: "lived-lessons",
    themes: ["consent", "communication"],
    relatedQuizId: "vibe-short",
    relatedQuizPrompt:
      "Optional: short Vibe Quiz names weather only. Consent still needs words — try it privately after this module.",
    relatedPractice: [
      {
        id: "cal-snapshot",
        label: "Practice Consent Snapshot language",
        hint: "Turn words into a dual-affirmed document before any session.",
        href: "/consent-snapshot/prepare",
      },
      {
        id: "cal-tl",
        label: "Edit Touch Language with clearer sentences",
        hint: "Name pressure, zones, and hard limits in the map.",
        href: "/touch-language/edit",
      },
    ],
    steps: [
      {
        id: "cal-frame",
        title: "A language you practice",
        body: "Consent is not a vibe check or a personality trait. It is a living language: ask, answer, revise, stop. This module stays private on your device. Completing it does not make anyone “safe to touch.”",
        takeaway: "Practice the words. Never claim certification.",
        reflection:
          "What sentence would you want someone to use when asking you for contact?",
      },
      {
        id: "cal-words-not-weather",
        title: "Weather is not a yes",
        body: "Feeling warm, playful, or compatible does not authorize touch. Social weather — including a Vibe Quiz mix — can start a conversation. Only a clear, current, mutual yes about a specific act authorizes it. Silence, freezing, or “maybe later” is not a yes.",
        takeaway: "Attraction and affinity are language. Consent is a sentence.",
      },
      {
        id: "cal-grammar",
        title: "The grammar of a yes",
        body: "A usable yes names who, what, how much, and for how long — or points to a written snapshot that already does. “Sure” under social pressure is not free. “Yes to a short side hug, light pressure, standing” is a sentence. Soft Signal is the punctuation that can end any sentence early.",
        takeaway: "Specificity is how yes stays free.",
        scenario: {
          prompt:
            "Which invitation is closest to consent-as-language?",
          options: [
            {
              label:
                "“Would a short side hug with light pressure work for you right now?”",
              feedback:
                "Yes. Specific, time-bound, easy to decline — and still needs their free answer.",
            },
            {
              label: "“You look like you need a hug.”",
              feedback:
                "Mind-reading plus presumption. Better: ask what they want, if anything.",
            },
            {
              label: "Leaning in without words because the vibe is good",
              feedback:
                "Vibe is not grammar. Words (or a dual snapshot) come first.",
            },
          ],
        },
      },
      {
        id: "cal-specific-revocable",
        title: "Specific and revocable",
        body: "A yes to a side hug is not a yes to longer contact. A yes last week is not a yes today. Either person can change the sentence mid-way without owing a polished explanation. On Litmo, the Consent Snapshot and Soft Signal exist so this is structural, not optional manners.",
        takeaway: "A smaller yes never expands by implication.",
        scenario: {
          prompt:
            "You both affirmed a short, light side hug. They seem relaxed. You want to linger. What is language-first?",
          options: [
            {
              label:
                "Ask for a clear yes about longer contact before changing anything",
              feedback:
                "Yes. New duration is a new sentence. Wait for an explicit yes — or stop if unsure.",
            },
            {
              label: "Linger because the vibe feels mutual",
              feedback:
                "Vibe is not consent. The snapshot named a short hug. Changing it needs a new mutual yes.",
            },
            {
              label: "Assume they would say stop if they minded",
              feedback:
                "Putting the whole burden on “they’ll stop me” is not care. Offer a check-in or stay inside what was affirmed.",
            },
          ],
        },
      },
      {
        id: "cal-hearing-no",
        title: "Hearing no as complete",
        body: "No, not now, I need space, and Soft Signal are finished sentences. They do not require a debate, a better offer, or proof that you are still a good person. Your job is to stop, leave room, and regulate yourself without making their boundary manage your feelings.",
        takeaway: "A complete no needs no defense.",
        scenario: {
          prompt: "They say “not today” after you invite a session. Best reply?",
          options: [
            {
              label: "Thank them and leave the door open without pressure",
              feedback:
                "Yes. No is complete. Warmth without pursuit respects the language.",
            },
            {
              label: "Ask three more times with different times or activities",
              feedback:
                "Repeated asks can feel like pressure. One clear answer is enough.",
            },
            {
              label: "Share your Vibe result so they see you are a good match",
              feedback:
                "Weather is not persuasion. Matching quizzes never override a no.",
            },
          ],
        },
      },
      {
        id: "cal-close",
        title: "Language leaves the app with you",
        body: "Litmo structures the grammar; life still needs the habit. Outside the product, the same rules hold: current, specific, mutual, revocable. Completing this module never means you or anyone else is fluent forever — only that you practiced the words.",
        takeaway: "Fluency is practice, not a badge.",
      },
    ],
  },
  {
    id: "nervous-system-safety",
    title: "Nervous System Safety",
    summary:
      "Notice capacity, freeze, and aftercare — without diagnosing yourself or anyone else.",
    minutes: 6,
    track: "lived-lessons",
    themes: ["nervous-system", "consent", "self-compassion"],
    relatedQuizId: "soft-capacity",
    relatedQuizPrompt:
      "Optional: Soft Capacity is a private check for energy and “enough” — not a diagnosis.",
    relatedPractice: [
      {
        id: "nss-soft",
        label: "Practice Soft Signal exit",
        hint: "When capacity drops, exit can be immediate — practice without a peer.",
        href: "/soft-signal/practice",
      },
      {
        id: "nss-campfire",
        label: "Campfire co-regulation (local)",
        hint: "Quiet presence practices — never scored, never clinical.",
        href: "/campfire",
      },
    ],
    steps: [
      {
        id: "nss-frame",
        title: "Bodies keep score quietly",
        body: "This is not clinical advice and not a trauma screen. It is a short practice in noticing capacity so consent can stay free. Leave anytime if the topic is too much — Soft Signal thinking applies to learning too.",
        takeaway: "You can exit this module the same way you can exit a session.",
        reflection:
          "What does “enough room inside to say no” feel like in your body today?",
      },
      {
        id: "nss-capacity-first",
        title: "Capacity is consent-relevant",
        body: "A body that is flooded, exhausted, or shut down may still say “okay” to keep the peace. Trauma-informed practice treats capacity as real data: if you cannot freely choose, pause. You never owe a session when your system is asking for rest, food, quiet, or exit.",
        takeaway: "A free yes needs enough room inside to say no.",
      },
      {
        id: "nss-window",
        title: "Inside and outside the window",
        body: "Some days you have a wide window for connection. Other days even gentle contact is too much. Neither day makes you broken or “bad at Litmo.” Soft Capacity and Connection Pace quizzes can mirror patterns privately — they never diagnose and never authorize touch.",
        takeaway: "Capacity changes. Consent must track the change.",
        scenario: {
          prompt:
            "You accepted a request yesterday. Today your system feels fried. Language-first move?",
          options: [
            {
              label:
                "Cancel or Soft Signal path: name that today is not available, without over-explaining",
              feedback:
                "Yes. Yesterday’s yes is not today’s obligation. Free exit is allowed.",
            },
            {
              label: "Push through so you do not disappoint them",
              feedback:
                "Pushing through can make consent unfree. Disappointing someone is not the same as harming them by faking capacity.",
            },
            {
              label: "Show up and hope freeze does not happen",
              feedback:
                "Hope is not a regulation plan. Decline or reschedule while you still have choice.",
            },
          ],
        },
      },
      {
        id: "nss-freeze-is-data",
        title: "Freeze is information",
        body: "Going still, blank, or overly agreeable can be a protective response — not proof that everything is fine. If you notice freeze in yourself, you can Soft Signal, step away, or ask for a pause. If you notice it in someone else, do not escalate contact to “warm them up.” Reduce intensity and offer an easy exit.",
        takeaway: "Stillness is not an invitation to go further.",
        scenario: {
          prompt:
            "Mid-session they go quiet and still. You feel awkward. Safest move?",
          options: [
            {
              label:
                "Pause, lower intensity, and offer an easy stop without pressure",
              feedback:
                "Yes. Create room. Soft Signal and space are available. Do not fill silence with more touch.",
            },
            {
              label: "Keep going so they do not feel embarrassed",
              feedback:
                "Continuing to spare feelings can deepen freeze. Safety first; comfort can wait.",
            },
            {
              label: "Ask them to explain what is wrong right now",
              feedback:
                "Demanding a story mid-flood can overwhelm. Offer pause/stop first; conversation can come later if they want it.",
            },
          ],
        },
      },
      {
        id: "nss-aftercare-private",
        title: "Aftercare is private",
        body: "After contact — or after a stop — your system may need water, quiet, a walk, or no contact. Private wrap-up notes are for you. You are not required to soothe someone else’s ego after you set a boundary. Seeking professional support for ongoing distress is strength, not failure; Litmo is not therapy.",
        takeaway: "Your recovery pace is not a performance for anyone else.",
        scenario: {
          prompt:
            "After Soft Signal you feel shaky. They want to “talk it out” right away. Kindest for you?",
          options: [
            {
              label:
                "Take private aftercare first (water, quiet, space) — conversation only if you freely want it later",
              feedback:
                "Yes. Aftercare is yours. You do not owe an immediate debrief to soothe them.",
            },
            {
              label: "Stay until they feel better so you seem mature",
              feedback:
                "Managing their feelings mid-activation can cost your capacity. Exit is allowed.",
            },
            {
              label: "Skip noticing your body and re-enter discovery immediately",
              feedback:
                "Rest is curriculum. You can return when your system has room again.",
            },
          ],
        },
      },
      {
        id: "nss-close",
        title: "Regulation is not a performance",
        body: "You do not have to look calm to deserve an exit. You do not have to explain your nervous system to keep a limit. Product tools (Soft Signal, snapshot withdraw, block) exist so regulation does not depend on perfect social skills in the hardest second.",
        takeaway: "Tools back the body when words are hard.",
      },
    ],
  },
  {
    id: "boundaries",
    title: "Boundaries",
    summary:
      "Name limits early, hold them kindly, and refuse the trap of earning rest or safety.",
    minutes: 6,
    track: "lived-lessons",
    themes: ["boundaries", "communication", "consent"],
    relatedQuizId: "boundary-voice",
    relatedQuizPrompt:
      "Optional: Boundary Voice practices naming limits with warmth — private only.",
    relatedPractice: [
      {
        id: "bnd-tl",
        label: "Write limits into Touch Language",
        hint: "Hard stops and soft limits on the body map — editable anytime.",
        href: "/touch-language/edit",
      },
      {
        id: "bnd-snapshot",
        label: "Put limits in a Consent Snapshot",
        hint: "Session-bound affirmation of the intersection — not a vibe.",
        href: "/consent-snapshot/prepare",
      },
    ],
    steps: [
      {
        id: "bnd-frame",
        title: "Limits are information",
        body: "A boundary is data about what works for you today. It is not a rejection of someone’s worth. Short practice: early, clear, kind, changeable. Completing this module does not make you “good at boundaries” forever.",
        takeaway: "Clarity is a form of care.",
        reflection:
          "Name one limit you wish you had said earlier in a past interaction.",
      },
      {
        id: "bnd-early-clear",
        title: "Early and clear is kind",
        body: "A boundary said early saves both people from guessing. Soft language can still be firm: “I’m available for a short side hug, not longer contact today.” On Litmo, profiles and snapshots hold the written form so you do not have to re-argue the same limit every time.",
        takeaway: "Clarity protects the relationship you hope to have.",
      },
      {
        id: "bnd-scripts",
        title: "Scripts you can borrow",
        body: "You do not need perfect wording. Try: “Not for me.” “I need a smaller version.” “I’m at capacity.” “Let’s stay with what we already confirmed.” “Soft Signal — I need this to stop.” Kind tone is optional; clear stop is not.",
        takeaway: "Short sentences can hold big limits.",
        scenario: {
          prompt:
            "They suggest expanding contact mid-session past the snapshot. Language-first boundary?",
          options: [
            {
              label:
                "“That’s outside what we confirmed — I want to stay with the snapshot.”",
              feedback:
                "Yes. Points back to mutual agreement. Expansion needs a new yes later, not pressure now.",
            },
            {
              label: "Laugh it off and hope they drop it",
              feedback:
                "Ambiguity can be misread as soft yes. A clear line is kinder.",
            },
            {
              label: "Agree so the moment stays light",
              feedback:
                "Agreeing under social heat is not free consent. The snapshot exists so you can lean on it.",
            },
          ],
        },
      },
      {
        id: "bnd-not-earning",
        title: "You do not earn a boundary",
        body: "You do not need a trauma story, a perfect tone, or reciprocal flexibility to have a limit. “No” and “not that” are complete. People who care will adjust. People who punish boundaries are giving you information — use block and report tools if you need distance or review.",
        takeaway: "A boundary is a fact about you, not a negotiation chip.",
        scenario: {
          prompt:
            "Someone pushes after you already said a clear limit. What honors your boundary?",
          options: [
            {
              label:
                "Repeat once if needed, then stop contact or Soft Signal — no essay required",
              feedback:
                "Yes. You already answered. Escalation is not your homework.",
            },
            {
              label: "Offer a compromise so they do not feel rejected",
              feedback:
                "Compromise under pressure is not free consent. Your original limit can stand.",
            },
            {
              label: "Explain your whole history so they understand",
              feedback:
                "You may share history if you want later — never as a toll for basic respect.",
            },
          ],
        },
      },
      {
        id: "bnd-changing",
        title: "Boundaries can move",
        body: "Growing closer does not erase old limits automatically. Expanding a boundary needs a new mutual yes. Shrinking a boundary mid-way is always allowed. Profiles update future matches; Soft Signal ends the present moment.",
        takeaway: "Change is allowed in both directions — especially smaller.",
      },
      {
        id: "bnd-close",
        title: "Boundaries after the room",
        body: "A limit can also be how often you message, how soon you meet, and what you disclose. Pace is a boundary. Connection Pace quiz can mirror tempo privately — never as a weapon about who cares more.",
        takeaway: "Closeness has a tempo. Tempo is consent-relevant.",
      },
    ],
  },
  {
    id: "recovering-from-violation",
    title: "Recovering from Violation",
    summary:
      "After a boundary is crossed: your pace, your tools, and the truth that repair is never owed.",
    minutes: 6,
    track: "lived-lessons",
    themes: ["recovery", "boundaries", "self-compassion"],
    relatedQuizId: "soft-capacity",
    relatedQuizPrompt:
      "Optional: Soft Capacity can help you notice energy after hard moments — privately.",
    relatedPractice: [
      {
        id: "rfv-soft",
        label: "Soft Signal practice (muscle memory)",
        hint: "Exit tools work best when your body already knows the path.",
        href: "/soft-signal/practice",
      },
      {
        id: "rfv-log",
        label: "Personal Soft Signal log",
        hint: "Private notes after stops — never shared with peers.",
        href: "/soft-signal/log",
      },
    ],
    steps: [
      {
        id: "rfv-frame",
        title: "Careful room",
        body: "This section is non-graphic and optional. It does not replace crisis care, counseling, or trusted people in your life. If this topic is too much, exit now — that is self-trust, not failure. Completing the module never means you are “over it.”",
        takeaway: "You choose whether and when to continue.",
        reflection:
          "You can leave this module mid-step. Progress saves privately; rest is allowed.",
      },
      {
        id: "rfv-believe-yourself",
        title: "Believe your own no",
        body: "If something crossed a line, you do not need the other person to agree before it counts. Minimizing (“maybe I overreacted”) is common after harm. You can name it privately first: that was too much, too fast, or not what I agreed to. Your timeline for naming it is yours.",
        takeaway:
          "Your experience does not require their validation to be real.",
      },
      {
        id: "rfv-what-counts",
        title: "Crossing is not only dramatic",
        body: "Violation includes clear force — and also “just a little past” what was affirmed, ignoring Soft Signal, treating freeze as yes, or wearing someone down with repeated asks. Severity can vary; your right to tools does not. You do not need a perfect legal narrative to Soft Signal, block, or report.",
        takeaway: "You do not need a dramatic story to deserve an exit.",
        scenario: {
          prompt:
            "They kept going a little longer after you said “that’s enough.” Valid?",
          options: [
            {
              label:
                "Yes — that can be a boundary cross; tools and distance are available",
              feedback:
                "Yes. “A little” past a stop is still past a stop. Soft Signal, block, report, and rest are valid.",
            },
            {
              label: "Only if they meant harm",
              feedback:
                "Intent does not define impact. Your body and your yes still matter.",
            },
            {
              label: "Not if you smiled to keep peace",
              feedback:
                "Peacekeeping smiles are not free yeses. You can still name the cross privately and use tools.",
            },
          ],
        },
      },
      {
        id: "rfv-tools-not-performance",
        title: "Tools, not performance",
        body: "Litmo offers Soft Signal, block, report, and private wrap-up. Use what you need. You are not required to educate the person who crossed a line, accept an apology, or “process together” for their relief. Human review of reports is private. This module is not clinical care — if you are in ongoing distress, outside support can matter.",
        takeaway:
          "Safety tools exist so you do not have to fix this alone in the room.",
        scenario: {
          prompt:
            "A session went past what you affirmed. You feel shaken. What is a valid next step?",
          options: [
            {
              label:
                "Leave, Soft Signal if still open, and use block/report if you want distance or review",
              feedback:
                "Yes. Exit first. Tools are available without a perfect narrative.",
            },
            {
              label: "Stay until you can explain calmly so they understand",
              feedback:
                "You do not owe a calm seminar to keep yourself safe. Exit is enough.",
            },
            {
              label:
                "Wait to see if they apologize before deciding it was a problem",
              feedback:
                "Their apology does not define whether your boundary was crossed. You can decide on your own evidence.",
            },
          ],
        },
      },
      {
        id: "rfv-no-forced-repair",
        title: "Repair is optional",
        body: "Some people want a careful conversation later. Some never do. Neither path is more “evolved.” If you choose contact later, it still needs a new, free yes — not guilt. If you choose no contact, that is a complete ending. Completing learning modules never certifies that you or anyone else is “over it.”",
        takeaway: "Healing is not a performance of forgiveness.",
      },
      {
        id: "rfv-close",
        title: "Aftercare is not a grade",
        body: "Sleep, water, trusted people, professional care, and time are valid. So is doing nothing visible for a while. Litmo will not track whether you “healed right.” When you return, every real gate still applies — that is care, not a punishment for what happened.",
        takeaway: "Return on your terms. Gates protect the next yes.",
      },
    ],
  },
  {
    id: "partner-communication",
    title: "Partner Communication",
    summary:
      "Check in, repair small misses, and keep comparison or weather talk from becoming pressure.",
    minutes: 6,
    track: "lived-lessons",
    themes: ["communication", "boundaries", "consent"],
    relatedQuizId: "connection-pace",
    relatedQuizPrompt:
      "Optional: Connection Pace names how fast closeness feels good — privately, for you.",
    relatedPractice: [
      {
        id: "pc-share",
        label: "Partner quiz share (dual consent)",
        hint: "Invite only — compare only after both people consent. Never auto-open.",
        href: "/quizzes/share",
      },
      {
        id: "pc-tl-share",
        label: "Touch Language secure share",
        hint: "AES-GCM share with unlock code; private notes stripped.",
        href: "/touch-language/share",
      },
    ],
    steps: [
      {
        id: "pc-frame",
        title: "Talk is part of touch culture",
        body: "Platonic connection still needs language. This module is about check-ins and small repairs — not debate skills for winning. Completing it never means you are a perfect communicator.",
        takeaway: "Curiosity without pressure is the skill.",
      },
      {
        id: "pc-check-ins",
        title: "Short check-ins beat mind reading",
        body: "“How is this pressure?” and “Want to pause?” are gifts. Wait for a real answer. Pair words with an easy out. Shared Vibe weather or quiz comparison can be conversation fuel only after mutual consent to share and compare — never a script that someone must match.",
        takeaway: "Ask, wait, accept the answer.",
        scenario: {
          prompt:
            "Mid-hold, you are unsure if pressure is still okay. Best check-in?",
          options: [
            {
              label:
                "“How is this pressure — want the same, lighter, or stop?”",
              feedback:
                "Yes. Specific options plus an easy stop. Wait for their words.",
            },
            {
              label: "Keep going; they would Soft Signal if needed",
              feedback:
                "Soft Signal is a backstop, not a substitute for care. Offer a check-in.",
            },
            {
              label: "Tighten slightly to “test” their reaction",
              feedback:
                "Testing without asking is not consent-forward. Ask first.",
            },
          ],
        },
      },
      {
        id: "pc-small-repair",
        title: "Small repair, no courtroom",
        body: "If you misread a cue, own the miss briefly: “I went longer than we said — stopping.” Do not demand absolution. If they misread you, you may name impact without prosecuting their character. Serious harm still belongs in Soft Signal, block, and report — not endless “talk it out” while contact continues.",
        takeaway: "Repair is brief accountability, not a trial.",
        scenario: {
          prompt:
            "You want to share Vibe weather with a partner. What keeps it safe?",
          options: [
            {
              label:
                "Invite only, wait for explicit share and compare consent, accept no",
              feedback:
                "Yes. Partner quiz share on Litmo requires dual consent. No is complete.",
            },
            {
              label: "Send your result so they feel included",
              feedback:
                "Unsolicited intimate data can pressure. Invite first; never dump a sealed result without consent.",
            },
            {
              label: "Treat matching weather as permission to skip the snapshot",
              feedback:
                "Never. Weather is not consent. Every session still needs its own snapshot.",
            },
          ],
        },
      },
      {
        id: "pc-pace",
        title: "Pace is a boundary too",
        body: "How often you text, how soon you meet, and how much you disclose are limits. Different paces can coexist without one person “winning.” Soft Capacity and Connection Pace quizzes are private mirrors — not weapons in an argument about who cares more.",
        takeaway: "Tempo is part of consent to closeness.",
      },
      {
        id: "pc-conflict",
        title: "When talk is not enough",
        body: "If conversation becomes pressure, circular, or scary, you can end the conversation the same way you end a session: stop, space, block, report. Good communication includes knowing when words are no longer the right tool.",
        takeaway: "Exit is a communication skill.",
      },
      {
        id: "pc-close",
        title: "Outside the product",
        body: "The same habits travel: ask specifically, wait, accept no, repair briefly, escalate tools when needed. Litmo’s dual-consent share paths exist so comparison never becomes ambush. Completing modules does not prove you will always get this right.",
        takeaway: "Practice leaves with you. Perfection does not.",
      },
    ],
  },
  {
    id: "self-compassion",
    title: "Self-Compassion",
    summary:
      "After awkwardness, stops, or hard lessons — speak to yourself without cruelty. Rest is curriculum.",
    minutes: 5,
    track: "lived-lessons",
    themes: ["self-compassion", "nervous-system", "recovery"],
    relatedQuizId: "comfort-care",
    relatedQuizPrompt:
      "Optional: Comfort & Care maps what settles you — a soft private mirror.",
    relatedPractice: [
      {
        id: "sc-campfire",
        label: "Campfire Mode (quiet practices)",
        hint: "Local presence and co-regulation — never scored.",
        href: "/campfire",
      },
      {
        id: "sc-comfort-quiz",
        label: "Comfort & Care quiz",
        hint: "Private mirror for what settles you — never a grade.",
        href: "/quizzes/play?quizId=comfort-care",
      },
    ],
    steps: [
      {
        id: "sc-frame",
        title: "Kindness is not complacency",
        body: "Self-compassion is how you stay teachable without self-attack. It does not excuse harm to others. It does not require you to “stay open” after a stop. Completing this module never means you must be gentle forever — only that you practiced a kinder inner voice.",
        takeaway: "You can be firm with others and gentle with yourself.",
        reflection:
          "What would you say to a friend who just Soft Signaled — can you offer yourself a version of that?",
      },
      {
        id: "sc-human-not-broken",
        title: "Awkward is human",
        body: "Misreads, Soft Signals, and changed minds happen among careful people. Shame says you are uniquely bad. Self-compassion says you are learning a language in public-ish privacy. Completing modules or quizzes never means you must be perfect next time.",
        takeaway: "Skill grows; cruelty toward yourself does not help it grow.",
      },
      {
        id: "sc-two-directions",
        title: "If you stopped — or were stopped",
        body: "If you used Soft Signal, you protected something important. If someone else did, their stop is not a verdict on your worth. If you crossed a line, self-compassion includes accountability: stop, repair briefly if wanted, use tools if needed — without spiraling into self-erasure or demanding their caretaking.",
        takeaway: "Worth and accountability can coexist.",
        scenario: {
          prompt:
            "You realize you went a little past what was affirmed. Self-compassionate accountability?",
          options: [
            {
              label:
                "Stop immediately, own the miss briefly, do not demand absolution, give space",
              feedback:
                "Yes. Brief ownership plus space. Their process is not yours to manage.",
            },
            {
              label: "Explain for a long time so they know you are good deep down",
              feedback:
                "Long defense can center you. Short accountability, then room.",
            },
            {
              label: "Attack yourself harshly so they see you suffer enough",
              feedback:
                "Self-attack is not repair. It can also pressure them to soothe you.",
            },
          ],
        },
      },
      {
        id: "sc-after-stop",
        title: "After a stop",
        body: "Private wrap-up is for gentle reflection, not a trial transcript. Rest before you re-enter discovery or partner share. Quizzes are mirrors, not cures. Certainty is not required to rest.",
        takeaway: "A stop can be success at honesty.",
        scenario: {
          prompt:
            "You feel embarrassed after a session ended early. Kindest next step?",
          options: [
            {
              label:
                "Pause contact, tend to your body, and revisit only when you want to",
              feedback:
                "Yes. Self-compassion includes time and care — not forcing a rebound session.",
            },
            {
              label: "Message immediately to prove you are still good",
              feedback:
                "That can pressure both of you. Worth is not repaired by urgent texts.",
            },
            {
              label: "Retake every quiz until you feel certain you are fixed",
              feedback:
                "Quizzes are mirrors, not cures. Certainty is not required to rest.",
            },
          ],
        },
      },
      {
        id: "sc-enough",
        title: "Enough for today",
        body: "You can stop learning mid-module, skip optional quizzes, and leave Litmo for the day. Self-compassion includes not optimizing your healing. When you return, every real gate still applies — which is a form of care, not a punishment.",
        takeaway: "Rest is part of the curriculum.",
      },
    ],
  },
];

/** Recommended paths through the curriculum — never required, never scored. */
export const learningPaths: LearningPath[] = [
  {
    id: "first-session-readiness",
    title: "Before a first session",
    summary:
      "Product gates and lived consent language — recommended practice, not a certificate.",
    minutes: 28,
    moduleIds: [
      "consent-as-language",
      "consent-snapshots",
      "soft-signal",
      "touch-language",
      "full-session-practice",
    ],
  },
  {
    id: "consent-and-language",
    title: "Consent & language",
    summary:
      "Words over weather: specific yes, complete no, and the product map that holds them.",
    minutes: 16,
    moduleIds: [
      "consent-as-language",
      "consent-snapshots",
      "touch-language",
      "partner-communication",
    ],
  },
  {
    id: "nervous-system-and-capacity",
    title: "Nervous system & capacity",
    summary:
      "Capacity, freeze, Soft Signal, and self-compassion — private, non-clinical.",
    minutes: 15,
    moduleIds: [
      "nervous-system-safety",
      "soft-signal",
      "self-compassion",
    ],
  },
  {
    id: "boundaries-in-practice",
    title: "Boundaries in practice",
    summary:
      "Early clarity, scripts, holding limits under pressure, product maps.",
    minutes: 15,
    moduleIds: ["boundaries", "touch-language", "blocking-and-reporting"],
  },
  {
    id: "after-hard-moments",
    title: "After hard moments",
    summary:
      "Recovery tools, optional repair, self-compassion — leave anytime; not therapy.",
    minutes: 15,
    moduleIds: [
      "recovering-from-violation",
      "self-compassion",
      "blocking-and-reporting",
    ],
  },
  {
    id: "full-lived-track",
    title: "Full lived-lessons track",
    summary:
      "All six hard-learned modules in a calm order. Optional quizzes after each.",
    minutes: 35,
    moduleIds: [
      "consent-as-language",
      "nervous-system-safety",
      "boundaries",
      "recovering-from-violation",
      "partner-communication",
      "self-compassion",
    ],
  },
];

export function findLearningModule(id: string | undefined) {
  return learningModules.find((module) => module.id === id);
}

export function findLearningPath(id: string | undefined) {
  return learningPaths.find((path) => path.id === id);
}

export function learningModulesForTrack(track: LearningTrack) {
  return learningModules.filter((module) => module.track === track);
}

export function learningModulesForTheme(theme: LearningTheme) {
  return learningModules.filter((module) => module.themes.includes(theme));
}

/** Lived-lesson modules that suggest a related private quiz. */
export function modulesLinkedToQuiz(quizId: QuizCatalogId) {
  return learningModules.filter((module) => module.relatedQuizId === quizId);
}

/**
 * First incomplete module in path order, then required foundations, then
 * remaining catalog. Never blocks product features.
 */
export function recommendedNextModule(
  progress: Record<string, { completed?: boolean } | undefined>,
): LearningModule | undefined {
  const incomplete = (id: string) => !progress[id]?.completed;

  for (const path of learningPaths) {
    if (path.id !== "first-session-readiness") continue;
    for (const id of path.moduleIds) {
      if (incomplete(id)) return findLearningModule(id);
    }
  }

  for (const module of learningModules) {
    if (module.requiredBeforeFirstSession && incomplete(module.id)) {
      return module;
    }
  }

  for (const module of learningModulesForTrack("lived-lessons")) {
    if (incomplete(module.id)) return module;
  }

  for (const module of learningModules) {
    if (incomplete(module.id)) return module;
  }

  return undefined;
}

/** Next incomplete module after `currentId` within a path, or undefined. */
export function nextModuleInPath(
  pathId: string,
  currentId: string,
  progress: Record<string, { completed?: boolean } | undefined>,
): LearningModule | undefined {
  const path = findLearningPath(pathId);
  if (!path) return undefined;
  const idx = path.moduleIds.indexOf(currentId);
  if (idx < 0) return undefined;
  for (let i = idx + 1; i < path.moduleIds.length; i++) {
    const id = path.moduleIds[i]!;
    if (!progress[id]?.completed) return findLearningModule(id);
  }
  return undefined;
}

export function pathCompletion(
  path: LearningPath,
  progress: Record<string, { completed?: boolean } | undefined>,
) {
  const done = path.moduleIds.filter((id) => progress[id]?.completed).length;
  return { done, total: path.moduleIds.length };
}
