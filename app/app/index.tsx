import { Link } from 'expo-router';
import { SafeAreaView, Text, View } from 'react-native';

const routes = [
  ['Touch Language Profile', '/onboarding/touch-language'],
  ['Consent Setup', '/onboarding/consent-setup'],
  ['Discover', '/match/discover'],
  ['Consent Snapshot', '/match/consent-snapshot'],
  ['Active Session', '/session/active'],
  ['Session Wrap-Up', '/session/wrap-up'],
  ['Trust Ledger', '/profile/trust-ledger'],
] as const;

export default function HomeScreen() {
  return (
    <SafeAreaView style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 30, fontWeight: '700', marginBottom: 8 }}>Litmo POC</Text>
      <Text style={{ marginBottom: 24 }}>Every nervous system deserves to exhale.</Text>
      <View style={{ gap: 14 }}>
        {routes.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
      </View>
    </SafeAreaView>
  );
}
