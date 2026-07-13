/**
 * Overload exit affordance for ND / trauma-informed flows.
 *
 * WHAT: One-tap leave path labeled from accommodation overloadExitMode.
 * WHY: Stopping and pausing must be easier than continuing under overload (I.4).
 * CONSENT: Never a Soft Signal substitute except when mode is panic_cover in session.
 * NEVER: Peer-visible; never a trust signal; never requires a reason.
 */
import { useRouter } from "expo-router";
import { View } from "react-native";
import { useNeurodivergent } from "../context/NeurodivergentContext";
import { Body, Button } from "./ui";

type Context = "quiz" | "learning" | "session" | "general";

export function OverloadExitBar(props: {
  context: Context;
  /** Optional override after navigate (e.g. Soft Signal first). */
  onBeforeExit?: () => void | Promise<void>;
  showWhenDisabled?: boolean;
}) {
  const neuro = useNeurodivergent();
  const router = useRouter();
  const show = neuro.enabled || neuro.easyBreaks || props.showWhenDisabled;

  if (!show) return null;

  const exit = neuro.overloadExitFor(props.context);

  return (
    <View style={{ gap: 8, marginTop: 8 }}>
      <Button
        variant="secondary"
        label={exit.label}
        onPress={() => {
          void (async () => {
            if (props.onBeforeExit) await props.onBeforeExit();
            router.push(exit.href as never);
          })();
        }}
        accessibilityHint={exit.hint}
      />
      {neuro.languageDensity !== "short" ? (
        <Body muted>{exit.hint}</Body>
      ) : null}
    </View>
  );
}
