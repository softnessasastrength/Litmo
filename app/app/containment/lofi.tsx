/**
 * Containment Lo-Fi index — protocol moods + external streams.
 * No bundled audio (licensing). Mute is always free = Soft Signal of sound.
 */
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import {
  Body,
  Button,
  Card,
  Eyebrow,
  Screen,
  Title,
} from "../../components/ui";
import { type AppColors } from "../../theme";
import { useThemedStyles } from "../../hooks/useThemedStyles";
import { useColors } from "../../context/ThemeContext";

type LofiRow = {
  protocol: string;
  track: string;
  vibe: string;
  openLabel: string;
  url: string;
};

const ROWS: readonly LofiRow[] = [
  {
    protocol: "Hub / Option A",
    track: "Option A (Keep Building)",
    vibe: "Lobby jazz-hop · rainy window · open laptop",
    openLabel: "Open Chillhop Radio",
    url: "https://chillhop.com/radio/",
  },
  {
    protocol: "Spooning Protocol",
    track: "Safety Spoon in D♭",
    vibe: "Velvet vinyl · blanket prison · held-together",
    openLabel: "Open Chillhop",
    url: "https://chillhop.com/",
  },
  {
    protocol: "Morning Cuddle",
    track: "Gremlin Needs 8 Minutes",
    vibe: "Half-awake · coffee not ready · Exit Protocol ok",
    openLabel: "Open Chillhop Radio",
    url: "https://chillhop.com/radio/",
  },
  {
    protocol: "Attachment Repair Cathedral",
    track: "Care-Seeker Is Strength",
    vibe: "Soft reverb church · mommy issues · soft land",
    openLabel: "Open Chillhop",
    url: "https://chillhop.com/",
  },
  {
    protocol: "Emotional Masochist Circuit",
    track: "Edge Is Capped",
    vibe: "Low drone → gentle · no growth-porn bangers",
    openLabel: "Open Chillhop Radio",
    url: "https://chillhop.com/radio/",
  },
  {
    protocol: "Conflict Navigation Sim",
    track: "Court Summons (Lo-Fi Edit)",
    vibe: "Steady pulse · practice room not courtroom",
    openLabel: "Open Chillhop Radio",
    url: "https://chillhop.com/radio/",
  },
  {
    protocol: "Soft Signal / aftercare",
    track: "No TED Talk Required",
    vibe: "Near silence · rain · you are free",
    openLabel: "Pixabay lo-fi (free library)",
    url: "https://pixabay.com/music/search/lofi/",
  },
] as const;

export default function ContainmentLofiScreen() {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  const router = useRouter();

  const open = (url: string) => {
    void Linking.openURL(url);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Eyebrow>CONTAINMENT LO-FI</Eyebrow>
        <Title>Soundtrack for the cathedral.</Title>
        <Card>
          <Text style={styles.banner}>
            This is currently a personal emotional containment system, not a
            public product.
          </Text>
          <Body muted>
            Protocol-matched lo-fi vibes. Streams open in browser — nothing
            copyrighted is bundled in the repo. Mute anytime (Soft Signal of
            sound).
          </Body>
          <Body muted>
            Fake track titles are comedy canon. Real audio lives at Chillhop /
            free libraries. Full map: docs/CONTAINMENT_LOFI.md
          </Body>
        </Card>

        {ROWS.map((row) => (
          <Pressable
            key={row.protocol}
            accessibilityRole="button"
            accessibilityLabel={`${row.protocol}. ${row.track}. ${row.openLabel}`}
            onPress={() => open(row.url)}
            style={({ pressed }) => [
              styles.card,
              pressed && { opacity: 0.88 },
            ]}
          >
            <Text style={[styles.tag, { color: colors.moss }]}>
              {row.protocol.toUpperCase()}
            </Text>
            <Text style={styles.track}>{row.track}</Text>
            <Body muted>{row.vibe}</Body>
            <Text style={[styles.link, { color: colors.moss }]}>
              {row.openLabel} →
            </Text>
          </Pressable>
        ))}

        <Card>
          <Body muted>
            Later: local CC files + expo-av ambient player. For now: stream
            external, keep Soft Signal freer than your playlist algorithm.
          </Body>
        </Card>

        <Button
          variant="secondary"
          label="Back to Containment Hub"
          onPress={() => router.back()}
        />
      </ScrollView>
    </Screen>
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
    card: {
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 18,
      padding: 16,
      gap: 6,
      backgroundColor: colors.cream,
    },
    tag: {
      fontSize: 11,
      fontWeight: "800" as const,
      letterSpacing: 1.1,
    },
    track: {
      color: colors.ink,
      fontWeight: "800" as const,
      fontSize: 17,
    },
    link: {
      fontWeight: "700" as const,
      fontSize: 14,
      marginTop: 4,
    },
  };
}
