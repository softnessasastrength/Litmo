/**
 * Attachment Repair Protocol — Mommy Issues + Emotional Masochist Cathedral.
 * Soft Signal God Mode. Fail-closed seal. Funny + honest on purpose.
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
  REPAIR_COPY,
  REPAIR_DURATIONS,
  REPAIR_INTENSITIES,
  REPAIR_MODES,
  REPAIR_ROLES,
  advanceScript,
  canSealRepair,
  completeRepair,
  currentScriptLine,
  defaultRepairDebrief,
  defaultRepairDraft,
  durationTargetSeconds,
  findIntensity,
  findMode,
  findRole,
  formatRepairClock,
  isRepairDurationComplete,
  resumeFromYellow,
  sealRepair,
  startRepairSession,
  summarizeRepairHistory,
  tickRepairSession,
  yellowPause,
  type RepairActiveSession,
  type RepairDebrief,
  type RepairDurationMinutes,
  type RepairHistoryEntry,
  type RepairIntensityId,
  type RepairModeId,
  type RepairRoleId,
  type RepairSealDraft,
} from "../../lib/attachmentRepairCore";
import { softSignalService } from "../../services/softSignalService";
import { attachmentRepairStore } from "../../services/attachmentRepairStore";
import { type AppColors } from "../../theme";
import { useThemedStyles } from "../../hooks/useThemedStyles";
import { useColors } from "../../context/ThemeContext";

type Phase =
  | "hub"
  | "negotiate"
  | "active"
  | "aftercare"
  | "debrief"
  | "history";

export default function AttachmentRepairScreen() {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("hub");
  const [draft, setDraft] = useState<RepairSealDraft>(defaultRepairDraft());
  const [session, setSession] = useState<RepairActiveSession | null>(null);
  const [debrief, setDebrief] = useState<RepairDebrief>(defaultRepairDebrief());
  const [pendingEnd, setPendingEnd] = useState<
    "completed" | "soft_signal" | "yellow_pause_exit" | null
  >(null);
  const [softState, setSoftState] = useState<"idle" | "stopping" | "stopped">(
    "idle",
  );
  const [history, setHistory] = useState<RepairHistoryEntry[]>([]);
  const [sealError, setSealError] = useState("");
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const reloadHistory = useCallback(async () => {
    setHistory(await attachmentRepairStore.load());
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
        if (!prev || prev.paused) return prev;
        const next = tickRepairSession(prev, 1);
        if (isRepairDurationComplete(next)) {
          setPendingEnd("completed");
          setPhase("aftercare");
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
  }, [phase, session?.snapshot.id, session?.paused]);

  const gate = canSealRepair(draft);
  const summary = summarizeRepairHistory(history);

  const onSeal = () => {
    const g = canSealRepair(draft);
    if (!g.ok) {
      setSealError(g.reason);
      return;
    }
    const snap = sealRepair(draft);
    if (!snap) {
      setSealError("Could not seal. Fail closed.");
      return;
    }
    setSealError("");
    setSession(startRepairSession(snap));
    setSoftState("idle");
    setDebrief(defaultRepairDebrief());
    if (snap.modeId === "mommy_issues") {
      setDebrief((d) => ({ ...d, ledgerNamedMommyIssues: true }));
    }
    if (snap.modeId === "emotional_masochist") {
      setDebrief((d) => ({ ...d, ledgerCaughtMasochistLoop: true }));
    }
    setPendingEnd(null);
    setPhase("active");
  };

  const finishToHistory = async (
    reason: "completed" | "soft_signal" | "yellow_pause_exit" | "abandoned",
    includeDebrief: boolean,
  ) => {
    if (!session) return;
    const entry = completeRepair(
      session,
      reason,
      includeDebrief ? debrief : null,
    );
    await attachmentRepairStore.append(entry);
    await reloadHistory();
    setSession(null);
    setPendingEnd(null);
    setSoftState("idle");
    setDraft(defaultRepairDraft());
    setPhase("hub");
  };

  const fireSoftSignal = async () => {
    setSoftState("stopping");
    await softSignalService.practice();
    setSoftState("stopped");
    setPendingEnd("soft_signal");
    setPhase("aftercare");
  };

  if (phase === "active" && session) {
    const target = durationTargetSeconds(session.snapshot.durationMinutes);
    const mode = findMode(session.snapshot.modeId);
    const role = findRole(session.snapshot.roleId);
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Eyebrow>CATHEDRAL · RITUAL BODY</Eyebrow>
          <Title>{mode.label}</Title>
          <Card>
            <Text style={styles.banner}>{REPAIR_COPY.softSignal}</Text>
            <Body>
              {role.label} · {findIntensity(session.snapshot.intensityId).label}
            </Body>
            <Body muted>{mode.nervousSystemJob}</Body>
            <Text style={styles.clock} accessibilityRole="timer">
              {formatRepairClock(session.elapsedSeconds)}
              {target != null ? ` / ${formatRepairClock(target)}` : " · open"}
              {session.paused ? " · PAUSED (Yellow)" : ""}
            </Text>
          </Card>

          <Card>
            <Text style={styles.section}>Script</Text>
            <Text style={styles.scriptLine}>{currentScriptLine(session)}</Text>
            <Button
              variant="secondary"
              label="Next line"
              onPress={() => setSession(advanceScript(session))}
            />
          </Card>

          <SoftSignalButton
            state={softState}
            onPress={() => void fireSoftSignal()}
            accessibilityHint="God Mode. Instant cathedral exit."
          />

          {session.paused ? (
            <Button
              label="Resume from Yellow"
              onPress={() => setSession(resumeFromYellow(session))}
            />
          ) : (
            <Button
              variant="secondary"
              label="Yellow · pause"
              onPress={() => setSession(yellowPause(session))}
            />
          )}

          <Button
            variant="secondary"
            label="Complete → aftercare"
            onPress={() => {
              setPendingEnd("completed");
              setPhase("aftercare");
            }}
          />
          <Body muted>Pauses: {session.pauseCount}</Body>
        </ScrollView>
      </Screen>
    );
  }

  if (phase === "aftercare" && session) {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Eyebrow>AFTERCARE</Eyebrow>
          <Title>Soft land.</Title>
          <Card>
            <Body>Water. Breath. Feet on floor.</Body>
            <Body muted>
              One kind sentence to yourself. Soft Signal practice if still
              braced. No relationship diagnosis.
            </Body>
            {session.snapshot.intensityId === "edge" ? (
              <Text style={styles.banner}>
                Edge complete. Soft land is law. No extending the wound for
                drama.
              </Text>
            ) : null}
          </Card>
          <Button
            label="Continue to debrief"
            onPress={() => setPhase("debrief")}
          />
          <Button
            variant="secondary"
            label="Skip debrief"
            onPress={() =>
              void finishToHistory(pendingEnd ?? "completed", false)
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
          <Eyebrow>POST-RITUAL DEBRIEF</Eyebrow>
          <Title>Receipts for the nervous system.</Title>
          <Body muted>
            Ended:{" "}
            {pendingEnd === "soft_signal"
              ? "Soft Signal (success)"
              : "completed"}
          </Body>

          <Card>
            <Text style={styles.section}>How flooded? (1–10)</Text>
            <View style={styles.chipRow}>
              {([1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const).map((n) => (
                <Chip
                  key={n}
                  label={String(n)}
                  selected={debrief.flooded === n}
                  onPress={() => setDebrief({ ...debrief, flooded: n })}
                  styles={styles}
                  colors={colors}
                />
              ))}
            </View>
            <TextInput
              accessibilityLabel="What wound was this for"
              value={debrief.woundActuallyFor}
              onChangeText={(t) =>
                setDebrief({ ...debrief, woundActuallyFor: t })
              }
              placeholder="What wound was this actually for?"
              placeholderTextColor={colors.muted}
              style={styles.input}
              multiline
              maxLength={500}
            />
          </Card>

          <Card>
            <ToggleRow
              label="Soft Signal stayed free in my mind"
              value={debrief.softSignalStayedFreeInMind}
              onChange={(v) =>
                setDebrief({ ...debrief, softSignalStayedFreeInMind: v })
              }
              colors={colors}
              styles={styles}
            />
            <ToggleRow
              label="I used a partner as stand-in without consent (honesty)"
              value={debrief.usedPartnerAsStandInWithoutConsent}
              onChange={(v) =>
                setDebrief({
                  ...debrief,
                  usedPartnerAsStandInWithoutConsent: v,
                })
              }
              colors={colors}
              styles={styles}
            />
          </Card>

          <Card>
            <Text style={styles.section}>Joke ledger (local only)</Text>
            <ToggleRow
              label="+1 Named mommy issues without dumping raw"
              value={debrief.ledgerNamedMommyIssues}
              onChange={(v) =>
                setDebrief({ ...debrief, ledgerNamedMommyIssues: v })
              }
              colors={colors}
              styles={styles}
            />
            <ToggleRow
              label="+1 Caught emotional masochist loop mid-build"
              value={debrief.ledgerCaughtMasochistLoop}
              onChange={(v) =>
                setDebrief({ ...debrief, ledgerCaughtMasochistLoop: v })
              }
              colors={colors}
              styles={styles}
            />
            <ToggleRow
              label="+1 Received reassurance without performing pain"
              value={debrief.ledgerReceivedWithoutPerformingPain}
              onChange={(v) =>
                setDebrief({
                  ...debrief,
                  ledgerReceivedWithoutPerformingPain: v,
                })
              }
              colors={colors}
              styles={styles}
            />
            <ToggleRow
              label="+1 Soft Signal remembered as available"
              value={debrief.ledgerSoftSignalRemembered}
              onChange={(v) =>
                setDebrief({ ...debrief, ledgerSoftSignalRemembered: v })
              }
              colors={colors}
              styles={styles}
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
          <Eyebrow>CATHEDRAL HISTORY</Eyebrow>
          <Title>Local only. Not healing certification.</Title>
          <Body muted>
            {summary.total} · Soft Signal {summary.soft_signal_exits} · Mommy
            Issues {summary.mommy_issues} · Masochist {summary.masochist}
          </Body>
          {history.length === 0 ? (
            <Body muted>No rituals yet. The cathedral is patient.</Body>
          ) : (
            history.slice(0, 12).map((h) => (
              <Card key={`${h.snapshot.id}-${h.endedAt}`}>
                <Body>{findMode(h.snapshot.modeId).label}</Body>
                <Body muted>
                  {h.endReason} · {findRole(h.snapshot.roleId).label}
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
          <Eyebrow>SEAL THE RITUAL</Eyebrow>
          <Title>Admission · roles · intensity · Soft Signal.</Title>

          <Card>
            <Text style={styles.section}>Mode</Text>
            {REPAIR_MODES.filter((m) => m.id !== "undecided").map((m) => (
              <Pressable
                key={m.id}
                accessibilityRole="button"
                accessibilityState={{ selected: draft.modeId === m.id }}
                onPress={() => {
                  const next: RepairSealDraft = {
                    ...draft,
                    modeId: m.id as RepairModeId,
                  };
                  if (m.id !== "emotional_masochist") {
                    next.edgeConsent = false;
                    if (next.intensityId === "edge") {
                      next.intensityId = "warm";
                    }
                  }
                  setDraft(next);
                }}
                style={[
                  styles.roleCard,
                  draft.modeId === m.id && styles.roleCardSelected,
                ]}
              >
                <Text style={styles.roleTitle}>{m.label}</Text>
                <Body muted>{m.blurb}</Body>
                <Body muted>Job: {m.nervousSystemJob}</Body>
              </Pressable>
            ))}
          </Card>

          <Card>
            <Text style={styles.section}>Role</Text>
            {draft.roleId === "care_seeker" ? (
              <Text style={styles.banner}>{REPAIR_COPY.careSeeker}</Text>
            ) : null}
            <View style={styles.chipRow}>
              {REPAIR_ROLES.filter((r) => r.id !== "undecided").map((r) => (
                <Chip
                  key={r.id}
                  label={r.label}
                  selected={draft.roleId === r.id}
                  onPress={() =>
                    setDraft({ ...draft, roleId: r.id as RepairRoleId })
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
            <Text style={styles.section}>Intensity</Text>
            <View style={styles.chipRow}>
              {REPAIR_INTENSITIES.filter((i) => i.id !== "undecided")
                .filter(
                  (i) =>
                    i.id !== "edge" ||
                    draft.modeId === "emotional_masochist",
                )
                .map((i) => (
                  <Chip
                    key={i.id}
                    label={i.label}
                    selected={draft.intensityId === i.id}
                    onPress={() =>
                      setDraft({
                        ...draft,
                        intensityId: i.id as RepairIntensityId,
                      })
                    }
                    styles={styles}
                    colors={colors}
                  />
                ))}
            </View>
            {draft.intensityId === "edge" ? (
              <>
                <Text style={styles.banner}>{REPAIR_COPY.masochist}</Text>
                <ToggleRow
                  label="I consent to Edge: capped, timed, soft land required"
                  value={draft.edgeConsent}
                  onChange={(v) => setDraft({ ...draft, edgeConsent: v })}
                  colors={colors}
                  styles={styles}
                />
              </>
            ) : null}
          </Card>

          <Card>
            <Text style={styles.section}>Duration</Text>
            <View style={styles.chipRow}>
              {REPAIR_DURATIONS.map((d) => (
                <Chip
                  key={String(d)}
                  label={d === "open" ? "Open" : `${d}m`}
                  selected={draft.durationMinutes === d}
                  onPress={() =>
                    setDraft({
                      ...draft,
                      durationMinutes: d as RepairDurationMinutes,
                    })
                  }
                  styles={styles}
                  colors={colors}
                />
              ))}
            </View>
          </Card>

          <Card>
            <ToggleRow
              label="Soft Signal is God Mode (required)"
              value={draft.softSignalAcknowledged}
              onChange={(v) =>
                setDraft({ ...draft, softSignalAcknowledged: v })
              }
              colors={colors}
              styles={styles}
            />
            <ToggleRow
              label="Yellow pause exists (required)"
              value={draft.yellowPauseAcknowledged}
              onChange={(v) =>
                setDraft({ ...draft, yellowPauseAcknowledged: v })
              }
              colors={colors}
              styles={styles}
            />
            <TextInput
              accessibilityLabel="Wound note"
              value={draft.woundNote}
              onChangeText={(t) => setDraft({ ...draft, woundNote: t })}
              placeholder="What am I actually bringing into the cathedral?"
              placeholderTextColor={colors.muted}
              style={styles.input}
              multiline
              maxLength={500}
            />
          </Card>

          {sealError ? <Body muted>{sealError}</Body> : null}
          {!gate.ok ? <Body muted>{gate.reason}</Body> : null}

          <Button
            label="Seal · enter ritual body"
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
        <Eyebrow>ATTACHMENT REPAIR CATHEDRAL</Eyebrow>
        <Title>{REPAIR_COPY.title}</Title>
        <Card>
          <Text style={styles.banner}>{REPAIR_COPY.banner}</Text>
          <Text style={styles.tagline}>{REPAIR_COPY.tagline}</Text>
          <Body muted>{REPAIR_COPY.purpose}</Body>
          <Body muted>{REPAIR_COPY.comedy}</Body>
        </Card>
        <Card>
          <Body>• Mommy Issues Reassurance Ritual</Body>
          <Body>• Emotional Masochist Circuit (Edge capped)</Body>
          <Body>• Soft Landing · Cathedral Silence</Body>
          <Body>• Soft Signal God Mode · Yellow pause · joke ledger</Body>
        </Card>
        <Button
          label="Enter the cathedral (negotiate)"
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
          label="Spooning Protocol"
          onPress={() => router.push("/spooning" as never)}
        />
        <Button
          variant="secondary"
          label="Morning Cuddle"
          onPress={() => router.push("/morning-cuddle" as never)}
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
        accessibilityLabel={label}
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
    scriptLine: {
      color: colors.ink,
      fontSize: 20,
      fontWeight: "600" as const,
      lineHeight: 28,
      marginBottom: 12,
    },
    clock: {
      color: colors.moss,
      fontSize: 32,
      fontWeight: "800" as const,
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
