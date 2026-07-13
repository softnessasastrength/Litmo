import { Link, useRouter } from "expo-router";
import { Text } from "react-native";
import { Body, Button, Eyebrow, Screen, Title } from "../../components/ui";
import { authFormStyles } from "./sign-in";
import { useThemedStyles } from "../../hooks/useThemedStyles";

export default function RecoveryScreen() {
  const styles = useThemedStyles(authFormStyles);
  const router = useRouter();
  return (
    <Screen>
      <Eyebrow>ACCOUNT RECOVERY</Eyebrow>
      <Title>Recovery never weakens your account.</Title>
      <Body muted>
        Litmo does not use passwords. Recovery paths stay passkey-first so a
        stolen email cannot unlock private consent data.
      </Body>
      <Text style={styles.label}>1 · Synced Apple passkey</Text>
      <Body muted>
        Try “Sign in with passkey” on any Apple device signed into the same
        iCloud Keychain. Apple will ask for Face ID, Touch ID, or the device
        passcode. A replacement phone can enroll a new Litmo device secret after
        a successful passkey.
      </Body>
      <Text style={styles.label}>2 · Another passkey you enrolled</Text>
      <Body muted>
        If you added a second passkey under Settings → Passkeys and devices, use
        that device to sign in.
      </Body>
      <Text style={styles.label}>3 · Human-reviewed support</Text>
      <Body muted>
        If no trusted Apple device remains, email alone is not enough. A
        delayed, human-reviewed operator process must revoke sessions, record a
        review without private consent content, and authorize one short-lived
        re-enrollment. That operator workflow is not deployed yet — until it is,
        the account stays locked rather than accepting weaker proof.
      </Body>
      <Button
        label="Try passkey sign-in"
        onPress={() => router.push("/auth/sign-in")}
        accessibilityHint="Returns to the primary WebAuthn passkey sign-in"
      />
      <Link href="/auth/sign-in" style={styles.link}>
        Return to passkey sign-in
      </Link>
    </Screen>
  );
}
