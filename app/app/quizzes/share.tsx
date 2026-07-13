import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { useNeurodivergent } from "../../context/NeurodivergentContext";
import { getQuizEntry, type QuizCatalogId } from "../../data/quizCatalog";
import { clearLanguage } from "../../lib/clearLanguage";
import { guidePartnerFlow } from "../../services/quizPartnerFlowCore";
import { quizInviteStore } from "../../services/quizInviteStore";
import { quizResultsRepository } from "../../services/quizResultsRepository";
import { quizE2eRelay } from "../../services/quizE2eRelay";
import {
  canCompare,
  compareInvite,
  type QuizInvite,
} from "../../services/quizShareCore";
import { speechService } from "../../services/speechService";
import { fonts, radius, type AppColors } from "../../theme";
import { useThemedStyles } from "../../hooks/useThemedStyles";

type MessageTone = "info" | "ok" | "closed";

function ShareBody() {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { status } = useAuth();
  const { prefs } = useNeurodivergent();
  const isDemo = status === "demo";
  const plain = prefs.clearLanguage;
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
  const [hasLocalResult, setHasLocalResult] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

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

  useEffect(() => {
    const quizId = selected?.quizId ?? preferredQuiz;
    let active = true;
    void quizResultsRepository.load().then((map) => {
      if (!active) return;
      setHasLocalResult(Boolean(map[quizId as keyof typeof map]));
    });
    return () => {
      active = false;
    };
  }, [selected?.quizId, preferredQuiz, selected?.hostConsentToShare]);

  const entry = selected
    ? getQuizEntry(selected.quizId)
    : getQuizEntry(preferredQuiz);

  const guide = useMemo(
    () =>
      guidePartnerFlow(selected, {
        hasLocalQuizResult: hasLocalResult,
        isDemo,
      }),
    [selected, hasLocalResult, isDemo],
  );

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
      setRelayCode(null);
      const exported = await quizInviteStore.exportPackage(invite.id);
      if (!("error" in exported)) {
        setCopiedPackage(exported.packageJson);
      } else {
        setCopiedPackage(null);
      }
      setStatus(
        isDemo
          ? "Invite ready. Practice with a fictional partner, or copy the package for a real person. You still choose share and compare."
          : "Encrypted invite ready. Copy the package below and send it only to your partner — public keys only, never your weather.",
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
        "Fictional partner package imported with real encryption. Comparison still needs your share and compare consents.",
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
        "Take this quiz first when you have a quiet moment — then you can share an encrypted result.",
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
        "You chose to share. Weather is encrypted for this invite only. You can withdraw anytime.",
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
        ? "You consent to compare — still closed until they consent too."
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
    setStatus(
      "Package ready below. Copy it privately. Ciphertext only — servers never see your weather plaintext.",
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
      "Claim code ready. Partner enters it on their device. Server holds ciphertext only.",
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
          ? "You joined their encrypted invite. Take the same quiz, then choose share and compare when ready."
          : next.peerConsentToShare
            ? "Partner package opened on this device only. Your share and compare choices remain yours."
            : "Handshake accepted. Encryption is ready — share when you choose.",
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
        "Comparison stays closed until both people consent to share and to compare — and both results are present.",
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

  const runPrimary = async () => {
    switch (guide.primaryAction) {
      case "create":
        await create();
        break;
      case "show_package":
        await showPackage();
        break;
      case "practice_demo":
        await practiceDemo();
        break;
      case "import":
        setShowAdvanced(true);
        setStatus("Paste their package below, then import.", "info");
        break;
      case "take_quiz":
        router.push({
          pathname: "/quizzes/play",
          params: { quizId: selected?.quizId ?? preferredQuiz },
        } as never);
        break;
      case "share":
        await consentShare(true);
        break;
      case "compare":
        await consentCompare(true);
        break;
      case "open_compare":
        runCompare();
        break;
      default:
        break;
    }
  };

  const step1Done = Boolean(
    selected?.hostConsentToShare && selected.hostResult,
  );
  const step2Done = Boolean(selected?.hostConsentToCompare);
  const peerPresent = Boolean(selected?.peerResult);
  const compareOpen = selected ? canCompare(selected) : false;

  return (
    <Screen>
      <Eyebrow>
        {isDemo ? "DEMO · PARTNER SHARE" : "PARTNER SHARE"}
      </Eyebrow>
      <Title>
        {plain
          ? clearLanguage.partnerTitle
          : "Invite softly. Compare only together."}
      </Title>
      <Body muted>
        {plain
          ? clearLanguage.partnerBody
          : "End-to-end encrypted social weather for one person you choose. Two yeses — share, then compare. You can stop either anytime. This is never consent to touch."}
      </Body>

      {/* Guided next step — empowering primary path */}
      <Card>
        <Text style={styles.stepsTitle}>
          Your next step · {guide.stepIndex} of {guide.stepTotal}
        </Text>
        <View style={styles.progressDots} accessibilityRole="progressbar">
          {Array.from({ length: guide.stepTotal }, (_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i < guide.stepIndex ? styles.dotDone : styles.dotTodo,
              ]}
            />
          ))}
        </View>
        <Text style={styles.guideTitle} accessibilityRole="header">
          {guide.title}
        </Text>
        <Body muted>{guide.body}</Body>
        <Text style={styles.safetyLine}>{guide.safetyLine}</Text>
        {guide.primaryAction !== "idle" ? (
          <Button
            label={
              plain && guide.primaryAction === "create"
                ? clearLanguage.partnerCreate
                : guide.primaryLabel
            }
            onPress={() => void runPrimary()}
            disabled={busy}
            accessibilityHint={guide.body}
          />
        ) : (
          <Body muted>Nothing more to do on this device until they respond.</Body>
        )}
        {isDemo &&
        selected?.role === "host" &&
        guide.primaryAction === "practice_demo" ? (
          <Button
            label="Show invite package instead"
            variant="secondary"
            disabled={busy}
            onPress={() => void showPackage()}
          />
        ) : null}
        {prefs.readAloud ? (
          <Button
            label="Read next step aloud"
            variant="secondary"
            onPress={() =>
              void speechService.speak(
                `${guide.title}. ${guide.body}. ${guide.safetyLine}`,
              )
            }
          />
        ) : null}
      </Card>

      {entry ? (
        <Card>
          <Text style={styles.cardTitle}>{entry.title}</Text>
          <Body muted>
            {hasLocalResult
              ? "You have a private result for this quiz on this device."
              : "No private result yet — the next-step guide will send you to take the quiz when needed."}
          </Body>
          {!hasLocalResult ? (
            <Button
              label="Take quiz now"
              variant="secondary"
              onPress={() =>
                router.push({
                  pathname: "/quizzes/play",
                  params: { quizId: entry.id },
                } as never)
              }
            />
          ) : null}
        </Card>
      ) : null}

      {selected ? (
        <Card>
          <Text style={styles.cardTitle}>Your power to choose</Text>
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
                compareOpen ? styles.statusChipOk : styles.statusChipClosed,
              ]}
            >
              <Text
                style={[
                  styles.statusChipText,
                  compareOpen ? styles.statusOkText : styles.statusClosedText,
                ]}
              >
                Open · {compareOpen ? "ready" : "closed"}
              </Text>
            </View>
          </View>
          <Body muted>
            Withdraw anytime. Withdrawing share removes your encrypted result
            and closes comparison.
          </Body>
          {step1Done ? (
            <Button
              label={plain ? clearLanguage.partnerShareNo : "Withdraw share"}
              variant="secondary"
              onPress={() => void consentShare(false)}
            />
          ) : null}
          {step2Done ? (
            <Button
              label={plain ? clearLanguage.partnerCompareNo : "Withdraw compare"}
              variant="secondary"
              onPress={() => void consentCompare(false)}
            />
          ) : null}
          <Button
            label="Show my package"
            variant="secondary"
            onPress={() => void showPackage()}
          />
        </Card>
      ) : null}

      {copiedPackage ? (
        <Card>
          <Text style={styles.cardTitle}>Package to copy</Text>
          <Body muted>
            Treat this like a private invitation. Ciphertext and public keys
            only.
          </Body>
          <Text selectable style={styles.packageBox}>
            {copiedPackage}
          </Text>
          {relayCode ? (
            <Text selectable style={styles.relayCode}>
              Claim code: {relayCode}
            </Text>
          ) : null}
        </Card>
      ) : null}

      {invites.length > 1 ? (
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
              >
                <Text style={styles.inviteTitle}>
                  {label} · {invite.role}
                </Text>
                <Text style={styles.inviteMeta}>
                  share {invite.hostConsentToShare ? "yes" : "no"} · compare{" "}
                  {invite.hostConsentToCompare ? "yes" : "no"} · partner{" "}
                  {invite.peerResult ? "yes" : "no"}
                </Text>
              </Pressable>
            );
          })}
        </Card>
      ) : null}

      <Card>
        <Pressable
          onPress={() => setShowAdvanced((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={
            showAdvanced ? "Hide advanced tools" : "Show advanced tools"
          }
        >
          <Text style={styles.cardTitle}>
            {showAdvanced ? "▾ Advanced tools" : "▸ Advanced tools"}
          </Text>
        </Pressable>
        {showAdvanced ? (
          <>
            <Body muted>
              Paste a partner package, claim code (signed-in), or create another
              invite. Demo can practice with a fictional partner anytime from
              the next-step card when available.
            </Body>
            <Button
              label={plain ? clearLanguage.partnerCreate : "Create another invite"}
              variant="secondary"
              disabled={busy}
              onPress={() => void create()}
            />
            {isDemo && selected?.role === "host" && !selected.peerResult ? (
              <Button
                label="Practice with fictional partner"
                variant="secondary"
                disabled={busy}
                onPress={() => void practiceDemo()}
              />
            ) : null}
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
                <Button
                  label="Publish claim code (ciphertext only)"
                  variant="secondary"
                  onPress={() => void publishRelay()}
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
              label={plain ? clearLanguage.partnerImport : "Import package"}
              disabled={busy}
              onPress={() => void importPackage()}
            />
            <Button
              label={
                compareOpen
                  ? plain
                    ? clearLanguage.partnerCompareOpen
                    : "Open shared comparison"
                  : plain
                    ? clearLanguage.partnerCompareClosed
                    : "Open comparison (still closed)"
              }
              variant={compareOpen ? "primary" : "secondary"}
              onPress={runCompare}
            />
          </>
        ) : null}
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
    progressDots: {
      flexDirection: "row" as const,
      gap: 8,
      marginBottom: 12,
    },
    dot: {
      flex: 1,
      height: 6,
      borderRadius: 3,
    },
    dotDone: { backgroundColor: colors.moss },
    dotTodo: { backgroundColor: colors.line },
    guideTitle: {
      color: colors.ink,
      fontFamily: fonts.headline,
      fontSize: 24,
      lineHeight: 30,
      marginBottom: 8,
    },
    safetyLine: {
      color: colors.plum,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "600" as const,
      marginBottom: 12,
      marginTop: 4,
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
