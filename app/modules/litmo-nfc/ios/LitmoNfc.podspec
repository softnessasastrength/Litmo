Pod::Spec.new do |s|
  s.name           = 'LitmoNfc'
  s.version        = '1.0.0'
  s.summary        = 'Litmo Core NFC bridge for intentional NDEF offer exchange'
  s.description    = 'Thin Core NFC reader/writer. Consent and crypto live in TypeScript.'
  s.author         = 'Litmo'
  s.homepage       = 'https://softnessasastrength.com'
  s.platforms      = { :ios => '15.1' }
  s.source         = { :git => '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.frameworks = 'CoreNFC'
  s.source_files = '**/*.{h,m,mm,swift}'
end
