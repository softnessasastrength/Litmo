Pod::Spec.new do |s|
  s.name           = 'LitmoAgeRange'
  s.version        = '1.0.0'
  s.summary        = 'Litmo bridge for Apple Declared Age Range'
  s.description    = 'Requests a privacy-preserving adult age-range signal. Never stores identity documents.'
  s.author         = 'Litmo'
  s.homepage       = 'https://softnessasastrength.com'
  s.platforms      = { :ios => '15.1' }
  s.source         = { :git => '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files = '**/*.{h,m,mm,swift}'
  # DeclaredAgeRange is iOS 26+; weak so older SDKs still link.
  s.weak_frameworks = 'DeclaredAgeRange'
end
