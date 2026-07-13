import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import {
  Body,
  Button,
  Card,
  Eyebrow,
  Screen,
  Title,
} from "../../components/ui";
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
import { sessionConsentSnapshotStore } from "../../services/sessionConsentSnapshotStore";
import { hapticService } from "../../services/hapticService";
import { fonts, type AppColors } from "../../theme";
import { useThemedStyles } from "../../hooks/useThemedStyles";
import { scheduleDemoNotification } from "../../services/notifications";

const EMPTY_CHECKS = {
  reviewedBoundaries: false,
  reviewedSafewords: false,
  reviewedAftercare: false,
  affirmedSoftSignal: false,
  thisMomentOnly: false,
  notAGuaranteeOfSafety: false,
};

/**
 * Mutual Consent Snapshot seal — both parties must affirm the same package.
 * Demo: practice partner declaration + your declaration; you affirm both roles
 * only after reviewing — labeled as practice, never as real remote proof.
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

  const rebuild = useCallback(
    (a: PreSessionDeclaration, b: PreSessionDeclaration) => {
      const next = createMutualSnapshot(a, b);
      setSnap(next);
      setChecksA({ ...EMPTY_CHECKS });
      setChecksB({ ...EMPTY_CHECKS });
      return next;
    },
    [],
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void (async () => {
        const decl = await sessionConsentSnapshotStore.loadDeclaration();
        const existing = await sessionConsentSnapshotStore.loadMutual();
        if (!active) return;
        if (!decl) {
          setSelfDecl(null);
          return;
        }
        setSelfDecl(decl);
        if (existing && !existing.withdrawnAt) {
          setSnap(existing);
          setPartnerDecl(existing.partyB);
          return;
        }
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

  const toggle = (
    side: "A" | "B",
    key: keyof typeof EMPTY_CHECKS,
  ) => {
    if (side === "A") setChecksA((c) => ({ ...c, [key]: !c[key] }));
    else setChecksB((c) => ({ ...c, [key]: !c[key] }));
  };

  const seal = async () => {
    if (!snap || !selfDecl || !partnerDecl) return;
    if (!allA || !allB) {
      setError("Every protective check must be affirmed by both sides.");
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
      let next = affirmParty(snap, "partyA", checks);
      next = affirmParty(next, "partyB", checks);
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

  const withdraw = async () => {
    if (!snap) return;
    const next = withdrawMutualSnapshot(snap, "partyA");
    await sessionConsentSnapshotStore.saveMutual(next);
    setSnap(next);
    void hapticService.play("softSignal");
  };

  const enterSession = async () => {
    if (!snap || !isSealed(snap)) return;
    await scheduleDemoNotification(4);
    router.push({
      pathname: "/session/active",
      params: { sealedSnapshotId: snap.id },
    } as never);
  };

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
        <Text style={styles.bannerTitle}>Protective process</Text>
        <Text style={styles.bannerBody}>
          Read the full intersection. Affirm Soft Signal. Seal only if both of
          you mean yes for now. Either person may withdraw without explanation.
        </Text>
      </View>

      {partnerDecl?.role === "partner_practice" ? (
        <Body muted>
          Demo mode uses a labeled practice partner so you can rehearse dual
          affirmation on one phone. A real session requires two independent
          people and devices.
        </Body>
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

      {!sealed && !snap?.withdrawnAt ? (
        <>
          <Text style={styles.section}>
            Your affirmations ({selfDecl.displayLabel})
          </Text>
          {(
            [
              ["reviewedBoundaries", "I reviewed the boundary intersection"],
              ["reviewedSafewords", "I know both sets of safewords"],
              ["reviewedAftercare", "I reviewed aftercare preferences"],
              ["affirmedSoftSignal", "I affirm Soft Signal for both of us"],
              ["thisMomentOnly", "This agreement is for this moment only"],
              [
                "notAGuaranteeOfSafety",
                "I understand this does not prove anyone is safe forever",
              ],
            ] as const
          ).map(([key, label]) => (
            <Pressable
              key={key}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: checksA[key] }}
              onPress={() => toggle("A", key)}
              style={[styles.check, checksA[key] && styles.checkOn]}
            >
              <Text style={styles.checkText}>
                {checksA[key] ? "☑" : "☐"} {label}
              </Text>
            </Pressable>
          ))}

          <Text style={styles.section}>
            Partner affirmations ({partnerDecl?.displayLabel ?? "Partner"})
          </Text>
          <Body muted>
            In demo, you record the partner side only after reviewing as if you
            were them — practice dual consent, never forge a real remote yes.
          </Body>
          {(
            [
              ["reviewedBoundaries", "Partner reviewed boundary intersection"],
              ["reviewedSafewords", "Partner knows both safeword sets"],
              ["reviewedAftercare", "Partner reviewed aftercare"],
              ["affirmedSoftSignal", "Partner affirms Soft Signal"],
              ["thisMomentOnly", "Partner agrees this moment only"],
              [
                "notAGuaranteeOfSafety",
                "Partner understands this is not a safety guarantee",
              ],
            ] as const
          ).map(([key, label]) => (
            <Pressable
              key={`b-${key}`}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: checksB[key] }}
              onPress={() => toggle("B", key)}
              style={[styles.check, checksB[key] && styles.checkOn]}
            >
              <Text style={styles.checkText}>
                {checksB[key] ? "☑" : "☐"} {label}
              </Text>
            </Pressable>
          ))}

          <Button
            label="Seal Consent Snapshot (both affirmed)"
            disabled={!allA || !allB}
            onPress={() => void seal()}
            accessibilityHint="Records mutual affirmation of this exact snapshot fingerprint. Soft Signal remains available."
          />
        </>
      ) : null}

      {sealed ? (
        <View style={styles.sealed}>
          <Text style={styles.sealedTitle}>Snapshot sealed</Text>
          <Text style={styles.sealedBody}>
            Fingerprint {snap!.fingerprint.slice(0, 20)}…{"\n"}
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
            This snapshot is void. Nothing proceeds from it.
          </Text>
          <Button
            label="Prepare a new declaration"
            onPress={() => router.replace("/consent-snapshot/prepare" as never)}
          />
        </View>
      ) : (
        <Button
          variant="signal"
          label="Withdraw without explanation"
          onPress={() => void withdraw()}
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
    check: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.line,
      padding: 12,
      marginBottom: 8,
      backgroundColor: colors.paper,
    },
    checkOn: {
      borderColor: colors.signal,
      backgroundColor: colors.signalSoft,
    },
    checkText: { color: colors.ink, fontSize: 15, lineHeight: 21 },
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
