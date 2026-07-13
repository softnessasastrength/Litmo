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
import { useAuth } from "../../context/AuthContext";
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
  const { status } = useAuth();
  const isDemo = status === "demo";
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
  const [busy, setBusy] = useState(false);

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
    setBusy(true);
    try {
      const invite = await quizInviteStore.create(quizId);
      if ("error" in invite) {
        setStatus(`Closed: ${invite.error}`, "closed");
        return;
      }
      setSelectedId(invite.id);
      setCopiedPackage(null);
      setRelayCode(null);
      setStatus(
        isDemo
          ? "Invite ready. In demo you can practice with a fictional partner, or copy the package as if sending it to a real person."
          : "Encrypted invite ready. Show the package only to the person you trust — public keys only, never your weather.",
        "ok",
      );
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const practiceDemo = async () => {
    if (!selected) {
      setStatus("Create an invite first, then practice.", "closed");
      return;
    }
    setBusy(true);
    try {
      const next = await quizInviteStore.practiceWithFictionalPartner(
        selected.id,
      );
      if ("error" in next) {
        setStatus(`Closed: ${next.error}`, "closed");
        return;
      }
      setSelectedId(next.id);
      setComparisonText(null);
      setStatus(
        "Fictional partner package imported and decrypted with real E2E crypto. Comparison still stays closed until you consent to share and to compare.",
        "ok",
      );
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const consentShare = async (value: boolean) => {
    if (!selected) return;
    if (!value) {
      await quizInviteStore.setLocalShare(selected.id, false, null);
      setComparisonText(null);
      setStatus(
        "Share consent withdrawn. Your encrypted result is removed. Comparison closed.",
        "info",
      );
      await refresh();
      return;
    }
    const results = await quizResultsRepository.load();
    const mine = results[selected.quizId];
    if (!mine) {
      setStatus(
        "Take this quiz first when you have a quiet moment — then you can choose to share an encrypted result.",
        "closed",
      );
      return;
    }
    setBusy(true);
    try {
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
        "You chose to share. Your weather is encrypted for this invite only. You can withdraw anytime.",
        "ok",
      );
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const consentCompare = async (value: boolean) => {
    if (!selected) return;
    await quizInviteStore.setLocalCompare(selected.id, value);
    if (!value) setComparisonText(null);
    setStatus(
      value
        ? "You consent to compare — still closed until they consent too (and both results are present)."
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
      ? "your encrypted weather"
      : selected.role === "peer"
        ? "handshake so they can open encryption"
        : "public invite (keys only)";
    setStatus(
      `Package ready (${kindHint}). Copy it privately. Servers never see your weather plaintext.`,
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
      "Short claim code ready. Partner enters it on their device. Server holds ciphertext only.",
      "ok",
    );
  };

  const importPackage = async () => {
    const raw = peerJson.trim();
    if (!raw) {
      setStatus("Paste a partner package first.", "closed");
      return;
    }
    setBusy(true);
    try {
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
          ? "You joined their encrypted invite. Take the same quiz, then choose share and compare when you are ready."
          : next.peerConsentToShare
            ? "Partner package opened on this device only. Your share and compare choices are still yours."
            : "Handshake accepted. Encryption is ready — you may share when you choose.",
        "ok",
      );
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const claimRelay = async () => {
    const code = claimCode.trim();
    if (!code) {
      setStatus("Enter a claim code first.", "closed");
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
      "Ciphertext loaded from relay. Tap Import package to decrypt on this device.",
      "ok",
    );
  };

  const runCompare = () => {
    if (!selected) return;
    if (!canCompare(selected)) {
      setStatus(
        "Comparison stays closed until both people consent to share and to compare — and both encrypted results are present.",
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
      "Comparison opened with mutual consent. Soft notes only — never permission to touch.",
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
      <Eyebrow>
        {isDemo ? "DEMO · PARTNER INVITES" : "PARTNER INVITES"}
      </Eyebrow>
      <Title>Invite softly. Compare only together.</Title>
      <Body muted>
        Share encrypted social weather with one person you choose. Comparison
        never opens without both of you saying yes — twice: once to share, once
        to compare. This is never consent to touch.
      </Body>

      {isDemo ? (
        <Card>
          <Text style={styles.cardTitle}>Demo walkthrough</Text>
          <Body muted>
            Fictional mode uses the real encryption path on this device. A
            practice partner is not a real person. Face ID is skipped so Expo Go
            can walk the flow. Your consents still matter — nothing auto-opens.
          </Body>
        </Card>
      ) : null}

      <Card>
        <Text style={styles.cardTitle}>
          {entry ? entry.title : "Shareable quiz"}
        </Text>
        <Text style={styles.stepsTitle}>A calm path</Text>
        <View style={styles.stepRow}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>1</Text>
          </View>
          <Text style={styles.stepCopy}>
            Create an encrypted invite (or join one you were given).
          </Text>
        </View>
        <View style={styles.stepRow}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>2</Text>
          </View>
          <Text style={styles.stepCopy}>
            <Text style={styles.stepStrong}>Share</Text>
            {" — encrypt your private result for this invite only."}
          </Text>
        </View>
        <View style={styles.stepRow}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>3</Text>
          </View>
          <Text style={styles.stepCopy}>
            <Text style={styles.stepStrong}>Compare</Text>
            {" — open a joint view only if both people opt in."}
          </Text>
        </View>
        <Body muted>
          Encryption uses Signal-style X3DH + Double Ratchet. Keys stay on this
          device (Secure Store and device-bound vault / Secure Enclave path on
          real iOS). Servers may only relay ciphertext.
        </Body>
        <Button
          label="Create encrypted invite"
          onPress={() => void create()}
          disabled={busy}
        />
        {isDemo && selected?.role === "host" ? (
          <Button
            label="Practice with fictional partner (demo)"
            variant="secondary"
            disabled={busy || Boolean(selected.peerResult)}
            accessibilityHint="Imports a fictional partner package encrypted with real E2E crypto. Still requires your share and compare consents."
            onPress={() => void practiceDemo()}
          />
        ) : null}
      </Card>

      {invites.length > 0 ? (
        <Card>
          <Text style={styles.cardTitle}>Your invites</Text>
          {invites.map((invite) => {
            const label = getQuizEntry(invite.quizId)?.title ?? invite.quizId;
            const active = invite.id === selectedId;
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
                accessibilityLabel={`${label}. Role ${invite.role}. Share ${invite.hostConsentToShare ? "yes" : "no"}. Compare ${invite.hostConsentToCompare ? "yes" : "no"}. Peer ${invite.peerResult ? "present" : "none"}.`}
              >
                <Text style={styles.inviteTitle}>
                  {label} · {invite.role}
                </Text>
                <Text style={styles.inviteMeta}>
                  share: {invite.hostConsentToShare ? "yes" : "no"} · compare:{" "}
                  {invite.hostConsentToCompare ? "yes" : "no"} · partner:{" "}
                  {invite.peerResult ? "present" : "waiting"} · e2e:{" "}
                  {invite.sessionReady ? "ready" : "waiting"}
                </Text>
              </Pressable>
            );
          })}
        </Card>
      ) : null}

      {selected ? (
        <Card>
          <Text style={styles.cardTitle}>Your choices</Text>
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
                Share · {step1Done ? "yes" : "not yet"}
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
                Compare · {step2Done ? "yes" : "not yet"}
              </Text>
            </View>
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
                Partner · {peerPresent ? "here" : "waiting"}
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
            {selected.role === "host" && !sessionReady
              ? "After your partner joins (or you practice in demo), encryption opens and you can share."
              : "You stay in control. Withdraw share or compare anytime — comparison closes immediately."}
          </Body>
          <Button
            label={
              selected.hostConsentToShare
                ? "Withdraw share consent"
                : "I consent to share my encrypted result"
            }
            variant={selected.hostConsentToShare ? "secondary" : "primary"}
            disabled={busy}
            accessibilityHint="Encrypts or removes your private result for this invite"
            onPress={() => void consentShare(!selected.hostConsentToShare)}
          />
          <Button
            label={
              selected.hostConsentToCompare
                ? "Withdraw compare consent"
                : "I consent to compare (if they do too)"
            }
            variant="secondary"
            accessibilityHint="Allows comparison only if your partner also consents"
            onPress={() => void consentCompare(!selected.hostConsentToCompare)}
          />
          <Button
            label="Show package to copy"
            variant="secondary"
            accessibilityHint="Shows the encrypted package to share out of band"
            onPress={() => void showPackage()}
          />
          {!isDemo ? (
            <Button
              label="Optional: publish claim code (ciphertext only)"
              variant="secondary"
              accessibilityHint="Uploads opaque ciphertext to relay and returns a short claim code"
              onPress={() => void publishRelay()}
            />
          ) : null}
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
        <Text style={styles.cardTitle}>Receive a partner package</Text>
        <Body muted>
          Paste their package below
          {isDemo ? " (or use practice with a fictional partner above)" : ""}.
          Wrong packages and missing share consent fail closed.
        </Body>
        <View style={styles.statusRow}>
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
              Comparison · {compareOpen ? "ready" : "closed"}
            </Text>
          </View>
        </View>
        {!isDemo ? (
          <>
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
          </>
        ) : null}
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
          disabled={busy}
          onPress={() => void importPackage()}
        />
        <Button
          label={
            compareOpen
              ? "Open shared comparison"
              : "Open comparison (still closed)"
          }
          variant={compareOpen ? "primary" : "secondary"}
          accessibilityHint={
            compareOpen
              ? "Opens mutual-consent comparison notes"
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
          <Text style={styles.cardTitle}>Shared comparison</Text>
          <Text style={styles.compareReminder}>
            Soft notes only — never a match score, safety rating, or permission
            to touch.
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
