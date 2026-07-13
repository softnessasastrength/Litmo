import { useRouter } from "expo-router";
import { Text } from "react-native";
import {
  Body,
  Button,
  Card,
  Eyebrow,
  Screen,
  Title,
} from "../../components/ui";
import { dataProtectionSections } from "../../data/privacyContent";
import { fonts, type AppColors } from "../../theme";
import { useThemedStyles } from "../../hooks/useThemedStyles";

export default function DataProtectionScreen() {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();

  return (
    <Screen>
      <Eyebrow>DATA PROTECTION</Eyebrow>
      <Title>Your rights and our duties</Title>
      <Body muted>
        Privacy by design, data minimization, and strong consent for sensitive
        categories. Full engineering alignment is documented in docs/GDPR.md.
      </Body>

      {dataProtectionSections.map((section) => (
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
          Quick actions
        </Text>
        <Body muted>
          Export a portable copy, request erasure, or read the full Privacy
          Policy.
        </Body>
        <Button
          label="Privacy Policy"
          variant="secondary"
          onPress={() => router.push("/privacy/policy" as never)}
        />
        <Button
          label="Export my data"
          variant="secondary"
          onPress={() => router.push("/security/data-export" as never)}
        />
        <Button
          label="Delete or wipe my data"
          variant="secondary"
          onPress={() => router.push("/privacy/delete-data" as never)}
        />
      </Card>
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
  };
}
