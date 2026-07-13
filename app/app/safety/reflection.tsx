import { useEffect, useMemo, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, Text, TextInput, View } from "react-native";
import {
  Body,
  Button,
  Card,
  Eyebrow,
  Screen,
  Title,
} from "../../components/ui";
import {
  REFLECTION_COPY,
  REFLECTION_PROMPTS,
  type ReflectionPromptId,
  type SessionReflectionDocument,
} from "../../lib/traumaSafetyCore";
import { traumaSafetyService } from "../../services/traumaSafetyService";
import { fonts, radius, type AppColors } from "../../theme";
import { useThemedStyles } from "../../hooks/useThemedStyles";

/**
 * Optional post-session reflection ladder.
 * Skip anytime. Not therapy. Not a score. Private on device.
 */
export default function ReflectionScreen() {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const params = useLocalSearchParams<{
    sessionId?: string;
    softSignalLogId?: string;
    exitKind?: string;
  }>();
  const [doc, setDoc] = useState<SessionReflectionDocument | null>(null);
  const [step, setStep] = useState(0);
  const [note, setNote] = useState("");
  const [selectedChip, setSelectedChip] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    void traumaSafetyService
      .startReflection({
        sessionId: params.sessionId || null,
        softSignalLogId: params.softSignalLogId || null,
        exitKind: (params.exitKind as SessionReflectionDocument["exitKind"]) ||
          "unknown",
      })
      .then((d) => {
        if (active) setDoc(d);
      });
    return () => {
      active = false;
    };
  }, [params.sessionId, params.softSignalLogId, params.exitKind]);

  const prompt = REFLECTION_PROMPTS[step];
  const isLast = step >= REFLECTION_PROMPTS.length - 1;

  const progressLabel = useMemo(
    () =>
      prompt
        ? `Step ${step + 1} of ${REFLECTION_PROMPTS.length}`
        : "Complete",
    [step, prompt],
  );

  const advance = async (skipped: boolean) => {
    if (!doc || !prompt) return;
    setBusy(true);
    try {
      const next = await traumaSafetyService.answerReflection(doc, {
        promptId: prompt.id as ReflectionPromptId,
        chip: skipped ? null : selectedChip,
        note: skipped ? null : note || null,
        skipped,
      });
      setDoc(next);
      setNote("");
      setSelectedChip(null);
      if (isLast) {
        await traumaSafetyService.completeReflection(next, note || null);
        router.replace("/(tabs)/home" as never);
      } else {
        setStep((s) => s + 1);
      }
    } finally {
      setBusy(false);
    }
  };

  const skipAll = async () => {
    if (!doc) {
      router.back();
      return;
    }
    setBusy(true);
    try {
      await traumaSafetyService.skipReflection(doc);
      router.replace("/(tabs)/home" as never);
    } finally {
      setBusy(false);
    }
  };

  if (!prompt) {
    return (
      <Screen>
        <Title>Reflection complete</Title>
        <Button label="Home" onPress={() => router.replace("/(tabs)/home" as never)} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Eyebrow>PRIVATE REFLECTION · OPTIONAL</Eyebrow>
      <Title>{REFLECTION_COPY.title}</Title>
      <Body muted>{REFLECTION_COPY.body}</Body>
      <Text style={styles.progress}>{progressLabel.toUpperCase()}</Text>

      <Card>
        <Text style={styles.promptTitle} accessibilityRole="header">
          {prompt.title}
        </Text>
        <Body muted>{prompt.body}</Body>
        {prompt.chips ? (
          <View style={styles.chips}>
            {prompt.chips.map((chip) => {
              const on = selectedChip === chip;
              return (
                <Pressable
                  key={chip}
                  onPress={() => setSelectedChip(on ? null : chip)}
                  style={[styles.chip, on && styles.chipOn]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                >
                  <Text style={[styles.chipText, on && styles.chipTextOn]}>
                    {chip}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Optional private note (stays on this device)"
          placeholderTextColor={styles.placeholder.color}
          style={styles.input}
          multiline
          accessibilityLabel="Optional private reflection note"
        />
      </Card>

      <Button
        label={
          busy
            ? "Saving…"
            : isLast
              ? REFLECTION_COPY.done
              : "Continue"
        }
        onPress={() => void advance(false)}
        disabled={busy}
      />
      <Button
        variant="secondary"
        label="Skip this step"
        onPress={() => void advance(true)}
        disabled={busy}
        accessibilityHint="Skipping is complete and allowed"
      />
      <Button
        variant="secondary"
        label={REFLECTION_COPY.skipAll}
        onPress={() => void skipAll()}
        disabled={busy}
      />
    </Screen>
  );
}

function makeStyles(colors: AppColors) {
  return {
    progress: {
      color: colors.moss,
      fontSize: 12,
      fontWeight: "800" as const,
      letterSpacing: 1.2,
    },
    promptTitle: {
      color: colors.ink,
      fontFamily: fonts.headline,
      fontSize: 26,
      marginBottom: 8,
    },
    chips: {
      flexDirection: "row" as const,
      flexWrap: "wrap" as const,
      gap: 8,
      marginTop: 12,
      marginBottom: 12,
    },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.paper,
      minHeight: 44,
      justifyContent: "center" as const,
    },
    chipOn: {
      borderColor: colors.moss,
      backgroundColor: colors.mossSoft,
    },
    chipText: { color: colors.ink, fontSize: 14, fontWeight: "600" as const },
    chipTextOn: { color: colors.moss },
    input: {
      minHeight: 80,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: radius.md,
      padding: 12,
      color: colors.ink,
      backgroundColor: colors.cream,
      fontSize: 16,
      textAlignVertical: "top" as const,
    },
    placeholder: { color: colors.muted },
  };
}
