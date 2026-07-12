Pod::Spec.new do |s|
  s.name           = 'LitmoPasskeys'
  s.version        = '1.0.0'
  s.summary        = 'Litmo native Apple passkey ceremony bridge'
  s.description    = 'A deliberately small AuthenticationServices bridge. It never stores credential material.'
  s.author         = 'Litmo'
  s.homepage       = 'https://softnessasastrength.com'
  # The app's post-install policy compiles all pods at iOS 17; declaring the
  # Podfile's resolver floor here keeps CocoaPods resolution consistent.
  s.platforms      = { :ios => '15.1' }
  s.source         = { :git => '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.frameworks = 'AuthenticationServices'
  s.weak_frameworks = 'CryptoKit', 'LocalAuthentication', 'Security'
  s.source_files = '**/*.{h,m,mm,swift}'
end
