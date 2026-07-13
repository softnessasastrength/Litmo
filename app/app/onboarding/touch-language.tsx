import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import {
  Body,
  Button,
  Choice,
  Eyebrow,
  Screen,
  Title,
} from "../../components/ui";
import {
  DURATION_OPTIONS,
  ENVIRONMENT_OPTIONS,
  PRESSURE_OPTIONS,
  SPEED_OPTIONS,
} from "../../data/touchLanguageCatalog";
import { usePrototype } from "../../context/PrototypeContext";
import { fonts, type AppColors } from "../../theme";
import { useAuth } from "../../context/AuthContext";
import { profileRepository } from "../../services/profileRepository";
import { archetypes } from "../../data/quiz";
import { useThemedStyles } from "../../hooks/useThemedStyles";
import {
  createDefaultTouchLanguage,
  migrateFromLegacyDemo,
  type TouchLanguageDocument,
} from "../../lib/touchLanguageCore";
import { touchLanguageStore } from "../../services/touchLanguageStore";

/**
 * WHAT: Quick Touch Language onboarding (`/onboarding/touch-language`) — four
 *   preference groups then save into local TL store (+ real completeProfile when user).
 * WHY: Essentials before body-zone map; full visual editor is a detour under /touch-language.
 * CONSENT: `onboard_touch_language_save` (prepare). Preferences are future snapshot
 *   *inputs* only. Forced document flags: notConsentToTouch, shareIsReviewOnly.
 * EDGE CASES:
 *   - Incomplete groups → Save disabled.
 *   - Demo (no user) → local store + PrototypeContext only; then boundaries.
 *   - Real user → completeProfile may set onboardingCompletedAt before zones polished
 *     (documented tension); still must do age gate if not adult.
 *   - soft_limit zones map to ask_first for server bodyZones; empty zones bootstrap hands ask_first.
 *   - Save error → stay, show message, busy cleared.
 * NEVER: Profile as consent; partner may touch now; skip Soft Signal in later sessions.
 * SEE: docs/ONBOARDING_CONSENT_FLOW.md §8 · CONSENT_POINTS.onboard_touch_language_save
 *   · docs/TOUCH_LANGUAGE.md · touchLanguageCore
 */
export default function TouchLanguageScreen() {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { touchChoices, setTouchChoice, bodyBoundaries, hardStops, boundaryNote } =
    usePrototype();
  const { user, refreshProfile } = useAuth();
  const { archetypeId } = usePrototype();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // Default doc is fail-closed empty structure; load may overlay device store.
  const [doc, setDoc] = useState<TouchLanguageDocument>(
    createDefaultTouchLanguage(),
  );

  useEffect(() => {
    // Hydrate prior device-local TL if any — never invent welcomed zones from silence.
    void touchLanguageStore.load().then((stored) => {
      if (stored) setDoc(stored);
    });
  }, []);

  // Four required groups; selection stored as label string in touchChoices (ids resolved on save).
  const groups = [
    {
      key: "pressure" as const,
      title: "What kind of pressure tends to feel kind?",
      options: PRESSURE_OPTIONS.map((o) => ({
        id: o.id,
        label: o.label,
        detail: o.detail,
      })),
    },
    {
      key: "speed" as const,
      title: "What speed feels kindest?",
      options: SPEED_OPTIONS.map((o) => ({
        id: o.id,
        label: o.label,
        detail: o.detail,
      })),
    },
    {
      key: "duration" as const,
      title: "How long sounds comfortable?",
      options: DURATION_OPTIONS.map((o) => ({
        id: o.id,
        label: o.label,
        detail: o.detail,
      })),
    },
    {
      key: "environment" as const,
      title: "Where might your system settle easiest?",
      options: ENVIRONMENT_OPTIONS.map((o) => ({
        id: o.id,
        label: o.label,
        detail: o.detail,
      })),
    },
  ];

  // All four must be chosen — partial profile is not a completable prepare save.
  const complete = groups.every((group) => touchChoices[group.key]);

  /**
   * WHAT: Builds a TouchLanguageDocument from prototype + catalog ids + forced safety flags.
   * WHY: Migrate legacy label strings to structured ids; merge with any loaded doc fields.
   * CONSENT: Always sets notConsentToTouch + shareIsReviewOnly true — map ≠ grant.
   * EDGE CASES:
   *   - Label or id match either way (UI may store either after editor detour).
   *   - Missing env → fall back to base.environments from migrate.
   * NEVER: Drop notConsentToTouch; treat document as session dual-seal.
   * SEE: migrateFromLegacyDemo · createDefaultTouchLanguage
   */
  const buildDocument = (): TouchLanguageDocument => {
    const base = migrateFromLegacyDemo({
      touchChoices,
      bodyBoundaries: bodyBoundaries as Partial<Record<string, string>>,
      hardStops: hardStops as string[],
      boundaryNote,
    });
    // Prefer structured ids when present in touchChoices (label → id → base fallback).
    const pressure =
      PRESSURE_OPTIONS.find((o) => o.label === touchChoices.pressure)?.id ??
      PRESSURE_OPTIONS.find((o) => o.id === touchChoices.pressure)?.id ??
      base.pressure;
    const speed =
      SPEED_OPTIONS.find((o) => o.label === touchChoices.speed)?.id ??
      SPEED_OPTIONS.find((o) => o.id === touchChoices.speed)?.id ??
      base.speed;
    const duration =
      DURATION_OPTIONS.find((o) => o.label === touchChoices.duration)?.id ??
      DURATION_OPTIONS.find((o) => o.id === touchChoices.duration)?.id ??
      base.duration;
    const env =
      ENVIRONMENT_OPTIONS.find((o) => o.label === touchChoices.environment)
        ?.id ??
      ENVIRONMENT_OPTIONS.find((o) => o.id === touchChoices.environment)?.id;
    return {
      ...base,
      ...doc,
      pressure,
      speed,
      duration,
      environments: env ? [env] : base.environments,
      updatedAt: new Date().toISOString(),
      // Constitutional flags — never strip on save paths.
      notConsentToTouch: true,
      shareIsReviewOnly: true,
      version: 1,
    };
  };

  /**
   * WHAT: Persists TL locally; real users also completeProfile then refresh; navigates to boundaries.
   * WHY: Device-local store for demo and offline resilience; server profile for real durability.
   * CONSENT: `onboard_touch_language_save` — prepare only. Authorizes preference storage + next
   *   onboarding step, not touch, not sealed snapshot, not partner access.
   * EDGE CASES:
   *   - !user → save local + push boundaries; no completeProfile.
   *   - Empty zones → bootstrap hands ask_first (fail-closed default, not welcomed).
   *   - Empty hardLimits → default “All unlisted body areas are off limits”.
   *   - soft_limit → ask_first; unknown status → ask_first (never invent welcomed).
   *   - Error → message, stay, busy false.
   * NEVER: Upload private notes as public bio; claim session ready; skip age gate for real.
   * SEE: docs/ONBOARDING_CONSENT_FLOW.md §8.3–8.5 · profileRepository.completeProfile
   */
  const save = async () => {
    setBusy(true);
    setError("");
    try {
      const next = buildDocument();
      await touchLanguageStore.save(next);
      setDoc(next);

      // Demo path: no account — local only.
      if (!user) {
        router.push("/onboarding/boundaries");
        return;
      }

      // Real path: completeProfile may mark onboarding complete before zone map UI is finished.
      // Age eligibility still separate (age_gate). Touch still needs session snapshot later.
      await profileRepository.completeProfile(
        user.id,
        { ...(await profileRepository.getOwnProfile(user.id)), vibeArchetype: archetypes[archetypeId].name },
        {
          pressure: next.pressure,
          duration: next.duration,
          environments: next.environments,
          holdTypes: next.holdTypes.length ? next.holdTypes : ["side_by_side"],
          privateNervousSystemNotes: next.privateNotes,
        },
        {
          bodyZones: (() => {
            const zones = Object.entries(next.zones).map(([zone, pref]) => ({
              zone,
              status:
                pref!.status === "soft_limit"
                  ? ("ask_first" as const)
                  : pref!.status === "off_limits"
                    ? ("off_limits" as const)
                    : pref!.status === "welcomed"
                      ? ("welcomed" as const)
                      : // Unknown / missing status → ask_first (fail-closed vs welcomed).
                        ("ask_first" as const),
              pressure:
                pref!.status === "off_limits"
                  ? null
                  : (pref!.pressure ?? next.pressure),
            }));
            // Empty map: one conservative default zone — never empty welcomed list as “open body”.
            if (zones.length === 0) {
              return [
                {
                  zone: "hands",
                  status: "ask_first" as const,
                  pressure: next.pressure,
                },
              ];
            }
            return zones;
          })(),
          hardStops:
            next.hardLimits.length > 0
              ? next.hardLimits
              : ["All unlisted body areas are off limits"],
          privateNervousSystemNotes: next.privateNotes,
        },
      );
      await refreshProfile();
      router.push("/onboarding/boundaries");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Your Touch Language could not be saved.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Eyebrow>TOUCH LANGUAGE</Eyebrow>
      <Title>Preferences are a starting point.</Title>
      <Body muted>
        Choose what tends to feel welcoming. You will set body areas and hard
        limits next. A full visual editor is always available after onboarding.
      </Body>
      {groups.map((group) => (
        <View key={group.key} style={styles.group}>
          <Text style={styles.question} accessibilityRole="header">
            {group.title}
          </Text>
          <View accessibilityRole="radiogroup" style={styles.choices}>
            {group.options.map((choice) => (
              <Choice
                key={choice.id}
                label={choice.label}
                detail={choice.detail}
                // Accept label or id so editor detour re-entry still shows selected.
                selected={
                  touchChoices[group.key] === choice.label ||
                  touchChoices[group.key] === choice.id
                }
                // Store label for demo PrototypeContext; buildDocument maps to ids.
                onPress={() => setTouchChoice(group.key, choice.label)}
              />
            ))}
          </View>
        </View>
      ))}
      {/* Non-dismissible safety block — profile ≠ consent (ONBOARDING_CONSENT_FLOW §8.2). */}
      <View style={styles.safety}>
        <Text style={styles.safetyTitle}>Your profile is not consent.</Text>
        <Text style={styles.safetyBody}>
          It helps begin a conversation. Every session still requires a new,
          explicit agreement. Soft Signal ends anything immediately.
        </Text>
      </View>
      {/* onboard_touch_language_save — disabled until all four groups complete and not mid-save. */}
      <Button
        label={busy ? "Saving privately…" : "Save and set body areas"}
        disabled={!complete || busy}
        onPress={() => void save()}
      />
      {/* Detour: full editor — may diverge from quick path; not a consent seal. */}
      <Button
        variant="secondary"
        label="Open full Touch Language editor"
        onPress={() => router.push("/touch-language/edit" as never)}
      />
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </Screen>
  );
}

/**
 * WHAT: Theme styles for TL groups, safety callout, and save error text.
 * WHY: Safety block uses soft plum surface — calm, not alarm-as-punishment.
 * CONSENT: Not a consent surface (copy inside is the non-claim).
 * EDGE CASES: none — pure style factory.
 * NEVER: Hide the safety callout behind dismiss for this screen.
 * SEE: docs/ONBOARDING_CONSENT_FLOW.md §8.2
 */
function makeStyles(colors: AppColors) {
  return {
    group: { gap: 12, marginTop: 12 },
    question: {
      color: colors.ink,
      fontFamily: fonts.headline,
      fontSize: 25,
      lineHeight: 31,
    },
    choices: { gap: 9 },
    safety: {
      backgroundColor: colors.plumSoft,
      borderRadius: 18,
      padding: 18,
      gap: 5,
    },
    safetyTitle: { color: colors.ink, fontSize: 16, fontWeight: "800" as const },
    safetyBody: { color: colors.muted, lineHeight: 21 },
    error: { color: colors.signal, lineHeight: 21 },
  };
}
