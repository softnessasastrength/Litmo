import ExpoModulesCore

/**
 Litmo Watch Haptics — phone module shell.

 Maps Soft Signal kill + preview requests toward a future Watch app via
 Watch Connectivity. Until the Watch target ships, methods return
 unavailable / false fail-closed.

 Soft Signal must never wait on delivery ACK before ending the phone session.
 */
public class LitmoWatchHapticsModule: Module {
  public func definition() -> ModuleDefinition {
    Name("LitmoWatchHaptics")

    AsyncFunction("getStatus") { () -> String in
      // Future: WCSession.default.isPaired / isReachable
      return "unavailable"
    }

    AsyncFunction("playWatchPhrase") { (_ phraseId: String, _ intensity: String) -> [String: Any] in
      // Future: transferUserInfo to Watch → WKInterfaceDevice play
      return ["ok": false]
    }

    AsyncFunction("sendSoftSignalKill") { (_ command: [String: Any]) -> [String: Any] in
      // Future: high-priority WCSession message; Watch kills Taptic + phones session
      // Phone Soft Signal must already have committed locally before this.
      return ["ok": false]
    }

    AsyncFunction("requestWatchPreview") { (_ proposal: [String: Any]) -> [String: Any] in
      return ["ok": false]
    }
  }
}
