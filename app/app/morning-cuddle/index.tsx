/**
 * Morning Cuddle Protocol v0.1 — 7:42am negotiation + Soft Signal.
 * Comedy gold + emotional support infrastructure.
 */
import { useCallback, useEffect, useRef, useState } from "react";
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
  MORNING_COPY,
  MORNING_DURATIONS,
  MORNING_ENERGIES,
  MORNING_STYLES,
  armGracefulExit,
  canSealMorning,
  checkInPhraseText,
  completeMorning,
  defaultMorningDebrief,
  defaultMorningDraft,
  durationTargetSeconds,
  exitProtocolHistoryEntry,
  findDuration,
  findEnergy,
  findStyle,
  formatMorningClock,
  isMorningDurationComplete,
  recordMorningCheckIn,
  sealMorning,
  shouldFireGremlinPeeWarning,
  startMorningSession,
  summarizeMorningHistory,
  tickMorningSession,
  type MorningActiveSession,
  type MorningCheckInPhraseId,
  type MorningDebrief,
  type MorningDurationId,
  type MorningEnergyId,
  type MorningHistoryEntry,
  type MorningSealDraft,
  type MorningStyleId,
} from "../../lib/morningCuddleCore";
import { softSignalService } from "../../services/softSignalService";
import { morningCuddleStore } from "../../services/morningCuddleStore";
import { hapticService } from "../../services/hapticService";
import { type AppColors } from "../../theme";
import { useThemedStyles } from "../../hooks/useThemedStyles";
import { useColors } from "../../context/ThemeContext";

type Phase = "hub" | "negotiate" | "active" | "exit_ritual" | "debrief" | "history";

export default function MorningCuddleScreen() {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("hub");
  const [draft, setDraft] = useState<MorningSealDraft>(defaultMorningDraft());
  const [session, setSession] = useState<MorningActiveSession | null>(null);
  const [debrief, setDebrief] = useState<MorningDebrief>(defaultMorningDebrief());
  const [pendingEnd, setPendingEnd] = useState<
    "completed" | "soft_signal" | "graceful_timer" | null
  >(null);
  const [softState, setSoftState] = useState<"idle" | "stopping" | "stopped">(
    "idle",
  );
  const [history, setHistory] = useState<MorningHistoryEntry[]>([]);
  const [sealError, setSealError] = useState("");
  const [checkInFlash, setCheckInFlash] = useState<string | null>(null);
  const [peeBanner, setPeeBanner] = useState(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const peeFired = useRef(false);

  const reloadHistory = useCallback(async () => {
    setHistory(await morningCuddleStore.load());
  }, []);

  useEffect(() => {
    void reloadHistory();
  }, [reloadHistory]);

  useEffect(() => {
    if (phase !== "active" || !session) {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
      return;
    }
    tickRef.current = setInterval(() => {
      setSession((prev) => {
        if (!prev) return prev;
        const next = tickMorningSession(prev, 1);
        if (shouldFireGremlinPeeWarning(next) && !peeFired.current) {
          peeFired.current = true;
          setPeeBanner(true);
          void hapticService.play("attention");
        }
        if (isMorningDurationComplete(next)) {
          setPendingEnd("graceful_timer");
          setPhase("exit_ritual");
        }
        return next;
      });
    }, 1000);
    return () => {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };
  }, [phase, session?.snapshot.id]);

  const gate = canSealMorning(draft);
  const summary = summarizeMorningHistory(history);

  const onSeal = async () => {
    const g = canSealMorning(draft);
    if (!g.ok) {
      setSealError(g.reason);
      return;
    }
    if (g.immediateExit) {
      await morningCuddleStore.append(exitProtocolHistoryEntry());
      await reloadHistory();
      setSealError("");
      setPhase("hub");
      return;
    }
    const snap = sealMorning(draft);
    if (!snap) {
      setSealError("Could not seal. Fail closed.");
      return;
    }
    setSealError("");
    const s = startMorningSession(snap);
    setSession(s);
    setSoftState("idle");
    setDebrief(defaultMorningDebrief());
    setPendingEnd(null);
    setPeeBanner(false);
    peeFired.current = false;
    setCheckInFlash(null);
    if (snap.goodMorningHaptic) {
      void hapticService.play("presence");
    }
    setPhase("active");
  };

  const finishToHistory = async (
    reason: "completed" | "soft_signal" | "graceful_timer" | "abandoned",
    includeDebrief: boolean,
  ) => {
    if (!session) return;
    const entry = completeMorning(
      session,
      reason,
      includeDebrief ? debrief : null,
    );
    await morningCuddleStore.append(entry);
    await reloadHistory();
    setSession(null);
    setPendingEnd(null);
    setSoftState("idle");
    setDraft(defaultMorningDraft());
    setPeeBanner(false);
    setPhase("hub");
  };

  const fireSoftSignal = async () => {
    setSoftState("stopping");
    await softSignalService.practice();
    setSoftState("stopped");
    setPendingEnd("soft_signal");
    setPhase("exit_ritual");
  };

  const onCheckIn = () => {
    if (!session) return;
    setSession(recordMorningCheckIn(session));
    const phrase =
      checkInPhraseText(session.snapshot.checkInPhrase) ??
      MORNING_COPY.checkInGremlin;
    setCheckInFlash(phrase);
    void hapticService.play("presence");
    setTimeout(() => setCheckInFlash(null), 2500);
  };

  if (phase === "active" && session) {
    const target = durationTargetSeconds(session.snapshot.durationId);
    const energy = findEnergy(session.snapshot.energyId);
    const style = findStyle(session.snapshot.styleId);
    const z = session.snapshot.zones;
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Eyebrow>MORNING CUDDLE · ACTIVE</Eyebrow>
          <Title>Gremlin containment in progress.</Title>
          <Card>
            <Text style={styles.banner}>{MORNING_COPY.softSignal}</Text>
            <Body>
              {energy.label} · {style.label}
            </Body>
            <Body muted>
              Hair: {z.hair} · Stomach: {z.stomach} · Legs: {z.legs} · Face:{" "}
              {z.faceToFace}
            </Body>
            <Text style={styles.clock} accessibilityRole="timer">
              {formatMorningClock(session.elapsedSeconds)}
              {target != null
                ? ` / ${formatMorningClock(target)}`
                : ""}
            </Text>
            {peeBanner ? (
              <Text style={styles.warning}>
                ~8 min gremlin window: pee may be becoming load-bearing. Soft
                Signal still free.
              </Text>
            ) : null}
            {checkInFlash ? (
              <Text style={styles.checkInFlash}>{checkInFlash}</Text>
            ) : null}
          </Card>

          <SoftSignalButton
            state={softState}
            onPress={() => void fireSoftSignal()}
            accessibilityHint="Instant release. No worries, love you."
          />

          <Button
            variant="secondary"
            label="Silly check-in"
            onPress={onCheckIn}
          />
          <Button
            variant="secondary"
            label="Graceful exit → ritual"
            onPress={() => {
              setSession(armGracefulExit(session));
              setPendingEnd("completed");
              setPhase("exit_ritual");
            }}
          />
          <Body muted>Check-ins: {session.checkInCount}</Body>
        </ScrollView>
      </Screen>
    );
  }

  if (phase === "exit_ritual" && session) {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Eyebrow>EXIT PROTOCOL</Eyebrow>
          <Title>Graceful disengage.</Title>
          <Card>
            <Text style={styles.banner}>{MORNING_COPY.exitRitual}</Text>
            <Body muted>
              Script for the human (or the pillow): forehead kiss + “I really
              liked that.” This is mandatory positive reinforcement for the
              brain that spirals at 7:42am.
            </Body>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Body>I did the exit ritual (or will)</Body>
              </View>
              <Switch
                accessibilityLabel="Exit ritual done"
                value={debrief.exitRitualDone}
                onValueChange={(v) =>
                  setDebrief({ ...debrief, exitRitualDone: v })
                }
                trackColor={{ false: colors.line, true: colors.mossSoft }}
                thumbColor={
                  debrief.exitRitualDone ? colors.moss : colors.white
                }
              />
            </View>
          </Card>
          <Button
            label="Continue to private debrief"
            onPress={() => setPhase("debrief")}
          />
          <Button
            variant="secondary"
            label="Skip debrief, save exit only"
            onPress={() =>
              void finishToHistory(pendingEnd ?? "completed", true)
            }
          />
        </ScrollView>
      </Screen>
    );
  }

  if (phase === "debrief" && session) {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Eyebrow>PRIVATE DEBRIEF</Eyebrow>
          <Title>How safe did that feel?</Title>
          <Body muted>Optional. Local only. Not a grade for the relationship.</Body>
          <Card>
            <Text style={styles.section}>Safety feel (1–10)</Text>
            <View style={styles.chipRow}>
              {([1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const).map((n) => (
                <Chip
                  key={n}
                  label={String(n)}
                  selected={debrief.safetyFeel === n}
                  onPress={() => setDebrief({ ...debrief, safetyFeel: n })}
                  styles={styles}
                  colors={colors}
                />
              ))}
            </View>
            <TextInput
              accessibilityLabel="Debrief note"
              value={debrief.note}
              onChangeText={(t) => setDebrief({ ...debrief, note: t })}
              placeholder="Optional note…"
              placeholderTextColor={colors.muted}
              style={styles.input}
              multiline
              maxLength={500}
            />
          </Card>
          <Card>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Body>{MORNING_COPY.ledger1}</Body>
              </View>
              <Switch
                value={debrief.ledgerReceivedWithoutSpiral}
                onValueChange={(v) =>
                  setDebrief({
                    ...debrief,
                    ledgerReceivedWithoutSpiral: v,
                  })
                }
                trackColor={{ false: colors.line, true: colors.mossSoft }}
                thumbColor={
                  debrief.ledgerReceivedWithoutSpiral
                    ? colors.moss
                    : colors.white
                }
              />
            </View>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Body>{MORNING_COPY.ledger2}</Body>
              </View>
              <Switch
                value={debrief.ledgerNoGuiltAboutCloseness}
                onValueChange={(v) =>
                  setDebrief({
                    ...debrief,
                    ledgerNoGuiltAboutCloseness: v,
                  })
                }
                trackColor={{ false: colors.line, true: colors.mossSoft }}
                thumbColor={
                  debrief.ledgerNoGuiltAboutCloseness
                    ? colors.moss
                    : colors.white
                }
              />
            </View>
          </Card>
          <Button
            label="Save private debrief"
            onPress={() =>
              void finishToHistory(pendingEnd ?? "completed", true)
            }
          />
          <Button
            variant="secondary"
            label="Skip"
            onPress={() =>
              void finishToHistory(pendingEnd ?? "completed", false)
            }
          />
        </ScrollView>
      </Screen>
    );
  }

  if (phase === "history") {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Eyebrow>MORNING HISTORY</Eyebrow>
          <Title>Local joke ledger.</Title>
          <Body muted>
            {summary.total} · Soft Signal {summary.soft_signal_exits} · Exit
            Protocol {summary.exit_protocol_skips} · no-spiral{" "}
            {summary.no_spiral_plus} · no-guilt {summary.no_guilt_plus} ·
            gremlin {summary.gremlin_sessions}
          </Body>
          {history.length === 0 ? (
            <Body muted>No morning cuddles logged. Coffee awaits.</Body>
          ) : (
            history.slice(0, 12).map((h) => (
              <Card key={`${h.snapshot.id}-${h.endedAt}`}>
                <Body>
                  {findEnergy(h.snapshot.energyId).label} ·{" "}
                  {findStyle(h.snapshot.styleId).label}
                </Body>
                <Body muted>{h.endReason}</Body>
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

  if (phase === "negotiate") {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Eyebrow>30-SECOND NEGOTIATION</Eyebrow>
          <Title>Before coffee. After consciousness (barely).</Title>
          <Body muted>{MORNING_COPY.negotiateHint}</Body>

          <Card>
            <Text style={styles.section}>Energy</Text>
            {MORNING_ENERGIES.filter((e) => e.id !== "undecided").map((e) => (
              <Pressable
                key={e.id}
                accessibilityRole="button"
                accessibilityState={{ selected: draft.energyId === e.id }}
                onPress={() =>
                  setDraft({ ...draft, energyId: e.id as MorningEnergyId })
                }
                style={[
                  styles.roleCard,
                  draft.energyId === e.id && styles.roleCardSelected,
                ]}
              >
                <Text style={styles.roleTitle}>{e.label}</Text>
                <Body muted>{e.blurb}</Body>
              </Pressable>
            ))}
          </Card>

          {draft.energyId !== "exit_protocol" &&
          draft.energyId !== "undecided" ? (
            <>
              <Card>
                <Text style={styles.section}>Duration</Text>
                <View style={styles.chipRow}>
                  {MORNING_DURATIONS.filter((d) => d.id !== "undecided").map(
                    (d) => (
                      <Chip
                        key={d.id}
                        label={d.label}
                        selected={draft.durationId === d.id}
                        onPress={() =>
                          setDraft({
                            ...draft,
                            durationId: d.id as MorningDurationId,
                          })
                        }
                        styles={styles}
                        colors={colors}
                      />
                    ),
                  )}
                </View>
                {draft.durationId !== "undecided" ? (
                  <Body muted>{findDuration(draft.durationId).blurb}</Body>
                ) : null}
              </Card>

              <Card>
                <Text style={styles.section}>Cuddle style</Text>
                <View style={styles.chipRow}>
                  {MORNING_STYLES.filter((s) => s.id !== "undecided").map(
                    (s) => (
                      <Chip
                        key={s.id}
                        label={s.label}
                        selected={draft.styleId === s.id}
                        onPress={() =>
                          setDraft({
                            ...draft,
                            styleId: s.id as MorningStyleId,
                          })
                        }
                        styles={styles}
                        colors={colors}
                      />
                    ),
                  )}
                </View>
                {draft.styleId !== "undecided" ? (
                  <Body muted>{findStyle(draft.styleId).blurb}</Body>
                ) : null}
              </Card>

              <Card>
                <Text style={styles.section}>Morning zones</Text>
                <Body muted>Hair touching</Body>
                <View style={styles.chipRow}>
                  {(
                    [
                      ["yes", "Yes"],
                      ["washed_yesterday_only", "Only if washed yesterday"],
                      ["no", "No"],
                    ] as const
                  ).map(([id, label]) => (
                    <Chip
                      key={id}
                      label={label}
                      selected={draft.zones.hair === id}
                      onPress={() =>
                        setDraft({
                          ...draft,
                          zones: { ...draft.zones, hair: id },
                        })
                      }
                      styles={styles}
                      colors={colors}
                    />
                  ))}
                </View>
                <Body muted>Stomach contact</Body>
                <View style={styles.chipRow}>
                  {(
                    [
                      ["yes", "Yes"],
                      ["negotiable", "Negotiable"],
                      ["no", "No / danger zone"],
                    ] as const
                  ).map(([id, label]) => (
                    <Chip
                      key={id}
                      label={label}
                      selected={draft.zones.stomach === id}
                      onPress={() =>
                        setDraft({
                          ...draft,
                          zones: { ...draft.zones, stomach: id },
                        })
                      }
                      styles={styles}
                      colors={colors}
                    />
                  ))}
                </View>
                <Body muted>Leg entanglement</Body>
                <View style={styles.chipRow}>
                  {(
                    [
                      ["default_yes", "Default yes"],
                      ["restless_no", "Restless legs — no"],
                    ] as const
                  ).map(([id, label]) => (
                    <Chip
                      key={id}
                      label={label}
                      selected={draft.zones.legs === id}
                      onPress={() =>
                        setDraft({
                          ...draft,
                          zones: { ...draft.zones, legs: id },
                        })
                      }
                      styles={styles}
                      colors={colors}
                    />
                  ))}
                </View>
                <Body muted>Morning breath / face-to-face</Body>
                <View style={styles.chipRow}>
                  {(
                    [
                      ["no", "No (default)"],
                      ["explicit_yes", "Explicit yes only"],
                    ] as const
                  ).map(([id, label]) => (
                    <Chip
                      key={id}
                      label={label}
                      selected={draft.zones.faceToFace === id}
                      onPress={() =>
                        setDraft({
                          ...draft,
                          zones: { ...draft.zones, faceToFace: id },
                        })
                      }
                      styles={styles}
                      colors={colors}
                    />
                  ))}
                </View>
              </Card>

              <Card>
                <Text style={styles.section}>One silly check-in phrase</Text>
                <View style={styles.chipRow}>
                  {(
                    [
                      ["still_alive", "Still alive in there?"],
                      ["you_good_gremlin", "You good, gremlin?"],
                      ["none", "None"],
                    ] as const
                  ).map(([id, label]) => (
                    <Chip
                      key={id}
                      label={label}
                      selected={draft.checkInPhrase === id}
                      onPress={() =>
                        setDraft({
                          ...draft,
                          checkInPhrase: id as MorningCheckInPhraseId,
                        })
                      }
                      styles={styles}
                      colors={colors}
                    />
                  ))}
                </View>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Body>Good Morning Haptic (rising presence)</Body>
                  </View>
                  <Switch
                    value={draft.goodMorningHaptic}
                    onValueChange={(v) =>
                      setDraft({ ...draft, goodMorningHaptic: v })
                    }
                    trackColor={{ false: colors.line, true: colors.mossSoft }}
                    thumbColor={
                      draft.goodMorningHaptic ? colors.moss : colors.white
                    }
                  />
                </View>
              </Card>

              <Card>
                <Text style={styles.section}>Private 7:42am note</Text>
                <TextInput
                  accessibilityLabel="Morning anxiety note"
                  value={draft.anxietyNote}
                  onChangeText={(t) =>
                    setDraft({ ...draft, anxietyNote: t })
                  }
                  placeholder="Am I being too needy / are they annoyed…"
                  placeholderTextColor={colors.muted}
                  style={styles.input}
                  multiline
                  maxLength={500}
                />
              </Card>
            </>
          ) : null}

          {sealError ? <Body muted>{sealError}</Body> : null}
          {!gate.ok ? <Body muted>{gate.reason}</Body> : null}
          {gate.ok && gate.immediateExit ? (
            <Body muted>{gate.reason}</Body>
          ) : null}

          <Button
            label={
              gate.immediateExit
                ? "Log Exit Protocol (no cuddle)"
                : "Seal morning snapshot → cuddle"
            }
            onPress={() => void onSeal()}
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
        <Eyebrow>MORNING CUDDLE</Eyebrow>
        <Title>{MORNING_COPY.title}</Title>
        <Card>
          <Text style={styles.banner}>{MORNING_COPY.banner}</Text>
          <Text style={styles.tagline}>{MORNING_COPY.tagline}</Text>
          <Body muted>{MORNING_COPY.philosophy}</Body>
          <Body muted>{MORNING_COPY.comedy}</Body>
        </Card>
        <Card>
          <Body>• 30-second negotiation (energy · duration · style · zones)</Body>
          <Body>• Soft Signal sacred · silly check-in · Good Morning Haptic</Body>
          <Body>• Exit ritual: forehead kiss + “I really liked that”</Body>
          <Body>• Joke ledger: no-spiral + no-guilt closeness</Body>
        </Card>
        <Button
          label="30-second negotiation"
          onPress={() => setPhase("negotiate")}
        />
        <Button
          variant="secondary"
          label="I'm Not Ready To Get Up Yet"
          onPress={() => router.push("/not-ready-yet" as never)}
        />
        <Button
          variant="secondary"
          label={`Local history (${summary.total})`}
          onPress={() => {
            void reloadHistory();
            setPhase("history");
          }}
        />
        <Button
          variant="secondary"
          label="Spooning Protocol (anytime edition)"
          onPress={() => router.push("/spooning" as never)}
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

function Chip({
  label,
  selected,
  onPress,
  styles,
  colors,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  styles: ReturnType<typeof makeStyles>;
  colors: AppColors;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.chip,
        selected && {
          backgroundColor: colors.mossSoft,
          borderColor: colors.moss,
        },
      ]}
    >
      <Text
        style={[
          styles.chipText,
          selected && { color: colors.moss, fontWeight: "700" },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function makeStyles(colors: AppColors) {
  return {
    scroll: { gap: 14, paddingBottom: 40 },
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
      marginTop: 4,
    },
    clock: {
      color: colors.moss,
      fontSize: 36,
      fontWeight: "800" as const,
      marginTop: 12,
    },
    warning: {
      color: colors.signal,
      fontWeight: "700" as const,
      marginTop: 10,
      fontSize: 14,
    },
    checkInFlash: {
      color: colors.moss,
      fontWeight: "800" as const,
      fontSize: 20,
      marginTop: 12,
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
      fontSize: 16,
    },
    chipRow: {
      flexDirection: "row" as const,
      flexWrap: "wrap" as const,
      gap: 8,
      marginTop: 8,
      marginBottom: 8,
    },
    chip: {
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: colors.cream,
    },
    chipText: { color: colors.ink, fontSize: 13 },
    row: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 12,
      marginTop: 12,
    },
    input: {
      minHeight: 72,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.line,
      padding: 14,
      color: colors.ink,
      textAlignVertical: "top" as const,
      backgroundColor: colors.cream,
      marginTop: 10,
    },
  };
}
