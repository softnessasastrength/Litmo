Pod::Spec.new do |s|
  s.name           = 'LitmoLocalShare'
  s.version        = '1.0.0'
  s.summary        = 'Litmo Multipeer Connectivity bridge for intentional nearby share'
  s.description    = 'Thin Multipeer Connectivity bridge. Application-layer consent and encryption live in TypeScript.'
  s.author         = 'Litmo'
  s.homepage       = 'https://softnessasastrength.com'
  s.platforms      = { :ios => '15.1' }
  s.source         = { :git => '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.frameworks = 'MultipeerConnectivity'
  s.source_files = '**/*.{h,m,mm,swift}'
end
