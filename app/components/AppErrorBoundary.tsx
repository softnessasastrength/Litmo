import { Component, type ErrorInfo, type PropsWithChildren } from "react";
import { Body, Button, Screen, Title } from "./ui";
import { safeLog } from "../services/logger";
type State = { failed: boolean };
export class AppErrorBoundary extends Component<PropsWithChildren, State> {
  state: State = { failed: false };
  static getDerivedStateFromError(): State {
    return { failed: true };
  }
  componentDidCatch(_error: Error, info: ErrorInfo) {
    safeLog("render_failure", {
      componentStack: info.componentStack?.slice(0, 200),
    });
  }
  render() {
    if (this.state.failed)
      return (
        <Screen>
          <Title>Litmo lost its place.</Title>
          <Body>
            Your choices were not intentionally changed. Try returning to the
            screen once more.
          </Body>
          <Button
            label="Try again"
            onPress={() => this.setState({ failed: false })}
          />
        </Screen>
      );
    return this.props.children;
  }
}
