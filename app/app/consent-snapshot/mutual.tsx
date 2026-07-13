/**
 * Consent Snapshot — mutual seal screen (dual affirm + withdraw + enter session).
 *
 * WHAT (module): Display intersection package; require both-side checklists + grant-arm dwell;
 * seal via affirmParty×2; withdraw clears seal; sealed path may enter active session.
 * WHY: Dual independent affirm is constitutional; demo practice partner is labeled, not forged remote.
 * CONSENT: prepare ≠ mutual seal ≠ touch. Soft Signal always available. Withdraw faster than seal.
 * Dual affirm required. Withdraw clears seal. Fingerprint shown for same-package honesty.
 * NEVER: One-phone practice partner is not two real people; seal is not lifelong safety.
 * SEE: sessionConsentSnapshotCore · useConsentGrantArm · docs/CODE_COMMENT_STANDARD.md
 */

import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Text, View } from "react-native";
import {
  Body,
  Button,
  Card,
  Eyebrow,
  Screen,
  Title,
} from "../../components/ui";
import { ConsentAffirmRow } from "../../components/ConsentAffirmRow";
import {
  affirmParty,
  createMutualSnapshot,
  createPracticePartnerDeclaration,
  isSealed,
  mutualSnapshotRows,
  withdrawMutualSnapshot,
  type AffirmationChecks,
  type MutualConsentSnapshot,
  type PreSessionDeclaration,
} from "../../lib/sessionConsentSnapshotCore";
import { CONSENT_POINTS, CONSENT_TIMING } from "../../lib/consentInteractionCore";
import { useConsentGrantArm } from "../../hooks/useConsentGrantArm";
import { sessionConsentSnapshotStore } from "../../services/sessionConsentSnapshotStore";
import { hapticService } from "../../services/hapticService";
import { fonts, type AppColors } from "../../theme";
import { useThemedStyles } from "../../hooks/useThemedStyles";
import { scheduleDemoNotification } from "../../services/notifications";

/**
 * WHAT: UI toggle state for dual-seal checklists before casting to AffirmationChecks.
 * WHY: Core AffirmationChecks requires all true; UI must accumulate intentional toggles first.
 * CONSENT: All false by default — no pre-checked consent (anti-accident grammar).
 * EDGE CASES: Spreading EMPTY_CHECKS on rebuild clears mid-edit after package change.
 * NEVER: Do not start with any true “to save taps”.
 */
const EMPTY_CHECKS = {
  reviewedBoundaries: false,
  reviewedSafewords: false,
  reviewedAftercare: false,
  affirmedSoftSignal: false,
  thisMomentOnly: false,
  notAGuaranteeOfSafety: false,
};

/**
 * WHAT: Row config for self/partner ConsentAffirmRow lists (keys + point ids + labels).
 * WHY: Shared structure for dual columns; Soft Signal row uses dedicated pointId.
 * CONSENT: Each row is intentional affirm; Soft Signal never optional in the list.
 * EDGE CASES: Partner labels rewrite first-person “I/This” for demo role clarity.
 * NEVER: Do not drop notAGuaranteeOfSafety — seal must not claim eternal safety.
 */
const SELF_ROWS = [
  {
    key: "reviewedBoundaries" as const,
    pointId: "snapshot_mutual_self_affirm" as const,
    label: "I read every boundary row for this moment",
  },
  {
    key: "reviewedSafewords" as const,
    pointId: "snapshot_mutual_self_affirm" as const,
    label: "I know both sets of stop / slow words",
  },
  {
    key: "reviewedAftercare" as const,
    pointId: "snapshot_mutual_self_affirm" as const,
    label: "I reviewed aftercare overlap carefully",
  },
  {
    key: "affirmedSoftSignal" as const,
    pointId: "snapshot_soft_signal_ack" as const,
    label: CONSENT_POINTS.snapshot_soft_signal_ack.copy.primary,
  },
  {
    key: "thisMomentOnly" as const,
    pointId: "snapshot_mutual_self_affirm" as const,
    label: "This yes is for this moment only",
  },
  {
    key: "notAGuaranteeOfSafety" as const,
    pointId: "snapshot_mutual_self_affirm" as const,
    label: "This seal never proves anyone is safe forever",
  },
];

/**
 * WHAT: Mutual Consent Snapshot seal screen — dual affirm, withdraw, enter session.
 * WHY: Only mutual seal of the same package may proceed to active session in the demo path.
 * CONSENT: Practice partner on one phone is rehearsal only. Withdraw requires no explanation.
 * Grant arm dwell slows seal; Soft Signal / withdraw never waits for arm.
 * EDGE CASES:
 *   - missing self declaration → redirect CTA to prepare
 *   - existing non-withdrawn mutual loaded from vault
 *   - withdrawn or missing mutual → create practice partner + rebuild snapshot
 *   - seal button disabled until arm + all checks
 * NEVER: Do not forge remote partner yes; do not auto-seal on focus.
 * SEE: affirmParty, withdrawMutualSnapshot, useConsentGrantArm
 */
export default function ConsentSnapshotMutualScreen() {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const [selfDecl, setSelfDecl] = useState<PreSessionDeclaration | null>(null);
  const [partnerDecl, setPartnerDecl] =
    useState<PreSessionDeclaration | null>(null);
  const [snap, setSnap] = useState<MutualConsentSnapshot | null>(null);
  const [checksA, setChecksA] = useState({ ...EMPTY_CHECKS });
  const [checksB, setChecksB] = useState({ ...EMPTY_CHECKS });
  const [error, setError] = useState("");

  /**
   * WHAT: Rebuild mutual snapshot from two declarations and reset both checklists.
   * WHY: Fingerprint and intersection must match current parties; stale checks must not seal.
   * CONSENT: New package starts unsealed; prior toggles wiped (fail-closed vs carry-over yes).
   * EDGE CASES: Called when creating practice partner package on focus.
   * NEVER: Do not copy sealedAt from an old snap into the new rebuild.
   */
  const rebuild = useCallback(
    (a: PreSessionDeclaration, b: PreSessionDeclaration) => {
      const next = createMutualSnapshot(a, b);
      setSnap(next);
      // Reset toggles — package identity changed; old yes is invalid.
      setChecksA({ ...EMPTY_CHECKS });
      setChecksB({ ...EMPTY_CHECKS });
      return next;
    },
    [],
  );

  /**
   * WHAT: On focus, load self declaration + mutual; seed practice partner if needed.
   * WHY: Demo path must always have a dual package without requiring a second device.
   * CONSENT: If mutual withdrawn or missing, practice partner is synthetic and labeled in UI.
   * EDGE CASES:
   *   - no declaration → selfDecl null (gate screen)
   *   - existing mutual not withdrawn → resume (may be sealed)
   *   - unmount race: active flag prevents setState after leave
   * NEVER: Do not silently treat practice partner as remote verified human.
   */
  useFocusEffect(
    useCallback(() => {
      let active = true;
      void (async () => {
        const decl = await sessionConsentSnapshotStore.loadDeclaration();
        const existing = await sessionConsentSnapshotStore.loadMutual();
        // Race: screen blurred before vault returns — drop updates.
        if (!active) return;
        if (!decl) {
          // Fail-closed: cannot mutual-seal without prepare-side declaration.
          setSelfDecl(null);
          return;
        }
        setSelfDecl(decl);
        // Resume non-withdrawn mutual (sealed or mid-affirm persistence).
        if (existing && !existing.withdrawnAt) {
          setSnap(existing);
          setPartnerDecl(existing.partyB);
          return;
        }
        // Withdrawn or absent → new practice package for demo dual-seal.
        const partner = createPracticePartnerDeclaration();
        setPartnerDecl(partner);
        rebuild(decl, partner);
      })();
      return () => {
        active = false;
      };
    }, [rebuild]),
  );

  const allA = Object.values(checksA).every(Boolean);
  const allB = Object.values(checksB).every(Boolean);
  // Content ready for arm only when package exists, not withdrawn, not already sealed.
  const contentReady = Boolean(snap && !snap.withdrawnAt && !isSealed(snap));
  /**
   * Grant arm: dwell after all toggles — seal is deliberately slower than withdraw.
   * fingerprintCurrent: package present; withdrawn freezes arm false.
   */
  const { armed: sealArmed, armProgress } = useConsentGrantArm({
    contentReady,
    requiredTogglesAllOn: allA && allB,
    fingerprintCurrent: Boolean(snap?.fingerprint),
    withdrawn: Boolean(snap?.withdrawnAt),
  });

  /**
   * WHAT: Dual affirmParty then persist sealed mutual when grant arm is live.
   * WHY: Core seals only when both parties affirmed; UI enforces arm + all checks first.
   * CONSENT: Both sides use full AffirmationChecks including Soft Signal + not safety forever.
   * EDGE CASES:
   *   - !sealArmed → error with distinct copy for incomplete checks vs dwell
   *   - isSealed false after dual affirm → error (should not happen if checks complete)
   *   - affirm throws snapshot_withdrawn / already_sealed → message
   * NEVER: Do not call affirmParty for only one party and claim sealed.
   */
  const seal = async () => {
    if (!snap || !selfDecl || !partnerDecl) return;
    // Fail-closed: no seal until arm (dwell + toggles + content).
    if (!sealArmed) {
      setError(
        allA && allB
          ? "Hold a breath — seal arms after a short deliberate pause."
          : "Every protective check must be affirmed by both sides.",
      );
      return;
    }
    setError("");
    try {
      const checks: AffirmationChecks = {
        reviewedBoundaries: true,
        reviewedSafewords: true,
        reviewedAftercare: true,
        affirmedSoftSignal: true,
        thisMomentOnly: true,
        notAGuaranteeOfSafety: true,
      };
      // Dual independent affirm required — sequential on same package.
      let next = affirmParty(snap, "partyA", checks);
      next = affirmParty(next, "partyB", checks);
      // Fail-closed: refuse to persist if core did not seal.
      if (!isSealed(next)) {
        setError("Seal incomplete.");
        return;
      }
      await sessionConsentSnapshotStore.saveMutual(next);
      setSnap(next);
      void hapticService.play("confirmation");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not seal snapshot.",
      );
    }
  };

  /**
   * WHAT: Withdraw mutual package as partyA — clear seal, persist, Soft Signal haptic.
   * WHY: Withdraw must be faster and freer than sealing; no peer, dwell, or reason.
   * CONSENT: withdrawMutualSnapshot clears affirmations + sealedAt; Soft Signal spirit.
   * EDGE CASES: No snap → no-op; works whether sealed or mid-checklist.
   * NEVER: Do not require confirmation modal that traps the user; do not require explanation.
   */
  const withdraw = async () => {
    if (!snap) return;
    const next = withdrawMutualSnapshot(snap, "partyA");
    await sessionConsentSnapshotStore.saveMutual(next);
    setSnap(next);
    // Soft Signal haptic family — withdraw is free exit, not confirmation chime.
    void hapticService.play("softSignal");
  };

  /**
   * WHAT: Enter active session only when mutual package is sealed.
   * WHY: Demo vertical slice — Soft Signal ready session after dual seal.
   * CONSENT: isSealed gate; sealedSnapshotId param is moment-specific package id only.
   * EDGE CASES: Unsealed → no-op; scheduleDemoNotification is demo-only side effect.
   * NEVER: Do not enter session from unsealed or withdrawn snap.
   */
  const enterSession = async () => {
    // Fail-closed: active session requires dual seal now.
    if (!snap || !isSealed(snap)) return;
    await scheduleDemoNotification(4);
    router.push({
      pathname: "/session/active",
      params: { sealedSnapshotId: snap.id },
    } as never);
  };

  // Gate: prepare first — no mutual UI without self declaration.
  if (!selfDecl) {
    return (
      <Screen>
        <Eyebrow>CONSENT SNAPSHOT</Eyebrow>
        <Title>Prepare your declaration first.</Title>
        <Body muted>
          Mutual seal needs your side. Take a few careful minutes to prepare.
        </Body>
        <Button
          label="Prepare my declaration"
          onPress={() => router.replace("/consent-snapshot/prepare" as never)}
        />
      </Screen>
    );
  }

  const rows = snap ? mutualSnapshotRows(snap) : [];
  const sealed = snap ? isSealed(snap) : false;

  return (
    <Screen>
      <Eyebrow>MUTUAL CONSENT SNAPSHOT</Eyebrow>
      <Title>
        {sealed
          ? "Sealed for this moment."
          : "Both people must agree — carefully."}
      </Title>
      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>Slow yes · free no</Text>
        <Text style={styles.bannerBody}>
          Read every row. Affirm Soft Signal. Seal only if both of you mean yes
          for now. Withdraw is always faster than sealing — no explanation.
        </Text>
      </View>

      {/* Honest demo label: one-phone dual role is rehearsal, not remote proof. */}
      {partnerDecl?.role === "partner_practice" ? (
        <View style={styles.demoBanner} accessible>
          <Text style={styles.demoTitle}>DEMO · PRACTICE PARTNER</Text>
          <Text style={styles.demoBody}>
            Dual affirmation on one phone is rehearsal only. A real session
            needs two independent people. Never forge a remote yes.
          </Text>
        </View>
      ) : null}

      <Card style={styles.snapshot}>
        {rows.map((row) => (
          <View
            key={row.label}
            style={styles.row}
            accessible
            accessibilityRole="text"
            accessibilityLabel={`${row.label}: ${row.value}`}
          >
            <Text style={styles.label}>{row.label}</Text>
            <Text style={styles.value}>{row.value}</Text>
          </View>
        ))}
      </Card>

      {/* Affirm UI only when unsealed and not withdrawn. */}
      {!sealed && !snap?.withdrawnAt ? (
        <>
          <Text style={styles.section} accessibilityRole="header">
            Your yes ({selfDecl.displayLabel})
          </Text>
          <Body muted>
            Each toggle is intentional. Seal will not arm until every check is
            on and a short deliberate pause passes (
            {CONSENT_TIMING.grantArmDwellMs}ms). Soft Signal never waits.
          </Body>
          {SELF_ROWS.map((row) => (
            <ConsentAffirmRow
              key={row.key}
              pointId={row.pointId}
              label={row.label}
              checked={checksA[row.key]}
              onChange={(next) =>
                setChecksA((c) => ({ ...c, [row.key]: next }))
              }
            />
          ))}

          <Text style={styles.section} accessibilityRole="header">
            Practice partner yes ({partnerDecl?.displayLabel ?? "Partner"})
          </Text>
          <Body muted>
            Demo only: complete these as if you were them after reading the
            package. Real remote partners affirm on their own device.
          </Body>
          {SELF_ROWS.map((row) => (
            <ConsentAffirmRow
              key={`b-${row.key}`}
              pointId={
                row.key === "affirmedSoftSignal"
                  ? "snapshot_soft_signal_ack"
                  : "snapshot_mutual_partner_affirm"
              }
              // Partner copy: strip first-person self so demo role stays clear.
              label={`Partner: ${row.label.replace(/^I /, "").replace(/^This /, "this ")}`}
              checked={checksB[row.key]}
              onChange={(next) =>
                setChecksB((c) => ({ ...c, [row.key]: next }))
              }
            />
          ))}

          {/* Progress while dwell arms — Soft Signal/withdraw path never shows this delay. */}
          {allA && allB && !sealArmed ? (
            <View
              style={styles.armTrack}
              accessible
              accessibilityRole="progressbar"
              accessibilityValue={{
                min: 0,
                max: 100,
                now: Math.round(armProgress * 100),
              }}
              accessibilityLabel="Arming seal deliberately"
            >
              <View
                style={[styles.armFill, { width: `${armProgress * 100}%` }]}
              />
              <Text style={styles.armLabel}>
                Arming seal… {Math.round(armProgress * 100)}%
              </Text>
            </View>
          ) : null}
          <Button
            label={
              sealArmed
                ? CONSENT_POINTS.snapshot_dual_seal.copy.primary
                : allA && allB
                  ? "Arming seal…"
                  : "Seal (complete every check first)"
            }
            // Fail-closed: disabled until grant arm true.
            disabled={!sealArmed}
            onPress={() => void seal()}
            accessibilityHint={CONSENT_POINTS.snapshot_dual_seal.a11yHint}
            accessibilityLabel={CONSENT_POINTS.snapshot_dual_seal.a11yLabel}
          />
        </>
      ) : null}

      {sealed ? (
        <View style={styles.sealed}>
          <Text style={styles.sealedTitle}>
            {CONSENT_POINTS.snapshot_dual_seal.copy.success}
          </Text>
          <Text style={styles.sealedBody}>
            Shared seal · this moment only{"\n"}
            Soft Signal remains available to either person at any time.
          </Text>
          <Button
            label="Enter active session (Soft Signal ready)"
            onPress={() => void enterSession()}
          />
        </View>
      ) : null}

      {snap?.withdrawnAt ? (
        <View style={styles.withdrawn}>
          <Text style={styles.sealedTitle}>Withdrawn</Text>
          <Text style={styles.sealedBody}>
            {CONSENT_POINTS.snapshot_withdraw.copy.success}
          </Text>
          <Button
            label="Prepare a new declaration"
            onPress={() => router.replace("/consent-snapshot/prepare" as never)}
          />
        </View>
      ) : (
        // Withdraw always available until withdrawn — faster than seal, no arm.
        <Button
          variant="signal"
          label={CONSENT_POINTS.snapshot_withdraw.copy.primary}
          onPress={() => void withdraw()}
          accessibilityHint={CONSENT_POINTS.snapshot_withdraw.a11yHint}
        />
      )}

      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}

      <Button
        variant="secondary"
        label="Edit my declaration"
        onPress={() => router.push("/consent-snapshot/prepare" as never)}
      />
      <Button
        variant="secondary"
        label="Home"
        onPress={() => router.replace("/home")}
      />
    </Screen>
  );
}

/**
 * WHAT: Theme-bound styles for mutual seal layout (banner, rows, arm track, sealed/withdrawn).
 * WHY: useThemedStyles pure factory from AppColors.
 * CONSENT: Not a consent surface — presentation; meaning is not color-only (copy + a11y labels).
 * EDGE CASES: none — pure style map.
 * NEVER: Do not encode seal vs withdraw only by hue without text.
 */
function makeStyles(colors: AppColors) {
  return {
    banner: {
      backgroundColor: colors.signalSoft,
      borderColor: colors.signal,
      borderWidth: 1,
      borderRadius: 16,
      padding: 16,
      gap: 6,
      marginBottom: 8,
    },
    bannerTitle: {
      color: colors.signal,
      fontWeight: "800" as const,
      letterSpacing: 0.5,
      textTransform: "uppercase" as const,
      fontSize: 12,
    },
    bannerBody: { color: colors.ink, lineHeight: 22, fontSize: 15 },
    demoBanner: {
      backgroundColor: colors.apricotSoft,
      borderRadius: 14,
      padding: 14,
      gap: 6,
      borderWidth: 1,
      borderColor: colors.apricot,
      marginBottom: 8,
    },
    demoTitle: {
      color: colors.plum,
      fontWeight: "800" as const,
      fontSize: 11,
      letterSpacing: 1,
    },
    demoBody: { color: colors.ink, fontSize: 14, lineHeight: 20 },
    snapshot: {
      backgroundColor: colors.paper,
      borderWidth: 1,
      borderColor: colors.line,
      gap: 0,
      paddingVertical: 4,
    },
    row: {
      paddingVertical: 12,
      paddingHorizontal: 4,
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
      gap: 4,
    },
    label: {
      color: colors.signal,
      fontSize: 11,
      fontWeight: "800" as const,
      letterSpacing: 0.5,
      textTransform: "uppercase" as const,
    },
    value: {
      color: colors.ink,
      fontSize: 16,
      lineHeight: 22,
      fontFamily: fonts.headline,
    },
    section: {
      fontFamily: fonts.headline,
      fontSize: 22,
      color: colors.ink,
      marginTop: 16,
      marginBottom: 8,
    },
    armTrack: {
      height: 36,
      borderRadius: 12,
      backgroundColor: colors.line,
      overflow: "hidden" as const,
      justifyContent: "center" as const,
      marginBottom: 4,
    },
    armFill: {
      position: "absolute" as const,
      left: 0,
      top: 0,
      bottom: 0,
      backgroundColor: colors.mossSoft,
      borderRadius: 12,
    },
    armLabel: {
      color: colors.moss,
      fontSize: 12,
      fontWeight: "700" as const,
      textAlign: "center" as const,
      zIndex: 1,
    },
    sealed: {
      backgroundColor: colors.mossSoft,
      borderRadius: 16,
      padding: 16,
      gap: 10,
      marginTop: 12,
    },
    withdrawn: {
      backgroundColor: colors.signalSoft,
      borderRadius: 16,
      padding: 16,
      gap: 10,
      marginTop: 12,
    },
    sealedTitle: {
      fontWeight: "800" as const,
      fontSize: 18,
      color: colors.ink,
    },
    sealedBody: { color: colors.muted, lineHeight: 21 },
    error: { color: colors.signal, marginTop: 8 },
  };
}
