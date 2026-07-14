/**
 * Containment Lo-Fi player — expo-av ambient, CC BY Kevin MacLeod streams.
 * Soft Signal of sound = stop/mute free. Not a product feature.
 */
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  Switch,
  Text,
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
import {
  LOFI_TRACKS,
  type LofiTrack,
} from "../../lib/lofiCatalog";
import {
  lofiAmbientPlayer,
  type LofiPlayerStatus,
} from "../../services/lofiAmbientPlayer";
import { type AppColors } from "../../theme";
import { useThemedStyles } from "../../hooks/useThemedStyles";
import { useColors } from "../../context/ThemeContext";

export default function ContainmentLofiScreen() {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  const router = useRouter();
  const [status, setStatus] = useState<LofiPlayerStatus>(
    lofiAmbientPlayer.getStatus(),
  );

  useEffect(() => {
    void lofiAmbientPlayer.hydratePrefs();
    return lofiAmbientPlayer.subscribe(setStatus);
  }, []);

  const track = status.track ?? LOFI_TRACKS[0]!;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Eyebrow>CONTAINMENT LO-FI · LIVE</Eyebrow>
        <Title>Ambient for the cathedral.</Title>
        <Card>
          <Text style={styles.banner}>
            This is currently a personal emotional containment system, not a
            public product.
          </Text>
          <Body muted>
            In-app playback via expo-av. Streams CC BY 4.0 Kevin MacLeod
            (incompetech.com). Comedy titles are ours; credit the real artists.
            Stop/mute anytime — Soft Signal of sound.
          </Body>
        </Card>

        <Card>
          <Text style={[styles.tag, { color: colors.moss }]}>
            {track.protocolLabel.toUpperCase()}
          </Text>
          <Text style={styles.nowPlaying}>{track.canonTitle}</Text>
          <Body muted>{track.vibe}</Body>
          <Body muted>
            Real: {track.sourceTitle} — {track.artist} ({track.license})
          </Body>
          {status.isLoading ? (
            <ActivityIndicator
              color={colors.moss}
              style={{ marginVertical: 12 }}
            />
          ) : null}
          {status.error ? (
            <Text style={styles.error}>{status.error}</Text>
          ) : null}

          <View style={styles.controls}>
            <Button
              variant="secondary"
              label="Prev"
              onPress={() => void lofiAmbientPlayer.prev()}
            />
            <Button
              label={status.isPlaying ? "Pause" : "Play"}
              onPress={() => void lofiAmbientPlayer.togglePlay()}
              disabled={status.isLoading}
            />
            <Button
              variant="secondary"
              label="Next"
              onPress={() => void lofiAmbientPlayer.next()}
            />
          </View>

          <Button
            variant="signal"
            label="Stop (Soft Signal of sound)"
            onPress={() => void lofiAmbientPlayer.stop()}
          />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Body>Mute</Body>
            </View>
            <Switch
              accessibilityLabel="Mute ambient"
              value={status.isMuted}
              onValueChange={(v) => void lofiAmbientPlayer.setMuted(v)}
              trackColor={{ false: colors.line, true: colors.mossSoft }}
              thumbColor={status.isMuted ? colors.moss : colors.white}
            />
          </View>

          <Text style={styles.section}>Volume</Text>
          <View style={styles.chipRow}>
            {[0.15, 0.35, 0.55, 0.75, 1].map((v) => (
              <Pressable
                key={v}
                accessibilityRole="button"
                accessibilityState={{ selected: status.volume === v }}
                onPress={() => void lofiAmbientPlayer.setVolume(v)}
                style={[
                  styles.chip,
                  status.volume === v && {
                    backgroundColor: colors.mossSoft,
                    borderColor: colors.moss,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    status.volume === v && {
                      color: colors.moss,
                      fontWeight: "700",
                    },
                  ]}
                >
                  {Math.round(v * 100)}%
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>

        <Text style={styles.section}>Protocol playlist</Text>
        {LOFI_TRACKS.map((t) => (
          <TrackRow
            key={t.id}
            track={t}
            selected={status.trackId === t.id}
            playing={status.trackId === t.id && status.isPlaying}
            colors={colors}
            styles={styles}
            onPress={() => void lofiAmbientPlayer.playTrack(t.id)}
          />
        ))}

        <Card>
          <Text style={styles.section}>Attribution (required)</Text>
          <Body muted>
            Music by Kevin MacLeod (incompetech.com), licensed under Creative
            Commons: By Attribution 4.0 License
            (https://creativecommons.org/licenses/by/4.0/).
          </Body>
          <Button
            variant="secondary"
            label="incompetech.com"
            onPress={() => void Linking.openURL("https://incompetech.com/")}
          />
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

function TrackRow({
  track,
  selected,
  playing,
  onPress,
  styles,
  colors,
}: {
  track: LofiTrack;
  selected: boolean;
  playing: boolean;
  onPress: () => void;
  styles: ReturnType<typeof makeStyles>;
  colors: AppColors;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Play ${track.canonTitle}`}
      onPress={onPress}
      style={[
        styles.card,
        selected && { borderColor: colors.moss, backgroundColor: colors.mossSoft },
      ]}
    >
      <Text style={[styles.tag, { color: colors.moss }]}>
        {track.protocolLabel.toUpperCase()}
        {playing ? " · PLAYING" : ""}
      </Text>
      <Text style={styles.trackTitle}>{track.canonTitle}</Text>
      <Body muted>{track.vibe}</Body>
      <Body muted>
        {track.sourceTitle} — {track.artist}
      </Body>
    </Pressable>
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
    tag: {
      fontSize: 11,
      fontWeight: "800" as const,
      letterSpacing: 1.1,
    },
    nowPlaying: {
      color: colors.ink,
      fontWeight: "800" as const,
      fontSize: 22,
      marginTop: 4,
    },
    trackTitle: {
      color: colors.ink,
      fontWeight: "800" as const,
      fontSize: 17,
    },
    section: {
      color: colors.ink,
      fontWeight: "800" as const,
      fontSize: 16,
      marginTop: 8,
      marginBottom: 4,
    },
    controls: {
      flexDirection: "row" as const,
      gap: 8,
      marginTop: 12,
      flexWrap: "wrap" as const,
    },
    row: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 12,
      marginTop: 12,
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
    card: {
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 18,
      padding: 16,
      gap: 6,
      backgroundColor: colors.cream,
    },
    error: {
      color: colors.signal,
      fontWeight: "700" as const,
      marginTop: 8,
    },
  };
}
