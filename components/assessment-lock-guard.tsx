import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAssessmentMode } from '@/lib/assessment-mode';
import { useColors } from '@/hooks/use-colors';
import { Colors, Spacing, BorderRadius, FontSize } from '@/constants/Colors';

interface AssessmentLockGuardProps {
  children: ReactNode;
  toolName: string;
  fallbackMessage?: string;
}

export function AssessmentLockGuard({ children, toolName, fallbackMessage }: AssessmentLockGuardProps) {
  const router = useRouter();
  const colors = useColors();
  const { mode, lockedTools } = useAssessmentMode();

  const isLocked = mode === 'active' && lockedTools.includes(toolName);

  if (!isLocked) {
    return <>{children}</>;
  }

  const handleReturn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background || '#040810' }]}>
      <View style={[styles.overlay, { backgroundColor: 'rgba(4, 8, 16, 0.85)' }]}>
        <View style={[styles.card, { 
          backgroundColor: colors.surface || '#0A1628',
          borderColor: colors.border || 'rgba(0, 170, 255, 0.18)'
        }]}>
          <Text style={styles.icon}>🔒</Text>
          <Text style={[styles.title, { color: colors.foreground || '#FFFFFF' }]}>
            Tool Locked
          </Text>
          <Text style={[styles.message, { color: colors.muted || '#7EB8E0' }]}>
            This tool is locked during assessment.
          </Text>
          {fallbackMessage && (
            <Text style={[styles.fallback, { color: colors.muted || '#3D5A7A' }]}>
              {fallbackMessage}
            </Text>
          )}
          
          <TouchableOpacity 
            style={[styles.button, { 
              backgroundColor: colors.surface || '#0E1E38',
              borderColor: colors.primary || '#00AAFF'
            }]}
            onPress={handleReturn}
            activeOpacity={0.7}
          >
            <Text style={[styles.buttonText, { color: colors.primary || '#00AAFF' }]}>
              Return to Assessment
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing?.lg || 24,
    zIndex: 1000,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    padding: Spacing?.xl || 32,
    borderRadius: BorderRadius?.lg || 16,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#00AAFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  icon: {
    fontSize: 48,
    marginBottom: Spacing?.md || 16,
  },
  title: {
    fontSize: FontSize?.xl || 24,
    fontWeight: 'bold',
    marginBottom: Spacing?.sm || 8,
    textAlign: 'center',
  },
  message: {
    fontSize: FontSize?.md || 16,
    textAlign: 'center',
    marginBottom: Spacing?.md || 16,
    lineHeight: 24,
  },
  fallback: {
    fontSize: FontSize?.sm || 14,
    textAlign: 'center',
    marginBottom: Spacing?.xl || 32,
    fontStyle: 'italic',
  },
  button: {
    paddingVertical: Spacing?.md || 16,
    paddingHorizontal: Spacing?.xl || 32,
    borderRadius: BorderRadius?.md || 12,
    borderWidth: 1,
    width: '100%',
    alignItems: 'center',
    marginTop: Spacing?.md || 16,
  },
  buttonText: {
    fontSize: FontSize?.md || 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
