/**
 * I'm Too Much / Fear of Abandonment — safe panic room UI.
 * Soft Signal always lit. Pattern tracking private. Not a score.
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
  CONTAINMENT_SCRIPT,
  REASSURANCE_LINES,
  TOO_MUCH_COPY,
  TOO_MUCH_INTENSITIES,
  TOO_MUCH_TRIGGERS,
  canEnterPanicRoom,
  completeTooMuch,
  defaultTooMuchDebrief,
  defaultTooMuchDraft,
  findIntensity,
  findTrigger,
  moveLabel,
  sealTooMuch,
  suggestedMoves,
  summarizePatterns,
  type TooMuchBodySpot,
  type TooMuchDebrief,
  type TooMuchHistoryEntry,
  type TooMuchIntensityId,
  type TooMuchMoveId,
  type TooMuchSealDraft,
  type TooMuchSnapshot,
  type TooMuchTriggerId,
} from "../../lib/tooMuchCore";
import { softSignalService } from "../../services/softSignalService";
import { tooMuchStore } from "../../services/tooMuchStore";
import { hapticService } from "../../services/hapticService";
import { type AppColors } from "../../theme";
import { useThemedStyles } from "../../hooks/useThemedStyles";
import { useColors } from "../../context/ThemeContext";

type Phase =
  | "hub"
  | "detect"
  | "room"
  | "reassurance"
  | "move"
  | "debrief"
  | "patterns"
  | "history";

const BODY_SPOTS: { id: TooMuchBodySpot; label: string }[] = [
  { id: "chest", label: "Chest" },
  { id: "throat", label: "Throat" },
  { id: "stomach", label: "Stomach" },
  { id: "jaw", label: "Jaw" },
  { id: "everywhere", label: "Everywhere" },
  { id: "numb", label: "Numb" },
  { id: "unknown", label: "Unknown" },
];

export default function TooMuchScreen() {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("hub");
  const [draft, setDraft] = useState<TooMuchSealDraft>(defaultTooMuchDraft());
  const [snapshot, setSnapshot] = useState<TooMuchSnapshot | null>(null);
  const [scriptIndex, setScriptIndex] = useState(0);
  const [reassureIndex, setReassureIndex] = useState(0);
  const [moveId, setMoveId] = useState<TooMuchMoveId>("none");
  const [debrief, setDebrief] = useState<TooMuchDebrief>(
    defaultTooMuchDebrief(),
  );
  const [softState, setSoftState] = useState<"idle" | "stopping" | "stopped">(
    "idle",
  );
  const [history, setHistory] = useState<TooMuchHistoryEntry[]>([]);
  const [sealError, setSealError] = useState("");
  const [pendingEnd, setPendingEnd] = useState<
    "completed" | "soft_signal" | null
  >(null);
  const [containmentSteps, setContainmentSteps] = useState(0);
  const [reassuranceSteps, setReassuranceSteps] = useState(0);

  const reload = useCallback(async () => {
    setHistory(await tooMuchStore.load());
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const gate = canEnterPanicRoom(draft);
  const patterns = summarizePatterns(history);

  const enterRoom = () => {
    const g = canEnterPanicRoom(draft);
    if (!g.ok) {
      setSealError(g.reason);
      return;
    }
    const snap = sealTooMuch(draft);
    if (!snap) {
      setSealError("Fail closed.");
      return;
    }
    setSealError("");
    setSnapshot(snap);
    setScriptIndex(0);
    setContainmentSteps(1);
    setReassuranceSteps(0);
    setMoveId("none");
    setDebrief(defaultTooMuchDebrief());
    setSoftState("idle");
    setPendingEnd(null);
    void hapticService.play("presence");
    setPhase("room");
  };

  const finish = async (
    reason: "completed" | "soft_signal" | "abandoned",
    includeDebrief: boolean,
  ) => {
    if (!snapshot) return;
    const move =
      moveId === "none" && reason === "soft_signal" ? "soft_signal" : moveId;
    const entry = completeTooMuch(
      snapshot,
      move,
      reason,
      containmentSteps,
      reassuranceSteps,
      includeDebrief ? debrief : null,
    );
    await tooMuchStore.append(entry);
    await reload();
    setSnapshot(null);
    setDraft(defaultTooMuchDraft());
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

  if (phase === "room" && snapshot) {
    const line = CONTAINMENT_SCRIPT[scriptIndex] ?? CONTAINMENT_SCRIPT[0]!;
    return (
      <Screen style={styles.roomScreen}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.roomHeader}>
            <Eyebrow>PANIC ROOM · CONTAINMENT</Eyebrow>
            <Title>You are not required to be less.</Title>
          </View>
          <Card style={styles.roomCard}>
            <Text style={styles.softBanner}>{TOO_MUCH_COPY.softSignal}</Text>
            <Body muted>
              Trigger: {findTrigger(snapshot.triggerId).label} ·{" "}
              {findIntensity(snapshot.intensityId).label}
            </Body>
            <Body muted>Story: {snapshot.storySentence}</Body>
            <Body muted>Body: {snapshot.bodySpot}</Body>
          </Card>
          <Card style={styles.roomCard}>
            <Text style={styles.scriptLine}>{line}</Text>
            <Body muted>
              Step {scriptIndex + 1}/{CONTAINMENT_SCRIPT.length}
            </Body>
            <Button
              label={
                scriptIndex < CONTAINMENT_SCRIPT.length - 1
                  ? "Next containment step"
                  : "Containment complete → moves"
              }
              onPress={() => {
                if (scriptIndex < CONTAINMENT_SCRIPT.length - 1) {
                  setScriptIndex((i) => i + 1);
                  setContainmentSteps((n) => n + 1);
                  void hapticService.play("presence");
                } else {
                  setContainmentSteps(CONTAINMENT_SCRIPT.length);
                  setPhase("move");
                }
              }}
            />
          </Card>
          <SoftSignalButton
            state={softState}
            onPress={() => void fireSoftSignal()}
            accessibilityHint="God Mode. Leave the room instantly."
          />
          <Button
            variant="secondary"
            label="Skip to moves"
            onPress={() => setPhase("move")}
          />
          <Button
            variant="secondary"
            label="Panic cover (safety tools)"
            onPress={() => router.push("/safety/panic-cover" as never)}
          />
        </ScrollView>
      </Screen>
    );
  }

  if (phase === "reassurance" && snapshot) {
    const line = REASSURANCE_LINES[reassureIndex] ?? REASSURANCE_LINES[0]!;
    return (
      <Screen style={styles.roomScreen}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Eyebrow>REASSURANCE RITUAL</Eyebrow>
          <Title>Not a verdict. A reframe.</Title>
          <Card style={styles.roomCard}>
            <Text style={styles.scriptLine}>{line}</Text>
            <Button
              label="Next line"
              onPress={() => {
                setReassureIndex((i) => (i + 1) % REASSURANCE_LINES.length);
                setReassuranceSteps((n) => n + 1);
                void hapticService.play("confirmation");
              }}
            />
          </Card>
          <SoftSignalButton
            state={softState}
            onPress={() => void fireSoftSignal()}
          />
          <Button
            label="Done with ritual → moves"
            onPress={() => setPhase("move")}
          />
          <Button
            variant="secondary"
            label="Attachment Repair Cathedral"
            onPress={() => router.push("/attachment-repair" as never)}
          />
        </ScrollView>
      </Screen>
    );
  }

  if (phase === "move" && snapshot) {
    const moves = suggestedMoves(snapshot.intensityId);
    return (
      <Screen style={styles.roomScreen}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Eyebrow>CHOOSE A MOVE</Eyebrow>
          <Title>What does the room need next?</Title>
          <Card style={styles.roomCard}>
            {moves.map((m) => (
              <Pressable
                key={m}
                onPress={() => {
                  setMoveId(m);
                  if (m === "reassurance") {
                    setReassureIndex(0);
                    setPhase("reassurance");
                  }
                  if (m === "stay_in_room") {
                    setScriptIndex(0);
                    setPhase("room");
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
                <Text style={styles.chipText}>{moveLabel(m)}</Text>
              </Pressable>
            ))}
          </Card>
          <SoftSignalButton
            state={softState}
            onPress={() => void fireSoftSignal()}
          />
          <Button
            label="Leave room → debrief"
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
      <Screen style={styles.roomScreen}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Eyebrow>EXIT DEBRIEF</Eyebrow>
          <Title>You left the room. Still not too much.</Title>
          <Body muted>
            {findTrigger(snapshot.triggerId).label} · move:{" "}
            {moveLabel(moveId)}
          </Body>
          <Card style={styles.roomCard}>
            <Toggle
              label="Still flooded?"
              value={debrief.stillFlooded}
              onChange={(v) => setDebrief({ ...debrief, stillFlooded: v })}
              colors={colors}
              styles={styles}
            />
            <TextInput
              value={debrief.note}
              onChangeText={(t) => setDebrief({ ...debrief, note: t })}
              placeholder="Optional note…"
              placeholderTextColor={colors.muted}
              style={styles.input}
              multiline
            />
            <Toggle
              label="+1 Named the story without dumping raw"
              value={debrief.ledgerNamedStory}
              onChange={(v) =>
                setDebrief({ ...debrief, ledgerNamedStory: v })
              }
              colors={colors}
              styles={styles}
            />
            <Toggle
              label="+1 Did not dump raw onto partner"
              value={debrief.ledgerDidNotDumpRaw}
              onChange={(v) =>
                setDebrief({ ...debrief, ledgerDidNotDumpRaw: v })
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
              label="+1 Did not treat spiral as final “too much” verdict"
              value={debrief.ledgerNotTooMuchVerdict}
              onChange={(v) =>
                setDebrief({ ...debrief, ledgerNotTooMuchVerdict: v })
              }
              colors={colors}
              styles={styles}
            />
          </Card>
          <Button
            label="Save & exit room"
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

  if (phase === "patterns") {
    return (
      <Screen style={styles.roomScreen}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Eyebrow>PATTERN TRACKING</Eyebrow>
          <Title>Private. Not a neediness score.</Title>
          <Body muted>{TOO_MUCH_COPY.notScore}</Body>
          <Card style={styles.roomCard}>
            <Body>
              Total runs: {patterns.total} · 7d: {patterns.last_7_days} · 30d:{" "}
              {patterns.last_30_days}
            </Body>
            <Body muted>
              Flooded: {patterns.flooded_count} · Soft Signal:{" "}
              {patterns.soft_signal_count} · Named story:{" "}
              {patterns.named_story_count}
            </Body>
          </Card>
          <Card style={styles.roomCard}>
            <Text style={styles.section}>Top triggers</Text>
            {patterns.top_triggers.length === 0 ? (
              <Body muted>No data yet. The room waits without judgment.</Body>
            ) : (
              patterns.top_triggers.map((t) => (
                <Body key={t.id}>
                  {t.label}: {t.count}
                </Body>
              ))
            )}
          </Card>
          <Button
            variant="secondary"
            label="Back"
            onPress={() => setPhase("hub")}
          />
        </ScrollView>
      </Screen>
    );
  }

  if (phase === "history") {
    return (
      <Screen style={styles.roomScreen}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Eyebrow>HISTORY</Eyebrow>
          <Title>Local only.</Title>
          {history.length === 0 ? (
            <Body muted>No entries. Panic room is empty and available.</Body>
          ) : (
            history.slice(0, 15).map((h) => (
              <Card key={`${h.snapshot.id}-${h.endedAt}`} style={styles.roomCard}>
                <Body>{findTrigger(h.snapshot.triggerId).label}</Body>
                <Body muted>
                  {h.snapshot.intensityId} · {h.endReason} ·{" "}
                  {moveLabel(h.moveId)}
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

  if (phase === "detect") {
    return (
      <Screen style={styles.roomScreen}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Eyebrow>DETECTION</Eyebrow>
          <Title>What lit the fuse?</Title>
          <Body muted>{TOO_MUCH_COPY.panicRoom}</Body>

          <Card style={styles.roomCard}>
            <Text style={styles.section}>Trigger</Text>
            {TOO_MUCH_TRIGGERS.filter((t) => t.id !== "undecided").map((t) => (
              <Pressable
                key={t.id}
                onPress={() =>
                  setDraft({
                    ...draft,
                    triggerId: t.id as TooMuchTriggerId,
                  })
                }
                style={[
                  styles.triggerCard,
                  draft.triggerId === t.id && styles.triggerSelected,
                ]}
              >
                <Text style={styles.roleTitle}>{t.label}</Text>
                <Body muted>{t.detect}</Body>
              </Pressable>
            ))}
            {draft.triggerId === "custom" ? (
              <TextInput
                value={draft.customTriggerNote}
                onChangeText={(t) =>
                  setDraft({ ...draft, customTriggerNote: t })
                }
                placeholder="Name the detector…"
                placeholderTextColor={colors.muted}
                style={styles.input}
              />
            ) : null}
          </Card>

          <Card style={styles.roomCard}>
            <Text style={styles.section}>Intensity</Text>
            <View style={styles.chipRow}>
              {TOO_MUCH_INTENSITIES.filter((i) => i.id !== "undecided").map(
                (i) => (
                  <Chip
                    key={i.id}
                    label={i.label}
                    selected={draft.intensityId === i.id}
                    onPress={() =>
                      setDraft({
                        ...draft,
                        intensityId: i.id as TooMuchIntensityId,
                      })
                    }
                    styles={styles}
                    colors={colors}
                  />
                ),
              )}
            </View>
          </Card>

          <Card style={styles.roomCard}>
            <Text style={styles.section}>Body</Text>
            <View style={styles.chipRow}>
              {BODY_SPOTS.map((b) => (
                <Chip
                  key={b.id}
                  label={b.label}
                  selected={draft.bodySpot === b.id}
                  onPress={() =>
                    setDraft({
                      ...draft,
                      bodySpot: b.id,
                    })
                  }
                  styles={styles}
                  colors={colors}
                />
              ))}
            </View>
            {draft.intensityId !== "flooded" ? (
              <TextInput
                value={draft.storySentence}
                onChangeText={(t) =>
                  setDraft({ ...draft, storySentence: t })
                }
                placeholder='My brain says I am too much / they will leave because…'
                placeholderTextColor={colors.muted}
                style={styles.input}
                multiline
              />
            ) : (
              <Body muted>Flooded: story optional. Soft Signal is the point.</Body>
            )}
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Body>Soft Signal is free (required)</Body>
              </View>
              <Switch
                value={draft.softSignalAcknowledged}
                onValueChange={(v) =>
                  setDraft({ ...draft, softSignalAcknowledged: v })
                }
                trackColor={{ false: colors.line, true: colors.mossSoft }}
                thumbColor={
                  draft.softSignalAcknowledged ? colors.moss : colors.white
                }
              />
            </View>
          </Card>

          {sealError ? <Body muted>{sealError}</Body> : null}
          {!gate.ok ? <Body muted>{gate.reason}</Body> : null}

          <Button
            label="Enter panic room"
            onPress={enterRoom}
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
    <Screen style={styles.roomScreen}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.roomHeader}>
          <Eyebrow>TOO MUCH · ABANDONMENT</Eyebrow>
          <Title>{TOO_MUCH_COPY.title}</Title>
        </View>
        <Card style={styles.roomCard}>
          <Text style={styles.softBanner}>{TOO_MUCH_COPY.banner}</Text>
          <Text style={styles.tagline}>{TOO_MUCH_COPY.tagline}</Text>
          <Body muted>{TOO_MUCH_COPY.purpose}</Body>
          <Body muted>{TOO_MUCH_COPY.panicRoom}</Body>
          <Body muted>{TOO_MUCH_COPY.comedy}</Body>
        </Card>
        <Card style={styles.roomCard}>
          <Body muted>
            {patterns.total} runs · {patterns.last_7_days} this week · Soft
            Signal uses: {patterns.soft_signal_count}
          </Body>
        </Card>
        <Button
          label="Detection → enter panic room"
          onPress={() => setPhase("detect")}
        />
        <Button
          variant="secondary"
          label="Pattern tracking"
          onPress={() => {
            void reload();
            setPhase("patterns");
          }}
        />
        <Button
          variant="secondary"
          label={`History (${patterns.total})`}
          onPress={() => {
            void reload();
            setPhase("history");
          }}
        />
        <Button
          variant="secondary"
          label="Attachment Repair Cathedral"
          onPress={() => router.push("/attachment-repair" as never)}
        />
        <Button
          variant="secondary"
          label="Soft Signal practice"
          onPress={() => router.push("/soft-signal/practice" as never)}
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
    roomScreen: {
      backgroundColor: colors.ink,
    },
    scroll: { gap: 12, paddingBottom: 48 },
    roomHeader: { gap: 6 },
    roomCard: {
      backgroundColor: colors.cream,
      borderColor: colors.mossSoft,
      borderWidth: 2,
    },
    softBanner: {
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
    scriptLine: {
      color: colors.ink,
      fontSize: 20,
      fontWeight: "600" as const,
      lineHeight: 28,
      marginBottom: 12,
    },
    triggerCard: {
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 16,
      padding: 12,
      marginTop: 8,
      gap: 4,
      backgroundColor: colors.cream,
    },
    triggerSelected: {
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
      marginTop: 12,
    },
    input: {
      minHeight: 72,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.line,
      padding: 14,
      color: colors.ink,
      backgroundColor: colors.cream,
      marginTop: 10,
    },
  };
}
