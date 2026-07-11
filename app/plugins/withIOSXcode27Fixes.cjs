const {
  withAppDelegate,
  withInfoPlist,
  withPodfile,
  withXcodeProject,
} = require("@expo/config-plugins");

/**
 * Two fixes discovered running on a real device with an early Xcode/iOS beta
 * (Xcode 27 beta, iOS 27). Without these, `expo prebuild` regenerates a
 * native project that either fails to build in Release or crashes instantly
 * on launch. See docs/adr/0004-ios-27-beta-build-fixes.md for the full story.
 *
 * 1. iOS 27 traps on launch (EXC_BREAKPOINT in
 *    UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption) if the app
 *    has no UIApplicationSceneManifest / SceneDelegate at all. Expo's
 *    AppDelegate-only template predates this and has neither.
 * 2. Some pods (SDWebImage, AsyncStorage) ship a per-target
 *    IPHONEOS_DEPLOYMENT_TARGET below what Xcode 27's SDK will even accept
 *    (minimum 15.0), which fails a Release build outright.
 */
function withSceneManifest(config) {
  return withInfoPlist(config, (config) => {
    config.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: "Default Configuration",
            UISceneDelegateClassName: "$(PRODUCT_MODULE_NAME).SceneDelegate",
          },
        ],
      },
    };
    return config;
  });
}

const CONFIGURATION_FOR_CONNECTING_METHOD = `
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

  // Linking API`;

const SCENE_DELEGATE_CLASS = `
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

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
}
`;

const DIRECT_WINDOW_CREATION = /\n#if os\(iOS\) \|\| os\(tvOS\)\n\s*window = UIWindow\(frame: UIScreen\.main\.bounds\)\n\s*factory\.startReactNative\(\n\s*withModuleName: "main",\n\s*in: window,\n\s*launchOptions: launchOptions\)\n#endif\n/;

function withSceneDelegate(config) {
  return withAppDelegate(config, (config) => {
    let contents = config.modResults.contents;
    if (contents.includes("class SceneDelegate")) return config; // already applied

    if (!contents.includes("\n  // Linking API")) {
      console.warn(
        "withIOSXcode27Fixes: AppDelegate.swift template changed, could not insert configurationForConnecting. Add the iOS 27 Scene lifecycle fix by hand (see docs/adr/0004-ios-27-beta-build-fixes.md).",
      );
      return config;
    }
    contents = contents.replace(
      "\n  // Linking API",
      CONFIGURATION_FOR_CONNECTING_METHOD,
    );

    if (DIRECT_WINDOW_CREATION.test(contents)) {
      contents = contents.replace(DIRECT_WINDOW_CREATION, "\n");
    } else {
      console.warn(
        "withIOSXcode27Fixes: could not remove direct window creation from didFinishLaunchingWithOptions; the app may create two windows.",
      );
    }

    contents += SCENE_DELEGATE_CLASS;
    config.modResults.contents = contents;
    return config;
  });
}

function withPodDeploymentTargetFloor(config, { minimumVersion = "17.0" } = {}) {
  return withPodfile(config, (config) => {
    let contents = config.modResults.contents;
    if (contents.includes("IPHONEOS_DEPLOYMENT_TARGET pod floor fix")) {
      return config; // already applied
    }
    const lastEndEndIndex = contents.lastIndexOf("\n  end\nend");
    if (lastEndEndIndex === -1) {
      console.warn(
        "withIOSXcode27Fixes: Podfile template changed, could not insert the pod deployment-target floor fix. Add it by hand (see docs/adr/0004-ios-27-beta-build-fixes.md).",
      );
      return config;
    }
    const injected = `
    # IPHONEOS_DEPLOYMENT_TARGET pod floor fix: some pods (e.g. SDWebImage,
    # AsyncStorage) ship a deployment target below what this Xcode's SDK will
    # even accept. Force every pod target up to the app's own minimum instead
    # of failing the build.
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        deployment_target = Gem::Version.new(config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'].to_s)
        minimum_target = Gem::Version.new('${minimumVersion}')
        if deployment_target < minimum_target
          config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '${minimumVersion}'
        end
      end
    end
`;
    contents =
      contents.slice(0, lastEndEndIndex) +
      "\n" +
      injected +
      contents.slice(lastEndEndIndex);
    config.modResults.contents = contents;
    return config;
  });
}

function withAppTargetDeploymentTargetFloor(config, { minimumVersion = "17.0" } = {}) {
  return withXcodeProject(config, (config) => {
    // Pods get bumped to this floor by withPodDeploymentTargetFloor above;
    // the app's own target must match or Swift refuses to compile against
    // modules (e.g. Expo) built for the higher target.
    config.modResults.updateBuildProperty(
      "IPHONEOS_DEPLOYMENT_TARGET",
      minimumVersion,
    );
    return config;
  });
}

module.exports = function withIOSXcode27Fixes(config) {
  config = withSceneManifest(config);
  config = withSceneDelegate(config);
  config = withPodDeploymentTargetFloor(config, { minimumVersion: "17.0" });
  config = withAppTargetDeploymentTargetFloor(config, { minimumVersion: "17.0" });
  return config;
};
