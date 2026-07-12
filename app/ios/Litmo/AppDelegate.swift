internal import Expo
import React
import ReactAppDependencyProvider

@main
class AppDelegate: ExpoAppDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ExpoReactNativeFactoryDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  public override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = ExpoReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory


    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  // UIApplicationSceneManifest in Info.plist requires this: without it, iOS 27
  // traps on launch instead of just warning about missing scene lifecycle
  // adoption. The window is created in SceneDelegate below instead of here,
  // since the scene (not the app) now owns it.
  public func application(
    _ application: UIApplication,
    configurationForConnecting connectingSceneSession: UISceneSession,
    options: UIScene.ConnectionOptions
  ) -> UISceneConfiguration {
    let configuration = UISceneConfiguration(
      name: "Default Configuration",
      sessionRole: connectingSceneSession.role
    )
    configuration.delegateClass = SceneDelegate.self
    return configuration
  }

  // Linking API
  public override func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    return super.application(app, open: url, options: options) || RCTLinkingManager.application(app, open: url, options: options)
  }

  // Universal Links
  public override func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    let result = RCTLinkingManager.application(application, continue: userActivity, restorationHandler: restorationHandler)
    return super.application(application, continue: userActivity, restorationHandler: restorationHandler) || result
  }
}

class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {
  // Extension point for config-plugins

  override func sourceURL(for bridge: RCTBridge) -> URL? {
    // needed to return the correct URL for expo-dev-client.
    bridge.bundleURL ?? bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: ".expo/.virtual-metro-entry")
#else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?
  private var privacyShield: UIView?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene,
      let appDelegate = UIApplication.shared.delegate as? AppDelegate,
      let factory = appDelegate.reactNativeFactory
    else { return }

    let window = UIWindow(windowScene: windowScene)
    self.window = window
    appDelegate.window = window
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: nil)
  }

  // Native cover is installed before iOS captures the multitasking snapshot.
  // The React biometric controller independently remains locked underneath it.
  func sceneWillResignActive(_ scene: UIScene) {
    guard let window, privacyShield == nil else { return }
    let shield = UIView(frame: window.bounds)
    shield.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    shield.backgroundColor = UIColor(red: 247 / 255, green: 241 / 255, blue: 232 / 255, alpha: 1)

    let mark = UILabel()
    mark.text = "L"
    mark.textColor = UIColor(red: 105 / 255, green: 71 / 255, blue: 91 / 255, alpha: 1)
    mark.font = UIFont(name: "Georgia-Italic", size: 52) ?? UIFont.italicSystemFont(ofSize: 52)
    mark.translatesAutoresizingMaskIntoConstraints = false
    shield.addSubview(mark)
    NSLayoutConstraint.activate([
      mark.centerXAnchor.constraint(equalTo: shield.centerXAnchor),
      mark.centerYAnchor.constraint(equalTo: shield.centerYAnchor),
    ])

    privacyShield = shield
    window.addSubview(shield)
  }

  func sceneDidBecomeActive(_ scene: UIScene) {
    privacyShield?.removeFromSuperview()
    privacyShield = nil
  }
}
