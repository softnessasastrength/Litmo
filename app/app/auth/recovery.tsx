import { Link } from "expo-router";
import { Body, Eyebrow, Screen, Title } from "../../components/ui";
import { authFormStyles as styles } from "./sign-in";

export default function RecoveryScreen() {
  return (
    <Screen>
      <Eyebrow>ACCOUNT RECOVERY</Eyebrow>
      <Title>Recovery never weakens your account.</Title>
      <Body muted>
        First, try “Sign in with passkey” on any Apple device signed into your
        iCloud Keychain. A restored or replacement device can use the synced
        passkey after Apple verifies the device owner.
      </Body>
      <Body muted>
        If no trusted Apple device remains, Litmo cannot unlock the account by
        email or reset it to a password. Human-reviewed recovery is not deployed
        yet, so the account remains locked rather than accepting weaker proof.
      </Body>
      <Link href="/auth/sign-in" style={styles.link}>
        Return to passkey sign-in
      </Link>
    </Screen>
  );
}
