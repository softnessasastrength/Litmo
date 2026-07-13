/**
 * Spooning Protocol v0.1 — runnable containment cuddle planner.
 * Soft Signal free mid-spoon. Local only. Funny on purpose.
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
  SPOON_ROLES,
  canSealSpoon,
  completeSpoon,
  defaultDebrief,
  defaultSpoonDraft,
  durationTargetSeconds,
  findEnergy,
  findPosition,
  findRole,
  formatSpoonClock,
  isDurationComplete,
  sealSpoon,
  startSpoonSession,
  summarizeHistory,
  tickSpoonSession,
  type SpoonActiveSession,
  type SpoonDebrief,
  type SpoonDurationMinutes,
  type SpoonEnergyId,
  type SpoonHistoryEntry,
  type SpoonPositionId,
  type SpoonRoleId,
  type SpoonSealDraft,
} from "../../lib/spooningCore";
import { softSignalService } from "../../services/softSignalService";
import { spooningStore } from "../../services/spooningStore";
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
    "completed" | "soft_signal" | null
  >(null);
  const [softState, setSoftState] = useState<"idle" | "stopping" | "stopped">(
    "idle",
  );
  const [history, setHistory] = useState<SpoonHistoryEntry[]>([]);
  const [sealError, setSealError] = useState("");
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
        const next = tickSpoonSession(prev, 1);
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
    setPhase("active");
  };

  const finishToHistory = async (
    reason: "completed" | "soft_signal" | "abandoned",
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
    setPhase("hub");
  };

  const fireSoftSignal = async () => {
    setSoftState("stopping");
    await softSignalService.practice();
    setSoftState("stopped");
    setPendingEnd("soft_signal");
    setPhase("debrief");
  };

  if (phase === "active" && session) {
    const target = durationTargetSeconds(session.snapshot.durationMinutes);
    const role = findRole(session.snapshot.roleId);
    const pos = findPosition(session.snapshot.positionId);
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Eyebrow>SPOON · ACTIVE</Eyebrow>
          <Title>You are in the spoon.</Title>
          <Card>
            <Text style={styles.banner}>{SPOONING_COPY.softSignalHint}</Text>
            <Body>
              {role.label} · {pos.label}
            </Body>
            <Body muted>
              Energy: {findEnergy(session.snapshot.energyId).label}
            </Body>
            <Text style={styles.clock} accessibilityRole="timer">
              {formatSpoonClock(session.elapsedSeconds)}
              {target != null
                ? ` / ${formatSpoonClock(target)}`
                : " · open (Soft Signal free)"}
            </Text>
          </Card>
          <SoftSignalButton
            state={softState}
            onPress={() => void fireSoftSignal()}
            accessibilityHint="Ends spoon immediately. No reason required."
          />
          <Button
            variant="secondary"
            label="Natural end → debrief"
            onPress={() => {
              setPendingEnd("completed");
              setPhase("debrief");
            }}
          />
          <Body muted>{SPOONING_COPY.banner}</Body>
        </ScrollView>
      </Screen>
    );
  }

  if (phase === "debrief" && session) {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Eyebrow>POST-SPOON DEBRIEF</Eyebrow>
          <Title>Private. Optional. Not a grade.</Title>
          <Body muted>
            Ended via:{" "}
            {pendingEnd === "soft_signal"
              ? "Soft Signal (success)"
              : "completed / natural"}
          </Body>
          <Card>
            <Body>Comfort (1–5)</Body>
            <View style={styles.chipRow}>
              {([1, 2, 3, 4, 5] as const).map((n) => (
                <Chip
                  key={n}
                  label={String(n)}
                  selected={debrief.comfort === n}
                  onPress={() => setDebrief({ ...debrief, comfort: n })}
                  styles={styles}
                  colors={colors}
                />
              ))}
            </View>
            <Body>Want this shape again?</Body>
            <View style={styles.chipRow}>
              {(
                [
                  ["yes", "Yes"],
                  ["maybe", "Maybe"],
                  ["no", "No"],
                ] as const
              ).map(([id, label]) => (
                <Chip
                  key={id}
                  label={label}
                  selected={debrief.again === id}
                  onPress={() => setDebrief({ ...debrief, again: id })}
                  styles={styles}
                  colors={colors}
                />
              ))}
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
            <TextInput
              accessibilityLabel="Private debrief note"
              value={debrief.note}
              onChangeText={(t) => setDebrief({ ...debrief, note: t })}
              placeholder="Optional private note…"
              placeholderTextColor={colors.muted}
              style={styles.input}
              multiline
              maxLength={500}
            />
          </Card>
          <Button
            label="Save private debrief"
            onPress={() =>
              void finishToHistory(pendingEnd ?? "completed", true)
            }
          />
          <Button
            variant="secondary"
            label="Skip debrief"
            onPress={() =>
              void finishToHistory(pendingEnd ?? "completed", false)
            }
          />
          <Body muted>
            Soft Signal exits are success. History stays on this device.
          </Body>
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
            {summary.total} spoons · {summary.soft_signal_exits} Soft Signal
            exits · {summary.solo_practice} solo practice
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
                  {h.debrief?.owedNoPerformance
                    ? " · no performance owed"
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
          <Eyebrow>NEGOTIATE · SEAL</Eyebrow>
          <Title>Build the spoon snapshot.</Title>
          <Body muted>{SPOONING_COPY.sealHint}</Body>

          <Card>
            <Text style={styles.section}>Role</Text>
            <View style={styles.chipRow}>
              {SPOON_ROLES.filter((r) => r.id !== "undecided").map((r) => (
                <Chip
                  key={r.id}
                  label={r.label}
                  selected={draft.roleId === r.id}
                  onPress={() =>
                    setDraft({ ...draft, roleId: r.id as SpoonRoleId })
                  }
                  styles={styles}
                  colors={colors}
                />
              ))}
            </View>
            {draft.roleId !== "undecided" ? (
              <Body muted>{findRole(draft.roleId).blurb}</Body>
            ) : null}
          </Card>

          <Card>
            <Text style={styles.section}>Position</Text>
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
                placeholder="Name the shape…"
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
                  label={d === "open" ? "Open" : `${d}m`}
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
            <Text style={styles.section}>Energy</Text>
            <View style={styles.chipRow}>
              {SPOON_ENERGIES.filter((e) => e.id !== "unknown").map((e) => (
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
            {draft.energyId !== "unknown" ? (
              <Body muted>{findEnergy(draft.energyId).blurb}</Body>
            ) : null}
          </Card>

          <Card>
            <Text style={styles.section}>Private anxiety note (optional)</Text>
            <Body muted>
              Device-local. This is me trying not to be anxious while cuddling.
            </Body>
            <TextInput
              accessibilityLabel="Anxiety note"
              value={draft.anxietyNote}
              onChangeText={(t) => setDraft({ ...draft, anxietyNote: t })}
              placeholder="If this stays ambiguous, I am afraid that…"
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

  // hub
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Eyebrow>SPOONING PROTOCOL</Eyebrow>
        <Title>{SPOONING_COPY.title}</Title>
        <Card>
          <Text style={styles.banner}>{SPOONING_COPY.banner}</Text>
          <Body muted>{SPOONING_COPY.subtitle}</Body>
          <Body muted>{SPOONING_COPY.comedy}</Body>
        </Card>
        <Card>
          <Body>
            Roles · positions · duration · energy · Soft Signal · private
            debrief. Fail closed until sealed. History is not consent.
          </Body>
          <Body muted>
            Containment job: hold “what if I mess up closeness” in a runnable
            joke-spec so it doesn’t have to live only in my chest.
          </Body>
        </Card>
        <Button label="Negotiate a spoon" onPress={() => setPhase("negotiate")} />
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
        selected && { backgroundColor: colors.mossSoft, borderColor: colors.moss },
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
