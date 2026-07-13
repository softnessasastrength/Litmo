/**
 * Consent Snapshot — prepare screen (personal declaration only).
 *
 * WHAT (module): Multi-step UI to build/save PreSessionDeclaration on-device.
 * WHY: Prepare must be serious and separate from mutual seal so one save never unlocks touch.
 * CONSENT: prepare ≠ mutual seal ≠ touch. Soft Signal affirmations required before save path.
 * Unset zones stay off_limits via TL mapping. maxDurationMinutes is personal; mutual takes min.
 * NEVER: Do not auto-navigate into active session; do not claim dual affirm on this screen.
 * SEE: sessionConsentSnapshotCore · mutual.tsx · docs/CODE_COMMENT_STANDARD.md
 */

import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Text, TextInput, View } from "react-native";
import {
  Body,
  Button,
  Choice,
  Eyebrow,
  Screen,
  Title,
} from "../../components/ui";
import { ConsentAffirmRow } from "../../components/ConsentAffirmRow";
import {
  AFTERCARE_OPTIONS,
  ENERGY_OPTIONS,
  MOOD_OPTIONS,
  createEmptyDeclaration,
  declarationFromTouchLanguage,
  type AftercareId,
  type EnergyId,
  type MoodId,
  type PreSessionDeclaration,
} from "../../lib/sessionConsentSnapshotCore";
import { touchLanguageStore } from "../../services/touchLanguageStore";
import { sessionConsentSnapshotStore } from "../../services/sessionConsentSnapshotStore";
import { fonts, radius, type AppColors } from "../../theme";
import { useThemedStyles } from "../../hooks/useThemedStyles";
import { useColors } from "../../context/ThemeContext";
import { hapticService } from "../../services/hapticService";

/**
 * WHAT: Wizard step ids for the prepare flow.
 * WHY: Ordered protective narrative: intro → state → duration → boundaries → safewords → aftercare → Soft Signal → save.
 * CONSENT: soft_signal step gates save with three explicit understandings.
 * EDGE CASES: Unknown stepIndex falls back to intro in render.
 * NEVER: Do not skip Soft Signal step for “power users”.
 */
type Step =
  | "intro"
  | "state"
  | "duration"
  | "boundaries"
  | "safewords"
  | "aftercare"
  | "soft_signal"
  | "save";

/**
 * WHAT: Ordered step sequence for progress UI and continue navigation.
 * WHY: Fixed order prevents jumping to save without Soft Signal education steps.
 * CONSENT: Order is product grammar, not decoration.
 * EDGE CASES: Length used for clamp on stepIndex.
 * NEVER: Do not reorder Soft Signal after save.
 */
const STEPS: Step[] = [
  "intro",
  "state",
  "duration",
  "boundaries",
  "safewords",
  "aftercare",
  "soft_signal",
  "save",
];

/**
 * WHAT: Optional personal max-duration choices for this moment (null = no fixed clock).
 * WHY: UI-facing presets in [15,60] plus null; core accepts 5–180 but prepare offers clear commons.
 * CONSENT: Clock is never a cage — Soft Signal anytime sooner (copy on every option).
 * EDGE CASES: null selected clears maxDurationMinutes; mutual seal takes stricter min of both.
 * NEVER: Do not present duration as requiring someone to finish the full time.
 *
 * Unit: minutes | null. Changing options only affects prepare UX, not core clamp.
 */
const DURATION_CHOICES: Array<{ minutes: number | null; label: string; detail: string }> = [
  { minutes: null, label: "No fixed clock", detail: "Soft Signal anytime — no agreed max" },
  { minutes: 15, label: "About 15 minutes", detail: "Short, clear boundary" },
  { minutes: 30, label: "About 30 minutes", detail: "Common default" },
  { minutes: 45, label: "About 45 minutes", detail: "Longer held presence" },
  { minutes: 60, label: "About 60 minutes", detail: "Still Soft Signal anytime sooner" },
];

/**
 * WHAT: Screen component for preparing one person's pre-session Consent Snapshot declaration.
 * WHY: Serious multi-step protective path before mutual seal; hydrates from vault or Touch Language.
 * CONSENT: Saves only local declaration (notConsentAlone). Soft Signal three checks required before save.
 * EDGE CASES:
 *   - existing vault declaration wins over TL seed
 *   - no TL → empty declaration (all zones off_limits by core default)
 *   - save without three Soft Signal UI checks → error, no persist
 *   - save failure → alert, stay on screen
 * NEVER: Never claim this save seals mutual consent or starts touch.
 * SEE: sessionConsentSnapshotStore.saveDeclaration · ConsentAffirmRow
 */
export default function ConsentSnapshotPrepareScreen() {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  // Fail-closed default: empty declaration is all off_limits until TL/vault loads.
  const [decl, setDecl] = useState<PreSessionDeclaration>(
    createEmptyDeclaration(),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // Soft Signal UI checks start false — must be intentionally toggled (prepare gate).
  const [ssChecks, setSsChecks] = useState({
    stop: false,
    noExplain: false,
    mutual: false,
  });

  const step = STEPS[stepIndex] ?? "intro";

  /**
   * WHAT: On mount, hydrate declaration from vault or Touch Language.
   * WHY: Resume prepare work; otherwise seed from TL map (unset → off_limits).
   * CONSENT: Load is prepare-only; does not open mutual seal automatically.
   * EDGE CASES: existing declaration short-circuits TL; missing both keeps empty defaults.
   * NEVER: Do not overwrite user mid-edit after first paint beyond this mount effect.
   */
  useEffect(() => {
    void (async () => {
      const existing = await sessionConsentSnapshotStore.loadDeclaration();
      // Prefer saved prepare work over re-seeding TL (user may have edited safewords etc.).
      if (existing) {
        setDecl(existing);
        return;
      }
      const tl = await touchLanguageStore.load();
      if (tl) setDecl(declarationFromTouchLanguage(tl, "You"));
    })();
  }, []);

  /**
   * WHAT: Immutable patch helper that re-stamps updatedAt + constitutional flags.
   * WHY: Every field edit must keep notConsentAlone / forThisMomentOnly true after merge.
   * CONSENT: Prevents accidental flag loss if a patch spreads a partial object.
   * EDGE CASES: none beyond pure state transform of current decl.
   * NEVER: Do not allow patch to set notConsentAlone false.
   */
  const patch = (fn: (d: PreSessionDeclaration) => PreSessionDeclaration) => {
    setDecl((d) =>
      fn({
        ...d,
        updatedAt: new Date().toISOString(),
        notConsentAlone: true,
        forThisMomentOnly: true,
      }),
    );
  };

  /**
   * WHAT: Gate Soft Signal checks, persist declaration, navigate to mutual seal screen.
   * WHY: Mutual path must not open without a valid local prepare + Soft Signal understanding.
   * CONSENT: Save is still prepare-only; mutual.tsx performs dual affirm separately.
   * EDGE CASES:
   *   - incomplete ssChecks → error, no network/vault write
   *   - store throw → user-visible error
   * NEVER: Do not navigate to /session/active from prepare.
   */
  const saveAndContinue = async () => {
    // Fail-closed: all three Soft Signal statements must be affirmed before persist.
    if (!ssChecks.stop || !ssChecks.noExplain || !ssChecks.mutual) {
      setError("Affirm all three Soft Signal statements to continue.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const now = new Date().toISOString();
      const next = await sessionConsentSnapshotStore.saveDeclaration({
        ...decl,
        softSignal: {
          understandsImmediateStop: true,
          understandsNoExplanation: true,
          understandsMutualAvailability: true,
          affirmedAt: now,
        },
        // Re-assert prepare-only flags at the write boundary.
        notConsentAlone: true,
        forThisMomentOnly: true,
        updatedAt: now,
      });
      setDecl(next);
      void hapticService.play("confirmation");
      // Mutual seal is the next consent phase — not active session.
      router.push("/consent-snapshot/mutual" as never);
    } catch {
      setError("Could not save your declaration on this device.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Eyebrow>CONSENT SNAPSHOT · PREPARE</Eyebrow>
      <Text style={styles.progress}>
        Step {stepIndex + 1} of {STEPS.length} — protective, not performative
      </Text>

      {step === "intro" ? (
        <>
          <Title>Before anyone is near you.</Title>
          <Body>
            A Consent Snapshot is a serious, moment-specific agreement. It pulls
            your current boundaries, names mood and capacity, records safewords
            and aftercare, and requires Soft Signal understanding — from{" "}
            <Text style={styles.em}>both</Text> people.
          </Body>
          <View style={styles.protective}>
            <Text style={styles.protectiveTitle}>Protective rules</Text>
            <Text style={styles.protectiveBody}>
              · A match or vibe is not consent{"\n"}
              · This declaration alone is not consent{"\n"}
              · Only mutual seal of the same package may proceed{"\n"}
              · Soft Signal ends everything immediately, no explanation{"\n"}
              · You may stop preparing at any time without penalty
            </Text>
          </View>
          <Button label="Begin my declaration" onPress={() => setStepIndex(1)} />
        </>
      ) : null}

      {step === "state" ? (
        <>
          <Title>Mood and capacity — right now</Title>
          <Body muted>
            Honest capacity protects everyone. Low capacity is allowed. Unsure
            is allowed. Soft Signal stays available either way.
          </Body>
          <Text style={styles.section}>Mood</Text>
          <View accessibilityRole="radiogroup" style={styles.choices}>
            {MOOD_OPTIONS.map((opt) => (
              <Choice
                key={opt.id}
                label={opt.label}
                detail={opt.detail}
                selected={decl.mood === opt.id}
                onPress={() =>
                  patch((d) => ({ ...d, mood: opt.id as MoodId }))
                }
              />
            ))}
          </View>
          <Text style={styles.section}>Energy</Text>
          <View accessibilityRole="radiogroup" style={styles.choices}>
            {ENERGY_OPTIONS.map((opt) => (
              <Choice
                key={opt.id}
                label={opt.label}
                selected={decl.energy === opt.id}
                onPress={() =>
                  patch((d) => ({ ...d, energy: opt.id as EnergyId }))
                }
              />
            ))}
          </View>
        </>
      ) : null}

      {step === "duration" ? (
        <>
          <Title>Time boundary for this moment</Title>
          <Body muted>
            Optional agreed max. Mutual seal will take the stricter (shorter)
            time if both people set one. Soft Signal still ends anytime sooner —
            a clock is never a cage.
          </Body>
          <View accessibilityRole="radiogroup" style={styles.choices}>
            {DURATION_CHOICES.map((opt) => (
              <Choice
                key={String(opt.minutes)}
                label={opt.label}
                detail={opt.detail}
                selected={decl.maxDurationMinutes === opt.minutes}
                onPress={() =>
                  // Personal max only; mutual core applies Math.min later.
                  patch((d) => ({ ...d, maxDurationMinutes: opt.minutes }))
                }
              />
            ))}
          </View>
        </>
      ) : null}

      {step === "boundaries" ? (
        <>
          <Title>Current boundaries in this snapshot</Title>
          <Body muted>
            Loaded from your Touch Language map when available. Unset areas stay
            off limits. Edit Touch Language anytime — then refresh by reopening
            prepare.
          </Body>
          <View style={styles.listCard}>
            {decl.boundaries.map((b) => (
              <Text key={String(b.zoneId)} style={styles.listLine}>
                · {b.label}:{" "}
                <Text style={styles.listStatus}>
                  {/* soft_limit / ask_first / welcomed / off_limits shown as plain words */}
                  {b.status.replaceAll("_", " ")}
                </Text>
              </Text>
            ))}
          </View>
          {decl.hardLimits.length > 0 ? (
            <>
              <Text style={styles.section}>Hard limits</Text>
              <Body muted>{decl.hardLimits.join(" · ")}</Body>
            </>
          ) : null}
          {decl.softLimits.length > 0 ? (
            <>
              <Text style={styles.section}>Soft limits</Text>
              <Body muted>{decl.softLimits.join(" · ")}</Body>
            </>
          ) : null}
          <Button
            variant="secondary"
            label="Edit full Touch Language"
            onPress={() => router.push("/touch-language/edit" as never)}
          />
          <Button
            variant="secondary"
            label="Reload from saved Touch Language"
            onPress={() => {
              // Explicit user action: re-map TL → declaration (private notes still not copied).
              void touchLanguageStore.load().then((tl) => {
                if (tl) setDecl(declarationFromTouchLanguage(tl, decl.displayLabel));
              });
            }}
          />
        </>
      ) : null}

      {step === "safewords" ? (
        <>
          <Title>Safewords for this session</Title>
          <Body muted>
            Speakable, unmistakable. Soft Signal is always a full stop even if
            you use different words.
          </Body>
          <Text style={styles.fieldLabel}>Stop (immediate full end)</Text>
          <TextInput
            value={decl.safewords.stop}
            onChangeText={(stop) =>
              // Cap length to match parseDeclaration slice(0, 40).
              patch((d) => ({
                ...d,
                safewords: { ...d.safewords, stop: stop.slice(0, 40) },
              }))
            }
            style={styles.input}
            placeholder="Soft Signal / Red / Stop"
            placeholderTextColor={colors.muted}
          />
          <Text style={styles.fieldLabel}>Slow (check in / reduce)</Text>
          <TextInput
            value={decl.safewords.slow}
            onChangeText={(slow) =>
              patch((d) => ({
                ...d,
                safewords: { ...d.safewords, slow: slow.slice(0, 40) },
              }))
            }
            style={styles.input}
            placeholder="Yellow / Slow / Pause"
            placeholderTextColor={colors.muted}
          />
          <Text style={styles.fieldLabel}>Optional OK / continue word</Text>
          <TextInput
            value={decl.safewords.ok ?? ""}
            onChangeText={(ok) =>
              // Empty trim → null optional ok; never required to stop.
              patch((d) => ({
                ...d,
                safewords: {
                  ...d.safewords,
                  ok: ok.trim() ? ok.slice(0, 40) : null,
                },
              }))
            }
            style={styles.input}
            placeholder="Green (optional)"
            placeholderTextColor={colors.muted}
          />
        </>
      ) : null}

      {step === "aftercare" ? (
        <>
          <Title>Aftercare preferences</Title>
          <Body muted>
            What helps after contact ends — including if Soft Signal was used.
            Select all that apply.
          </Body>
          <View style={styles.choices}>
            {AFTERCARE_OPTIONS.map((opt) => {
              const on = decl.aftercare.includes(opt.id);
              return (
                <Choice
                  key={opt.id}
                  label={opt.label}
                  selected={on}
                  onPress={() =>
                    // Multi-select: toggle id in/out; empty aftercare is allowed.
                    patch((d) => {
                      const aftercare = on
                        ? d.aftercare.filter((x) => x !== opt.id)
                        : [...d.aftercare, opt.id as AftercareId];
                      return { ...d, aftercare };
                    })
                  }
                />
              );
            })}
          </View>
          <Text style={styles.fieldLabel}>Optional aftercare note</Text>
          <TextInput
            value={decl.aftercareNote ?? ""}
            onChangeText={(aftercareNote) =>
              // Cap 400 to match parse; empty → null.
              patch((d) => ({
                ...d,
                aftercareNote: aftercareNote.slice(0, 400) || null,
              }))
            }
            style={styles.noteInput}
            multiline
            placeholder="Anything else that helps you land…"
            placeholderTextColor={colors.muted}
            maxLength={400}
          />
        </>
      ) : null}

      {step === "soft_signal" ? (
        <>
          <Title>Soft Signal — non-negotiable</Title>
          <View style={styles.protective}>
            <Text style={styles.protectiveTitle}>Immediate exit</Text>
            <Text style={styles.protectiveBody}>
              Soft Signal ends the session the moment it is used. No debate. No
              “one more minute.” No social cost. It is success to stop safely —
              never failure.
            </Text>
          </View>
          {/* Three independent intentional toggles — save gated on all true. */}
          <ConsentAffirmRow
            pointId="snapshot_soft_signal_ack"
            label="I understand Soft Signal stops everything immediately"
            detail="The moment it is used. No debate. No one more minute."
            checked={ssChecks.stop}
            onChange={(stop) => setSsChecks((c) => ({ ...c, stop }))}
          />
          <ConsentAffirmRow
            pointId="snapshot_soft_signal_ack"
            label="No explanation is required from either person"
            detail="A complete stop needs no story."
            checked={ssChecks.noExplain}
            onChange={(noExplain) => setSsChecks((c) => ({ ...c, noExplain }))}
          />
          <ConsentAffirmRow
            pointId="snapshot_soft_signal_ack"
            label="Soft Signal is equally available to both of us"
            detail="Either person. Anytime. Same authority."
            checked={ssChecks.mutual}
            onChange={(mutual) => setSsChecks((c) => ({ ...c, mutual }))}
          />
        </>
      ) : null}

      {step === "save" ? (
        <>
          <Title>Save your declaration</Title>
          <Body>
            This stores <Text style={styles.em}>your</Text> side only on this
            device. Mutual seal happens next — both people must affirm the same
            package.
          </Body>
          <View style={styles.listCard}>
            <Text style={styles.listLine}>
              Mood · {MOOD_OPTIONS.find((m) => m.id === decl.mood)?.label}
            </Text>
            <Text style={styles.listLine}>
              Energy · {ENERGY_OPTIONS.find((e) => e.id === decl.energy)?.label}
            </Text>
            <Text style={styles.listLine}>
              Stop word · “{decl.safewords.stop}”
            </Text>
            <Text style={styles.listLine}>
              Slow word · “{decl.safewords.slow}”
            </Text>
            <Text style={styles.listLine}>
              Aftercare · {decl.aftercare.length} selected
            </Text>
          </View>
          <Button
            label={busy ? "Saving…" : "Save and open mutual seal"}
            disabled={busy}
            onPress={() => void saveAndContinue()}
          />
        </>
      ) : null}

      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}

      {/* Mid-flow nav: back/continue; intro uses Begin; save has its own primary + back. */}
      {step !== "intro" && step !== "save" ? (
        <View style={styles.nav}>
          <Button
            variant="secondary"
            label="Back"
            onPress={() => setStepIndex((i) => Math.max(0, i - 1))}
          />
          <Button
            label="Continue"
            onPress={() =>
              setStepIndex((i) => Math.min(STEPS.length - 1, i + 1))
            }
          />
        </View>
      ) : null}
      {step === "intro" ? null : step === "save" ? (
        <Button
          variant="secondary"
          label="Back"
          onPress={() => setStepIndex((i) => i - 1)}
        />
      ) : null}
    </Screen>
  );
}

/**
 * WHAT: Theme-bound styles for prepare screen layout and protective chrome.
 * WHY: useThemedStyles requires a pure factory from AppColors.
 * CONSENT: Not a consent surface — presentation only.
 * EDGE CASES: none — pure style map.
 * NEVER: Do not encode consent state only in color (copy remains primary).
 * NOTE: `radius` import retained for theme parity with sibling screens; unused here is pre-existing.
 */
function makeStyles(colors: AppColors) {
  return {
    progress: {
      color: colors.signal,
      fontSize: 12,
      fontWeight: "700" as const,
      letterSpacing: 0.3,
      marginBottom: 6,
    },
    em: { fontWeight: "800" as const, color: colors.ink },
    section: {
      fontFamily: fonts.headline,
      fontSize: 22,
      color: colors.ink,
      marginTop: 14,
      marginBottom: 8,
    },
    choices: { gap: 9 },
    protective: {
      backgroundColor: colors.signalSoft,
      borderRadius: 16,
      padding: 16,
      gap: 6,
      marginVertical: 10,
      borderWidth: 1,
      borderColor: colors.signal,
    },
    protectiveTitle: {
      color: colors.signal,
      fontWeight: "800" as const,
      fontSize: 15,
      letterSpacing: 0.4,
      textTransform: "uppercase" as const,
    },
    protectiveBody: { color: colors.ink, lineHeight: 22, fontSize: 15 },
    listCard: {
      backgroundColor: colors.paper,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.line,
      padding: 14,
      gap: 4,
    },
    listLine: { color: colors.ink, fontSize: 14, lineHeight: 21 },
    listStatus: { fontWeight: "700" as const, color: colors.muted },
    fieldLabel: {
      color: colors.moss,
      fontSize: 12,
      fontWeight: "700" as const,
      marginTop: 12,
      marginBottom: 4,
      textTransform: "uppercase" as const,
    },
    input: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.paper,
      padding: 12,
      color: colors.ink,
      fontSize: 16,
    },
    noteInput: {
      minHeight: 90,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.paper,
      padding: 12,
      color: colors.ink,
      fontSize: 16,
      textAlignVertical: "top" as const,
      marginTop: 8,
    },
    checkRow: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.line,
      padding: 14,
      marginTop: 10,
      backgroundColor: colors.paper,
    },
    checkOn: {
      borderColor: colors.signal,
      backgroundColor: colors.signalSoft,
    },
    checkText: { color: colors.ink, fontSize: 15, lineHeight: 22 },
    nav: { marginTop: 16, gap: 10 },
    error: { color: colors.signal, marginTop: 10 },
  };
}
