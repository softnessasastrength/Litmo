import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Share, Text, TextInput, View } from "react-native";
import {
  Body,
  Button,
  Card,
  Eyebrow,
  Screen,
  Title,
} from "../../components/ui";
import { TouchLanguageMap } from "../../components/TouchLanguageMap";
import {
  createDefaultTouchLanguage,
  summarizeForDisplay,
  type TouchLanguageDocument,
  type TouchLanguageSharePayload,
} from "../../lib/touchLanguageCore";
import {
  openTouchLanguageShare,
  sealTouchLanguageShare,
  type TouchLanguageShareBuild,
} from "../../services/touchLanguageShareCore";
import { touchLanguageStore } from "../../services/touchLanguageStore";
import { fonts, type AppColors } from "../../theme";
import { useThemedStyles } from "../../hooks/useThemedStyles";
import { useColors } from "../../context/ThemeContext";

/**
 * Encrypted partner share for Touch Language.
 * Review-only; private notes stripped; not consent to touch.
 */
export default function TouchLanguageShareScreen() {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  const router = useRouter();
  const [doc, setDoc] = useState<TouchLanguageDocument>(
    createDefaultTouchLanguage(),
  );
  const [built, setBuilt] = useState<TouchLanguageShareBuild | null>(null);
  const [importLink, setImportLink] = useState("");
  const [importCode, setImportCode] = useState("");
  const [received, setReceived] = useState<TouchLanguageSharePayload | null>(
    null,
  );
  const [error, setError] = useState("");
  const [acceptedReview, setAcceptedReview] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void touchLanguageStore.loadOrDefault().then((value) => {
        if (active) setDoc(value);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  const createShare = () => {
    setError("");
    setReceived(null);
    try {
      const next = sealTouchLanguageShare(doc);
      setBuilt(next);
      setAcceptedReview(false);
    } catch {
      setError("Could not create an encrypted share.");
    }
  };

  const shareOut = async () => {
    if (!built) return;
    try {
      await Share.share({
        message: `${built.shareMessage}\n\nLink: ${built.deepLink}\nUnlock code: ${built.unlockCode}\nExpires: ${new Date(built.exp).toLocaleTimeString()}`,
      });
    } catch {
      // user cancelled
    }
  };

  const openIncoming = () => {
    setError("");
    setReceived(null);
    setAcceptedReview(false);
    const result = openTouchLanguageShare(
      importLink.trim() || "",
      importCode.trim(),
    );
    if (!result.ok) {
      setError(result.reason);
      return;
    }
    setReceived(result.payload);
  };

  const partnerSummary = received
    ? summarizeForDisplay(received.document)
    : null;

  return (
    <Screen>
      <Eyebrow>SECURE SHARE</Eyebrow>
      <Title>Share your map carefully.</Title>
      <Body muted>
        Creates a time-limited encrypted package. Private notes are never
        included. Accepting a share is review only — not consent to touch, not a
        match, not a Consent Snapshot.
      </Body>

      <Card>
        <Text style={styles.cardTitle}>Send your Touch Language</Text>
        <Body muted>
          Partner needs the link and unlock code in person or through a channel
          you trust. Expires in about 15 minutes.
        </Body>
        <Button label="Create encrypted share" onPress={createShare} />
        {built ? (
          <View style={styles.shareBox}>
            <Text style={styles.codeLabel}>Unlock code</Text>
            <Text
              style={styles.code}
              accessibilityLabel={`Unlock code ${built.unlockCode.split("").join(" ")}`}
            >
              {built.unlockCode}
            </Text>
            <Text style={styles.expires}>
              Expires {new Date(built.exp).toLocaleString()}
            </Text>
            <Button
              variant="secondary"
              label="Share link + code"
              onPress={() => void shareOut()}
            />
          </View>
        ) : null}
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Open a partner’s share</Text>
        <Body muted>
          Paste the litmo://tl/v1/ link and enter the unlock code. You must
          explicitly accept review below.
        </Body>
        <TextInput
          value={importLink}
          onChangeText={setImportLink}
          placeholder="litmo://tl/v1/…"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
          accessibilityLabel="Share link"
        />
        <TextInput
          value={importCode}
          onChangeText={setImportCode}
          placeholder="6-digit unlock code"
          placeholderTextColor={colors.muted}
          keyboardType="number-pad"
          style={styles.input}
          accessibilityLabel="Unlock code"
          maxLength={8}
        />
        <Button label="Unlock share" onPress={openIncoming} />
      </Card>

      {received && partnerSummary ? (
        <Card>
          <Text style={styles.cardTitle}>Partner map (review only)</Text>
          <Body muted>{received.disclaimer}</Body>
          {!acceptedReview ? (
            <Button
              label="I understand — review only, not consent"
              onPress={() => setAcceptedReview(true)}
              accessibilityHint="Reveals the shared map for review. Does not start a session or grant touch."
            />
          ) : (
            <>
              <Text style={styles.row}>
                Pressure · {partnerSummary.pressure}
              </Text>
              <Text style={styles.row}>Speed · {partnerSummary.speed}</Text>
              <Text style={styles.row}>
                Duration · {partnerSummary.duration}
              </Text>
              <Text style={styles.row}>
                Places · {partnerSummary.environments}
              </Text>
              <Text style={styles.row}>Holds · {partnerSummary.holds}</Text>
              <Text style={styles.row}>
                Hard limits · {partnerSummary.hardLimits}
              </Text>
              <Text style={styles.row}>
                Soft limits · {partnerSummary.softLimits}
              </Text>
              <TouchLanguageMap document={received.document} compact />
              <Body muted>
                This did not save over your map. Session consent is a separate
                step.
              </Body>
            </>
          )}
        </Card>
      ) : null}

      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}

      <Button
        variant="secondary"
        label="Back to Touch Language"
        onPress={() => router.replace("/touch-language" as never)}
      />
    </Screen>
  );
}

function makeStyles(colors: AppColors) {
  return {
    cardTitle: {
      fontFamily: fonts.headline,
      fontSize: 22,
      color: colors.ink,
      marginBottom: 6,
    },
    shareBox: {
      marginTop: 14,
      padding: 14,
      borderRadius: 16,
      backgroundColor: colors.mossSoft,
      gap: 8,
    },
    codeLabel: {
      color: colors.moss,
      fontSize: 12,
      fontWeight: "700" as const,
      letterSpacing: 0.6,
      textTransform: "uppercase" as const,
    },
    code: {
      fontFamily: fonts.headline,
      fontSize: 36,
      letterSpacing: 6,
      color: colors.ink,
    },
    expires: { color: colors.muted, fontSize: 13 },
    input: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.paper,
      padding: 12,
      color: colors.ink,
      fontSize: 16,
      marginTop: 8,
    },
    row: { color: colors.ink, fontSize: 15, lineHeight: 22, marginBottom: 4 },
    error: { color: colors.signal, marginTop: 8 },
  };
}
