/**
 * WHAT: Shared shape for mode-specific user-facing copy packs.
 * WHY:  Maximum and App Store packs must implement the same keys so screens
 *       never branch on missing strings.
 * CONSENT: Copy may soften tone; it must never require a reason to stop,
 *       claim safety scores, or imply profile = consent.
 */

export type SoftSignalCopyPack = {
  button: string;
  buttonStopping: string;
  buttonStopped: string;
  hint: string;
  bannerTitle: string;
  bannerBody: string;
  endedTitle: string;
  endedBody: string;
  pendingSync: string;
  practiceTitle: string;
  practiceBody: string;
  logEmpty: string;
  logPrivacy: string;
  notEmergency: string;
  stickyLabel: string;
};

export type EntryCopyPack = {
  eyebrow: string;
  title: string;
  body: string;
  demoTitle: string;
  demoBody: string;
  demoNoticeTitle: string;
  demoNoticeBody: string;
  demoButton: string;
  realTitle: string;
  realBody: string;
  footer: string;
  modeBadgeMaximum: string;
  modeBadgeAppStore: string;
};

export type WelcomeCopyPack = {
  kicker: string;
  title: string;
  body: string;
  primary: string;
  caption: string;
};

export type ModeCopyPack = {
  softSignal: SoftSignalCopyPack;
  entry: EntryCopyPack;
  welcome: WelcomeCopyPack;
  /** Generic name for the founder's real partner in Maximum-mode containment
   *  copy ("Renn"); genericized to "your partner" for App Store Safe so a
   *  stranger's screen never displays someone else's real name. */
  partnerName: string;
};
