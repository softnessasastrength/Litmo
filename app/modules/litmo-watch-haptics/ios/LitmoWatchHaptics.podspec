Pod::Spec.new do |s|
  s.name           = 'LitmoWatchHaptics'
  s.version        = '0.1.0'
  s.summary        = 'Litmo Apple Watch haptic bridge (Taptic Soft Signal)'
  s.description    = 'Phone-side module shell for Watch Connectivity + Taptic co-regulation'
  s.license        = 'MPL-2.0'
  s.author         = 'Litmo'
  s.homepage       = 'https://github.com/softnessasastrength/Litmo'
  s.platforms      = { :ios => '15.1' }
  s.source         = { :git => '' }
  s.source_files   = '**/*.swift'
  s.dependency 'ExpoModulesCore'
end
