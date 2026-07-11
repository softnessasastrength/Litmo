import { useRouter } from "expo-router";
import { Body, Button, Eyebrow, Screen, Title } from "../../components/ui";
import { VibeCard } from "../../components/VibeCard";
import { usePrototype } from "../../context/PrototypeContext";
export default function VibeProfileScreen() {
  const router = useRouter();
  const { archetypeId } = usePrototype();
  return (
    <Screen>
      <Eyebrow>YOUR CARD</Eyebrow>
      <Title>A little shorthand for your social weather.</Title>
      <VibeCard archetypeId={archetypeId} />
      <Body muted>
        This card is designed to feel shareable, but sharing is not enabled in
        this prototype. Your vibe may suggest conversation—not consent.
      </Body>
      <Button
        label="Name my touch language"
        onPress={() => router.push("/onboarding/touch-language")}
      />
    </Screen>
  );
}
