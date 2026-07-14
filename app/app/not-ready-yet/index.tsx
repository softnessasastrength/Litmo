/**
 * I'm Not Ready To Get Up Yet — morning snooze / exit containment.
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
  NOT_READY_COPY,
  NOT_READY_REASONS,
  SNOOZE_OPTIONS,
  canExtendOnce,
  canSealNotReady,
  completeNotReady,
  defaultNotReadyDebrief,
  defaultNotReadyDraft,
  extendOnce,
  findReason,
  formatClock,
  isSnoozeComplete,
  remainingSeconds,
  sealNotReady,
  snoozeLabel,
  startNotReadySession,
  summarizeNotReadyHistory,
  tickNotReady,
  type NotReadyActiveSession,
  type NotReadyDebrief,
  type NotReadyHistoryEntry,
  type NotReadyReasonId,
  type NotReadySealDraft,
  type SnoozeMinutes,
} from "../../lib/notReadyYetCore";
import { softSignalService } from "../../services/softSignalService";
import { notReadyYetStore } from "../../services/notReadyYetStore";
import { relationshipModelStore } from "../../services/relationshipModelStore";
import {
  modelBannerLine,
  type RelationshipModel,
} from "../../lib/relationshipModelCore";
import { type AppColors } from "../../theme";
import { useThemedStyles } from "../../hooks/useThemedStyles";
import { useColors } from "../../context/ThemeContext";

type Phase =
  | "hub"
  | "negotiate"
  | "active"
  | "exit_ritual"
  | "debrief"
  | "history";

export default function NotReadyYetScreen() {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("hub");
  const [draft, setDraft] = useState<NotReadySealDraft>(defaultNotReadyDraft());
  const [session, setSession] = useState<NotReadyActiveSession | null>(null);
  const [debrief, setDebrief] = useState<NotReadyDebrief>(
    defaultNotReadyDebrief(),
  );
  const [softState, setSoftState] = useState<"idle" | "stopping" | "stopped">(
    "idle",
  );
  const [history, setHistory] = useState<NotReadyHistoryEntry[]>([]);
  const [sealError, setSealError] = useState("");
  const [pendingEnd, setPendingEnd] = useState<
    "completed" | "soft_signal" | "im_up" | null
  >(null);
  /** Bond map for hub banner only — never auto-changes phase; not consent. */
  const [relModel, setRelModel] = useState<RelationshipModel | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const reloadHistory = useCallback(async () => {
    setHistory(await notReadyYetStore.load());
  }, []);

  useEffect(() => {
    void reloadHistory();
    // WHAT: Load Relationship Model for hub banner. WHY: Light bond context on
    // snooze hub without driving snooze phase. CONSENT: Model is not consent.
    // NEVER: Auto-change not-ready phase from model.
    void relationshipModelStore.load().then((b) => {
      if (b?.model) setRelModel(b.model);
    });
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
        const next = tickNotReady(prev, 1);
        if (isSnoozeComplete(next)) {
          setPendingEnd("completed");
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

  const gate = canSealNotReady(draft);
  const summary = summarizeNotReadyHistory(history);

  const onSeal = () => {
    const g = canSealNotReady(draft);
    if (!g.ok) {
      setSealError(g.reason);
      return;
    }
    const snap = sealNotReady(draft);
    if (!snap) {
      setSealError("Fail closed.");
      return;
    }
    setSealError("");
    setSession(startNotReadySession(snap));
    setDebrief(defaultNotReadyDebrief());
    setSoftState("idle");
    setPendingEnd(null);
    setPhase("active");
  };

  const finish = async (
    reason: "completed" | "soft_signal" | "im_up" | "abandoned",
    includeDebrief: boolean,
  ) => {
    if (!session) return;
    const entry = completeNotReady(
      session,
      reason,
      includeDebrief ? debrief : null,
    );
    await notReadyYetStore.append(entry);
    await reloadHistory();
    setSession(null);
    setDraft(defaultNotReadyDraft());
    setPhase("hub");
  };

  const fireSoftSignal = async () => {
    setSoftState("stopping");
    await softSignalService.practice();
    setSoftState("stopped");
    setPendingEnd("soft_signal");
    setDebrief((d) => ({ ...d, ledgerSoftSignalOk: true }));
    setPhase("exit_ritual");
  };

  if (phase === "active" && session) {
    const remain = remainingSeconds(session);
    const reason = findReason(session.snapshot.reasonId);
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Eyebrow>SNOOZE · ACTIVE</Eyebrow>
          <Title>Bed is still sovereign.</Title>
          <Card>
            <Text style={styles.banner}>{NOT_READY_COPY.softSignal}</Text>
            <Body>
              {reason.label} · {snoozeLabel(session.snapshot.snoozeMinutes)}
            </Body>
            <Text style={styles.clock} accessibilityRole="timer">
              {formatClock(session.elapsedSeconds)}
              {remain != null ? ` · ${formatClock(remain)} left` : " · open"}
              {session.extendedOnce ? " · +5 used" : ""}
            </Text>
          </Card>

          <SoftSignalButton
            state={softState}
            onPress={() => void fireSoftSignal()}
          />

          {canExtendOnce(session) ? (
            <Button
              variant="secondary"
              label="Extend +5 min (once)"
              onPress={() => {
                const ext = extendOnce(session);
                if (ext) setSession(ext);
              }}
            />
          ) : null}

          <Button
            label="Ok — I'm up → exit ritual"
            onPress={() => {
              setPendingEnd("im_up");
              setDebrief((d) => ({ ...d, ledgerExitedWithScript: true }));
              setPhase("exit_ritual");
            }}
          />
        </ScrollView>
      </Screen>
    );
  }

  if (phase === "exit_ritual" && session) {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Eyebrow>EXIT RITUAL</Eyebrow>
          <Title>Graceful disengage from bed nation.</Title>
          <Card>
            <Text style={styles.section}>Your exit script</Text>
            <Body>{session.snapshot.exitScript}</Body>
            {session.snapshot.partnerLine ? (
              <>
                <Text style={styles.section}>Optional partner line</Text>
                <Body muted>{session.snapshot.partnerLine}</Body>
                <Body muted>
                  Not auto-sent. Only if you choose to use it with a real human.
                </Body>
              </>
            ) : null}
            <Body muted>
              Positive reinforcement energy: “I really liked that” / thanks for
              the minutes — even if you said it only to yourself.
            </Body>
          </Card>
          <Button
            label="Continue to debrief"
            onPress={() => setPhase("debrief")}
          />
          <Button
            variant="secondary"
            label="Skip debrief"
            onPress={() => void finish(pendingEnd ?? "im_up", false)}
          />
        </ScrollView>
      </Screen>
    );
  }

  if (phase === "debrief" && session) {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Eyebrow>DEBRIEF</Eyebrow>
          <Title>No self-hate for needing more.</Title>
          <Body muted>Ended: {pendingEnd ?? "completed"}</Body>
          <Card>
            <Text style={styles.section}>Guilt level (1–10)</Text>
            <View style={styles.chipRow}>
              {([1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const).map((n) => (
                <Pressable
                  key={n}
                  onPress={() => setDebrief({ ...debrief, guilt: n })}
                  style={[
                    styles.chip,
                    debrief.guilt === n && {
                      backgroundColor: colors.mossSoft,
                      borderColor: colors.moss,
                    },
                  ]}
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
              label="+1 Asked for more without full spiral"
              value={debrief.ledgerAskedWithoutSpiral}
              onChange={(v) =>
                setDebrief({ ...debrief, ledgerAskedWithoutSpiral: v })
              }
              colors={colors}
              styles={styles}
            />
            <Toggle
              label="+1 Exited with script"
              value={debrief.ledgerExitedWithScript}
              onChange={(v) =>
                setDebrief({ ...debrief, ledgerExitedWithScript: v })
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
              label="+1 No self-hate for needing hold"
              value={debrief.ledgerNoSelfHate}
              onChange={(v) =>
                setDebrief({ ...debrief, ledgerNoSelfHate: v })
              }
              colors={colors}
              styles={styles}
            />
          </Card>
          <Button
            label="Save"
            onPress={() => void finish(pendingEnd ?? "im_up", true)}
          />
          <Button
            variant="secondary"
            label="Skip"
            onPress={() => void finish(pendingEnd ?? "im_up", false)}
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
            {summary.total} · I’m up {summary.im_up} · Soft Signal{" "}
            {summary.soft_signal} · extended {summary.extended}
          </Body>
          {history.length === 0 ? (
            <Body muted>No snoozes logged. The bed awaits policy.</Body>
          ) : (
            history.slice(0, 12).map((h) => (
              <Card key={`${h.snapshot.id}-${h.endedAt}`}>
                <Body>{findReason(h.snapshot.reasonId).label}</Body>
                <Body muted>
                  {h.endReason} · {snoozeLabel(h.snapshot.snoozeMinutes)}
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
          <Eyebrow>NEGOTIATE SNOOZE</Eyebrow>
          <Title>One more unit of safety.</Title>

          <Card>
            <Text style={styles.section}>Why not ready?</Text>
            {NOT_READY_REASONS.filter((r) => r.id !== "undecided").map((r) => (
              <Pressable
                key={r.id}
                onPress={() =>
                  setDraft({
                    ...draft,
                    reasonId: r.id as NotReadyReasonId,
                  })
                }
                style={[
                  styles.roleCard,
                  draft.reasonId === r.id && styles.roleCardSelected,
                ]}
              >
                <Text style={styles.roleTitle}>{r.label}</Text>
                <Body muted>{r.blurb}</Body>
              </Pressable>
            ))}
            {draft.reasonId === "other" ? (
              <TextInput
                value={draft.reasonNote}
                onChangeText={(t) => setDraft({ ...draft, reasonNote: t })}
                placeholder="Name it…"
                placeholderTextColor={colors.muted}
                style={styles.input}
              />
            ) : null}
          </Card>

          <Card>
            <Text style={styles.section}>Snooze unit</Text>
            <View style={styles.chipRow}>
              {SNOOZE_OPTIONS.map((s) => (
                <Pressable
                  key={String(s)}
                  onPress={() =>
                    setDraft({
                      ...draft,
                      snoozeMinutes: s as SnoozeMinutes,
                    })
                  }
                  style={[
                    styles.chip,
                    draft.snoozeMinutes === s && {
                      backgroundColor: colors.mossSoft,
                      borderColor: colors.moss,
                    },
                  ]}
                >
                  <Text style={styles.chipText}>{snoozeLabel(s)}</Text>
                </Pressable>
              ))}
            </View>
          </Card>

          <Card>
            <Text style={styles.section}>Exit script (when you do get up)</Text>
            <TextInput
              value={draft.exitScript}
              onChangeText={(t) => setDraft({ ...draft, exitScript: t })}
              style={styles.input}
              multiline
            />
            <Text style={styles.section}>Optional partner ask line</Text>
            <TextInput
              value={draft.partnerLine}
              onChangeText={(t) => setDraft({ ...draft, partnerLine: t })}
              style={styles.input}
              multiline
            />
            <Body muted>Never auto-sent. Soft Signal always free.</Body>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Body>Soft Signal free (required)</Body>
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

          <Button label="Seal snooze → start" onPress={onSeal} disabled={!gate.ok} />
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
        <Eyebrow>NOT READY YET</Eyebrow>
        <Title>{NOT_READY_COPY.title}</Title>
        <Card>
          <Text style={styles.banner}>{NOT_READY_COPY.banner}</Text>
          <Text style={styles.tagline}>{NOT_READY_COPY.tagline}</Text>
          <Body muted>{NOT_READY_COPY.purpose}</Body>
          <Body muted>{NOT_READY_COPY.comedy}</Body>
        </Card>
        {relModel ? (
          <Card>
            <Body muted>Bond map: {modelBannerLine(relModel)}</Body>
            {relModel.closenessStyle === "touch_primary" ? (
              <Body muted>
                Touch-primary closeness — more hold before up can match this
                language. Model is not consent. Soft Signal free.
              </Body>
            ) : (
              <Body muted>
                Banner only — model does not seal a snooze. Soft Signal free.
              </Body>
            )}
            <Button
              variant="secondary"
              label="Open Relationship Model"
              onPress={() => router.push("/relationship-model" as never)}
            />
          </Card>
        ) : (
          <Card>
            <Body muted>
              No Relationship Model yet — optional bond map. Soft Signal free.
            </Body>
            <Button
              variant="secondary"
              label="Open Relationship Model"
              onPress={() => router.push("/relationship-model" as never)}
            />
          </Card>
        )}
        <Button
          label="Negotiate snooze"
          onPress={() => setPhase("negotiate")}
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
          label="Morning Cuddle Protocol"
          onPress={() => router.push("/morning-cuddle" as never)}
        />
        <Button
          variant="secondary"
          label="Interest Reverse Engineering"
          onPress={() => router.push("/interest-re" as never)}
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
      marginTop: 4,
    },
    clock: {
      color: colors.moss,
      fontSize: 36,
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
      paddingVertical: 10,
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
      minHeight: 64,
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
