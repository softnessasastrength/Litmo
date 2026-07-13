/**
 * In-app privacy & data-protection copy.
 * Versioned for notice acceptance. Not a substitute for qualified legal review.
 */

export const PRIVACY_NOTICE_VERSION = "2026-07-13-v1";

export type PrivacySection = {
  id: string;
  title: string;
  body: string;
};

export const privacyPolicySections: PrivacySection[] = [
  {
    id: "who",
    title: "Who we are",
    body: "Litmo is a consent-centered prototype for platonic, non-sexual physical connection between consenting adults. It is not emergency care, dating, or therapy. The operator identity for a public launch (controller name, contact, DPO if required) will appear here after legal review. Until then this notice describes the product as implemented in this repository.",
  },
  {
    id: "what",
    title: "What we collect",
    body: "Depending on how you use Litmo we may process: account identifiers and passkey device metadata; profile and discovery fields you choose to show; Touch Language and consent preference versions (body zones, pressure, hard stops); Consent Snapshots shared only with a session counterpart; session lifecycle audit facts; private wrap-up outcomes and optional encrypted notes; safety reports you submit; optional owner-only quiz summaries; and technical logs that deliberately avoid sensitive free text. Demo mode does not create a server account.",
  },
  {
    id: "sensitive",
    title: "Sensitive categories we protect especially",
    body: "Touch profiles, consent preferences, Consent Snapshots, and private nervous-system or wrap-up notes are treated as high-sensitivity. They are not discovery fields. Private free text uses device-bound application encryption where designed. Snapshots are participant-scoped under row-level security. Partner quiz weather shared with another person uses end-to-end encryption so the server only sees ciphertext when a relay is used.",
  },
  {
    id: "why",
    title: "Why we process data",
    body: "To provide account access; to store your boundaries and compute conservative session compatibility; to run explicit dual-consent session flows; to support Soft Signal withdrawal; to operate safety reporting and human moderation; and to offer optional self-understanding quizzes. We do not sell personal data or run third-party advertising SDKs in the current build.",
  },
  {
    id: "bases",
    title: "Legal bases (intent)",
    body: "Product intent is to rely on contract (providing the service you request), explicit consent where intimate preference data requires it, and legitimate interests or legal obligations for safety moderation. Exact bases for each jurisdiction must be confirmed by qualified counsel before public marketing claims of full GDPR compliance.",
  },
  {
    id: "sharing",
    title: "Who can see what",
    body: "You see your own private data. A session counterpart sees only shared snapshot semantics, not your private encrypted notes. Moderators see structured report fields under staff auth — not your passkeys. Processors currently include infrastructure such as Supabase and Apple (passkeys/biometrics). Subprocessor lists will be finalized for public release.",
  },
  {
    id: "retention",
    title: "How long we keep data",
    body: "Private-alpha design includes cascade deletion with sessions for many session-scoped rows and timed purge helpers for some safety-ops artifacts. Production retention windows and complete automated account deletion are not finalized and are blocked pending legal and operational ownership. You can export your data and request erasure in the app; device-local data can be wiped immediately on this phone.",
  },
  {
    id: "rights",
    title: "Your rights",
    body: "You can access and port data via Export my data; request erasure; rectify profile and preference data; withdraw session consent anytime; and control device-local preferences (including Neurodivergent Mode). To exercise rights use Data protection in Settings. Complaints to a supervisory authority will be documented with contact details in a reviewed public notice.",
  },
  {
    id: "security",
    title: "Security measures",
    body: "Row-level security, passkey-first auth, device Keychain storage for secrets, optional application encryption for sensitive free text, privacy-safe logging, and Face ID step-up on private screens for real accounts. No system is perfect; report vulnerabilities through responsible channels when published.",
  },
  {
    id: "children",
    title: "Children",
    body: "Litmo is for adults only. Age eligibility gating is required for real matching. Do not use the service if you are not an adult under applicable law.",
  },
  {
    id: "changes",
    title: "Changes",
    body: `This notice version is ${PRIVACY_NOTICE_VERSION}. Material changes will bump the version. Signed-in users may be asked to acknowledge a new version.`,
  },
];

export const dataProtectionSections: PrivacySection[] = [
  {
    id: "minimization",
    title: "Data minimization",
    body: "We collect what the product needs for consent-centered sessions and safety. Discovery shows only intentional public fields. Private notes and partner quiz plaintext are not written to discovery or general logs.",
  },
  {
    id: "touch-consent",
    title: "Touch profiles & Consent Snapshots",
    body: "Your Touch Language and consent preference versions are owner-controlled and versioned. A Consent Snapshot is the exact shared document both people affirm for one session — it is not permanent consent for future touch. Withdrawal does not require a reason. Private nervous-system notes stay out of shared snapshots.",
  },
  {
    id: "export",
    title: "Export (portability)",
    body: "Generate a structured JSON export of server-side categories available to you, plus device-local categories we can read on this phone (quiz results, learning progress metadata, invite counts — never raw encryption private keys).",
  },
  {
    id: "erasure",
    title: "Erasure (delete)",
    body: "You can wipe device-local Litmo data immediately. You can submit an account erasure request for human/ops fulfillment. Complete automatic destruction of every server record is intentionally not silently performed until legal and operational owners approve destructive deletion workflows.",
  },
  {
    id: "demo",
    title: "Demo mode",
    body: "Demo does not create a server account. Prefer fictional data. Local progress may still sit on the device until you clear it.",
  },
  {
    id: "contact",
    title: "Contact",
    body: "Controller contact and EU representative details will be published after legal review. Until then, use repository stewardship channels documented for private alpha.",
  },
];
