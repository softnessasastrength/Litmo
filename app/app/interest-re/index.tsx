/**
 * Interest Reverse Engineering — want vs should vs fawn.
 * Soft Signal free. Interest is not consent.
 */
import { useCallback, useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Body,
  Button,
  Card,
  Eyebrow,
  Screen,
  Title,
} from "../../components/ui";
import { SoftSignalButton } from "../../components/SoftSignalButton";
import {
  INTEREST_COPY,
  INTEREST_TARGETS,
  canSealInterest,
  completeInterest,
  defaultInterestDebrief,
  defaultInterestDraft,
  findTarget,
  moveLabel,
  sealInterest,
  suggestedMoves,
  summarizeInterestHistory,
  type InterestDebrief,
  type InterestHistoryEntry,
  type InterestMoveId,
  type InterestSealDraft,
  type InterestSnapshot,
  type InterestTargetKind,
} from "../../lib/interestReCore";
import { softSignalService } from "../../services/softSignalService";
import { interestReStore } from "../../services/interestReStore";
import { relationshipModelStore } from "../../services/relationshipModelStore";
import { BondMapBanner } from "../../components/BondMapBanner";
import type { RelationshipModel } from "../../lib/relationshipModelCore";
import { type AppColors } from "../../theme";
import { useThemedStyles } from "../../hooks/useThemedStyles";
import { useColors } from "../../context/ThemeContext";

type Phase = "hub" | "inventory" | "result" | "debrief" | "history";

export default function InterestReScreen() {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("hub");
  const [draft, setDraft] = useState<InterestSealDraft>(defaultInterestDraft());
  const [snapshot, setSnapshot] = useState<InterestSnapshot | null>(null);
  const [moveId, setMoveId] = useState<InterestMoveId>("none");
  const [debrief, setDebrief] = useState<InterestDebrief>(
    defaultInterestDebrief(),
  );
  const [softState, setSoftState] = useState<"idle" | "stopping" | "stopped">(
    "idle",
  );
  const [history, setHistory] = useState<InterestHistoryEntry[]>([]);
  const [sealError, setSealError] = useState("");
  const [pendingEnd, setPendingEnd] = useState<
    "completed" | "soft_signal" | null
  >(null);
  const [relModel, setRelModel] = useState<RelationshipModel | null>(null);

  const reloadHistory = useCallback(async () => {
    setHistory(await interestReStore.load());
  }, []);

  useEffect(() => {
    void reloadHistory();
    void relationshipModelStore.load().then((b) => {
      if (b?.model) setRelModel(b.model);
    });
  }, [reloadHistory]);

  const gate = canSealInterest(draft);
  const summary = summarizeInterestHistory(history);

  const onSeal = () => {
    const g = canSealInterest(draft);
    if (!g.ok) {
      setSealError(g.reason);
      return;
    }
    const snap = sealInterest(draft);
    if (!snap) {
      setSealError("Fail closed.");
      return;
    }
    setSealError("");
    setSnapshot(snap);
    setMoveId("none");
    setDebrief(defaultInterestDebrief());
    if (snap.signals.shouldWant || snap.honesty.label === "performing") {
      setDebrief((d) => ({ ...d, ledgerNamedShould: true }));
    }
    setSoftState("idle");
    setPendingEnd(null);
    setPhase("result");
  };

  const finish = async (
    reason: "completed" | "soft_signal" | "abandoned",
    includeDebrief: boolean,
  ) => {
    if (!snapshot) return;
    const entry = completeInterest(
      snapshot,
      moveId === "none" && reason === "soft_signal" ? "soft_signal" : moveId,
      reason,
      includeDebrief ? debrief : null,
    );
    await interestReStore.append(entry);
    await reloadHistory();
    setSnapshot(null);
    setDraft(defaultInterestDraft());
    setMoveId("none");
    setPhase("hub");
  };

  const fireSoftSignal = async () => {
    setSoftState("stopping");
    await softSignalService.practice();
    setSoftState("stopped");
    setMoveId("soft_signal");
    setPendingEnd("soft_signal");
    setDebrief((d) => ({ ...d, ledgerSoftSignalOk: true }));
    setPhase("debrief");
  };

  if (phase === "result" && snapshot) {
    const moves = suggestedMoves(snapshot.honesty.label);
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Eyebrow>HONESTY READ</Eyebrow>
          <Title>{snapshot.honesty.title}</Title>
          <Card>
            <Text style={styles.banner}>{INTEREST_COPY.notConsent}</Text>
            <Body muted>
              Target: {findTarget(snapshot.targetKind).label}
              {snapshot.targetNote ? ` — ${snapshot.targetNote}` : ""}
            </Body>
            <Body>{snapshot.honesty.advice}</Body>
            <Body muted>
              Confidence (UI only):{" "}
              {Math.round(snapshot.honesty.confidence * 100)}% — not a grade of
              you.
            </Body>
          </Card>

          <Card>
            <Text style={styles.section}>Choose a move</Text>
            {moves.map((m) => (
              <Pressable
                key={m}
                accessibilityRole="button"
                onPress={() => {
                  setMoveId(m);
                  if (m === "dont_know_yet") {
                    setDebrief((d) => ({
                      ...d,
                      ledgerAllowedDontKnow: true,
                    }));
                  }
                }}
                style={[
                  styles.chip,
                  moveId === m && {
                    backgroundColor: colors.mossSoft,
                    borderColor: colors.moss,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    moveId === m && {
                      color: colors.moss,
                      fontWeight: "700",
                    },
                  ]}
                >
                  {moveLabel(m)}
                </Text>
              </Pressable>
            ))}
          </Card>

          <SoftSignalButton
            state={softState}
            onPress={() => void fireSoftSignal()}
          />

          <Button
            label="Finish → debrief"
            disabled={moveId === "none"}
            onPress={() => {
              if (moveId === "soft_signal") setPendingEnd("soft_signal");
              else setPendingEnd("completed");
              setPhase("debrief");
            }}
          />
        </ScrollView>
      </Screen>
    );
  }

  if (phase === "debrief" && snapshot) {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Eyebrow>DEBRIEF</Eyebrow>
          <Title>No soul grades.</Title>
          <Body muted>
            {snapshot.honesty.label} · move: {moveLabel(moveId)}
          </Body>
          <Card>
            <Text style={styles.section}>Clarity after (1–10)</Text>
            <View style={styles.chipRow}>
              {([1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const).map((n) => (
                <Pressable
                  key={n}
                  onPress={() => setDebrief({ ...debrief, clarity: n })}
                  style={[
                    styles.chip,
                    debrief.clarity === n && {
                      backgroundColor: colors.mossSoft,
                      borderColor: colors.moss,
                    },
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: debrief.clarity === n }}
                  accessibilityLabel={`Clarity ${n}`}
                  hitSlop={6}
                >
                  <Text style={styles.chipText}>{n}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              value={debrief.note}
              onChangeText={(t) => setDebrief({ ...debrief, note: t })}
              placeholder="Optional note…"
              placeholderTextColor={colors.muted}
              style={styles.input}
              multiline
            />
          </Card>
          <Card>
            <Toggle
              label="+1 Named should vs want"
              value={debrief.ledgerNamedShould}
              onChange={(v) =>
                setDebrief({ ...debrief, ledgerNamedShould: v })
              }
              colors={colors}
              styles={styles}
            />
            <Toggle
              label="+1 Allowed “I don’t know yet”"
              value={debrief.ledgerAllowedDontKnow}
              onChange={(v) =>
                setDebrief({ ...debrief, ledgerAllowedDontKnow: v })
              }
              colors={colors}
              styles={styles}
            />
            <Toggle
              label="+1 Soft Signal free in mind"
              value={debrief.ledgerSoftSignalOk}
              onChange={(v) =>
                setDebrief({ ...debrief, ledgerSoftSignalOk: v })
              }
              colors={colors}
              styles={styles}
            />
            <Toggle
              label="+1 Not a gotcha against partner"
              value={debrief.ledgerNotGotcha}
              onChange={(v) =>
                setDebrief({ ...debrief, ledgerNotGotcha: v })
              }
              colors={colors}
              styles={styles}
            />
          </Card>
          <Button
            label="Save"
            onPress={() => void finish(pendingEnd ?? "completed", true)}
          />
          <Button
            variant="secondary"
            label="Skip"
            onPress={() => void finish(pendingEnd ?? "completed", false)}
          />
        </ScrollView>
      </Screen>
    );
  }

  if (phase === "history") {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Eyebrow>HISTORY</Eyebrow>
          <Title>Local only.</Title>
          <Body muted>
            {summary.total} · performing {summary.performing} · Soft Signal{" "}
            {summary.soft_signal} · don’t-know {summary.dont_know}
          </Body>
          {history.length === 0 ? (
            <Body muted>No runs yet. Vibes can wait in the lobby.</Body>
          ) : (
            history.slice(0, 12).map((h) => (
              <Card key={`${h.snapshot.id}-${h.endedAt}`}>
                <Body>{h.snapshot.honesty.title}</Body>
                <Body muted>
                  {findTarget(h.snapshot.targetKind).label} · {h.endReason}
                </Body>
              </Card>
            ))
          )}
          <Button
            variant="secondary"
            label="Back"
            onPress={() => setPhase("hub")}
          />
        </ScrollView>
      </Screen>
    );
  }

  if (phase === "inventory") {
    const s = draft.signals;
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Eyebrow>SIGNAL INVENTORY</Eyebrow>
          <Title>What is lighting up?</Title>
          <Body muted>{INTEREST_COPY.notConsent}</Body>

          <Card>
            <Text style={styles.section}>Target</Text>
            {INTEREST_TARGETS.filter((t) => t.id !== "undecided").map((t) => (
              <Pressable
                key={t.id}
                onPress={() =>
                  setDraft({
                    ...draft,
                    targetKind: t.id as InterestTargetKind,
                  })
                }
                style={[
                  styles.roleCard,
                  draft.targetKind === t.id && styles.roleCardSelected,
                ]}
                accessibilityRole="radio"
                accessibilityState={{ selected: draft.targetKind === t.id }}
                accessibilityLabel={`${t.label}. ${t.blurb}`}
              >
                <Text style={styles.roleTitle}>{t.label}</Text>
                <Body muted>{t.blurb}</Body>
              </Pressable>
            ))}
            {draft.targetKind === "other" ? (
              <TextInput
                value={draft.targetNote}
                onChangeText={(t) => setDraft({ ...draft, targetNote: t })}
                placeholder="Name it…"
                placeholderTextColor={colors.muted}
                style={styles.input}
              />
            ) : null}
          </Card>

          <Card>
            <Text style={styles.section}>Signals</Text>
            <Toggle
              label="Body wants (pull / warmth / ease)"
              value={s.bodyWant}
              onChange={(v) =>
                setDraft({
                  ...draft,
                  signals: { ...s, bodyWant: v },
                })
              }
              colors={colors}
              styles={styles}
            />
            <Toggle
              label="Mind wants (curious, not panic)"
              value={s.mindWant}
              onChange={(v) =>
                setDraft({
                  ...draft,
                  signals: { ...s, mindWant: v },
                })
              }
              colors={colors}
              styles={styles}
            />
            <Toggle
              label="“I should want this”"
              value={s.shouldWant}
              onChange={(v) =>
                setDraft({
                  ...draft,
                  signals: { ...s, shouldWant: v },
                })
              }
              colors={colors}
              styles={styles}
            />
            <Toggle
              label="Fear if I say no (abandonment / cold / disappointing)"
              value={s.fearIfNo}
              onChange={(v) =>
                setDraft({
                  ...draft,
                  signals: { ...s, fearIfNo: v },
                })
              }
              colors={colors}
              styles={styles}
            />
            <Toggle
              label="Flooded / shut down"
              value={s.flooded}
              onChange={(v) =>
                setDraft({
                  ...draft,
                  signals: { ...s, flooded: v },
                })
              }
              colors={colors}
              styles={styles}
            />
            <Toggle
              label="I suspect I’m performing"
              value={s.performingSuspected}
              onChange={(v) =>
                setDraft({
                  ...draft,
                  signals: { ...s, performingSuspected: v },
                })
              }
              colors={colors}
              styles={styles}
            />
            <TextInput
              value={s.bodyNote}
              onChangeText={(t) =>
                setDraft({
                  ...draft,
                  signals: { ...s, bodyNote: t },
                })
              }
              placeholder="Body note (optional)…"
              placeholderTextColor={colors.muted}
              style={styles.input}
              multiline
            />
            <TextInput
              value={s.shouldNote}
              onChangeText={(t) =>
                setDraft({
                  ...draft,
                  signals: { ...s, shouldNote: t },
                })
              }
              placeholder="Should / fear note (optional)…"
              placeholderTextColor={colors.muted}
              style={styles.input}
              multiline
            />
          </Card>

          <Card>
            <Toggle
              label="Soft Signal is free (required)"
              value={draft.softSignalAcknowledged}
              onChange={(v) =>
                setDraft({ ...draft, softSignalAcknowledged: v })
              }
              colors={colors}
              styles={styles}
            />
          </Card>

          {sealError ? <Body muted>{sealError}</Body> : null}
          {!gate.ok ? <Body muted>{gate.reason}</Body> : null}

          <Button
            label="Reverse-engineer"
            onPress={onSeal}
            disabled={!gate.ok}
          />
          <Button
            variant="secondary"
            label="Back"
            onPress={() => setPhase("hub")}
          />
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Eyebrow>INTEREST RE</Eyebrow>
        <Title>{INTEREST_COPY.title}</Title>
        <Card>
          <Text style={styles.banner}>{INTEREST_COPY.banner}</Text>
          <Text style={styles.tagline}>{INTEREST_COPY.tagline}</Text>
          <Body muted>{INTEREST_COPY.purpose}</Body>
          <Body muted>{INTEREST_COPY.comedy}</Body>
        </Card>
        <BondMapBanner
          model={relModel}
          onOpenModel={() => router.push("/relationship-model" as never)}
        />
        <Button
          label="Open signal inventory"
          onPress={() => setPhase("inventory")}
        />
        <Button
          variant="secondary"
          label={`History (${summary.total})`}
          onPress={() => {
            void reloadHistory();
            setPhase("history");
          }}
        />
        <Button
          variant="secondary"
          label="Containment Hub"
          onPress={() => router.push("/containment" as never)}
        />
        <Button
          variant="secondary"
          label="Back"
          onPress={() => router.back()}
        />
      </ScrollView>
    </Screen>
  );
}

function Toggle({
  label,
  value,
  onChange,
  colors,
  styles,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  colors: AppColors;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Body>{label}</Body>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.line, true: colors.mossSoft }}
        thumbColor={value ? colors.moss : colors.white}
      />
    </View>
  );
}

function makeStyles(colors: AppColors) {
  return {
    scroll: { gap: 12, paddingBottom: 40 },
    banner: {
      color: colors.signal,
      fontWeight: "800" as const,
      fontSize: 13,
      marginBottom: 8,
    },
    tagline: {
      color: colors.ink,
      fontWeight: "700" as const,
      fontSize: 16,
      marginBottom: 10,
      fontStyle: "italic" as const,
    },
    section: {
      color: colors.ink,
      fontWeight: "800" as const,
      fontSize: 16,
      marginBottom: 8,
    },
    roleCard: {
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 16,
      padding: 12,
      marginTop: 8,
      gap: 4,
      backgroundColor: colors.cream,
    },
    roleCardSelected: {
      borderColor: colors.moss,
      backgroundColor: colors.mossSoft,
    },
    roleTitle: {
      color: colors.ink,
      fontWeight: "800" as const,
      fontSize: 15,
    },
    chipRow: {
      flexDirection: "row" as const,
      flexWrap: "wrap" as const,
      gap: 8,
      marginTop: 8,
    },
    chip: {
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: colors.cream,
      marginTop: 6,
    },
    chipText: { color: colors.ink, fontSize: 13 },
    row: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 12,
      marginTop: 10,
    },
    input: {
      minHeight: 48,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.line,
      padding: 14,
      color: colors.ink,
      backgroundColor: colors.cream,
      marginTop: 8,
    },
  };
}
