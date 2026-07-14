/**
 * I'm Too Much / Fear of Abandonment v0.2 — maximum autism safe panic room.
 * Dual containment tracks, Soft Signal always lit, private patterns, never a score.
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
  TOO_MUCH_COPY,
  TOO_MUCH_INTENSITIES,
  TOO_MUCH_TRIGGERS,
  canEnterPanicRoom,
  completeTooMuch,
  containmentScriptFor,
  defaultTooMuchDebrief,
  defaultTooMuchDraft,
  findIntensity,
  findTrigger,
  moveLabel,
  reassuranceFor,
  sealTooMuch,
  suggestedMoves,
  summarizePatterns,
  toggleCoTrigger,
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
import { relationshipModelStore } from "../../services/relationshipModelStore";
import { modeCopy } from "../../config/copy";
import { runtimeConfig } from "../../config/runtime";
import {
  enterFloodProtect,
  modelBannerLine,
  type RelationshipEvent,
  type RelationshipModel,
} from "../../lib/relationshipModelCore";
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
  const [relModel, setRelModel] = useState<RelationshipModel | null>(null);
  const [relEvents, setRelEvents] = useState<RelationshipEvent[]>([]);

  const reload = useCallback(async () => {
    setHistory(await tooMuchStore.load());
  }, []);

  useEffect(() => {
    void reload();
    // Bond map is phase-2 (relationship-in-friction) content — not core v1.
    if (!runtimeConfig.features.pairedGrowthContent) return;
    void relationshipModelStore.load().then((b) => {
      if (b) {
        setRelModel(b.model);
        setRelEvents(b.events);
      }
    });
  }, [reload]);

  const gate = canEnterPanicRoom(draft);
  const patterns = summarizePatterns(history);
  const script = snapshot
    ? containmentScriptFor(snapshot.containmentTrack)
    : containmentScriptFor("standard");
  const reassureLines = snapshot
    ? reassuranceFor(snapshot.containmentTrack)
    : reassuranceFor("standard");

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
    // Flooded intensity path + bond still "steady" → suggest flood_protect locally.
    // Soft Signal freeness unchanged (never blocks exit / freeness).
    const floodedPath =
      snapshot.intensityId === "flooded" ||
      snapshot.containmentTrack === "flood";
    if (
      floodedPath &&
      reason !== "abandoned" &&
      relModel &&
      relModel.phase === "steady"
    ) {
      const result = enterFloodProtect(relModel);
      const evts = [result.event, ...relEvents].slice(0, 100);
      await relationshipModelStore.saveModel(result.model, evts);
      setRelModel(result.model);
      setRelEvents(evts);
    }
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

  const softSignalBlock = (
    <View style={styles.softDock}>
      <Text style={styles.softDockLabel}>SOFT SIGNAL · ALWAYS LIT</Text>
      <SoftSignalButton
        state={softState}
        onPress={() => void fireSoftSignal()}
        accessibilityHint="God Mode. Leave the panic room instantly."
      />
    </View>
  );

  if (phase === "room" && snapshot) {
    const line = script[scriptIndex] ?? script[0]!;
    return (
      <Screen style={styles.roomScreen} scroll={false}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.doorSeal}>
            <Text style={styles.doorSealText}>{TOO_MUCH_COPY.doorSeal}</Text>
            <Body muted>
              Track: {snapshot.containmentTrack.toUpperCase()} ·{" "}
              {findIntensity(snapshot.intensityId).label}
            </Body>
          </View>
          <Title>You are not required to be less.</Title>
          <Card style={styles.roomCard}>
            <Text style={styles.softBanner}>{TOO_MUCH_COPY.softSignal}</Text>
            <Body>
              {findTrigger(snapshot.triggerId).label}
              {snapshot.coTriggers.length > 0
                ? ` + ${snapshot.coTriggers.length} co-triggers`
                : ""}
            </Body>
            <Body muted>
              System: {findTrigger(snapshot.triggerId).system}
            </Body>
            <Body muted>Story: {snapshot.storySentence}</Body>
            <Body muted>Body: {snapshot.bodySpot}</Body>
            {snapshot.delayDumpPledge ? (
              <Body muted>
                Pledge: no raw dump for a beat (voluntary, not a law).
              </Body>
            ) : null}
          </Card>
          <Card style={styles.roomCard}>
            <Text style={styles.scriptLine}>{line}</Text>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${((scriptIndex + 1) / script.length) * 100}%`,
                    backgroundColor: colors.moss,
                  },
                ]}
              />
            </View>
            <Body muted>
              Step {scriptIndex + 1}/{script.length}
            </Body>
            <Button
              label={
                scriptIndex < script.length - 1
                  ? "Next containment step"
                  : "Containment complete → moves"
              }
              onPress={() => {
                if (scriptIndex < script.length - 1) {
                  setScriptIndex((i) => i + 1);
                  setContainmentSteps((n) => n + 1);
                  void hapticService.play("presence");
                } else {
                  setContainmentSteps(script.length);
                  setPhase("move");
                }
              }}
            />
          </Card>
          {softSignalBlock}
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
    const line = reassureLines[reassureIndex] ?? reassureLines[0]!;
    return (
      <Screen style={styles.roomScreen} scroll={false}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.doorSeal}>
            <Text style={styles.doorSealText}>REASSURANCE CHAMBER</Text>
          </View>
          <Title>Not a verdict. A reframe.</Title>
          <Card style={styles.roomCard}>
            <Text style={styles.scriptLine}>{line}</Text>
            <Button
              label="Next line"
              onPress={() => {
                setReassureIndex((i) => (i + 1) % reassureLines.length);
                setReassuranceSteps((n) => n + 1);
                void hapticService.play("confirmation");
              }}
            />
          </Card>
          {softSignalBlock}
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
    const moves = suggestedMoves(
      snapshot.intensityId,
      snapshot.triggerId,
    );
    return (
      <Screen style={styles.roomScreen} scroll={false}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.doorSeal}>
            <Text style={styles.doorSealText}>CHOOSE EXIT PATH</Text>
          </View>
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
                    return;
                  }
                  if (m === "stay_in_room") {
                    setScriptIndex(0);
                    setPhase("room");
                    return;
                  }
                  if (m === "link_cathedral") {
                    router.push("/attachment-repair" as never);
                    return;
                  }
                  if (m === "link_interest_re") {
                    router.push("/interest-re" as never);
                    return;
                  }
                }}
                style={[
                  styles.chip,
                  moveId === m && {
                    backgroundColor: colors.mossSoft,
                    borderColor: colors.moss,
                  },
                ]}
                accessibilityRole="radio"
                accessibilityState={{ selected: moveId === m }}
                accessibilityLabel={moveLabel(m)}
                hitSlop={6}
              >
                <Text style={styles.chipText}>{moveLabel(m)}</Text>
              </Pressable>
            ))}
          </Card>
          {softSignalBlock}
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
      <Screen style={styles.roomScreen} scroll={false}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Eyebrow>EXIT DEBRIEF</Eyebrow>
          <Title>You left the room. Still not too much.</Title>
          <Body muted>
            {findTrigger(snapshot.triggerId).label} · {moveLabel(moveId)} ·
            track {snapshot.containmentTrack}
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
            <Toggle
              label="+1 Used the room without shame for needing it"
              value={debrief.ledgerUsedRoomWithoutShame}
              onChange={(v) =>
                setDebrief({ ...debrief, ledgerUsedRoomWithoutShame: v })
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
      <Screen style={styles.roomScreen} scroll={false}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Eyebrow>LONG-TERM PATTERN TRACKING</Eyebrow>
          <Title>Private analytics. Not a neediness score.</Title>
          <Body muted>{TOO_MUCH_COPY.notScore}</Body>
          <Card style={styles.roomCard}>
            <Body>
              Total: {patterns.total} · 7d: {patterns.last_7_days} · 30d:{" "}
              {patterns.last_30_days}
            </Body>
            <Body muted>
              Flooded: {patterns.flooded_count} · Soft Signal:{" "}
              {patterns.soft_signal_count}
            </Body>
            <Body muted>
              Named story: {patterns.named_story_count} · No dump:{" "}
              {patterns.no_dump_count}
            </Body>
            <Body muted>
              Named-without-dump streak: {patterns.named_without_dump_streak}
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
          <Card style={styles.roomCard}>
            <Text style={styles.section}>Recommended next protocol</Text>
            <Body>{patterns.recommended_protocol}</Body>
            <Body muted>{patterns.recommended_reason}</Body>
            {patterns.recommended_protocol === "attachment-repair" ? (
              <Button
                variant="secondary"
                label="Open Cathedral"
                onPress={() => router.push("/attachment-repair" as never)}
              />
            ) : null}
            {patterns.recommended_protocol === "interest-re" ? (
              <Button
                variant="secondary"
                label="Open Interest RE"
                onPress={() => router.push("/interest-re" as never)}
              />
            ) : null}
            {patterns.recommended_protocol === "conflict-sim" ? (
              <Button
                variant="secondary"
                label="Open Conflict Sim"
                onPress={() => router.push("/conflict-sim" as never)}
              />
            ) : null}
            {patterns.recommended_protocol === "spooning" ? (
              <Button
                variant="secondary"
                label="Open Spooning"
                onPress={() => router.push("/spooning" as never)}
              />
            ) : null}
            {patterns.recommended_protocol === "soft-signal" ? (
              <Button
                variant="secondary"
                label="Soft Signal practice"
                onPress={() => router.push("/soft-signal/practice" as never)}
              />
            ) : null}
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
      <Screen style={styles.roomScreen} scroll={false}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Eyebrow>HISTORY</Eyebrow>
          <Title>Local only.</Title>
          {history.length === 0 ? (
            <Body muted>No entries. Panic room empty and available.</Body>
          ) : (
            history.slice(0, 20).map((h) => (
              <Card
                key={`${h.snapshot.id}-${h.endedAt}`}
                style={styles.roomCard}
              >
                <Body>{findTrigger(h.snapshot.triggerId).label}</Body>
                <Body muted>
                  {h.snapshot.intensityId} · {h.snapshot.containmentTrack} ·{" "}
                  {h.endReason} · {moveLabel(h.moveId)}
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
      <Screen style={styles.roomScreen} scroll={false}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.doorSeal}>
            <Text style={styles.doorSealText}>DETECTION · BEFORE DOOR SEAL</Text>
          </View>
          <Title>What lit the fuse?</Title>
          <Body muted>{TOO_MUCH_COPY.panicRoom}</Body>

          <Card style={styles.roomCard}>
            <Text style={styles.section}>Primary trigger</Text>
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
                accessibilityRole="radio"
                accessibilityState={{ selected: draft.triggerId === t.id }}
                accessibilityLabel={`${t.label}. ${t.detect}`}
              >
                <Text style={styles.roleTitle}>{t.label}</Text>
                <Body muted>{t.detect}</Body>
                <Body muted>System: {t.system}</Body>
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
            <Text style={styles.section}>Co-triggers (optional, max 4)</Text>
            <View style={styles.chipRow}>
              {TOO_MUCH_TRIGGERS.filter(
                (t) =>
                  t.id !== "undecided" &&
                  t.id !== "custom" &&
                  t.id !== draft.triggerId,
              ).map((t) => (
                <Chip
                  key={t.id}
                  label={t.label}
                  selected={draft.coTriggers.includes(t.id)}
                  onPress={() =>
                    setDraft({
                      ...draft,
                      coTriggers: toggleCoTrigger(draft.coTriggers, t.id),
                    })
                  }
                  styles={styles}
                  colors={colors}
                />
              ))}
            </View>
          </Card>

          <Card style={styles.roomCard}>
            <Text style={styles.section}>Intensity → containment track</Text>
            <View style={styles.chipRow}>
              {TOO_MUCH_INTENSITIES.filter((i) => i.id !== "undecided").map(
                (i) => (
                  <Chip
                    key={i.id}
                    label={`${i.label} (${i.containmentTrack})`}
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
            <Text style={styles.section}>Body locater</Text>
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
              <Body muted>
                Flood track: story optional. Soft Signal is the point.
              </Body>
            )}
            <Toggle
              label="Soft Signal is free (required to seal door)"
              value={draft.softSignalAcknowledged}
              onChange={(v) =>
                setDraft({ ...draft, softSignalAcknowledged: v })
              }
              colors={colors}
              styles={styles}
            />
            <Toggle
              label="Voluntary: delay raw dump to partner (contain first)"
              value={draft.delayDumpPledge}
              onChange={(v) => setDraft({ ...draft, delayDumpPledge: v })}
              colors={colors}
              styles={styles}
            />
          </Card>

          {sealError ? <Body muted>{sealError}</Body> : null}
          {!gate.ok ? <Body muted>{gate.reason}</Body> : null}

          <Button
            label="Seal door · enter panic room"
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
    <Screen style={styles.roomScreen} scroll={false}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.doorSeal}>
          <Text style={styles.doorSealText}>PANIC ROOM · LOBBY</Text>
          <Text style={styles.softBanner}>{TOO_MUCH_COPY.softSignal}</Text>
        </View>
        <Title>{TOO_MUCH_COPY.title}</Title>
        <Card style={styles.roomCard}>
          <Text style={styles.softBanner}>{TOO_MUCH_COPY.banner}</Text>
          <Text style={styles.tagline}>{TOO_MUCH_COPY.tagline}</Text>
          <Body muted>
            {TOO_MUCH_COPY.purpose.replace("{{PARTNER}}", modeCopy.partnerName)}
          </Body>
          <Body muted>{TOO_MUCH_COPY.panicRoom}</Body>
          <Body muted>{TOO_MUCH_COPY.comedy}</Body>
        </Card>
        <Card style={styles.roomCard}>
          <Body muted>
            {patterns.total} runs · {patterns.last_7_days} this week · Soft
            Signal: {patterns.soft_signal_count} · streak named/no-dump:{" "}
            {patterns.named_without_dump_streak}
          </Body>
        </Card>
        {runtimeConfig.features.pairedGrowthContent && relModel ? (
          <Card style={styles.roomCard}>
            <Body muted>Bond map: {modelBannerLine(relModel)}</Body>
            <Body muted>
              Flooded intensity finish can move phase → flood_protect when bond
              was steady. Soft Signal freeness unchanged. Not consent.
            </Body>
            <Button
              variant="secondary"
              label="Open Relationship Model"
              onPress={() => router.push("/relationship-model" as never)}
            />
          </Card>
        ) : (
          <Card style={styles.roomCard}>
            <Body muted>
              No Relationship Model yet — optional bond map for phase context.
              Soft Signal free either way.
            </Body>
            <Button
              variant="secondary"
              label="Open Relationship Model"
              onPress={() => router.push("/relationship-model" as never)}
            />
          </Card>
        )}
        <Button
          label="Detection → seal door"
          onPress={() => setPhase("detect")}
        />
        <Button
          variant="secondary"
          label="Pattern tracking (private)"
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
    scroll: { gap: 12, paddingBottom: 56, paddingHorizontal: 4 },
    doorSeal: {
      borderWidth: 2,
      borderColor: colors.moss,
      borderRadius: 12,
      padding: 12,
      backgroundColor: colors.cream,
      gap: 4,
    },
    doorSealText: {
      color: colors.moss,
      fontWeight: "900" as const,
      fontSize: 12,
      letterSpacing: 1.2,
    },
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
    softDock: {
      borderWidth: 2,
      borderColor: colors.signal,
      borderRadius: 16,
      padding: 12,
      backgroundColor: colors.cream,
      gap: 8,
    },
    softDockLabel: {
      color: colors.signal,
      fontWeight: "900" as const,
      fontSize: 11,
      letterSpacing: 1.4,
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
    progressTrack: {
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.line,
      overflow: "hidden" as const,
      marginBottom: 8,
    },
    progressFill: {
      height: 8,
      borderRadius: 4,
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
