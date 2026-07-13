/**
 * Spooning Protocol v0.1 — runnable containment cuddle ritual.
 * Soft Signal = God Mode. Little Spoon = strength. Funny on purpose.
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
  SPOONING_COPY,
  SPOON_DURATIONS,
  SPOON_ENERGIES,
  SPOON_POSITIONS,
  SPOON_PRESSURES,
  SPOON_ROLES,
  SPOON_ZONES,
  canSealSpoon,
  completeSpoon,
  defaultDebrief,
  defaultSpoonDraft,
  durationLabel,
  durationTargetSeconds,
  findEnergy,
  findPosition,
  findPressure,
  findRole,
  formatSpoonClock,
  isDurationComplete,
  markFiveMinWarning,
  recordCheckIn,
  remainingSeconds,
  sealSpoon,
  shouldFireFiveMinWarning,
  startSpoonSession,
  summarizeHistory,
  tickSpoonSession,
  toggleZone,
  type SpoonActiveSession,
  type SpoonDebrief,
  type SpoonDurationMinutes,
  type SpoonEnergyId,
  type SpoonHistoryEntry,
  type SpoonPositionId,
  type SpoonPressureId,
  type SpoonRoleId,
  type SpoonSealDraft,
  type SpoonZoneId,
} from "../../lib/spooningCore";
import { softSignalService } from "../../services/softSignalService";
import { spooningStore } from "../../services/spooningStore";
import { hapticService } from "../../services/hapticService";
import { type AppColors } from "../../theme";
import { useThemedStyles } from "../../hooks/useThemedStyles";
import { useColors } from "../../context/ThemeContext";

type Phase = "hub" | "negotiate" | "active" | "debrief" | "history";

export default function SpooningProtocolScreen() {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("hub");
  const [draft, setDraft] = useState<SpoonSealDraft>(defaultSpoonDraft());
  const [session, setSession] = useState<SpoonActiveSession | null>(null);
  const [debrief, setDebrief] = useState<SpoonDebrief>(defaultDebrief());
  const [pendingEnd, setPendingEnd] = useState<
    "completed" | "soft_signal" | "hot_or_pee" | null
  >(null);
  const [softState, setSoftState] = useState<"idle" | "stopping" | "stopped">(
    "idle",
  );
  const [history, setHistory] = useState<SpoonHistoryEntry[]>([]);
  const [sealError, setSealError] = useState("");
  const [fiveMinBanner, setFiveMinBanner] = useState(false);
  const [checkInFlash, setCheckInFlash] = useState(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const reloadHistory = useCallback(async () => {
    setHistory(await spooningStore.load());
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
        let next = tickSpoonSession(prev, 1);
        if (shouldFireFiveMinWarning(next)) {
          next = markFiveMinWarning(next);
          setFiveMinBanner(true);
          void hapticService.play("presence");
        }
        if (isDurationComplete(next)) {
          setPendingEnd("completed");
          setPhase("debrief");
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

  const gate = canSealSpoon(draft);
  const summary = summarizeHistory(history);

  const onSeal = () => {
    const g = canSealSpoon(draft);
    if (!g.ok) {
      setSealError(g.reason);
      return;
    }
    const snap = sealSpoon(draft);
    if (!snap) {
      setSealError("Could not seal. Fail closed.");
      return;
    }
    setSealError("");
    setSession(startSpoonSession(snap));
    setSoftState("idle");
    setDebrief(defaultDebrief());
    setPendingEnd(null);
    setFiveMinBanner(false);
    setCheckInFlash(false);
    setPhase("active");
  };

  const finishToHistory = async (
    reason: "completed" | "soft_signal" | "hot_or_pee" | "abandoned",
    includeDebrief: boolean,
  ) => {
    if (!session) return;
    const entry = completeSpoon(
      session,
      reason,
      includeDebrief ? debrief : null,
    );
    await spooningStore.append(entry);
    await reloadHistory();
    setSession(null);
    setPendingEnd(null);
    setSoftState("idle");
    setDraft(defaultSpoonDraft());
    setFiveMinBanner(false);
    setPhase("hub");
  };

  const fireSoftSignal = async () => {
    setSoftState("stopping");
    await softSignalService.practice();
    setSoftState("stopped");
    setPendingEnd("soft_signal");
    setPhase("debrief");
  };

  const onCheckIn = async () => {
    if (!session) return;
    setSession(recordCheckIn(session));
    setCheckInFlash(true);
    void hapticService.play("presence");
    setTimeout(() => setCheckInFlash(false), 2500);
  };

  if (phase === "active" && session) {
    const target = durationTargetSeconds(session.snapshot.durationMinutes);
    const remain = remainingSeconds(session);
    const role = findRole(session.snapshot.roleId);
    const pos = findPosition(session.snapshot.positionId);
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Eyebrow>SPOON · ACTIVE · GOD MODE ARMED</Eyebrow>
          <Title>You are in the spoon.</Title>
          <Card>
            <Text style={styles.banner}>{SPOONING_COPY.softSignalGod}</Text>
            <Body>
              {role.label} · {pos.label}
            </Body>
            <Body muted>
              {findPressure(session.snapshot.pressureId).label} ·{" "}
              {findEnergy(session.snapshot.energyId).label}
            </Body>
            <Body muted>
              Zones:{" "}
              {session.snapshot.allowedZones
                .map(
                  (z) => SPOON_ZONES.find((x) => x.id === z)?.label ?? z,
                )
                .join(" · ")}
            </Body>
            <Text style={styles.clock} accessibilityRole="timer">
              {formatSpoonClock(session.elapsedSeconds)}
              {target != null && remain != null
                ? ` · ${formatSpoonClock(remain)} left`
                : ` · ${durationLabel(session.snapshot.durationMinutes)}`}
            </Text>
            {fiveMinBanner ? (
              <Text style={styles.warning}>{SPOONING_COPY.fiveMinWarning}</Text>
            ) : null}
            {checkInFlash ? (
              <Text style={styles.checkInFlash}>{SPOONING_COPY.checkIn}</Text>
            ) : null}
          </Card>

          <SoftSignalButton
            state={softState}
            onPress={() => void fireSoftSignal()}
            accessibilityHint="God Mode. Instant release. No questions."
          />

          <Button
            variant="secondary"
            label='Check-in · "you good?"'
            onPress={() => void onCheckIn()}
            accessibilityHint="Gentle haptic + private check-in flash. Does not end the spoon."
          />

          <Button
            variant="secondary"
            label="Hot / pee exit → debrief"
            onPress={() => {
              setPendingEnd("hot_or_pee");
              setPhase("debrief");
            }}
          />
          <Button
            variant="secondary"
            label="Natural end → debrief"
            onPress={() => {
              setPendingEnd("completed");
              setPhase("debrief");
            }}
          />
          <Body muted>
            Check-ins this spoon: {session.checkInCount}. Soft Signal needs zero
            of them.
          </Body>
          <Body muted>{SPOONING_COPY.banner}</Body>
        </ScrollView>
      </Screen>
    );
  }

  if (phase === "debrief" && session) {
    const endLabel =
      pendingEnd === "soft_signal"
        ? "Soft Signal (God Mode success)"
        : pendingEnd === "hot_or_pee"
          ? "Hot or pee (sacred clause)"
          : "completed / natural";
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Eyebrow>POST-SPOON DEBRIEF</Eyebrow>
          <Title>Data collection (lol).</Title>
          <Body muted>
            {SPOONING_COPY.debriefLol}
            {"\n"}Ended via: {endLabel}
          </Body>

          <Card>
            <Text style={styles.section}>How did that feel in your body?</Text>
            <View style={styles.chipRow}>
              {([1, 2, 3, 4, 5] as const).map((n) => (
                <Chip
                  key={n}
                  label={String(n)}
                  selected={debrief.bodyFeel === n}
                  onPress={() => setDebrief({ ...debrief, bodyFeel: n })}
                  styles={styles}
                  colors={colors}
                />
              ))}
            </View>
            <TextInput
              accessibilityLabel="Body notes"
              value={debrief.bodyNotes}
              onChangeText={(t) => setDebrief({ ...debrief, bodyNotes: t })}
              placeholder="Body notes (optional)…"
              placeholderTextColor={colors.muted}
              style={styles.input}
              multiline
              maxLength={500}
            />
          </Card>

          <Card>
            <Text style={styles.section}>What worked?</Text>
            <TextInput
              accessibilityLabel="What worked"
              value={debrief.worked}
              onChangeText={(t) => setDebrief({ ...debrief, worked: t })}
              placeholder="e.g. Safety Spoon wrist escape…"
              placeholderTextColor={colors.muted}
              style={styles.input}
              multiline
              maxLength={500}
            />
            <Text style={styles.section}>What didn’t work?</Text>
            <TextInput
              accessibilityLabel="What did not work"
              value={debrief.didntWork}
              onChangeText={(t) => setDebrief({ ...debrief, didntWork: t })}
              placeholder="Honest. Private. Not a performance review."
              placeholderTextColor={colors.muted}
              style={styles.input}
              multiline
              maxLength={500}
            />
          </Card>

          <Card>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Body>{SPOONING_COPY.ledgerJoke}</Body>
              </View>
              <Switch
                accessibilityLabel="Plus one successful non-traumatic closeness"
                value={debrief.nonTraumaticClosenessPlusOne}
                onValueChange={(v) =>
                  setDebrief({
                    ...debrief,
                    nonTraumaticClosenessPlusOne: v,
                  })
                }
                trackColor={{ false: colors.line, true: colors.mossSoft }}
                thumbColor={
                  debrief.nonTraumaticClosenessPlusOne
                    ? colors.moss
                    : colors.white
                }
              />
            </View>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Body>I did not owe a performance</Body>
              </View>
              <Switch
                accessibilityLabel="I did not owe a performance"
                value={debrief.owedNoPerformance}
                onValueChange={(v) =>
                  setDebrief({ ...debrief, owedNoPerformance: v })
                }
                trackColor={{ false: colors.line, true: colors.mossSoft }}
                thumbColor={
                  debrief.owedNoPerformance ? colors.moss : colors.white
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
            label="Skip paperwork (still allowed)"
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
          <Eyebrow>SPOON HISTORY</Eyebrow>
          <Title>Local only. Not a skill score.</Title>
          <Body muted>
            {summary.total} spoons · {summary.soft_signal_exits} Soft Signal ·{" "}
            {summary.check_ins} check-ins · {summary.non_traumatic_plus_ones}{" "}
            non-traumatic +1s
          </Body>
          {history.length === 0 ? (
            <Body muted>No spoons logged yet. Pillows await.</Body>
          ) : (
            history.slice(0, 12).map((h) => (
              <Card key={`${h.snapshot.id}-${h.endedAt}`}>
                <Body>
                  {findRole(h.snapshot.roleId).label} ·{" "}
                  {findPosition(h.snapshot.positionId).label}
                </Body>
                <Body muted>
                  {h.endReason}
                  {h.checkInCount > 0 ? ` · ${h.checkInCount} check-ins` : ""}
                  {h.debrief?.nonTraumaticClosenessPlusOne
                    ? " · +1 closeness"
                    : ""}
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

  if (phase === "negotiate") {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Eyebrow>CONSENT SNAPSHOT · SPOON</Eyebrow>
          <Title>Negotiate like a nerd. Cuddle like a mammal.</Title>
          <Body muted>{SPOONING_COPY.sealHint}</Body>

          <Card>
            <Text style={styles.section}>Role (funny cards)</Text>
            {SPOON_ROLES.filter((r) => r.id !== "undecided").map((r) => (
              <Pressable
                key={r.id}
                accessibilityRole="button"
                accessibilityState={{ selected: draft.roleId === r.id }}
                onPress={() =>
                  setDraft({ ...draft, roleId: r.id as SpoonRoleId })
                }
                style={[
                  styles.roleCard,
                  draft.roleId === r.id && styles.roleCardSelected,
                ]}
              >
                <Text style={styles.roleTitle}>{r.label}</Text>
                <Body muted>{r.blurb}</Body>
                <Body muted>{r.strengthNote}</Body>
              </Pressable>
            ))}
            {draft.roleId === "little" ? (
              <Text style={styles.banner}>{SPOONING_COPY.littleStrength}</Text>
            ) : null}
          </Card>

          <Card>
            <Text style={styles.section}>Position (stupid names)</Text>
            <View style={styles.chipRow}>
              {SPOON_POSITIONS.map((p) => (
                <Chip
                  key={p.id}
                  label={p.label}
                  selected={draft.positionId === p.id}
                  onPress={() =>
                    setDraft({
                      ...draft,
                      positionId: p.id as SpoonPositionId,
                    })
                  }
                  styles={styles}
                  colors={colors}
                />
              ))}
            </View>
            <Body muted>{findPosition(draft.positionId).blurb}</Body>
            {draft.positionId === "custom" ? (
              <TextInput
                accessibilityLabel="Custom position name"
                value={draft.customPositionNote}
                onChangeText={(t) =>
                  setDraft({ ...draft, customPositionNote: t })
                }
                placeholder="Name the chaos…"
                placeholderTextColor={colors.muted}
                style={styles.input}
                maxLength={200}
              />
            ) : null}
          </Card>

          <Card>
            <Text style={styles.section}>Duration</Text>
            <View style={styles.chipRow}>
              {SPOON_DURATIONS.map((d) => (
                <Chip
                  key={String(d)}
                  label={durationLabel(d)}
                  selected={draft.durationMinutes === d}
                  onPress={() =>
                    setDraft({
                      ...draft,
                      durationMinutes: d as SpoonDurationMinutes,
                    })
                  }
                  styles={styles}
                  colors={colors}
                />
              ))}
            </View>
          </Card>

          <Card>
            <Text style={styles.section}>Pressure</Text>
            <View style={styles.chipRow}>
              {SPOON_PRESSURES.filter((p) => p.id !== "undecided").map((p) => (
                <Chip
                  key={p.id}
                  label={p.label}
                  selected={draft.pressureId === p.id}
                  onPress={() =>
                    setDraft({
                      ...draft,
                      pressureId: p.id as SpoonPressureId,
                    })
                  }
                  styles={styles}
                  colors={colors}
                />
              ))}
            </View>
            {draft.pressureId !== "undecided" ? (
              <Body muted>{findPressure(draft.pressureId).blurb}</Body>
            ) : null}
          </Card>

          <Card>
            <Text style={styles.section}>Allowed zones</Text>
            <View style={styles.chipRow}>
              {SPOON_ZONES.map((z) => (
                <Chip
                  key={z.id}
                  label={z.avoid ? `🚫 ${z.label}` : z.label}
                  selected={draft.allowedZones.includes(z.id)}
                  onPress={() =>
                    setDraft({
                      ...draft,
                      allowedZones: toggleZone(
                        draft.allowedZones,
                        z.id as SpoonZoneId,
                      ),
                    })
                  }
                  styles={styles}
                  colors={colors}
                />
              ))}
            </View>
          </Card>

          <Card>
            <Text style={styles.section}>Energy expectation</Text>
            <View style={styles.chipRow}>
              {SPOON_ENERGIES.filter((e) => e.id !== "undecided").map((e) => (
                <Chip
                  key={e.id}
                  label={e.label}
                  selected={draft.energyId === e.id}
                  onPress={() =>
                    setDraft({ ...draft, energyId: e.id as SpoonEnergyId })
                  }
                  styles={styles}
                  colors={colors}
                />
              ))}
            </View>
            {draft.energyId !== "undecided" ? (
              <Body muted>{findEnergy(draft.energyId).blurb}</Body>
            ) : null}
          </Card>

          <Card>
            <Text style={styles.section}>Private anxiety note</Text>
            <TextInput
              accessibilityLabel="Anxiety note"
              value={draft.anxietyNote}
              onChangeText={(t) => setDraft({ ...draft, anxietyNote: t })}
              placeholder="If I just lie next to someone, I am afraid that…"
              placeholderTextColor={colors.muted}
              style={styles.input}
              multiline
              maxLength={500}
            />
          </Card>

          {sealError ? <Body muted>{sealError}</Body> : null}
          {!gate.ok ? <Body muted>{gate.reason}</Body> : null}

          <Button
            label="Seal spoon snapshot → start"
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
        <Eyebrow>SPOONING PROTOCOL</Eyebrow>
        <Title>{SPOONING_COPY.title}</Title>
        <Card>
          <Text style={styles.banner}>{SPOONING_COPY.banner}</Text>
          <Text style={styles.tagline}>{SPOONING_COPY.tagline}</Text>
          <Body muted>{SPOONING_COPY.purpose}</Body>
          <Body muted>{SPOONING_COPY.comedy}</Body>
        </Card>
        <Card>
          <Body>• Opt-in, revocable, snapshot-based</Body>
          <Body>• Soft Signal = God Mode</Body>
          <Body>• Little Spoon = strength</Body>
          <Body>• Debrief “mandatory” for data (lol) — skip still free</Body>
        </Card>
        <Button
          label="Negotiate a spoon"
          onPress={() => setPhase("negotiate")}
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
          label="Soft Signal practice"
          onPress={() => router.push("/soft-signal/practice" as never)}
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
      fontSize: 22,
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
