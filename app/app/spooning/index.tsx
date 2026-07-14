/**
 * Spooning Protocol v0.2 — nuclear role negotiation + Watch check-ins + debrief.
 * Soft Signal God Mode. Mommy-issues reassurance optional. Comedy + functional.
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
  MOMMY_ISSUES_REASSURANCE_LINES,
  SPOONING_COPY,
  SPOON_CHECK_IN_PHRASES,
  SPOON_DURATIONS,
  SPOON_ENERGIES,
  SPOON_POSITIONS,
  SPOON_PRESSURES,
  SPOON_ROLES,
  SPOON_ZONES,
  advanceReassuranceLine,
  canSealSpoon,
  completeSpoon,
  currentReassuranceLine,
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
  positionCount,
  recordCheckIn,
  remainingSeconds,
  sealSpoon,
  shouldFireFiveMinWarning,
  startSpoonSession,
  summarizeHistory,
  tickSpoonSession,
  toggleZone,
  type SpoonActiveSession,
  type SpoonCheckInPhraseId,
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
import { spooningHaptics } from "../../services/spooningHaptics";
import { type AppColors } from "../../theme";
import { useThemedStyles } from "../../hooks/useThemedStyles";
import { useColors } from "../../context/ThemeContext";

type Phase =
  | "hub"
  | "role"
  | "position"
  | "body"
  | "reassurance"
  | "active"
  | "debrief"
  | "history";

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
  const [checkInFlash, setCheckInFlash] = useState<string | null>(null);
  const [watchNote, setWatchNote] = useState("");
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
          void spooningHaptics.onFiveMinWarning(next.snapshot);
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

  const onSeal = async () => {
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
    const s = startSpoonSession(snap);
    setSession(s);
    setSoftState("idle");
    setDebrief({
      ...defaultDebrief(),
      namedNeedForHold: snap.mommyIssuesReassurance,
      receivedWithoutPerformingPain: snap.mommyIssuesReassurance,
    });
    setPendingEnd(null);
    setFiveMinBanner(false);
    setCheckInFlash(null);
    await spooningHaptics.onSeal(snap);
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
    await spooningHaptics.onSoftSignal(session?.snapshot ?? null);
    await softSignalService.practice();
    setSoftState("stopped");
    setPendingEnd("soft_signal");
    setPhase("debrief");
  };

  const onCheckIn = async () => {
    if (!session) return;
    const next = recordCheckIn(session);
    setSession(next);
    setCheckInFlash(next.lastCheckInFlash);
    const r = await spooningHaptics.onCheckIn(next.snapshot);
    setWatchNote(
      r.watchSimulated
        ? `Watch: ${r.phrase} (simulated — pair Watch for wrist)`
        : `Watch: ${r.phrase}`,
    );
    setTimeout(() => setCheckInFlash(null), 2800);
  };

  const stepBar = (active: number) => (
    <Body muted>
      Negotiate:{" "}
      {SPOONING_COPY.negotiateSteps.map((s, i) =>
        i === active ? `[${s}]` : s,
      ).join(" → ")}
    </Body>
  );

  if (phase === "active" && session) {
    const target = durationTargetSeconds(session.snapshot.durationMinutes);
    const remain = remainingSeconds(session);
    const role = findRole(session.snapshot.roleId);
    const pos = findPosition(session.snapshot.positionId);
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Eyebrow>SPOON v0.2 · ACTIVE · GOD MODE ARMED</Eyebrow>
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
            <Body muted>{pos.nervousSystemJob}</Body>
            {session.snapshot.mommyIssuesReassurance ? (
              <Text style={styles.banner}>
                Reassurance contract on · {currentReassuranceLine(session)}
              </Text>
            ) : null}
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
              <Text style={styles.checkInFlash}>{checkInFlash}</Text>
            ) : null}
            {watchNote ? <Body muted>{watchNote}</Body> : null}
          </Card>

          <SoftSignalButton
            state={softState}
            onPress={() => void fireSoftSignal()}
            accessibilityHint="God Mode. Instant release. Watch Soft Signal when paired."
          />

          <Button
            variant="secondary"
            label='Mid-spoon check-in (phone + Watch)'
            onPress={() => void onCheckIn()}
          />
          {session.snapshot.mommyIssuesReassurance ? (
            <Button
              variant="secondary"
              label="Next reassurance line"
              onPress={() => {
                setSession(advanceReassuranceLine(session));
                void spooningHaptics.onReassuranceLine();
              }}
            />
          ) : null}
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
            Check-ins: {session.checkInCount}. Soft Signal needs zero of them.
          </Body>
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
          <Eyebrow>POST-SPOON DEBRIEF v0.2</Eyebrow>
          <Title>Data collection (lol).</Title>
          <Body muted>
            {SPOONING_COPY.debriefLol}
            {"\n"}Ended via: {endLabel} · check-ins: {session.checkInCount}
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
              placeholder="Body notes…"
              placeholderTextColor={colors.muted}
              style={styles.input}
              multiline
            />
          </Card>

          <Card>
            <Text style={styles.section}>What worked?</Text>
            <TextInput
              value={debrief.worked}
              onChangeText={(t) => setDebrief({ ...debrief, worked: t })}
              placeholder="e.g. Safety Burrito + still wanted check-in…"
              placeholderTextColor={colors.muted}
              style={styles.input}
              multiline
            />
            <Text style={styles.section}>What didn’t?</Text>
            <TextInput
              value={debrief.didntWork}
              onChangeText={(t) => setDebrief({ ...debrief, didntWork: t })}
              placeholder="Honest. Private."
              placeholderTextColor={colors.muted}
              style={styles.input}
              multiline
            />
          </Card>

          <Card>
            <ToggleRow
              label={SPOONING_COPY.ledgerJoke}
              value={debrief.nonTraumaticClosenessPlusOne}
              onChange={(v) =>
                setDebrief({ ...debrief, nonTraumaticClosenessPlusOne: v })
              }
              colors={colors}
              styles={styles}
            />
            <ToggleRow
              label="I did not owe a performance"
              value={debrief.owedNoPerformance}
              onChange={(v) =>
                setDebrief({ ...debrief, owedNoPerformance: v })
              }
              colors={colors}
              styles={styles}
            />
            <ToggleRow
              label="+1 Received hold without performing pain (mommy-issues)"
              value={debrief.receivedWithoutPerformingPain}
              onChange={(v) =>
                setDebrief({ ...debrief, receivedWithoutPerformingPain: v })
              }
              colors={colors}
              styles={styles}
            />
            <ToggleRow
              label="+1 Named need for hold without dumping raw"
              value={debrief.namedNeedForHold}
              onChange={(v) =>
                setDebrief({ ...debrief, namedNeedForHold: v })
              }
              colors={colors}
              styles={styles}
            />
          </Card>

          <Button
            variant="secondary"
            label="Open Attachment Repair Cathedral"
            onPress={() => router.push("/attachment-repair" as never)}
          />
          <Button
            label="Save private debrief"
            onPress={() =>
              void finishToHistory(pendingEnd ?? "completed", true)
            }
          />
          <Button
            variant="secondary"
            label="Skip paperwork"
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
          <Eyebrow>SPOON HISTORY v0.2</Eyebrow>
          <Title>Local only. Not a skill score.</Title>
          <Body muted>
            {summary.total} · Soft Signal {summary.soft_signal_exits} ·
            check-ins {summary.check_ins} · mommy-issues{" "}
            {summary.mommy_issues_runs}
          </Body>
          {history.length === 0 ? (
            <Body muted>No spoons yet. Jetpack Mode awaits.</Body>
          ) : (
            history.slice(0, 12).map((h) => (
              <Card key={`${h.snapshot.id}-${h.endedAt}`}>
                <Body>
                  {findRole(h.snapshot.roleId).label} ·{" "}
                  {findPosition(h.snapshot.positionId).label}
                </Body>
                <Body muted>
                  {h.endReason}
                  {h.snapshot.mommyIssuesReassurance ? " · reassurance" : ""}
                  {h.checkInCount > 0 ? ` · ${h.checkInCount} check-ins` : ""}
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

  if (phase === "role") {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Eyebrow>1 · ROLE NEGOTIATION</Eyebrow>
          <Title>Who are you in this spoon?</Title>
          {stepBar(0)}
          {SPOON_ROLES.filter((r) => r.id !== "undecided").map((r) => (
            <Pressable
              key={r.id}
              accessibilityRole="button"
              accessibilityState={{ selected: draft.roleId === r.id }}
              onPress={() => {
                const next = { ...draft, roleId: r.id as SpoonRoleId };
                if (r.mommyIssuesAdjacent) {
                  next.mommyIssuesReassurance = true;
                  if (next.energyId === "undecided" || next.energyId === "cozy_silence") {
                    next.energyId = "reassurance_needed";
                  }
                }
                setDraft(next);
              }}
              style={[
                styles.roleCard,
                draft.roleId === r.id && styles.roleCardSelected,
              ]}
            >
              <Text style={styles.roleTitle}>{r.label}</Text>
              <Body muted>{r.blurb}</Body>
              <Body muted>{r.strengthNote}</Body>
              {r.mommyIssuesAdjacent ? (
                <Text style={styles.tag}>MOMMY-ISSUES ADJACENT</Text>
              ) : null}
            </Pressable>
          ))}
          {draft.roleId === "little" || draft.roleId === "care_seeker_little" ? (
            <Text style={styles.banner}>{SPOONING_COPY.littleStrength}</Text>
          ) : null}
          <Button
            label="Next · Position"
            disabled={draft.roleId === "undecided"}
            onPress={() => setPhase("position")}
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

  if (phase === "position") {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Eyebrow>2 · POSITION ({positionCount()} shapes)</Eyebrow>
          <Title>Pick the ridiculous geometry.</Title>
          {stepBar(1)}
          {SPOON_POSITIONS.map((p) => (
            <Pressable
              key={p.id}
              accessibilityRole="button"
              onPress={() =>
                setDraft({ ...draft, positionId: p.id as SpoonPositionId })
              }
              style={[
                styles.roleCard,
                draft.positionId === p.id && styles.roleCardSelected,
              ]}
            >
              <Text style={styles.roleTitle}>
                {p.label}
                {p.comedyLevel >= 3 ? " 🦞" : ""}
              </Text>
              <Body muted>{p.blurb}</Body>
              <Body muted>NS job: {p.nervousSystemJob}</Body>
            </Pressable>
          ))}
          {draft.positionId === "custom" ? (
            <TextInput
              value={draft.customPositionNote}
              onChangeText={(t) =>
                setDraft({ ...draft, customPositionNote: t })
              }
              placeholder="Name the chaos…"
              placeholderTextColor={colors.muted}
              style={styles.input}
            />
          ) : null}
          <Button label="Next · Body rules" onPress={() => setPhase("body")} />
          <Button
            variant="secondary"
            label="Back"
            onPress={() => setPhase("role")}
          />
        </ScrollView>
      </Screen>
    );
  }

  if (phase === "body") {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Eyebrow>3 · BODY RULES</Eyebrow>
          <Title>Duration · pressure · energy · zones.</Title>
          {stepBar(2)}
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
            <Text style={styles.section}>Energy</Text>
            <View style={styles.chipRow}>
              {SPOON_ENERGIES.filter((e) => e.id !== "undecided").map((e) => (
                <Chip
                  key={e.id}
                  label={e.label}
                  selected={draft.energyId === e.id}
                  onPress={() =>
                    setDraft({
                      ...draft,
                      energyId: e.id as SpoonEnergyId,
                      mommyIssuesReassurance:
                        e.id === "reassurance_needed"
                          ? true
                          : draft.mommyIssuesReassurance,
                    })
                  }
                  styles={styles}
                  colors={colors}
                />
              ))}
            </View>
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
          <Button
            label="Next · Reassurance / Watch"
            onPress={() => setPhase("reassurance")}
          />
          <Button
            variant="secondary"
            label="Back"
            onPress={() => setPhase("position")}
          />
        </ScrollView>
      </Screen>
    );
  }

  if (phase === "reassurance") {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Eyebrow>4 · REASSURANCE + WATCH</Eyebrow>
          <Title>Mommy issues · check-ins · haptics.</Title>
          {stepBar(3)}
          <Card>
            <Text style={styles.banner}>{SPOONING_COPY.mommyTie}</Text>
            <ToggleRow
              label="Mommy-issues reassurance contract (explicit lines mid-spoon)"
              value={draft.mommyIssuesReassurance}
              onChange={(v) =>
                setDraft({
                  ...draft,
                  mommyIssuesReassurance: v,
                  energyId: v ? "reassurance_needed" : draft.energyId,
                  preferredCheckIn: v ? "still_wanted" : draft.preferredCheckIn,
                })
              }
              colors={colors}
              styles={styles}
            />
            {draft.mommyIssuesReassurance ? (
              <>
                <Body muted>Sample lines:</Body>
                {MOMMY_ISSUES_REASSURANCE_LINES.map((line) => (
                  <Body key={line} muted>
                    • {line}
                  </Body>
                ))}
              </>
            ) : null}
          </Card>
          <Card>
            <ToggleRow
              label="Apple Watch haptics (best-effort; simulated if unpaired)"
              value={draft.watchHapticsEnabled}
              onChange={(v) =>
                setDraft({ ...draft, watchHapticsEnabled: v })
              }
              colors={colors}
              styles={styles}
            />
            <Text style={styles.section}>Preferred mid-spoon check-in</Text>
            <View style={styles.chipRow}>
              {SPOON_CHECK_IN_PHRASES.map((p) => (
                <Chip
                  key={p.id}
                  label={p.label}
                  selected={draft.preferredCheckIn === p.id}
                  onPress={() =>
                    setDraft({
                      ...draft,
                      preferredCheckIn: p.id as SpoonCheckInPhraseId,
                    })
                  }
                  styles={styles}
                  colors={colors}
                />
              ))}
            </View>
            {draft.preferredCheckIn === "custom" ? (
              <TextInput
                value={draft.customCheckInFlash}
                onChangeText={(t) =>
                  setDraft({ ...draft, customCheckInFlash: t })
                }
                placeholder="Custom flash phrase…"
                placeholderTextColor={colors.muted}
                style={styles.input}
              />
            ) : null}
          </Card>
          <Card>
            <Text style={styles.section}>Private anxiety note</Text>
            <TextInput
              value={draft.anxietyNote}
              onChangeText={(t) => setDraft({ ...draft, anxietyNote: t })}
              placeholder="If I just lie next to someone, I am afraid that…"
              placeholderTextColor={colors.muted}
              style={styles.input}
              multiline
            />
          </Card>
          {sealError ? <Body muted>{sealError}</Body> : null}
          {!gate.ok ? <Body muted>{gate.reason}</Body> : null}
          <Button
            label="5 · Seal spoon snapshot → start"
            onPress={() => void onSeal()}
            disabled={!gate.ok}
          />
          <Button
            variant="secondary"
            label="Back"
            onPress={() => setPhase("body")}
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
          <Body>
            • {positionCount()} positions (Jetpack, Koala Death Grip, Safety
            Burrito…)
          </Body>
          <Body>• Full role negotiation (5 steps)</Body>
          <Body>• Mid-spoon check-ins + Watch haptics</Body>
          <Body>• Mommy-issues reassurance contract</Body>
          <Body>• Soft Signal God Mode + post-spoon debrief</Body>
        </Card>
        <Button
          label="Start role negotiation"
          onPress={() => setPhase("role")}
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
          label="Attachment Repair Cathedral"
          onPress={() => router.push("/attachment-repair" as never)}
        />
        <Button
          variant="secondary"
          label="Containment Lo-Fi"
          onPress={() => router.push("/containment/lofi" as never)}
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
    tag: {
      color: colors.moss,
      fontWeight: "800" as const,
      fontSize: 11,
      letterSpacing: 1,
      marginTop: 6,
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
