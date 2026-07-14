/**
 * Honest unavailable screen for App Store Safe / compile-time off features.
 * Agent 08/10 — never advertise RF that isn't in this binary.
 */
import { Body, Button, Eyebrow, Screen, Title } from "./ui";
import { useRouter } from "expo-router";

type Props = {
  eyebrow?: string;
  title: string;
  body: string;
  showBack?: boolean;
};

export function FeatureUnavailable({
  eyebrow = "NOT IN THIS BUILD",
  title,
  body,
  showBack = true,
}: Props) {
  const router = useRouter();
  return (
    <Screen>
      <Eyebrow>{eyebrow}</Eyebrow>
      <Title>{title}</Title>
      <Body muted>{body}</Body>
      <Body muted>
        Soft Signal stop, dual-seal consent, and age gate remain available.
        Maximum Mode (macOS / Linux / internal) keeps the full surface.
      </Body>
      {showBack ? (
        <Button variant="secondary" label="Back" onPress={() => router.back()} />
      ) : null}
    </Screen>
  );
}
