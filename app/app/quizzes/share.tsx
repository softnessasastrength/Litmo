import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import {
  Body,
  Button,
  Card,
  Eyebrow,
  Screen,
  Title,
} from "../../components/ui";
import { SensitiveAccessGate } from "../../components/SensitiveAccessGate";
import { getQuizEntry, type QuizCatalogId } from "../../data/quizCatalog";
import { quizInviteStore } from "../../services/quizInviteStore";
import { quizResultsRepository } from "../../services/quizResultsRepository";
import {
  canCompare,
  compareInvite,
  exportHostPackage,
  parsePortablePackage,
  sealResult,
  type QuizInvite,
} from "../../services/quizShareCore";
import { fonts, radius, type AppColors } from "../../theme";
import { useThemedStyles } from "../../hooks/useThemedStyles";

type MessageTone = "info" | "ok" | "closed";

function ShareBody() {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { quizId: quizIdParam } = useLocalSearchParams<{ quizId?: string }>();
  const [invites, setInvites] = useState<QuizInvite[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [peerJson, setPeerJson] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<MessageTone>("info");
  const [comparisonText, setComparisonText] = useState<string | null>(null);
  const [copiedPackage, setCopiedPackage] = useState<string | null>(null);

  const preferredQuiz =
    (quizIdParam as QuizCatalogId | undefined) ?? "vibe-short";

  const setStatus = (text: string, tone: MessageTone = "info") => {
    setMessage(text);
    setMessageTone(tone);
  };

  const refresh = useCallback(async () => {
    const list = await quizInviteStore.list();
    setInvites(list);
    setSelectedId((current) => current ?? list[0]?.id ?? null);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const selected = invites.find((i) => i.id === selectedId) ?? null;

  // Fail closed: if mutual share+compare consent is incomplete, never keep a
  // prior comparison payload on screen (e.g. after revoke or peer re-import).
  useEffect(() => {
    if (!selected || !canCompare(selected)) {
      setComparisonText(null);
    }
  }, [selected]);
  const entry = selected
    ? getQuizEntry(selected.quizId)
    : getQuizEntry(preferredQuiz);

  const create = async () => {
    const quizId = (selected?.quizId ?? preferredQuiz) as QuizCatalogId;
    if (!getQuizEntry(quizId)?.shareable) {
      setStatus(
        "That quiz is not available for partner invites. Choose a shareable quiz first.",
        "closed",
      );
      return;
    }
    const invite = await quizInviteStore.create(quizId);
    setSelectedId(invite.id);
    setStatus(
      "Invite created on this device. Treat the package like a password.",
      "ok",
    );
    await refresh();
  };

  const consentShare = async (value: boolean) => {
    if (!selected) return;
    const results = await quizResultsRepository.load();
    const mine = results[selected.quizId];
    if (value && !mine) {
      setStatus(
        "Closed for now: take this quiz first, then you can consent to share a sealed result.",
        "closed",
      );
      return;
    }
    const sealed =
      value && mine
        ? sealResult(
            {
              quizId: selected.quizId,
              primary: mine.primary,
              secondary: mine.secondary,
              mixPercent: mine.mixPercent,
              completedAt: mine.completedAt,
              notes: mine.notes.slice(0, 5),
            },
            selected.sealKey,
          )
        : null;
    await quizInviteStore.setHostShare(selected.id, value, sealed);
    // Fail closed: never leave a comparison view open after share revoke.
    if (!value) setComparisonText(null);
    setStatus(
      value
        ? "Step 1 done: you consented to share a sealed result for this invite."
        : "Share consent withdrawn. Sealed result removed. Comparison closed.",
      value ? "ok" : "info",
    );
    await refresh();
  };

  const consentCompare = async (value: boolean) => {
    if (!selected) return;
    await quizInviteStore.setHostCompare(selected.id, value);
    // Fail closed: never leave a comparison view open after compare revoke.
    if (!value) setComparisonText(null);
    setStatus(
      value
        ? "Step 2 noted: you consent to compare — still closed until they consent too."
        : "Compare consent withdrawn. Comparison closed.",
      value ? "ok" : "info",
    );
    await refresh();
  };

  const showPackage = () => {
    if (!selected) return;
    if (!selected.hostConsentToShare || !selected.hostSealed) {
      setStatus(
        "Closed: consent to share (step 1) before showing your invite package.",
        "closed",
      );
      return;
    }
    const pack = JSON.stringify(exportHostPackage(selected));
    setCopiedPackage(pack);
    setStatus(
      "Package ready below. Copy it manually to share out-of-band. It includes the seal key — treat it like a password.",
      "ok",
    );
  };

  const importPeer = async () => {
    if (!selected) return;
    const parsed = parsePortablePackage(peerJson.trim());
    if ("error" in parsed) {
      setStatus(`Closed: ${parsed.error}`, "closed");
      return;
    }
    if (!parsed.sealed || !parsed.consentToShare) {
      setStatus(
        "Closed: peer package has no sealed result or share consent. Nothing was imported.",
        "closed",
      );
      return;
    }
    const next = await quizInviteStore.importPeer(selected.id, {
      sealed: parsed.sealed,
      consentToShare: parsed.consentToShare,
      consentToCompare: parsed.consentToCompare,
    });
    if ("error" in next) {
      setStatus(`Closed: ${next.error}`, "closed");
      return;
    }
    setStatus(
      "Peer package imported. Comparison still needs mutual compare consent (step 2).",
      "ok",
    );
    await refresh();
  };

  const runCompare = () => {
    if (!selected) return;
    if (!canCompare(selected)) {
      setStatus(
        "Closed: comparison opens only after both people complete step 1 (share) and step 2 (compare).",
        "closed",
      );
      setComparisonText(null);
      return;
    }
    const result = compareInvite(selected);
    if ("error" in result) {
      setStatus(`Closed: ${result.error}`, "closed");
      setComparisonText(null);
      return;
    }
    setComparisonText(
      [
        result.consentReminder,
        "",
        ...result.notes.map((n) => `• ${n.text}`),
      ].join("\n"),
    );
    setStatus(
      "Comparison opened with mutual consent. Still never permission to touch.",
      "ok",
    );
  };

  const step1Done = Boolean(
    selected?.hostConsentToShare && selected.hostSealed,
  );
  const step2Done = Boolean(selected?.hostConsentToCompare);
  const peerPresent = Boolean(selected?.peerSealed);
  const compareOpen = selected ? canCompare(selected) : false;

  return (
    <Screen>
      <Eyebrow>PARTNER INVITES</Eyebrow>
      <Title>Share softly, compare only with consent.</Title>
      <Body muted>
        Invites live in Secure Store on this device. Sealed results need the
        invite key. Comparison never implies consent to touch.
      </Body>

      <Card>
        <Text style={styles.cardTitle}>
          {entry ? entry.title : "Shareable quiz"}
        </Text>
        <Text style={styles.stepsTitle}>Two consents — always</Text>
        <View style={styles.stepRow}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>1</Text>
          </View>
          <Text style={styles.stepCopy}>
            <Text style={styles.stepStrong}>Share</Text>
            {" — seal your private result for this invite only."}
          </Text>
        </View>
        <View style={styles.stepRow}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>2</Text>
          </View>
          <Text style={styles.stepCopy}>
            <Text style={styles.stepStrong}>Compare</Text>
            {" — open a joint view only if both people opt in."}
          </Text>
        </View>
        <Body muted>
          Create an invite, exchange packages out-of-band, then complete both
          steps. Missing consent fails closed.
        </Body>
        <Button label="Create invite" onPress={() => void create()} />
      </Card>

      {invites.length > 0 ? (
        <Card>
          <Text style={styles.cardTitle}>Your invites</Text>
          {invites.map((invite) => {
            const label = getQuizEntry(invite.quizId)?.title ?? invite.quizId;
            const active = invite.id === selectedId;
            const shareLabel = invite.hostConsentToShare
              ? "shared"
              : "not shared";
            const compareLabel = invite.hostConsentToCompare
              ? "compare yes"
              : "compare no";
            const peerLabel = invite.peerSealed
              ? "peer present"
              : "no peer yet";
            return (
              <Pressable
                key={invite.id}
                onPress={() => {
                  setSelectedId(invite.id);
                  setCopiedPackage(null);
                  setComparisonText(null);
                }}
                style={[styles.inviteRow, active && styles.inviteActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`${label}. Step 1 ${shareLabel}. Step 2 ${compareLabel}. ${peerLabel}.`}
              >
                <Text style={styles.inviteTitle}>{label}</Text>
                <Text style={styles.inviteMeta}>
                  1 share: {invite.hostConsentToShare ? "yes" : "no"} · 2
                  compare: {invite.hostConsentToCompare ? "yes" : "no"} · peer:{" "}
                  {invite.peerSealed ? "present" : "none"}
                </Text>
              </Pressable>
            );
          })}
        </Card>
      ) : null}

      {selected ? (
        <Card>
          <Text style={styles.cardTitle}>Your consents</Text>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusChip,
                step1Done ? styles.statusChipOk : styles.statusChipClosed,
              ]}
            >
              <Text
                style={[
                  styles.statusChipText,
                  step1Done ? styles.statusOkText : styles.statusClosedText,
                ]}
              >
                1 Share · {step1Done ? "yes" : "closed"}
              </Text>
            </View>
            <View
              style={[
                styles.statusChip,
                step2Done ? styles.statusChipOk : styles.statusChipClosed,
              ]}
            >
              <Text
                style={[
                  styles.statusChipText,
                  step2Done ? styles.statusOkText : styles.statusClosedText,
                ]}
              >
                2 Compare · {step2Done ? "yes" : "closed"}
              </Text>
            </View>
          </View>
          <Body muted>
            Two separate choices. Share seals your result. Compare opens a joint
            view only when both opt in.
          </Body>
          <Button
            label={
              selected.hostConsentToShare
                ? "Withdraw share consent"
                : "1 · I consent to share my sealed result"
            }
            variant={selected.hostConsentToShare ? "secondary" : "primary"}
            accessibilityHint="Step one: seal or unseal your private result for this invite"
            onPress={() => void consentShare(!selected.hostConsentToShare)}
          />
          <Button
            label={
              selected.hostConsentToCompare
                ? "Withdraw compare consent"
                : "2 · I consent to compare (if they do too)"
            }
            variant="secondary"
            accessibilityHint="Step two: allow comparison only if your partner also consents"
            onPress={() => void consentCompare(!selected.hostConsentToCompare)}
          />
          <Button
            label="Show my invite package"
            variant="secondary"
            disabled={!step1Done}
            accessibilityHint={
              step1Done
                ? "Shows the sealed package to copy out of band"
                : "Complete share consent first"
            }
            onPress={showPackage}
          />
          {copiedPackage ? (
            <Text selectable style={styles.packageBox}>
              {copiedPackage}
            </Text>
          ) : null}
        </Card>
      ) : null}

      {selected ? (
        <Card>
          <Text style={styles.cardTitle}>Import partner package</Text>
          <Body muted>
            Paste their JSON package. Wrong seals, missing share consent, or
            broken packages fail closed — nothing opens by accident.
          </Body>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusChip,
                peerPresent ? styles.statusChipOk : styles.statusChipClosed,
              ]}
            >
              <Text
                style={[
                  styles.statusChipText,
                  peerPresent ? styles.statusOkText : styles.statusClosedText,
                ]}
              >
                Peer · {peerPresent ? "present" : "none"}
              </Text>
            </View>
            <View
              style={[
                styles.statusChip,
                compareOpen ? styles.statusChipOk : styles.statusChipClosed,
              ]}
            >
              <Text
                style={[
                  styles.statusChipText,
                  compareOpen ? styles.statusOkText : styles.statusClosedText,
                ]}
              >
                Compare · {compareOpen ? "ready" : "closed"}
              </Text>
            </View>
          </View>
          <TextInput
            value={peerJson}
            onChangeText={setPeerJson}
            placeholder="Paste partner package JSON"
            placeholderTextColor={styles.placeholder.color}
            multiline
            style={styles.input}
            accessibilityLabel="Partner package JSON"
          />
          <Button
            label="Import peer package"
            onPress={() => void importPeer()}
          />
          <Button
            label={
              compareOpen ? "Open comparison" : "Open comparison (still closed)"
            }
            variant={compareOpen ? "primary" : "secondary"}
            accessibilityHint={
              compareOpen
                ? "Opens the mutual-consent comparison notes"
                : "Stays closed until both people share and both consent to compare"
            }
            onPress={runCompare}
          />
        </Card>
      ) : null}

      {message ? (
        <View
          style={[
            styles.messageBox,
            messageTone === "closed" && styles.messageClosed,
            messageTone === "ok" && styles.messageOk,
            messageTone === "info" && styles.messageInfo,
          ]}
          accessible
          accessibilityRole="text"
          accessibilityLiveRegion="polite"
          accessibilityLabel={message}
        >
          <Text style={styles.messageKicker}>
            {messageTone === "closed"
              ? "Fail closed"
              : messageTone === "ok"
                ? "Ready"
                : "Status"}
          </Text>
          <Text style={styles.messageBody}>{message}</Text>
        </View>
      ) : null}

      {comparisonText ? (
        <Card>
          <Text style={styles.cardTitle}>Comparison</Text>
          <Text style={styles.compareReminder}>
            Soft notes only — never a match score or permission to touch.
          </Text>
          <Text style={styles.compareBody}>{comparisonText}</Text>
        </Card>
      ) : null}

      <Button
        label="Back to Quizzes"
        variant="secondary"
        onPress={() => router.replace("/(tabs)/quizzes" as never)}
      />
    </Screen>
  );
}

export default function QuizShareScreen() {
  return (
    <SensitiveAccessGate>
      <ShareBody />
    </SensitiveAccessGate>
  );
}

function makeStyles(colors: AppColors) {
  return {
    cardTitle: {
      color: colors.ink,
      fontFamily: fonts.headline,
      fontSize: 22,
      marginBottom: 8,
    },
    stepsTitle: {
      color: colors.moss,
      fontSize: 13,
      fontWeight: "800" as const,
      letterSpacing: 0.4,
      textTransform: "uppercase" as const,
      marginBottom: 10,
    },
    stepRow: {
      flexDirection: "row" as const,
      alignItems: "flex-start" as const,
      gap: 10,
      marginBottom: 10,
    },
    stepBadge: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.mossSoft,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    stepBadgeText: {
      color: colors.moss,
      fontWeight: "800" as const,
      fontSize: 13,
    },
    stepCopy: {
      flex: 1,
      color: colors.ink,
      fontSize: 15,
      lineHeight: 22,
    },
    stepStrong: {
      fontWeight: "800" as const,
      color: colors.ink,
    },
    statusRow: {
      flexDirection: "row" as const,
      flexWrap: "wrap" as const,
      gap: 8,
      marginBottom: 10,
    },
    statusChip: {
      borderRadius: radius.pill,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderWidth: 1,
    },
    statusChipOk: {
      backgroundColor: colors.mossSoft,
      borderColor: colors.moss,
    },
    statusChipClosed: {
      backgroundColor: colors.paper,
      borderColor: colors.line,
    },
    statusChipText: {
      fontSize: 12,
      fontWeight: "700" as const,
    },
    statusOkText: { color: colors.moss },
    statusClosedText: { color: colors.muted },
    inviteRow: {
      minHeight: 52,
      paddingVertical: 12,
      paddingHorizontal: 4,
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
    },
    inviteActive: {
      backgroundColor: colors.mossSoft,
      borderRadius: 12,
      paddingHorizontal: 10,
      borderBottomWidth: 0,
    },
    inviteTitle: {
      color: colors.ink,
      fontWeight: "700" as const,
      fontSize: 16,
    },
    inviteMeta: { color: colors.muted, fontSize: 12, marginTop: 2 },
    input: {
      minHeight: 96,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 12,
      padding: 12,
      marginVertical: 10,
      backgroundColor: colors.paper,
      color: colors.ink,
      textAlignVertical: "top" as const,
    },
    placeholder: { color: colors.muted },
    packageBox: {
      marginTop: 10,
      color: colors.muted,
      fontSize: 11,
      lineHeight: 16,
    },
    compareReminder: {
      color: colors.plum,
      fontSize: 13,
      lineHeight: 19,
      marginBottom: 8,
      fontWeight: "600" as const,
    },
    compareBody: { color: colors.ink, fontSize: 15, lineHeight: 22 },
    messageBox: {
      borderRadius: radius.md,
      padding: 14,
      borderWidth: 1,
      gap: 4,
    },
    messageInfo: {
      backgroundColor: colors.paper,
      borderColor: colors.line,
    },
    messageOk: {
      backgroundColor: colors.mossSoft,
      borderColor: colors.moss,
    },
    messageClosed: {
      backgroundColor: colors.plumSoft,
      borderColor: colors.plum,
    },
    messageKicker: {
      fontSize: 12,
      fontWeight: "800" as const,
      letterSpacing: 0.5,
      textTransform: "uppercase" as const,
      color: colors.ink,
    },
    messageBody: {
      color: colors.ink,
      fontSize: 14,
      lineHeight: 21,
    },
  };
}
