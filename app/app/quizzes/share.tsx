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
import { quizResultsStore } from "../../services/quizResultsStore";
import {
  canCompare,
  compareInvite,
  exportHostPackage,
  parsePortablePackage,
  sealResult,
  type QuizInvite,
} from "../../services/quizShareCore";
import { fonts, type AppColors } from "../../theme";
import { useThemedStyles } from "../../hooks/useThemedStyles";

function ShareBody() {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { quizId: quizIdParam } = useLocalSearchParams<{ quizId?: string }>();
  const [invites, setInvites] = useState<QuizInvite[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [peerJson, setPeerJson] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [comparisonText, setComparisonText] = useState<string | null>(null);
  const [copiedPackage, setCopiedPackage] = useState<string | null>(null);

  const preferredQuiz =
    (quizIdParam as QuizCatalogId | undefined) ?? "vibe-short";

  const refresh = useCallback(async () => {
    const list = await quizInviteStore.list();
    setInvites(list);
    setSelectedId((current) => current ?? list[0]?.id ?? null);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const selected = invites.find((i) => i.id === selectedId) ?? null;
  const entry = selected
    ? getQuizEntry(selected.quizId)
    : getQuizEntry(preferredQuiz);

  const create = async () => {
    const quizId = (selected?.quizId ?? preferredQuiz) as QuizCatalogId;
    if (!getQuizEntry(quizId)?.shareable) {
      setMessage("That quiz is not available for partner invites.");
      return;
    }
    const invite = await quizInviteStore.create(quizId);
    setSelectedId(invite.id);
    setMessage(
      "Invite created on this device. Treat the package like a password.",
    );
    await refresh();
  };

  const consentShare = async (value: boolean) => {
    if (!selected) return;
    const results = await quizResultsStore.load();
    const mine = results[selected.quizId];
    if (value && !mine) {
      setMessage(
        "Take this quiz first, then consent to share a sealed result.",
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
    setMessage(
      value
        ? "You consented to share a sealed result for this invite."
        : "Share consent withdrawn; sealed result removed.",
    );
    await refresh();
  };

  const consentCompare = async (value: boolean) => {
    if (!selected) return;
    await quizInviteStore.setHostCompare(selected.id, value);
    setMessage(
      value
        ? "You consented to compare — still needs their compare consent."
        : "Compare consent withdrawn.",
    );
    await refresh();
  };

  const showPackage = () => {
    if (!selected) return;
    const pack = JSON.stringify(exportHostPackage(selected));
    setCopiedPackage(pack);
    setMessage(
      "Package ready below. Copy it manually to share out-of-band. It includes the seal key.",
    );
  };

  const importPeer = async () => {
    if (!selected) return;
    const parsed = parsePortablePackage(peerJson.trim());
    if ("error" in parsed) {
      setMessage(parsed.error);
      return;
    }
    if (!parsed.sealed || !parsed.consentToShare) {
      setMessage(
        "Peer package has no sealed result or share consent. Fail closed.",
      );
      return;
    }
    const next = await quizInviteStore.importPeer(selected.id, {
      sealed: parsed.sealed,
      consentToShare: parsed.consentToShare,
      consentToCompare: parsed.consentToCompare,
    });
    if ("error" in next) {
      setMessage(next.error);
      return;
    }
    setMessage(
      "Peer package imported. Comparison still needs mutual compare consent.",
    );
    await refresh();
  };

  const runCompare = () => {
    if (!selected) return;
    if (!canCompare(selected)) {
      setMessage(
        "Comparison stays closed until both people consent to share and to compare.",
      );
      setComparisonText(null);
      return;
    }
    const result = compareInvite(selected);
    if ("error" in result) {
      setMessage(result.error);
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
    setMessage("Comparison opened with mutual consent.");
  };

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
        <Body muted>
          1) Create invite · 2) Consent to share sealed result · 3) Exchange
          packages · 4) Both consent to compare · 5) Open comparison
        </Body>
        <Button label="Create invite" onPress={() => void create()} />
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
                onPress={() => setSelectedId(invite.id)}
                style={[styles.inviteRow, active && styles.inviteActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text style={styles.inviteTitle}>{label}</Text>
                <Text style={styles.inviteMeta}>
                  share {invite.hostConsentToShare ? "yes" : "no"} · compare{" "}
                  {invite.hostConsentToCompare ? "yes" : "no"} · peer{" "}
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
          <Body muted>
            Two separate choices. Share seals your result. Compare opens a joint
            view only when both opt in.
          </Body>
          <Button
            label={
              selected.hostConsentToShare
                ? "Withdraw share consent"
                : "I consent to share my sealed result"
            }
            variant={selected.hostConsentToShare ? "secondary" : "primary"}
            onPress={() => void consentShare(!selected.hostConsentToShare)}
          />
          <Button
            label={
              selected.hostConsentToCompare
                ? "Withdraw compare consent"
                : "I consent to compare (if they do too)"
            }
            variant="secondary"
            onPress={() => void consentCompare(!selected.hostConsentToCompare)}
          />
          <Button
            label="Show my invite package"
            variant="secondary"
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
          <Body muted>Paste their JSON package. Wrong seals fail closed.</Body>
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
            label="Open comparison (mutual consent required)"
            onPress={runCompare}
          />
        </Card>
      ) : null}

      {message ? <Body muted>{message}</Body> : null}
      {comparisonText ? (
        <Card>
          <Text style={styles.cardTitle}>Comparison</Text>
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
    inviteRow: {
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
    },
    inviteActive: {
      backgroundColor: colors.mossSoft,
      borderRadius: 12,
      paddingHorizontal: 10,
    },
    inviteTitle: { color: colors.ink, fontWeight: "700" as const },
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
    compareBody: { color: colors.ink, fontSize: 15, lineHeight: 22 },
  };
}
