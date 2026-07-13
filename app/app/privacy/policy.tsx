import { useState } from "react";
import { Text, View } from "react-native";
import {
  Body,
  Button,
  Card,
  Eyebrow,
  Screen,
  Title,
} from "../../components/ui";
import {
  PRIVACY_NOTICE_VERSION,
  privacyPolicySections,
} from "../../data/privacyContent";
import { useAuth } from "../../context/AuthContext";
import { privacyService } from "../../services/privacyService";
import { fonts, type AppColors } from "../../theme";
import { useThemedStyles } from "../../hooks/useThemedStyles";

export default function PrivacyPolicyScreen() {
  const styles = useThemedStyles(makeStyles);
  const { status } = useAuth();
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const acknowledge = async () => {
    setBusy(true);
    setStatusMsg(null);
    try {
      const result = await privacyService.acceptNotice(
        status === "authenticated",
      );
      if (result.remote === "ok") {
        setStatusMsg(
          `Acknowledged version ${PRIVACY_NOTICE_VERSION} on this device and your account.`,
        );
      } else if (result.remote === "failed") {
        setStatusMsg(
          `Saved on this device. Server note: ${result.detail ?? "unavailable"}.`,
        );
      } else {
        setStatusMsg(
          `Acknowledged version ${PRIVACY_NOTICE_VERSION} on this device.`,
        );
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Eyebrow>PRIVACY</Eyebrow>
      <Title>Privacy Policy</Title>
      <Body muted>
        Transparent notice for how Litmo handles personal data. Version{" "}
        {PRIVACY_NOTICE_VERSION}. This is product documentation, not legal
        advice. Public-launch controller details require legal review (see
        docs/GDPR.md).
      </Body>

      {privacyPolicySections.map((section) => (
        <Card key={section.id}>
          <Text
            style={styles.sectionTitle}
            accessibilityRole="header"
            allowFontScaling
            maxFontSizeMultiplier={2}
          >
            {section.title}
          </Text>
          <Body muted>{section.body}</Body>
        </Card>
      ))}

      <Card>
        <Text style={styles.sectionTitle} accessibilityRole="header">
          Sensitive data first
        </Text>
        <Body muted>
          Touch Language, consent preferences, and Consent Snapshots are
          protected with privacy-by-design controls: owner RLS, versioning,
          dual-session confirmation, and no discovery exposure of private notes.
        </Body>
      </Card>

      <Button
        label={busy ? "Saving…" : "I have read this notice"}
        disabled={busy}
        onPress={() => void acknowledge()}
        accessibilityHint="Records acknowledgment of this privacy notice version on device and, if signed in, on the server"
      />
      {statusMsg ? (
        <Text style={styles.status} accessibilityLiveRegion="polite">
          {statusMsg}
        </Text>
      ) : null}
    </Screen>
  );
}

function makeStyles(colors: AppColors) {
  return {
    sectionTitle: {
      color: colors.ink,
      fontFamily: fonts.headline,
      fontSize: 22,
      marginBottom: 8,
    },
    status: {
      color: colors.moss,
      fontSize: 14,
      lineHeight: 20,
      textAlign: "center" as const,
    },
  };
}
