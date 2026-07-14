import { useCallback, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import {
  Body,
  Button,
  Eyebrow,
  Pill,
  Screen,
  Title,
} from "../../components/ui";
import { mockProfiles } from "../../data/mock";
import { usePrototype } from "../../context/PrototypeContext";
import { useAuth } from "../../context/AuthContext";
import {
  cosmeticForUserId,
  discoveryService,
  type DiscoveryProfile,
} from "../../services/discoveryService";
import {
  EmptyState,
  FailureState,
  LoadingState,
} from "../../components/AsyncState";
import { fonts, radius, type AppColors } from "../../theme";
import { useThemedStyles } from "../../hooks/useThemedStyles";
import { runtimeConfig } from "../../config/runtime";
import { FeatureUnavailable } from "../../components/FeatureUnavailable";

export default function DiscoverScreen() {
  // v1 App Store Safe scope: solo self-understanding only. Discover needs a
  // real second paired account. SEE: docs/BUILD_MODES.md.
  if (!runtimeConfig.features.partnerPairingFeatures) {
    return (
      <FeatureUnavailable
        eyebrow="PEOPLE"
        title="Discovering other people is not available in this build."
        body="This build focuses on your own self-understanding — Touch Language, Nervous System Weather, Soft Signal practice, and Guided Learning. Partner discovery and matching remain in Maximum Mode builds (macOS / Linux / internal)."
      />
    );
  }
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { selectProfile } = usePrototype();
  const { user, status } = useAuth();
  const isDemo = status === "demo";
  const isAuthed = status === "authenticated";

  const [state, setState] = useState<
    | { kind: "idle" }
    | { kind: "loading" }
    | { kind: "error"; message: string }
    | { kind: "ready"; rows: DiscoveryProfile[] }
  >({ kind: isAuthed ? "loading" : "idle" });

  const load = useCallback(async () => {
    if (!isAuthed) return;
    setState({ kind: "loading" });
    try {
      const rows = await discoveryService.listProfiles();
      setState({ kind: "ready", rows });
    } catch (caught) {
      setState({
        kind: "error",
        message:
          caught instanceof Error
            ? caught.message
            : "People could not be loaded right now.",
      });
    }
  }, [isAuthed]);

  useEffect(() => {
    if (isAuthed) void load();
  }, [isAuthed, load]);

  return (
    <Screen>
      <Eyebrow>
        {isDemo
          ? "DEMO · IMAGINARY NEIGHBORS"
          : isAuthed
            ? "PEOPLE NEAR YOUR PRACTICE"
            : "IMAGINARY NEIGHBORS"}
      </Eyebrow>
      <Title>Who feels easy to be curious about?</Title>
      <Body muted>
        {isAuthed
          ? "These are real accounts who completed onboarding and adult confirmation. Vibe is not consent. Account age and completed sessions are separate facts — never a safety score."
          : "These synthetic profiles show vibe possibilities only. Vibe is not consent, and no safety guarantee is implied."}
      </Body>
      {user ? (
        <Button
          variant="secondary"
          label="Edit my general profile"
          onPress={() => router.push("/profile/edit")}
        />
      ) : (
        <Body muted>
          Demo mode has no account to edit. Sign in to edit a general profile
          and see real discovery.
        </Body>
      )}

      {isAuthed && state.kind === "loading" ? (
        <LoadingState label="Loading people…" />
      ) : null}
      {isAuthed && state.kind === "error" ? (
        <FailureState
          title="Discovery unavailable"
          message={state.message}
          onRetry={() => void load()}
        />
      ) : null}
      {isAuthed && state.kind === "ready" && state.rows.length === 0 ? (
        <EmptyState
          title="No one to show yet"
          message="Others appear when they finish onboarding, confirm adult status, and are not blocked or restricted — including you."
        />
      ) : null}

      <View style={styles.list}>
        {isAuthed && state.kind === "ready"
          ? state.rows.map((profile) => {
              const cosmetic = cosmeticForUserId(profile.userId);
              return (
                <Pressable
                  key={profile.userId}
                  accessibilityRole="button"
                  accessibilityLabel={`View ${profile.displayName}'s profile`}
                  onPress={() => {
                    router.push(`/match/${profile.userId}`);
                  }}
                  style={({ pressed }) => [
                    styles.card,
                    pressed && styles.pressed,
                  ]}
                >
                  <View
                    style={[styles.avatar, { backgroundColor: cosmetic.color }]}
                  >
                    <Text style={styles.glyph}>{cosmetic.glyph}</Text>
                  </View>
                  <View style={styles.main}>
                    <View style={styles.nameRow}>
                      <Text style={styles.name}>{profile.displayName}</Text>
                      <Text style={styles.arrow}>›</Text>
                    </View>
                    <Text style={styles.pronouns}>
                      {profile.pronouns ?? "pronouns not listed"}
                    </Text>
                    {profile.vibeArchetype ? (
                      <Pill>{profile.vibeArchetype}</Pill>
                    ) : null}
                    <Text style={styles.vibe}>
                      {profile.bio?.trim() || "No bio yet."}
                    </Text>
                    <Text style={styles.signals}>
                      Account age {profile.accountAgeDays}d ·{" "}
                      {profile.completedSessions} completed session
                      {profile.completedSessions === 1 ? "" : "s"}
                    </Text>
                    <Text style={styles.signalsNote}>
                      Facts only — not a safety score.
                    </Text>
                  </View>
                </Pressable>
              );
            })
          : null}

        {!isAuthed
          ? mockProfiles.map((profile) => (
              <Pressable
                key={profile.id}
                accessibilityRole="button"
                accessibilityLabel={`View ${profile.name}'s mock profile`}
                onPress={() => {
                  selectProfile(profile.id);
                  router.push(`/match/${profile.id}`);
                }}
                style={({ pressed }) => [
                  styles.card,
                  pressed && styles.pressed,
                ]}
              >
                <View
                  style={[styles.avatar, { backgroundColor: profile.color }]}
                >
                  <Text style={styles.glyph}>{profile.glyph}</Text>
                </View>
                <View style={styles.main}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name}>
                      {profile.name}, {profile.age}
                    </Text>
                    <Text style={styles.arrow}>›</Text>
                  </View>
                  <Text style={styles.pronouns}>
                    {profile.pronouns} · {profile.distance}
                  </Text>
                  <Pill>{profile.archetype}</Pill>
                  <Text style={styles.vibe}>{profile.vibe}</Text>
                </View>
              </Pressable>
            ))
          : null}
      </View>
      {isAuthed && state.kind === "ready" ? (
        <Button
          variant="secondary"
          label="Refresh people"
          onPress={() => void load()}
        />
      ) : null}
    </Screen>
  );
}
function makeStyles(colors: AppColors, shadow: Record<string, unknown> = {}) {
  return {
    list: { gap: 14 },
    card: {
      flexDirection: "row",
      gap: 15,
      backgroundColor: colors.paper,
      borderRadius: radius.md,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.line,
      ...shadow,
    },
    pressed: { opacity: 0.75 },
    avatar: {
      width: 70,
      height: 82,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
    },
    glyph: { color: colors.plum, fontFamily: "Georgia", fontSize: 34 },
    main: { flex: 1, gap: 7 },
    nameRow: { flexDirection: "row", justifyContent: "space-between" },
    name: { color: colors.ink, fontFamily: fonts.headline, fontSize: 23 },
    arrow: { color: colors.moss, fontSize: 26 },
    pronouns: { color: colors.muted, fontSize: 12 },
    vibe: { color: colors.ink, fontSize: 13, lineHeight: 19 },
    signals: {
      color: colors.moss,
      fontSize: 12,
      fontWeight: "700",
      marginTop: 2,
    },
    signalsNote: { color: colors.muted, fontSize: 11, lineHeight: 15 },
  };
}
