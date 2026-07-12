import { Body, Eyebrow, Screen, Title } from "../components/ui";
import { runtimeConfig } from "../config/runtime";

export default function DiagnosticsScreen() {
  if (!runtimeConfig.allowDiagnostics)
    return (
      <Screen>
        <Title>Unavailable.</Title>
        <Body>Diagnostics are not included in production.</Body>
      </Screen>
    );
  return (
    <Screen>
      <Eyebrow>NON-SENSITIVE DIAGNOSTICS</Eyebrow>
      <Title>Build context.</Title>
      <Body>Environment: {runtimeConfig.environment}</Body>
      <Body>App version: 0.1.0</Body>
      <Body muted>
        No profiles, identifiers, consent data, tokens, keys, notes, or session
        content appear here.
      </Body>
    </Screen>
  );
}
