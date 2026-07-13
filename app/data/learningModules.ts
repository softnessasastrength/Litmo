import type { QuizCatalogId } from "./quizCatalog.ts";

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

/** Catalog tracks for the Learn hub. */
export type LearningTrack = "foundations" | "lived-lessons";

export type LearningModule = {
  id: string;
  title: string;
  summary: string;
  minutes: number;
  /** foundations = product safety map; lived-lessons = hard-earned relational skills. */
  track: LearningTrack;
  requiredBeforeFirstSession?: boolean;
  /**
   * Optional private Vibe / self-quiz to try after the module.
   * Never required; never treated as competence or safety proof.
   */
  relatedQuizId?: QuizCatalogId;
  /** Soft invite copy for the related quiz card. */
  relatedQuizPrompt?: string;
  steps: LearningStep[];
};

export const learningModules: LearningModule[] = [
  {
    id: "consent-snapshots",
    title: "Consent Snapshots",
    summary:
      "Learn why both people confirm the same current boundaries before a session can begin.",
    minutes: 4,
    track: "foundations",
    requiredBeforeFirstSession: true,
    relatedQuizId: "vibe-short",
    relatedQuizPrompt:
      "Optional: a short Vibe Quiz can name your social weather — never a consent substitute.",
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
    track: "foundations",
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
    track: "foundations",
    relatedQuizId: "vibe-short",
    relatedQuizPrompt:
      "Optional: notice how today’s social weather sits beside your Touch Language — both stay private.",
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
    track: "foundations",
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
    track: "foundations",
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

  // —— Lived lessons: hard-earned relational skills (private, short, interactive) ——

  {
    id: "consent-as-language",
    title: "Consent as Language",
    summary:
      "Treat consent as something you speak and hear — not a vibe, smile, or past yes.",
    minutes: 4,
    track: "lived-lessons",
    relatedQuizId: "vibe-short",
    relatedQuizPrompt:
      "Optional: the short Vibe Quiz names weather, not permission. Consent still needs words.",
    steps: [
      {
        id: "cal-words-not-weather",
        title: "Weather is not a yes",
        body: "Feeling warm, playful, or compatible does not authorize touch. Social weather — including a Vibe Quiz mix — can start a conversation. Only a clear, current, mutual yes about a specific act authorizes it. Silence, freezing, or “maybe later” is not a yes.",
        takeaway: "Attraction and affinity are language. Consent is a sentence.",
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
              label: "Ask for a clear yes about longer contact before changing anything",
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
      },
    ],
  },
  {
    id: "nervous-system-safety",
    title: "Nervous System Safety",
    summary:
      "Notice capacity, freeze, and aftercare — without diagnosing yourself or anyone else.",
    minutes: 4,
    track: "lived-lessons",
    relatedQuizId: "soft-capacity",
    relatedQuizPrompt:
      "Optional: Soft Capacity is a private weather check for energy and “enough.”",
    steps: [
      {
        id: "nss-capacity-first",
        title: "Capacity is consent-relevant",
        body: "A body that is flooded, exhausted, or shut down may still say “okay” to keep the peace. Trauma-informed practice treats capacity as real data: if you cannot freely choose, pause. You never owe a session when your system is asking for rest, food, quiet, or exit.",
        takeaway: "A free yes needs enough room inside to say no.",
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
              label: "Pause, lower intensity, and offer an easy stop without pressure",
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
      },
    ],
  },
  {
    id: "boundaries",
    title: "Boundaries",
    summary:
      "Name limits early, hold them kindly, and refuse the trap of earning rest or safety.",
    minutes: 4,
    track: "lived-lessons",
    relatedQuizId: "boundary-voice",
    relatedQuizPrompt:
      "Optional: Boundary Voice is a short private practice in naming limits with warmth.",
    steps: [
      {
        id: "bnd-early-clear",
        title: "Early and clear is kind",
        body: "A boundary said early saves both people from guessing. Soft language can still be firm: “I’m available for a short side hug, not longer contact today.” On Litmo, profiles and snapshots hold the written form so you do not have to re-argue the same limit every time.",
        takeaway: "Clarity protects the relationship you hope to have.",
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
              label: "Repeat once if needed, then stop contact or Soft Signal — no essay required",
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
    ],
  },
  {
    id: "recovering-from-violation",
    title: "Recovering from Violation",
    summary:
      "After a boundary is crossed: your pace, your tools, and the truth that repair is never owed.",
    minutes: 4,
    track: "lived-lessons",
    relatedQuizId: "soft-capacity",
    relatedQuizPrompt:
      "Optional: Soft Capacity can help you notice energy after hard moments — privately.",
    steps: [
      {
        id: "rfv-believe-yourself",
        title: "Believe your own no",
        body: "If something crossed a line, you do not need the other person to agree before it counts. Minimizing (“maybe I overreacted”) is common after harm. You can name it privately first: that was too much, too fast, or not what I agreed to. Your timeline for naming it is yours.",
        takeaway: "Your experience does not require their validation to be real.",
      },
      {
        id: "rfv-tools-not-performance",
        title: "Tools, not performance",
        body: "Litmo offers Soft Signal, block, report, and private wrap-up. Use what you need. You are not required to educate the person who crossed a line, accept an apology, or “process together” for their relief. Human review of reports is private. This module is not clinical care — if you are in ongoing distress, outside support can matter.",
        takeaway: "Safety tools exist so you do not have to fix this alone in the room.",
        scenario: {
          prompt:
            "A session went past what you affirmed. You feel shaken. What is a valid next step?",
          options: [
            {
              label: "Leave, Soft Signal if still open, and use block/report if you want distance or review",
              feedback:
                "Yes. Exit first. Tools are available without a perfect narrative.",
            },
            {
              label: "Stay until you can explain calmly so they understand",
              feedback:
                "You do not owe a calm seminar to keep yourself safe. Exit is enough.",
            },
            {
              label: "Wait to see if they apologize before deciding it was a problem",
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
    ],
  },
  {
    id: "partner-communication",
    title: "Partner Communication",
    summary:
      "Check in, repair small misses, and keep comparison or weather talk from becoming pressure.",
    minutes: 4,
    track: "lived-lessons",
    relatedQuizId: "connection-pace",
    relatedQuizPrompt:
      "Optional: Connection Pace names how fast closeness feels good — privately, for you.",
    steps: [
      {
        id: "pc-check-ins",
        title: "Short check-ins beat mind reading",
        body: "“How is this pressure?” and “Want to pause?” are gifts. Wait for a real answer. Pair words with an easy out. Shared Vibe weather or quiz comparison can be conversation fuel only after mutual consent to share and compare — never a script that someone must match.",
        takeaway: "Curiosity without pressure is the skill.",
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
              label: "Invite only, wait for explicit share and compare consent, accept no",
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
    ],
  },
  {
    id: "self-compassion",
    title: "Self-Compassion",
    summary:
      "After awkwardness, stops, or hard lessons — speak to yourself without cruelty.",
    minutes: 3,
    track: "lived-lessons",
    relatedQuizId: "comfort-care",
    relatedQuizPrompt:
      "Optional: Comfort & Care is a soft private map of what settles you.",
    steps: [
      {
        id: "sc-human-not-broken",
        title: "Awkward is human",
        body: "Misreads, Soft Signals, and changed minds happen among careful people. Shame says you are uniquely bad. Self-compassion says you are learning a language in public-ish privacy. Completing modules or quizzes never means you must be perfect next time.",
        takeaway: "Skill grows; cruelty toward yourself does not help it grow.",
      },
      {
        id: "sc-after-stop",
        title: "After a stop",
        body: "If you used Soft Signal, you protected something important. If someone else did, their stop is not a verdict on your worth. Private wrap-up is for gentle reflection, not a trial transcript. Rest before you re-enter discovery or partner share.",
        takeaway: "A stop can be success at honesty.",
        scenario: {
          prompt: "You feel embarrassed after a session ended early. Kindest next step?",
          options: [
            {
              label: "Pause contact, tend to your body, and revisit only when you want to",
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

export function findLearningModule(id: string | undefined) {
  return learningModules.find((module) => module.id === id);
}

export function learningModulesForTrack(track: LearningTrack) {
  return learningModules.filter((module) => module.track === track);
}

/** Lived-lesson modules that suggest a related private quiz. */
export function modulesLinkedToQuiz(quizId: QuizCatalogId) {
  return learningModules.filter((module) => module.relatedQuizId === quizId);
}
