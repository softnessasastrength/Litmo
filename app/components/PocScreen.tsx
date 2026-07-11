import type { PropsWithChildren } from 'react';
import { SafeAreaView, Text, View } from 'react-native';

export function PocScreen({ title, children }: PropsWithChildren<{ title: string }>) {
  return (
    <SafeAreaView style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 28, fontWeight: '700', marginBottom: 12 }}>{title}</Text>
      <View style={{ gap: 12 }}>{children}</View>
    </SafeAreaView>
  );
}
