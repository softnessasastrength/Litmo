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
 * Onboarding entry into Touch Language.
 * Quick essentials here; full visual system lives under /touch-language.
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
  const [doc, setDoc] = useState<TouchLanguageDocument>(
    createDefaultTouchLanguage(),
  );

  useEffect(() => {
    void touchLanguageStore.load().then((stored) => {
      if (stored) setDoc(stored);
    });
  }, []);

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

  const complete = groups.every((group) => touchChoices[group.key]);

  const buildDocument = (): TouchLanguageDocument => {
    const base = migrateFromLegacyDemo({
      touchChoices,
      bodyBoundaries: bodyBoundaries as Partial<Record<string, string>>,
      hardStops: hardStops as string[],
      boundaryNote,
    });
    // Prefer structured ids when present in touchChoices
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
      notConsentToTouch: true,
      shareIsReviewOnly: true,
      version: 1,
    };
  };

  const save = async () => {
    setBusy(true);
    setError("");
    try {
      const next = buildDocument();
      await touchLanguageStore.save(next);
      setDoc(next);

      if (!user) {
        router.push("/onboarding/boundaries");
        return;
      }

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
                      : ("ask_first" as const),
              pressure:
                pref!.status === "off_limits"
                  ? null
                  : (pref!.pressure ?? next.pressure),
            }));
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
                selected={
                  touchChoices[group.key] === choice.label ||
                  touchChoices[group.key] === choice.id
                }
                onPress={() => setTouchChoice(group.key, choice.label)}
              />
            ))}
          </View>
        </View>
      ))}
      <View style={styles.safety}>
        <Text style={styles.safetyTitle}>Your profile is not consent.</Text>
        <Text style={styles.safetyBody}>
          It helps begin a conversation. Every session still requires a new,
          explicit agreement. Soft Signal ends anything immediately.
        </Text>
      </View>
      <Button
        label={busy ? "Saving privately…" : "Save and set body areas"}
        disabled={!complete || busy}
        onPress={() => void save()}
      />
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
