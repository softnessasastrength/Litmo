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
import { quizE2eRelay } from "../../services/quizE2eRelay";
import {
  canCompare,
  compareInvite,
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
  const [claimCode, setClaimCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<MessageTone>("info");
  const [comparisonText, setComparisonText] = useState<string | null>(null);
  const [copiedPackage, setCopiedPackage] = useState<string | null>(null);
  const [relayCode, setRelayCode] = useState<string | null>(null);

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
    if ("error" in invite) {
      setStatus(`Closed: ${invite.error}`, "closed");
      return;
    }
    setSelectedId(invite.id);
    setCopiedPackage(null);
    setRelayCode(null);
    setStatus(
      "Encrypted invite ready. Share the package with your partner — it holds public keys only, never your weather.",
      "ok",
    );
    await refresh();
  };

  const consentShare = async (value: boolean) => {
    if (!selected) return;
    if (!value) {
      await quizInviteStore.setLocalShare(selected.id, false, null);
      setComparisonText(null);
      setStatus(
        "Share consent withdrawn. Encrypted result removed. Comparison closed.",
        "info",
      );
      await refresh();
      return;
    }
    const results = await quizResultsRepository.load();
    const mine = results[selected.quizId];
    if (!mine) {
      setStatus(
        "Closed for now: take this quiz first, then you can consent to share an encrypted result.",
        "closed",
      );
      return;
    }
    const next = await quizInviteStore.setLocalShare(selected.id, true, {
      quizId: selected.quizId,
      primary: mine.primary,
      secondary: mine.secondary,
      mixPercent: mine.mixPercent,
      completedAt: mine.completedAt,
      notes: mine.notes.slice(0, 5),
    });
    if ("error" in next) {
      setStatus(`Closed: ${next.error}`, "closed");
      return;
    }
    setStatus(
      selected.role === "host"
        ? "Step 1 done: your weather is encrypted for this partner only."
        : "Step 1 done: encrypted package ready for your partner.",
      "ok",
    );
    await refresh();
  };

  const consentCompare = async (value: boolean) => {
    if (!selected) return;
    await quizInviteStore.setLocalCompare(selected.id, value);
    if (!value) setComparisonText(null);
    setStatus(
      value
        ? "Step 2 noted: you consent to compare — still closed until they consent too."
        : "Compare consent withdrawn. Comparison closed.",
      value ? "ok" : "info",
    );
    await refresh();
  };

  const showPackage = async () => {
    if (!selected) return;
    const exported = await quizInviteStore.exportPackage(selected.id);
    if ("error" in exported) {
      setStatus(`Closed: ${exported.error}`, "closed");
      return;
    }
    setCopiedPackage(exported.packageJson);
    setRelayCode(null);
    const kindHint = selected.hostConsentToShare
      ? "encrypted result (ciphertext only)"
      : selected.role === "peer"
        ? "handshake (opens their encryption)"
        : "public invite (keys only — not your weather)";
    setStatus(
      `Package ready (${kindHint}). Copy it privately. Supabase never sees your weather plaintext.`,
      "ok",
    );
  };

  const publishRelay = async () => {
    if (!selected) return;
    const exported = await quizInviteStore.exportPackage(selected.id);
    if ("error" in exported) {
      setStatus(`Closed: ${exported.error}`, "closed");
      return;
    }
    const published = await quizE2eRelay.publish(
      selected.id,
      exported.packageJson,
    );
    if ("error" in published) {
      setStatus(`Closed: ${published.error}`, "closed");
      return;
    }
    setRelayCode(published.claimCode);
    setStatus(
      "Claim code ready. Your partner enters it on their device. Server holds ciphertext only.",
      "ok",
    );
  };

  const importPackage = async () => {
    const raw = peerJson.trim();
    if (!raw) {
      setStatus("Closed: paste a partner package first.", "closed");
      return;
    }
    const next = await quizInviteStore.importPackage(raw);
    if ("error" in next) {
      setStatus(`Closed: ${next.error}`, "closed");
      return;
    }
    setSelectedId(next.id);
    setComparisonText(null);
    setPeerJson("");
    setStatus(
      next.role === "peer"
        ? "Joined their encrypted invite. Take the same quiz, then consent to share and compare."
        : next.peerConsentToShare
          ? "Partner package imported and decrypted on this device. Complete your share and compare consents."
          : "Handshake accepted. Encryption is ready — you can now share your sealed weather.",
      "ok",
    );
    await refresh();
  };

  const claimRelay = async () => {
    const code = claimCode.trim();
    if (!code) {
      setStatus("Closed: enter a claim code first.", "closed");
      return;
    }
    const claimed = await quizE2eRelay.claim(code);
    if ("error" in claimed) {
      setStatus(`Closed: ${claimed.error}`, "closed");
      return;
    }
    setPeerJson(claimed.packageJson);
    setClaimCode("");
    setStatus(
      "Ciphertext package loaded from relay. Tap Import to decrypt on this device.",
      "ok",
    );
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
    selected?.hostConsentToShare && selected.hostResult,
  );
  const step2Done = Boolean(selected?.hostConsentToCompare);
  const peerPresent = Boolean(selected?.peerResult);
  const compareOpen = selected ? canCompare(selected) : false;
  const sessionReady = Boolean(selected?.sessionReady);

  return (
    <Screen>
      <Eyebrow>PARTNER INVITES</Eyebrow>
      <Title>Share softly, encrypted end to end.</Title>
      <Body muted>
        Weather is sealed with Signal-style encryption (X3DH + Double Ratchet).
        Only the invited partner who joined this invite can decrypt — not Litmo
        servers, not a random package forward. Keys stay on-device (Secure Store
        + device-bound vault / Secure Enclave path on real iOS). Comparison
        never implies consent to touch.
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
            {" — encrypt your private result for this invite only."}
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
          Simple path: create invite → send only to your partner → they join →
          share → you share → both consent to compare. Treat the invite like a
          private invitation. Missing consent fails closed.
        </Body>
        <Button label="Create encrypted invite" onPress={() => void create()} />
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
            const peerLabel = invite.peerResult ? "peer present" : "no peer yet";
            return (
              <Pressable
                key={invite.id}
                onPress={() => {
                  setSelectedId(invite.id);
                  setCopiedPackage(null);
                  setRelayCode(null);
                  setComparisonText(null);
                }}
                style={[styles.inviteRow, active && styles.inviteActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`${label}. Role ${invite.role}. Step 1 ${shareLabel}. Step 2 ${compareLabel}. ${peerLabel}.`}
              >
                <Text style={styles.inviteTitle}>
                  {label} · {invite.role}
                </Text>
                <Text style={styles.inviteMeta}>
                  1 share: {invite.hostConsentToShare ? "yes" : "no"} · 2
                  compare: {invite.hostConsentToCompare ? "yes" : "no"} · peer:{" "}
                  {invite.peerResult ? "present" : "none"} · e2e:{" "}
                  {invite.sessionReady ? "ready" : "waiting"}
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
            <View
              style={[
                styles.statusChip,
                sessionReady ? styles.statusChipOk : styles.statusChipClosed,
              ]}
            >
              <Text
                style={[
                  styles.statusChipText,
                  sessionReady ? styles.statusOkText : styles.statusClosedText,
                ]}
              >
                E2E · {sessionReady ? "ready" : "waiting"}
              </Text>
            </View>
          </View>
          <Body muted>
            {selected.role === "host"
              ? "As host: show your public invite first. After they join and send a package, encryption opens and you can share."
              : "As partner: after joining, take the quiz, consent to share, then send your package back."}
          </Body>
          <Button
            label={
              selected.hostConsentToShare
                ? "Withdraw share consent"
                : "1 · I consent to share my encrypted result"
            }
            variant={selected.hostConsentToShare ? "secondary" : "primary"}
            accessibilityHint="Step one: encrypt or remove your private result for this invite"
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
            label="Show package to copy"
            variant="secondary"
            accessibilityHint="Shows the encrypted package to copy out of band"
            onPress={() => void showPackage()}
          />
          <Button
            label="Optional: publish claim code (ciphertext only)"
            variant="secondary"
            accessibilityHint="Uploads opaque ciphertext to Supabase relay and returns a short claim code"
            onPress={() => void publishRelay()}
          />
          {copiedPackage ? (
            <Text selectable style={styles.packageBox}>
              {copiedPackage}
            </Text>
          ) : null}
          {relayCode ? (
            <Text selectable style={styles.relayCode}>
              Claim code: {relayCode}
            </Text>
          ) : null}
        </Card>
      ) : null}

      <Card>
        <Text style={styles.cardTitle}>Import partner package</Text>
        <Body muted>
          Paste their JSON package, or enter a claim code. Wrong packages and
          missing share consent fail closed — nothing opens by accident.
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
          value={claimCode}
          onChangeText={setClaimCode}
          placeholder="Optional claim code"
          placeholderTextColor={styles.placeholder.color}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.claimInput}
          accessibilityLabel="Relay claim code"
        />
        <Button
          label="Load from claim code"
          variant="secondary"
          onPress={() => void claimRelay()}
        />
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
          label="Import package"
          onPress={() => void importPackage()}
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
    claimInput: {
      minHeight: 48,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 12,
      padding: 12,
      marginTop: 10,
      backgroundColor: colors.paper,
      color: colors.ink,
    },
    placeholder: { color: colors.muted },
    packageBox: {
      marginTop: 10,
      color: colors.muted,
      fontSize: 11,
      lineHeight: 16,
    },
    relayCode: {
      marginTop: 10,
      color: colors.moss,
      fontSize: 16,
      fontWeight: "700" as const,
      letterSpacing: 1,
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
