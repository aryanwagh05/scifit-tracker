import type { ComponentType, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { styles } from './styles';

export function GlassBackdrop() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={styles.blobOne} />
      <View style={styles.blobTwo} />
      <View style={styles.blobThree} />
    </View>
  );
}

export function GlassCard({ title, icon: Icon, children }: { title: string; icon: ComponentType<any>; children: ReactNode }) {
  return (
    <View style={styles.glassCard}>
      <View style={styles.cardHeader}>
        <Icon size={14} color="#b56543" />
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

export function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export function ProfileInput({
  label,
  value,
  onChangeText,
  keyboardType
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'numeric';
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType ?? 'default'}
        placeholderTextColor="#89a3bf"
        style={styles.authInput}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}

export function PrimaryButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.primaryButton,
        disabled && styles.runButtonDisabled
      ]}
    >
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}
