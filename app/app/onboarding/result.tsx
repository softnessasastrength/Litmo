import { useRouter } from "expo-router";
import {
  Body,
  Button,
  Eyebrow,
  FadeIn,
  Screen,
  Title,
} from "../../components/ui";
import { VibeCard } from "../../components/VibeCard";
import { usePrototype } from "../../context/PrototypeContext";
import { archetypes } from "../../data/quiz";
export default function ResultScreen() {
  const router = useRouter();
  const { archetypeId } = usePrototype();
  const vibe = archetypes[archetypeId];
  return (
    <Screen>
      <FadeIn>
        <Eyebrow>A SMALL REVEAL</Eyebrow>
        <Title>{vibe.name}</Title>
        <Body>{vibe.description}</Body>
      </FadeIn>
      <VibeCard archetypeId={archetypeId} />
      <Body muted center>
        People are more nuanced than profiles. This is an invitation to
        notice—not a diagnosis or a promise of compatibility.
      </Body>
      <Button
        label="Keep this Vibe Profile"
        onPress={() => router.push("/profile/vibe")}
      />
    </Screen>
  );
}
