/**
 * I Need You But I'm Scared You'll Leave — dual-bind attachment ritual.
 * Maximum granularity. Soft Signal free. Ask never auto-sent.
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
  BOTH_AND_SCRIPT,
  FEAR_POLES,
  FEAR_REASSURANCE,
  NEED_POLES,
  NEED_REASSURANCE,
  NEED_SCARED_COPY,
  buildOptionalAsk,
  canSealNeedScared,
  completeNeedScared,
  defaultNeedScaredDebrief,
  defaultNeedScaredDraft,
  findFear,
  findNeed,
  moveLabel,
  sealNeedScared,
  suggestedMoves,
  summarizeNeedScared,
  type BodySpot,
  type FearPoleId,
  type NeedPoleId,
  type NeedScaredDebrief,
  type NeedScaredDraft,
  type NeedScaredHistoryEntry,
  type NeedScaredMoveId,
  type NeedScaredSnapshot,
} from "../../lib/needScaredCore";
import { softSignalService } from "../../services/softSignalService";
import { needScaredStore } from "../../services/needScaredStore";
import { hapticService } from "../../services/hapticService";
import { relationshipModelStore } from "../../services/relationshipModelStore";
import { modeCopy } from "../../config/copy";
import {
  enterFloodProtect,
  modelBannerLine,
  type RelationshipEvent,
  type RelationshipModel,
} from "../../lib/relationshipModelCore";
import { type AppColors } from "../../theme";
import { useThemedStyles } from "../../hooks/useThemedStyles";
import { useColors } from "../../context/ThemeContext";
import { runtimeConfig } from "../../config/runtime";
import { FeatureUnavailable } from "../../components/FeatureUnavailable";

type Phase =
  | "hub"
  | "admit"
  | "need"
  | "fear"
  | "seal"
  | "both_and"
  | "ask"
  | "reassure"
  | "move"
  | "debrief"
  | "patterns"
  | "history";

const BODY: { id: BodySpot; label: string }[] = [
  { id: "chest", label: "Chest" },
  { id: "throat", label: "Throat" },
  { id: "stomach", label: "Stomach" },
  { id: "jaw", label: "Jaw" },
  { id: "everywhere", label: "Everywhere" },
  { id: "numb", label: "Numb" },
  { id: "unknown", label: "Unknown" },
];

export default function NeedScaredScreen() {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("hub");
  const [draft, setDraft] = useState<NeedScaredDraft>(defaultNeedScaredDraft());
  const [snapshot, setSnapshot] = useState<NeedScaredSnapshot | null>(null);
  const [step, setStep] = useState(0);
  const [reassureI, setReassureI] = useState(0);
  const [moveId, setMoveId] = useState<NeedScaredMoveId>("none");
  const [debrief, setDebrief] = useState(defaultNeedScaredDebrief());
  const [softState, setSoftState] = useState<"idle" | "stopping" | "stopped">(
    "idle",
  );
  const [history, setHistory] = useState<NeedScaredHistoryEntry[]>([]);
  const [sealError, setSealError] = useState("");
  const [pendingEnd, setPendingEnd] = useState<
    "completed" | "soft_signal" | null
  >(null);
  const [bothAndDone, setBothAndDone] = useState(0);
  const [askEdit, setAskEdit] = useState("");
  const [relModel, setRelModel] = useState<RelationshipModel | null>(null);
  const [relEvents, setRelEvents] = useState<RelationshipEvent[]>([]);

  const reload = useCallback(async () => {
    setHistory(await needScaredStore.load());
  }, []);

  useEffect(() => {
    void reload();
    void relationshipModelStore.load().then((b) => {
      if (b) {
        setRelModel(b.model);
        setRelEvents(b.events);
      }
    });
  }, [reload]);

  const gate = canSealNeedScared(draft);
  const summary = summarizeNeedScared(history);

  const onSeal = () => {
    const g = canSealNeedScared(draft);
    if (!g.ok) {
      setSealError(g.reason);
      return;
    }
    const snap = sealNeedScared(draft);
    if (!snap) {
      setSealError("Fail closed.");
      return;
    }
    setSealError("");
    setSnapshot(snap);
    setAskEdit(snap.optionalAsk);
    setStep(0);
    setBothAndDone(1);
    setMoveId("none");
    setDebrief(defaultNeedScaredDebrief());
    setSoftState("idle");
    setPendingEnd(null);
    void hapticService.play("presence");
    setPhase("both_and");
  };

  const finish = async (
    reason: "completed" | "soft_signal" | "abandoned",
    includeDebrief: boolean,
  ) => {
    if (!snapshot) return;
    const finalSnap = {
      ...snapshot,
      optionalAsk: askEdit.trim().slice(0, 500) || snapshot.optionalAsk,
    };
    const move =
      moveId === "none" && reason === "soft_signal" ? "soft_signal" : moveId;
    const entry = completeNeedScared(
      finalSnap,
      move,
      reason,
      bothAndDone,
      includeDebrief ? debrief : null,
    );
    await needScaredStore.append(entry);
    // High dual-bind intensity + bond still "steady" → suggest flood_protect locally.
    // Soft Signal freeness unchanged (never blocks exit / freeness).
    const highFlood =
      finalSnap.needIntensity >= 4 || finalSnap.fearIntensity >= 4;
    if (
      highFlood &&
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
    setDraft(defaultNeedScaredDraft());
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

  const softDock = (
    <View style={styles.softDock}>
      <Text style={styles.softDockLabel}>SOFT SIGNAL · GOD MODE</Text>
      <SoftSignalButton
        state={softState}
        onPress={() => void fireSoftSignal()}
      />
    </View>
  );

  if (phase === "both_and" && snapshot) {
    const line = BOTH_AND_SCRIPT[step] ?? BOTH_AND_SCRIPT[0]!;
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Eyebrow>BOTH / AND HOLDING</Eyebrow>
          <Title>Refuse either/or collapse.</Title>
          <Card>
            <Text style={styles.dual}>{snapshot.dualSentence}</Text>
            <Body muted>
              Need {snapshot.needIntensity}/5 · Fear {snapshot.fearIntensity}/5
            </Body>
          </Card>
          <Card>
            <Text style={styles.script}>{line}</Text>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${((step + 1) / BOTH_AND_SCRIPT.length) * 100}%`,
                    backgroundColor: colors.moss,
                  },
                ]}
              />
            </View>
            <Body muted>
              Step {step + 1}/{BOTH_AND_SCRIPT.length}
            </Body>
            <Button
              label={
                step < BOTH_AND_SCRIPT.length - 1
                  ? "Next both/and step"
                  : "Continue → optional ask"
              }
              onPress={() => {
                if (step < BOTH_AND_SCRIPT.length - 1) {
                  setStep((s) => s + 1);
                  setBothAndDone((n) => n + 1);
                  void hapticService.play("presence");
                } else {
                  setBothAndDone(BOTH_AND_SCRIPT.length);
                  setPhase("ask");
                }
              }}
            />
          </Card>
          {softDock}
          <Button
            variant="secondary"
            label="Skip to moves"
            onPress={() => setPhase("move")}
          />
        </ScrollView>
      </Screen>
    );
  }

  if (phase === "ask" && snapshot) {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Eyebrow>OPTIONAL ASK LINE</Eyebrow>
          <Title>Never auto-sent.</Title>
          <Body muted>{NEED_SCARED_COPY.notConsent}</Body>
          <Card>
            <Text style={styles.section}>Craft a small honest reach</Text>
            <TextInput
              value={askEdit}
              onChangeText={setAskEdit}
              style={styles.input}
              multiline
              placeholderTextColor={colors.muted}
            />
            <Button
              variant="secondary"
              label="Regenerate template"
              onPress={() =>
                setAskEdit(
                  buildOptionalAsk({
                    ...snapshot,
                    optionalAsk: "",
                  }),
                )
              }
            />
          </Card>
          {softDock}
          <Button
            label="Reassurance for both poles"
            onPress={() => {
              setReassureI(0);
              setPhase("reassure");
            }}
          />
          <Button
            variant="secondary"
            label="Skip to moves"
            onPress={() => setPhase("move")}
          />
        </ScrollView>
      </Screen>
    );
  }

  if (phase === "reassure" && snapshot) {
    const pool = [...NEED_REASSURANCE, ...FEAR_REASSURANCE];
    const line = pool[reassureI % pool.length]!;
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Eyebrow>DUAL REASSURANCE</Eyebrow>
          <Title>Need pole · Fear pole</Title>
          <Card>
            <Text style={styles.script}>{line}</Text>
            <Button
              label="Next line"
              onPress={() => {
                setReassureI((i) => i + 1);
                void hapticService.play("confirmation");
              }}
            />
          </Card>
          {softDock}
          <Button label="Continue → moves" onPress={() => setPhase("move")} />
        </ScrollView>
      </Screen>
    );
  }

  if (phase === "move" && snapshot) {
    const moves = suggestedMoves(
      snapshot.needIntensity,
      snapshot.fearIntensity,
    );
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Eyebrow>MOVES</Eyebrow>
          <Title>What next with both poles present?</Title>
          <Card>
            {moves.map((m) => (
              <Pressable
                key={m}
                onPress={() => {
                  setMoveId(m);
                  if (m === "link_too_much") {
                    router.push("/too-much" as never);
                    return;
                  }
                  if (m === "link_cathedral") {
                    router.push("/attachment-repair" as never);
                    return;
                  }
                  if (m === "hold_both") {
                    setStep(0);
                    setPhase("both_and");
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
          {softDock}
          <Button
            label="Finish → debrief"
            disabled={moveId === "none"}
            onPress={() => {
              if (moveId === "soft_signal") setPendingEnd("soft_signal");
              else setPendingEnd("completed");
              if (moveId === "ask_later") {
                setDebrief((d) => ({ ...d, ledgerAskNotAutoSent: true }));
              }
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
          <Title>Both poles still allowed.</Title>
          <Body muted>{snapshot.dualSentence}</Body>
          <Card>
            <Toggle
              label="Both poles still present"
              value={debrief.bothPolesStillPresent}
              onChange={(v) =>
                setDebrief({ ...debrief, bothPolesStillPresent: v })
              }
              colors={colors}
              styles={styles}
            />
            <TextInput
              value={debrief.note}
              onChangeText={(t) => setDebrief({ ...debrief, note: t })}
              style={styles.input}
              placeholder="Optional note…"
              placeholderTextColor={colors.muted}
              multiline
            />
            <Toggle
              label="+1 Held both/and"
              value={debrief.ledgerHeldBoth}
              onChange={(v) => setDebrief({ ...debrief, ledgerHeldBoth: v })}
              colors={colors}
              styles={styles}
            />
            <Toggle
              label="+1 Did not pre-abandon"
              value={debrief.ledgerDidNotPreAbandon}
              onChange={(v) =>
                setDebrief({ ...debrief, ledgerDidNotPreAbandon: v })
              }
              colors={colors}
              styles={styles}
            />
            <Toggle
              label="+1 Did not fawn-only (ignore fear)"
              value={debrief.ledgerDidNotFawnOnly}
              onChange={(v) =>
                setDebrief({ ...debrief, ledgerDidNotFawnOnly: v })
              }
              colors={colors}
              styles={styles}
            />
            <Toggle
              label="+1 Soft Signal free"
              value={debrief.ledgerSoftSignalOk}
              onChange={(v) =>
                setDebrief({ ...debrief, ledgerSoftSignalOk: v })
              }
              colors={colors}
              styles={styles}
            />
            <Toggle
              label="+1 Ask not auto-sent"
              value={debrief.ledgerAskNotAutoSent}
              onChange={(v) =>
                setDebrief({ ...debrief, ledgerAskNotAutoSent: v })
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

  if (phase === "patterns") {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Eyebrow>PATTERNS</Eyebrow>
          <Title>Private dual-bind analytics.</Title>
          <Card>
            <Body>
              Runs: {summary.total} · Soft Signal: {summary.soft_signal} · Held
              both: {summary.held_both}
            </Body>
            <Body muted>
              Avg need intensity: {summary.avg_need_intensity} · Avg fear:{" "}
              {summary.avg_fear_intensity}
            </Body>
          </Card>
          <Card>
            <Text style={styles.section}>Top needs</Text>
            {summary.top_needs.length === 0 ? (
              <Body muted>No data yet.</Body>
            ) : (
              summary.top_needs.map((t) => (
                <Body key={t.id}>
                  {t.label}: {t.count}
                </Body>
              ))
            )}
            <Text style={styles.section}>Top fears</Text>
            {summary.top_fears.map((t) => (
              <Body key={t.id}>
                {t.label}: {t.count}
              </Body>
            ))}
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
      <Screen>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Eyebrow>HISTORY</Eyebrow>
          <Title>Local only.</Title>
          {history.length === 0 ? (
            <Body muted>No dual-bind seals yet.</Body>
          ) : (
            history.slice(0, 15).map((h) => (
              <Card key={`${h.snapshot.id}-${h.endedAt}`}>
                <Body>{h.snapshot.dualSentence}</Body>
                <Body muted>
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

  if (phase === "admit") {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Eyebrow>1 · ADMIT DUAL BIND</Eyebrow>
          <Title>Both poles. No collapse yet.</Title>
          <Card>
            <Toggle
              label="I admit: I need you AND I'm scared you'll leave"
              value={draft.dualBindAdmitted}
              onChange={(v) => setDraft({ ...draft, dualBindAdmitted: v })}
              colors={colors}
              styles={styles}
            />
            <Toggle
              label="Soft Signal is free (required)"
              value={draft.softSignalAcknowledged}
              onChange={(v) =>
                setDraft({ ...draft, softSignalAcknowledged: v })
              }
              colors={colors}
              styles={styles}
            />
            <Body muted>{NEED_SCARED_COPY.notConsent}</Body>
          </Card>
          <Button
            label="Next · Granular need pole"
            disabled={!draft.dualBindAdmitted || !draft.softSignalAcknowledged}
            onPress={() => setPhase("need")}
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

  if (phase === "need") {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Eyebrow>2 · NEED POLE</Eyebrow>
          <Title>What do you need? (granular)</Title>
          {NEED_POLES.filter((p) => p.id !== "undecided").map((p) => (
            <Pressable
              key={p.id}
              onPress={() =>
                setDraft({ ...draft, needId: p.id as NeedPoleId })
              }
              style={[
                styles.poleCard,
                draft.needId === p.id && styles.poleSelected,
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected: draft.needId === p.id }}
              accessibilityLabel={`${p.label}. ${p.blurb}`}
            >
              <Text style={styles.poleTitle}>{p.label}</Text>
              <Body muted>{p.blurb}</Body>
            </Pressable>
          ))}
          {draft.needId === "other" ? (
            <TextInput
              value={draft.needNote}
              onChangeText={(t) => setDraft({ ...draft, needNote: t })}
              style={styles.input}
              placeholder="Name the need…"
              placeholderTextColor={colors.muted}
            />
          ) : null}
          <Card>
            <Text style={styles.section}>Need intensity 1–5</Text>
            <View style={styles.chipRow}>
              {([1, 2, 3, 4, 5] as const).map((n) => (
                <Chip
                  key={n}
                  label={String(n)}
                  selected={draft.needIntensity === n}
                  onPress={() => setDraft({ ...draft, needIntensity: n })}
                  styles={styles}
                  colors={colors}
                />
              ))}
            </View>
            <Text style={styles.section}>Where need lives in body</Text>
            <View style={styles.chipRow}>
              {BODY.map((b) => (
                <Chip
                  key={b.id}
                  label={b.label}
                  selected={draft.bodyNeed === b.id}
                  onPress={() => setDraft({ ...draft, bodyNeed: b.id })}
                  styles={styles}
                  colors={colors}
                />
              ))}
            </View>
          </Card>
          <Button
            label="Next · Fear pole"
            disabled={draft.needId === "undecided" || draft.needIntensity == null}
            onPress={() => setPhase("fear")}
          />
          <Button
            variant="secondary"
            label="Back"
            onPress={() => setPhase("admit")}
          />
        </ScrollView>
      </Screen>
    );
  }

  if (phase === "fear") {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Eyebrow>3 · FEAR POLE</Eyebrow>
          <Title>What are you scared of? (granular)</Title>
          {FEAR_POLES.filter((p) => p.id !== "undecided").map((p) => (
            <Pressable
              key={p.id}
              onPress={() =>
                setDraft({ ...draft, fearId: p.id as FearPoleId })
              }
              style={[
                styles.poleCard,
                draft.fearId === p.id && styles.poleSelected,
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected: draft.fearId === p.id }}
              accessibilityLabel={`${p.label}. ${p.blurb}`}
            >
              <Text style={styles.poleTitle}>{p.label}</Text>
              <Body muted>{p.blurb}</Body>
            </Pressable>
          ))}
          {draft.fearId === "other" ? (
            <TextInput
              value={draft.fearNote}
              onChangeText={(t) => setDraft({ ...draft, fearNote: t })}
              style={styles.input}
              placeholder="Name the fear…"
              placeholderTextColor={colors.muted}
            />
          ) : null}
          <Card>
            <Text style={styles.section}>Fear intensity 1–5</Text>
            <View style={styles.chipRow}>
              {([1, 2, 3, 4, 5] as const).map((n) => (
                <Chip
                  key={n}
                  label={String(n)}
                  selected={draft.fearIntensity === n}
                  onPress={() => setDraft({ ...draft, fearIntensity: n })}
                  styles={styles}
                  colors={colors}
                />
              ))}
            </View>
            <Text style={styles.section}>Where fear lives in body</Text>
            <View style={styles.chipRow}>
              {BODY.map((b) => (
                <Chip
                  key={b.id}
                  label={b.label}
                  selected={draft.bodyFear === b.id}
                  onPress={() => setDraft({ ...draft, bodyFear: b.id })}
                  styles={styles}
                  colors={colors}
                />
              ))}
            </View>
          </Card>
          <Button
            label="Next · Review seal"
            disabled={draft.fearId === "undecided" || draft.fearIntensity == null}
            onPress={() => setPhase("seal")}
          />
          <Button
            variant="secondary"
            label="Back"
            onPress={() => setPhase("need")}
          />
        </ScrollView>
      </Screen>
    );
  }

  if (phase === "seal") {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Eyebrow>4 · SEAL DUAL BIND</Eyebrow>
          <Title>Review before both/and holding.</Title>
          <Card>
            <Body>
              Need: {findNeed(draft.needId).label} ({draft.needIntensity}/5) ·
              body {draft.bodyNeed}
            </Body>
            <Body>
              Fear: {findFear(draft.fearId).label} ({draft.fearIntensity}/5) ·
              body {draft.bodyFear}
            </Body>
            <Text style={styles.dual}>
              I need{" "}
              {draft.needId === "other"
                ? draft.needNote || "…"
                : findNeed(draft.needId).label.toLowerCase()}
              , and I am scared of{" "}
              {draft.fearId === "other"
                ? draft.fearNote || "…"
                : findFear(draft.fearId).label.toLowerCase()}
              .
            </Text>
          </Card>
          {sealError ? <Body muted>{sealError}</Body> : null}
          {!gate.ok ? <Body muted>{gate.reason}</Body> : null}
          <Button
            label="Seal · begin both/and ritual"
            onPress={onSeal}
            disabled={!gate.ok}
          />
          <Button
            variant="secondary"
            label="Back"
            onPress={() => setPhase("fear")}
          />
        </ScrollView>
      </Screen>
    );
  }

  if (!runtimeConfig.features.pairedGrowthContent) {
    return (
      <FeatureUnavailable
        eyebrow="RELATIONSHIP TOOLS"
        title="This tool is not available in this build."
        body="This build focuses on your own self-understanding. Relationship-in-friction tools (bond map, conflict, attachment repair) remain in Maximum Mode builds (macOS / Linux / internal)."
      />
    );
  }
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Eyebrow>DUAL BIND RITUAL</Eyebrow>
        <Title>{NEED_SCARED_COPY.title}</Title>
        <Card>
          <Text style={styles.banner}>{NEED_SCARED_COPY.banner}</Text>
          <Text style={styles.tagline}>{NEED_SCARED_COPY.tagline}</Text>
          <Body muted>
            {NEED_SCARED_COPY.purpose.replace("{{PARTNER}}", modeCopy.partnerName)}
          </Body>
          <Body muted>{NEED_SCARED_COPY.comedy}</Body>
        </Card>
        <Card>
          <Body muted>
            {summary.total} seals · held both {summary.held_both} · Soft Signal{" "}
            {summary.soft_signal}
          </Body>
        </Card>
        {relModel ? (
          <Card>
            <Body muted>Bond map: {modelBannerLine(relModel)}</Body>
            <Body muted>
              High need/fear finish can move phase → flood_protect when bond was
              steady. Soft Signal freeness unchanged. Not consent.
            </Body>
            <Button
              variant="secondary"
              label="Open Relationship Model"
              onPress={() => router.push("/relationship-model" as never)}
            />
          </Card>
        ) : (
          <Card>
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
          label="Begin dual-bind ritual"
          onPress={() => setPhase("admit")}
        />
        <Button
          variant="secondary"
          label="Patterns"
          onPress={() => {
            void reload();
            setPhase("patterns");
          }}
        />
        <Button
          variant="secondary"
          label={`History (${summary.total})`}
          onPress={() => {
            void reload();
            setPhase("history");
          }}
        />
        <Button
          variant="secondary"
          label="Too Much panic room"
          onPress={() => router.push("/too-much" as never)}
        />
        <Button
          variant="secondary"
          label="Attachment Repair Cathedral"
          onPress={() => router.push("/attachment-repair" as never)}
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
    scroll: { gap: 12, paddingBottom: 48 },
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
      marginTop: 6,
    },
    dual: {
      color: colors.moss,
      fontWeight: "700" as const,
      fontSize: 17,
      lineHeight: 24,
      marginTop: 8,
    },
    script: {
      color: colors.ink,
      fontSize: 18,
      fontWeight: "600" as const,
      lineHeight: 26,
      marginBottom: 12,
    },
    progressTrack: {
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.line,
      overflow: "hidden" as const,
      marginBottom: 8,
    },
    progressFill: { height: 8, borderRadius: 4 },
    poleCard: {
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 16,
      padding: 12,
      marginTop: 8,
      gap: 4,
      backgroundColor: colors.cream,
    },
    poleSelected: {
      borderColor: colors.moss,
      backgroundColor: colors.mossSoft,
    },
    poleTitle: {
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
      minHeight: 80,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.line,
      padding: 14,
      color: colors.ink,
      backgroundColor: colors.cream,
      marginTop: 10,
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
      letterSpacing: 1.2,
    },
  };
}
