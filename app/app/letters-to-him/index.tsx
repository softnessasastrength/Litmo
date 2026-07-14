/**
 * Letters To Him — Pillar 7 containment: "Grace Over Guilt."
 *
 * WHAT: A single free-write screen, not a stepper. Name an old regret (no
 *   detail required), name what younger-you genuinely didn't know yet, and
 *   write one sentence of grace — to him, not extracted as a lesson. Past
 *   letters live below the form, each with a one-way "let this one go"
 *   toggle. Nothing here is sequenced, scored, or tracked as a streak.
 * WHY: Pillar 7 of the Seven Pillars (softnessasastrength.com): "Grace Over
 *   Guilt — honor who you were, forgive him, don't drag his guilt into
 *   tomorrow." docs/FIRST_RITUAL.md and docs/SECOND_RITUAL.md deliberately
 *   don't touch this. See docs/LETTERS_TO_HIM.md for the full spec.
 * CONSENT: Not consent, not a diagnosis, not therapy. Sealing a letter is
 *   never required and proves nothing about "healing enough." The only
 *   required field is one line of grace — regret and "didn't know yet" can
 *   both stay blank.
 * EDGE CASES: Loads existing history on mount; falls back to an empty list
 *   on any storage failure (lettersToHimStore already swallows errors).
 *   Releasing a letter is a pure flip with no follow-up prompt.
 * NEVER: A step sequence, a progress bar, a streak, a score, or a "+1
 *   growth" ledger. A Soft Signal button (there is no active session here
 *   to exit from). A debrief after "Let this one go" — the toggle is the
 *   whole action. Extracting the grace line as a lesson about him rather
 *   than grace written to him.
 * SEE: docs/LETTERS_TO_HIM.md, app/lib/lettersToHimCore.ts,
 *   app/services/lettersToHimStore.ts, docs/FIRST_RITUAL.md (voice
 *   calibration, guided-ritual pattern this screen deliberately skips).
 */
import { useCallback, useEffect, useState } from "react";
import { TextInput } from "react-native";
import { useRouter } from "expo-router";
import { Body, Button, Card, Eyebrow, Screen, Title } from "../../components/ui";
import {
  canSealLetter,
  defaultLetterDraft,
  releaseLetter,
  sealLetter,
  type LetterDraft,
  type LetterEntry,
} from "../../lib/lettersToHimCore";
import { lettersToHimStore } from "../../services/lettersToHimStore";
import { useThemedStyles } from "../../hooks/useThemedStyles";
import { useColors } from "../../context/ThemeContext";
import type { AppColors } from "../../theme";

export default function LettersToHimScreen() {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  const router = useRouter();
  const [history, setHistory] = useState<LetterEntry[]>([]);
  const [draft, setDraft] = useState<LetterDraft>(defaultLetterDraft());

  const reload = useCallback(async () => {
    setHistory(await lettersToHimStore.load());
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const gate = canSealLetter(draft);

  const seal = async () => {
    const entry = sealLetter(draft);
    if (!entry) return;
    const next = await lettersToHimStore.add(entry);
    setHistory(next);
    setDraft(defaultLetterDraft());
  };

  const release = async (id: string) => {
    const next = await lettersToHimStore.updateEntry(id, releaseLetter);
    setHistory(next);
  };

  return (
    <Screen>
      <Eyebrow>LETTERS TO HIM</Eyebrow>
      <Title>Grace over guilt.</Title>
      <Body muted>
        This isn't a debrief. Nobody's grading the report. We're not here to
        extract a lesson, mine a pattern, or turn "I was young and scared"
        into a growth metric. You get one job: write him — the younger, dumber,
        more scared version of you — a single true sentence of grace. The
        regret and the "what he didn't know yet" lines are optional. Leave
        them blank if there's nothing you want to say there. The grace line
        is the whole point; everything else is just runway.
      </Body>
      <Card>
        <Body muted>The regret (optional)</Body>
        <TextInput
          style={[styles.input, { minHeight: 90 }]}
          multiline
          placeholder="Name it, or don't…"
          placeholderTextColor={colors.muted}
          value={draft.regret}
          onChangeText={(t) => setDraft((d) => ({ ...d, regret: t }))}
          accessibilityLabel="The regret, optional"
        />
        <Body muted>What he didn't know yet (optional)</Body>
        <TextInput
          style={[styles.input, { minHeight: 90 }]}
          multiline
          placeholder="What you know now that he genuinely didn't yet…"
          placeholderTextColor={colors.muted}
          value={draft.didntKnowYet}
          onChangeText={(t) => setDraft((d) => ({ ...d, didntKnowYet: t }))}
          accessibilityLabel="What he didn't know yet, optional"
        />
        <Body muted>One sentence of grace, to him</Body>
        <TextInput
          style={[styles.input, { minHeight: 90 }]}
          multiline
          placeholder="The one true sentence…"
          placeholderTextColor={colors.muted}
          value={draft.grace}
          onChangeText={(t) => setDraft((d) => ({ ...d, grace: t }))}
          accessibilityLabel="One sentence of grace, required"
        />
        {!gate.ok ? <Body muted>{gate.reason}</Body> : null}
        <Button
          label="Seal this one"
          disabled={!gate.ok}
          onPress={() => void seal()}
          accessibilityHint="Seals this letter to your past self. Local only, no lesson extracted, no score."
        />
      </Card>
      {history.map((entry) => (
        <Card key={entry.id}>
          {entry.regret ? <Body muted>Regret: {entry.regret}</Body> : null}
          {entry.didntKnowYet ? (
            <Body muted>Didn't know yet: {entry.didntKnowYet}</Body>
          ) : null}
          <Body>{entry.grace}</Body>
          {entry.released ? (
            <Body muted>released</Body>
          ) : (
            <Button
              variant="secondary"
              label="Let this one go"
              onPress={() => void release(entry.id)}
              accessibilityHint="Marks this letter as let go. One-way, no debrief, no second draft."
            />
          )}
        </Card>
      ))}
      <Button
        variant="secondary"
        label="Back"
        onPress={() => router.push("/(tabs)/home" as never)}
      />
    </Screen>
  );
}

function makeStyles(colors: AppColors) {
  return {
    input: {
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 16,
      padding: 14,
      color: colors.ink,
      backgroundColor: colors.cream,
      textAlignVertical: "top" as const,
    },
  };
}
