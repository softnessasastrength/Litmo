/**
 * Conflict Navigation Simulator — practice conflict without dumping on Renn first.
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
  CONFLICT_BODY_SPOTS,
  CONFLICT_COPY,
  CONFLICT_INTENSITIES,
  CONFLICT_MODES,
  buildIStatement,
  canCompleteSim,
  canSealConflict,
  completeConflict,
  defaultConflictDebrief,
  defaultConflictDraft,
  findIntensity,
  findMode,
  sealConflict,
  startConflictSim,
  summarizeConflictHistory,
  type ConflictBodySpot,
  type ConflictDebrief,
  type ConflictHistoryEntry,
  type ConflictIntensityId,
  type ConflictModeId,
  type ConflictMoveId,
  type ConflictSealDraft,
  type ConflictSimState,
} from "../../lib/conflictSimCore";
import { modeCopy } from "../../config/copy";
import { softSignalService } from "../../services/softSignalService";
import { conflictSimStore } from "../../services/conflictSimStore";
import { relationshipModelStore } from "../../services/relationshipModelStore";
import {
  modelBannerLine,
  type RelationshipModel,
} from "../../lib/relationshipModelCore";
import { type AppColors } from "../../theme";
import { useThemedStyles } from "../../hooks/useThemedStyles";
import { useColors } from "../../context/ThemeContext";
import { runtimeConfig } from "../../config/runtime";
import { FeatureUnavailable } from "../../components/FeatureUnavailable";

type Phase = "hub" | "negotiate" | "run" | "debrief" | "history";

/**
 * WHAT: Conflict navigation practice sim with optional bond-map banner.
 * WHY: Externalize conflict practice without dumping on Renn; map is context only.
 * CONSENT: Practice-only — Soft Signal free; never contact; never consent seal.
 * EDGE CASES:
 *   - soft_signal / reschedule ends → never force bond phase (banner only)
 *   - no model → no banner; sim unchanged
 * NEVER: Treat sim completion as repair proof, safety score, or consent.
 * SEE: docs/RELATIONSHIP_MODEL.md
 */
export default function ConflictSimScreen() {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("hub");
  const [draft, setDraft] = useState<ConflictSealDraft>(defaultConflictDraft());
  const [sim, setSim] = useState<ConflictSimState | null>(null);
  const [debrief, setDebrief] = useState<ConflictDebrief>(
    defaultConflictDebrief(),
  );
  const [when, setWhen] = useState("");
  const [feel, setFeel] = useState("");
  const [need, setNeed] = useState("");
  const [softState, setSoftState] = useState<"idle" | "stopping" | "stopped">(
    "idle",
  );
  const [history, setHistory] = useState<ConflictHistoryEntry[]>([]);
  const [sealError, setSealError] = useState("");
  const [pendingEnd, setPendingEnd] = useState<
    "completed" | "soft_signal" | "reschedule" | null
  >(null);
  const [relModel, setRelModel] = useState<RelationshipModel | null>(null);

  const reloadHistory = useCallback(async () => {
    setHistory(await conflictSimStore.load());
  }, []);

  useEffect(() => {
    void reloadHistory();
    // Bond map is advisory only on this surface — never force phase from ends.
    void relationshipModelStore.load().then((b) => {
      if (b?.model) setRelModel(b.model);
    });
  }, [reloadHistory]);

  const gate = canSealConflict(draft);
  const summary = summarizeConflictHistory(history);

  const onSeal = () => {
    const g = canSealConflict(draft);
    if (!g.ok) {
      setSealError(g.reason);
      return;
    }
    const snap = sealConflict(draft);
    if (!snap) {
      setSealError("Fail closed.");
      return;
    }
    setSealError("");
    setSim(startConflictSim(snap));
    setDebrief(defaultConflictDebrief());
    setWhen("");
    setFeel("");
    setNeed("");
    setSoftState("idle");
    setPendingEnd(null);
    setPhase("run");
  };

  /**
   * WHAT: Persist conflict-sim history and return to hub.
   * WHY: Practice log only — Soft Signal / reschedule / complete all valid ends.
   * CONSENT: Local-only; Soft Signal freeness never reduced by map logic.
   * EDGE CASES:
   *   - soft_signal / reschedule / completed → NO bond phase mutation (by design)
   *   - includeDebrief false → still saves end reason without shame ledger
   * NEVER: Auto-set repair_needed or steady from this simulator.
   * SEE: docs/RELATIONSHIP_MODEL.md (conflict-sim = banner only)
   */
  const finish = async (
    reason: "completed" | "soft_signal" | "reschedule" | "abandoned",
    includeDebrief: boolean,
  ) => {
    if (!sim) return;
    const entry = completeConflict(
      sim,
      reason,
      includeDebrief ? debrief : null,
    );
    await conflictSimStore.append(entry);
    // Intentionally do not setBondPhase here: soft_signal / reschedule must stay
    // free; even "completed" is practice — map phase is human-owned on this surface.
    await reloadHistory();
    setSim(null);
    setDraft(defaultConflictDraft());
    setPhase("hub");
  };

  const fireSoftSignal = async () => {
    if (!sim) return;
    setSoftState("stopping");
    await softSignalService.practice();
    setSoftState("stopped");
    setSim({ ...sim, moveId: "soft_signal", step: "done" });
    setPendingEnd("soft_signal");
    setDebrief((d) => ({ ...d, ledgerSoftSignalOk: true }));
    setPhase("debrief");
  };

  if (phase === "run" && sim) {
    const mode = findMode(sim.snapshot.modeId);
    const completeGate = canCompleteSim(sim);
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Eyebrow>SIM · LIVE</Eyebrow>
          <Title>{mode.label}</Title>
          <Card>
            <Text style={styles.banner}>{CONFLICT_COPY.softSignal}</Text>
            <Body muted>
              Intensity: {findIntensity(sim.snapshot.intensityId).label}
            </Body>
            <Body>Issue: {sim.snapshot.issueSentence}</Body>
          </Card>

          {sim.step === "body" ||
          sim.snapshot.modeId === "solo_rehearsal" ||
          sim.snapshot.modeId === "repair_script" ? (
            <Card>
              <Text style={styles.section}>Body check</Text>
              <Body muted>Where does conflict live right now?</Body>
              <View style={styles.chipRow}>
                {CONFLICT_BODY_SPOTS.map((b) => (
                  <Chip
                    key={b.id}
                    label={b.label}
                    selected={sim.bodySpot === b.id}
                    onPress={() =>
                      setSim({
                        ...sim,
                        bodySpot: b.id as ConflictBodySpot,
                        step: "statement",
                      })
                    }
                    styles={styles}
                    colors={colors}
                  />
                ))}
              </View>
            </Card>
          ) : null}

          {sim.snapshot.modeId !== "flood" &&
          sim.snapshot.modeId !== "soft_signal_first" ? (
            <Card>
              <Text style={styles.section}>I-statement draft</Text>
              <Body muted>{CONFLICT_COPY.iTemplate}</Body>
              <TextInput
                accessibilityLabel="When"
                value={when}
                onChangeText={setWhen}
                placeholder="When…"
                placeholderTextColor={colors.muted}
                style={styles.input}
              />
              <TextInput
                accessibilityLabel="I feel"
                value={feel}
                onChangeText={setFeel}
                placeholder="I feel… in my body"
                placeholderTextColor={colors.muted}
                style={styles.input}
              />
              <TextInput
                accessibilityLabel="I need"
                value={need}
                onChangeText={setNeed}
                placeholder="I need…"
                placeholderTextColor={colors.muted}
                style={styles.input}
              />
              <Button
                variant="secondary"
                label="Build I-statement"
                onPress={() =>
                  setSim({
                    ...sim,
                    iStatement: buildIStatement({ when, feel, need }),
                    step: "move",
                  })
                }
              />
              {sim.iStatement ? <Body muted>{sim.iStatement}</Body> : null}
            </Card>
          ) : null}

          {sim.snapshot.modeId === "repair_script" ? (
            <Card>
              <Text style={styles.section}>Repair lines</Text>
              {CONFLICT_COPY.repairLines.map((line) => (
                <Body key={line} muted>
                  • {line}
                </Body>
              ))}
            </Card>
          ) : null}

          <Card>
            <Text style={styles.section}>Choose a move</Text>
            {(
              [
                ["ask", "Ask / bring it (I-statement)"],
                ["pause_yellow", "Yellow · pause"],
                ["reschedule", "Reschedule (valid win)"],
                ["soft_signal", "Soft Signal · exit"],
              ] as const
            ).map(([id, label]) => (
              <Chip
                key={id}
                label={label}
                selected={sim.moveId === id}
                onPress={() =>
                  setSim({
                    ...sim,
                    moveId: id as ConflictMoveId,
                    step: "done",
                  })
                }
                styles={styles}
                colors={colors}
              />
            ))}
          </Card>

          <SoftSignalButton
            state={softState}
            onPress={() => void fireSoftSignal()}
          />

          <Button
            label="Finish sim → debrief"
            disabled={!completeGate.ok}
            onPress={() => {
              if (!completeGate.ok) return;
              if (sim.moveId === "soft_signal") {
                setPendingEnd("soft_signal");
              } else if (sim.moveId === "reschedule") {
                setPendingEnd("reschedule");
                setDebrief((d) => ({
                  ...d,
                  ledgerPauseWithoutSelfHate: true,
                }));
              } else {
                setPendingEnd("completed");
              }
              setPhase("debrief");
            }}
          />
          {!completeGate.ok ? <Body muted>{completeGate.reason}</Body> : null}
        </ScrollView>
      </Screen>
    );
  }

  if (phase === "debrief" && sim) {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Eyebrow>DEBRIEF</Eyebrow>
          <Title>No soul grades.</Title>
          <Body muted>
            Ended: {pendingEnd ?? "completed"} · Move: {sim.moveId}
          </Body>
          <Card>
            <Text style={styles.section}>Shame level (1–10)</Text>
            <View style={styles.chipRow}>
              {([1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const).map((n) => (
                <Chip
                  key={n}
                  label={String(n)}
                  selected={debrief.shameLevel === n}
                  onPress={() => setDebrief({ ...debrief, shameLevel: n })}
                  styles={styles}
                  colors={colors}
                />
              ))}
            </View>
            <TextInput
              accessibilityLabel="Note"
              value={debrief.note}
              onChangeText={(t) => setDebrief({ ...debrief, note: t })}
              placeholder="Optional note…"
              placeholderTextColor={colors.muted}
              style={styles.input}
              multiline
            />
          </Card>
          <Card>
            <ToggleRow
              label="+1 Named conflict without ghosting the notebook"
              value={debrief.ledgerNamedWithoutGhosting}
              onChange={(v) =>
                setDebrief({ ...debrief, ledgerNamedWithoutGhosting: v })
              }
              colors={colors}
              styles={styles}
            />
            <ToggleRow
              label="+1 Pause/reschedule without self-hate spiral"
              value={debrief.ledgerPauseWithoutSelfHate}
              onChange={(v) =>
                setDebrief({ ...debrief, ledgerPauseWithoutSelfHate: v })
              }
              colors={colors}
              styles={styles}
            />
            <ToggleRow
              label="+1 Soft Signal allowed"
              value={debrief.ledgerSoftSignalOk}
              onChange={(v) =>
                setDebrief({ ...debrief, ledgerSoftSignalOk: v })
              }
              colors={colors}
              styles={styles}
            />
            <ToggleRow
              label="+1 Did not write a prosecutor brief"
              value={debrief.ledgerNotProsecutor}
              onChange={(v) =>
                setDebrief({ ...debrief, ledgerNotProsecutor: v })
              }
              colors={colors}
              styles={styles}
            />
          </Card>
          <Button
            label="Save debrief"
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
          <Title>Local practice only.</Title>
          <Body muted>
            {summary.total} · Soft Signal {summary.soft_signal} · Reschedule{" "}
            {summary.reschedule}
          </Body>
          {history.length === 0 ? (
            <Body muted>No sims yet. Shame can wait in the lobby.</Body>
          ) : (
            history.slice(0, 12).map((h) => (
              <Card key={`${h.snapshot.id}-${h.endedAt}`}>
                <Body>{findMode(h.snapshot.modeId).label}</Body>
                <Body muted>
                  {h.endReason} · {h.snapshot.issueSentence.slice(0, 80)}
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
          <Eyebrow>SEAL THE SIM</Eyebrow>
          <Title>Mode · intensity · Soft Signal · name it.</Title>
          <Card>
            <Text style={styles.section}>Mode</Text>
            {CONFLICT_MODES.filter((m) => m.id !== "undecided").map((m) => (
              <Pressable
                key={m.id}
                accessibilityRole="button"
                onPress={() =>
                  setDraft({ ...draft, modeId: m.id as ConflictModeId })
                }
                style={[
                  styles.roleCard,
                  draft.modeId === m.id && styles.roleCardSelected,
                ]}
              >
                <Text style={styles.roleTitle}>{m.label}</Text>
                <Body muted>
                  {m.blurb.replace("{{PARTNER}}", modeCopy.partnerName)}
                </Body>
              </Pressable>
            ))}
          </Card>
          <Card>
            <Text style={styles.section}>Intensity</Text>
            <View style={styles.chipRow}>
              {CONFLICT_INTENSITIES.filter((i) => i.id !== "undecided").map(
                (i) => (
                  <Chip
                    key={i.id}
                    label={i.label}
                    selected={draft.intensityId === i.id}
                    onPress={() =>
                      setDraft({
                        ...draft,
                        intensityId: i.id as ConflictIntensityId,
                      })
                    }
                    styles={styles}
                    colors={colors}
                  />
                ),
              )}
            </View>
          </Card>
          <Card>
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
            {draft.modeId !== "flood" ? (
              <TextInput
                accessibilityLabel="Issue sentence"
                value={draft.issueSentence}
                onChangeText={(t) =>
                  setDraft({ ...draft, issueSentence: t })
                }
                placeholder="One sentence: what is the conflict about?"
                placeholderTextColor={colors.muted}
                style={styles.input}
                multiline
                maxLength={500}
              />
            ) : (
              <Body muted>
                Flood mode: issue optional. Soft Signal is the point.
              </Body>
            )}
          </Card>
          {sealError ? <Body muted>{sealError}</Body> : null}
          {!gate.ok ? <Body muted>{gate.reason}</Body> : null}
          <Button
            label="Seal · run sim"
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
        <Eyebrow>CONFLICT SIM</Eyebrow>
        <Title>{CONFLICT_COPY.title}</Title>
        <Card>
          <Text style={styles.banner}>{CONFLICT_COPY.banner}</Text>
          <Text style={styles.tagline}>{CONFLICT_COPY.tagline}</Text>
          <Body muted>
            {CONFLICT_COPY.purpose.replace("{{PARTNER}}", modeCopy.partnerName)}
          </Body>
          <Body muted>{CONFLICT_COPY.comedy}</Body>
        </Card>
        {relModel ? (
          <Card>
            <Body muted>Bond map: {modelBannerLine(relModel)}</Body>
            <Body muted>
              Advisory only — Soft Signal / reschedule never force phase.
            </Body>
          </Card>
        ) : null}
        <Button label="Start simulator" onPress={() => setPhase("negotiate")} />
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
          label="Attachment Repair Cathedral"
          onPress={() => router.push("/attachment-repair" as never)}
        />
        <Button
          variant="secondary"
          label="Relationship Model"
          onPress={() => router.push("/relationship-model" as never)}
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

function ToggleRow({
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
      paddingVertical: 8,
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
