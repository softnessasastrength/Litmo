import { useState } from "react";
import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import {
  Body,
  Button,
  Eyebrow,
  Screen,
  Title,
} from "../../components/ui";
import { SoftSignalButton } from "../../components/SoftSignalButton";
import { SOFT_SIGNAL_COPY, type SoftSignalFireResult } from "../../lib/softSignalCore";
import { softSignalService } from "../../services/softSignalService";
import { fonts, type AppColors } from "../../theme";
import { useThemedStyles } from "../../hooks/useThemedStyles";

/**
 * Practice Soft Signal — no peer, no session. Builds muscle memory safely.
 */
export default function SoftSignalPracticeScreen() {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const [state, setState] = useState<"idle" | "stopping" | "stopped">("idle");
  const [result, setResult] = useState<SoftSignalFireResult | null>(null);

  const fire = async () => {
    setState("stopping");
    const next = await softSignalService.practice();
    setResult(next);
    setState("stopped");
  };

  return (
    <Screen>
      <Eyebrow>SOFT SIGNAL · PRACTICE</Eyebrow>
      <Title>{SOFT_SIGNAL_COPY.practiceTitle}</Title>
      <Body muted>{SOFT_SIGNAL_COPY.practiceBody}</Body>

      <View style={styles.panel}>
        <SoftSignalButton
          state={state}
          onPress={() => void fire()}
          disabled={state !== "idle"}
        />
      </View>

      {result ? (
        <View style={styles.after} accessible>
          <Text style={styles.afterTitle}>{SOFT_SIGNAL_COPY.endedTitle}</Text>
          <Text style={styles.afterBody}>{result.userMessage}</Text>
          <Text style={styles.meta}>
            Logged privately as practice · hardware pattern{" "}
            {result.hardwareCommand.patternId}
          </Text>
          <Button
            label="View personal Soft Signal log"
            onPress={() => router.push("/soft-signal/log" as never)}
          />
          <Button
            variant="secondary"
            label="Practice again"
            onPress={() => {
              setState("idle");
              setResult(null);
            }}
          />
        </View>
      ) : null}

      <Button variant="secondary" label="Back" onPress={() => router.back()} />
    </Screen>
  );
}

function makeStyles(colors: AppColors) {
  return {
    panel: { marginTop: 12 },
    after: {
      marginTop: 20,
      padding: 18,
      borderRadius: 18,
      backgroundColor: colors.mossSoft,
      gap: 10,
    },
    afterTitle: {
      fontFamily: fonts.headline,
      fontSize: 26,
      color: colors.ink,
    },
    afterBody: { color: colors.ink, lineHeight: 22, fontSize: 16 },
    meta: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  };
}
