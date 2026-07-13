import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Switch, Text, View } from "react-native";
import {
  Body,
  Button,
  Card,
  Eyebrow,
  Screen,
  Title,
} from "../../components/ui";
import {
  defaultTraumaSafetyPrefs,
  type TraumaSafetyPrefs,
} from "../../lib/traumaSafetyCore";
import { traumaSafetyService } from "../../services/traumaSafetyService";
import { fonts, type AppColors } from "../../theme";
import { useThemedStyles } from "../../hooks/useThemedStyles";
import { useColors } from "../../context/ThemeContext";

/**
 * Trauma-informed safety hub: panic, timeout, verification, reflection entry.
 */
export default function SafetyHubScreen() {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  const router = useRouter();
  const [prefs, setPrefs] = useState<TraumaSafetyPrefs>(
    defaultTraumaSafetyPrefs(),
  );

  useFocusEffect(
    useCallback(() => {
      void traumaSafetyService.loadPrefs().then(setPrefs);
    }, []),
  );

  const save = async (next: TraumaSafetyPrefs) => {
    setPrefs(next);
    await traumaSafetyService.savePrefs(next);
  };

  return (
    <Screen>
      <Eyebrow>TRAUMA-INFORMED SAFETY</Eyebrow>
      <Title>Tools that protect choice.</Title>
      <Body muted>
        Soft Signal, panic cover, quick exit, optional time boundaries,
        present-moment checks, and private reflection. Never a score. Never
        forced processing. Litmo is not emergency or crisis services.
      </Body>

      <Card>
        <Text style={styles.section} accessibilityRole="header">
          Immediate exits
        </Text>
        <Body muted>
          Soft Signal ends a session with no explanation. Panic mode also shows
          a calm cover. Quick exit ends and opens wrap-up without pressure to
          process.
        </Body>
        <Button
          label="Practice Soft Signal"
          onPress={() => router.push("/soft-signal/practice" as never)}
        />
        <Button
          variant="secondary"
          label="Preview panic cover"
          onPress={() => router.push("/safety/panic-cover" as never)}
        />
        <View style={styles.row}>
          <View style={styles.rowCopy}>
            <Body>Panic cover after Soft Signal</Body>
            <Body muted>
              Simple clock screen after panic exit so you can leave without
              explaining.
            </Body>
          </View>
          <Switch
            accessibilityLabel="Panic cover screen"
            value={prefs.panic.useCoverScreen}
            onValueChange={(useCoverScreen) =>
              void save({
                ...prefs,
                panic: { ...prefs.panic, useCoverScreen },
              })
            }
            trackColor={{ false: colors.line, true: colors.mossSoft }}
            thumbColor={prefs.panic.useCoverScreen ? colors.moss : colors.white}
          />
        </View>
      </Card>

      <Card>
        <Text style={styles.section} accessibilityRole="header">
          Session time boundary
        </Text>
        <Body muted>
          Optional agreed max time during active sessions. Soft warning before
          the end. Soft Signal still works anytime. Off by default.
        </Body>
        <View style={styles.row}>
          <View style={styles.rowCopy}>
            <Body>
              {prefs.timeout.enabled
                ? `On · ${prefs.timeout.maxMinutes} min`
                : "Off"}
            </Body>
          </View>
          <Switch
            accessibilityLabel="Session timeout"
            value={prefs.timeout.enabled}
            onValueChange={(enabled) =>
              void save({
                ...prefs,
                timeout: { ...prefs.timeout, enabled },
              })
            }
            trackColor={{ false: colors.line, true: colors.mossSoft }}
            thumbColor={prefs.timeout.enabled ? colors.moss : colors.white}
          />
        </View>
        {prefs.timeout.enabled ? (
          <>
            <Button
              variant="secondary"
              label={`Max time: ${prefs.timeout.maxMinutes} minutes`}
              onPress={() => {
                const options = [15, 20, 30, 45, 60, 90];
                const idx = options.indexOf(prefs.timeout.maxMinutes);
                const maxMinutes = options[(idx + 1) % options.length] ?? 30;
                void save({
                  ...prefs,
                  timeout: { ...prefs.timeout, maxMinutes },
                });
              }}
            />
            <Button
              variant="secondary"
              label={`Warn ${prefs.timeout.warnBeforeMinutes} min before`}
              onPress={() => {
                const options = [2, 3, 5, 10];
                const idx = options.indexOf(prefs.timeout.warnBeforeMinutes);
                const warnBeforeMinutes =
                  options[(idx + 1) % options.length] ?? 5;
                void save({
                  ...prefs,
                  timeout: { ...prefs.timeout, warnBeforeMinutes },
                });
              }}
            />
            <View style={styles.row}>
              <View style={styles.rowCopy}>
                <Body>Auto Soft Signal at time-up</Body>
                <Body muted>
                  Off: calm prompt. On: ends safely without asking (you can
                  change anytime).
                </Body>
              </View>
              <Switch
                accessibilityLabel="Auto Soft Signal at timeout"
                value={prefs.timeout.autoSoftSignalAtTimeout}
                onValueChange={(autoSoftSignalAtTimeout) =>
                  void save({
                    ...prefs,
                    timeout: { ...prefs.timeout, autoSoftSignalAtTimeout },
                  })
                }
                trackColor={{ false: colors.line, true: colors.mossSoft }}
                thumbColor={
                  prefs.timeout.autoSoftSignalAtTimeout
                    ? colors.moss
                    : colors.white
                }
              />
            </View>
          </>
        ) : null}
      </Card>

      <Card>
        <Text style={styles.section} accessibilityRole="header">
          Before contact
        </Text>
        <Body muted>
          Present-moment checks and Consent Snapshot. Never certificates of
          safety.
        </Body>
        <Button
          label="Present-moment checks"
          onPress={() => router.push("/safety/verify" as never)}
        />
        <Button
          variant="secondary"
          label="Consent Snapshot prepare"
          onPress={() => router.push("/consent-snapshot/prepare" as never)}
        />
      </Card>

      <Card>
        <Text style={styles.section} accessibilityRole="header">
          After a session
        </Text>
        <Body muted>
          Optional reflection tools that help you process without forcing a
          trauma narrative. Skip is success.
        </Body>
        <Button
          label="Private reflection tools"
          onPress={() => router.push("/safety/reflection" as never)}
        />
        <Button
          variant="secondary"
          label="Soft Signal private log"
          onPress={() => router.push("/soft-signal/log" as never)}
        />
      </Card>

      <Body muted>
        If you are in immediate danger, contact local emergency services. Litmo
        cannot dispatch help.
      </Body>
      <Button variant="secondary" label="Back" onPress={() => router.back()} />
    </Screen>
  );
}

function makeStyles(colors: AppColors) {
  return {
    section: {
      color: colors.ink,
      fontFamily: fonts.headline,
      fontSize: 22,
      marginBottom: 8,
    },
    row: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 12,
      marginTop: 12,
    },
    rowCopy: { flex: 1, gap: 4 },
  };
}
