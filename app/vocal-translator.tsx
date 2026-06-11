import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { Colors, Spacing, BorderRadius, FontSize } from '@/constants/Colors';

const LANGUAGES = ['Spanish', 'French', 'German', 'Japanese', 'Portuguese', 'Korean', 'Italian', 'Arabic'];
const VOICE_STYLES = ['Original Artist', 'Your Voice Clone', 'AI Singer'];
const PROCESSING_STEPS = [
  'Analyzing melody',
  'Translating lyrics',
  'Matching rhythm',
  'Synthesizing vocals',
  'Mixing'
];

export default function VocalTranslatorScreen() {
  const router = useRouter();
  const colors = useColors();
  
  const [targetLanguage, setTargetLanguage] = useState('Spanish');
  const [voiceStyle, setVoiceStyle] = useState('Original Artist');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(-1);
  const [resultReady, setResultReady] = useState(false);
  const [isPlayingSource, setIsPlayingSource] = useState(false);
  const [isPlayingResult, setIsPlayingResult] = useState(false);

  const handleTranslate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsProcessing(true);
    setProcessingStep(0);
    setResultReady(false);
  };

  useEffect(() => {
    if (isProcessing && processingStep < PROCESSING_STEPS.length) {
      const timer = setTimeout(() => {
        setProcessingStep(prev => prev + 1);
      }, 1500);
      return () => clearTimeout(timer);
    } else if (isProcessing && processingStep === PROCESSING_STEPS.length) {
      setIsProcessing(false);
      setResultReady(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [isProcessing, processingStep]);

  const togglePlaySource = () => {
    Haptics.selectionAsync();
    setIsPlayingSource(!isPlayingSource);
  };

  const togglePlayResult = () => {
    Haptics.selectionAsync();
    setIsPlayingResult(!isPlayingResult);
  };

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vocal Translator</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        
        {/* Source Audio Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Source Vocals</Text>
          <View style={styles.audioCard}>
            <View style={styles.audioInfo}>
              <Ionicons name="mic-outline" size={24} color="#00AAFF" />
              <View style={styles.audioTextContainer}>
                <Text style={styles.audioFileName}>isolated_vocals_take1.wav</Text>
                <Text style={styles.audioDuration}>03:42</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.playButton} onPress={togglePlaySource}>
              <Ionicons name={isPlayingSource ? "pause" : "play"} size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.metadataContainer}>
            <View style={styles.metadataBadge}>
              <Ionicons name="musical-note" size={14} color="#FFB800" />
              <Text style={styles.metadataText}>Key: Cm</Text>
            </View>
            <View style={styles.metadataBadge}>
              <Ionicons name="speedometer-outline" size={14} color="#FFB800" />
              <Text style={styles.metadataText}>Tempo: 92 BPM</Text>
            </View>
          </View>
        </View>

        {/* Target Language Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Target Language</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[
                  styles.chip,
                  targetLanguage === lang && styles.chipActive
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setTargetLanguage(lang);
                }}
              >
                <Text style={[
                  styles.chipText,
                  targetLanguage === lang && styles.chipTextActive
                ]}>{lang}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Voice Style Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Voice Style</Text>
          <View style={styles.styleContainer}>
            {VOICE_STYLES.map((style) => (
              <TouchableOpacity
                key={style}
                style={[
                  styles.styleOption,
                  voiceStyle === style && styles.styleOptionActive
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setVoiceStyle(style);
                }}
              >
                <View style={[
                  styles.radioOuter,
                  voiceStyle === style && styles.radioOuterActive
                ]}>
                  {voiceStyle === style && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.styleOptionText}>{style}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Translate Button */}
        {!isProcessing && !resultReady && (
          <TouchableOpacity style={styles.translateButton} onPress={handleTranslate}>
            <Ionicons name="language" size={20} color="#040810" />
            <Text style={styles.translateButtonText}>Translate Vocals</Text>
          </TouchableOpacity>
        )}

        {/* Processing Status Section */}
        {isProcessing && (
          <View style={styles.processingSection}>
            <Text style={styles.processingTitle}>Processing Translation...</Text>
            <View style={styles.stepsContainer}>
              {PROCESSING_STEPS.map((step, index) => {
                const isActive = index === processingStep;
                const isCompleted = index < processingStep;
                return (
                  <View key={step} style={styles.stepRow}>
                    <View style={styles.stepIconContainer}>
                      {isCompleted ? (
                        <Ionicons name="checkmark-circle" size={20} color="#00FF88" />
                      ) : isActive ? (
                        <ActivityIndicator size="small" color="#00AAFF" />
                      ) : (
                        <Ionicons name="ellipse-outline" size={20} color="#3D5A7A" />
                      )}
                    </View>
                    <Text style={[
                      styles.stepText,
                      isActive && styles.stepTextActive,
                      isCompleted && styles.stepTextCompleted
                    ]}>
                      {step}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Result Section */}
        {resultReady && (
          <View style={styles.resultSection}>
            <Text style={styles.sectionTitle}>Translated Output</Text>
            <View style={styles.audioCard}>
              <View style={styles.audioInfo}>
                <Ionicons name="language-outline" size={24} color="#00FF88" />
                <View style={styles.audioTextContainer}>
                  <Text style={styles.audioFileName}>translated_{targetLanguage.toLowerCase()}_vocals.wav</Text>
                  <Text style={styles.audioDuration}>03:42</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.playButtonSuccess} onPress={togglePlayResult}>
                <Ionicons name={isPlayingResult ? "pause" : "play"} size={20} color="#040810" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity style={styles.actionButtonSecondary}>
                <Ionicons name="bookmark-outline" size={20} color="#00AAFF" />
                <Text style={styles.actionButtonSecondaryText}>Save to Library</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButtonPrimary}>
                <Ionicons name="musical-notes" size={20} color="#040810" />
                <Text style={styles.actionButtonPrimaryText}>Open in Studio</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={styles.resetButton}
              onPress={() => {
                Haptics.selectionAsync();
                setResultReady(false);
                setProcessingStep(-1);
              }}
            >
              <Text style={styles.resetButtonText}>Translate Another</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#040810',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 170, 255, 0.18)',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  audioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0A1628',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 170, 255, 0.18)',
  },
  audioInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  audioTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  audioFileName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  audioDuration: {
    fontSize: 12,
    color: '#7EB8E0',
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 170, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#00AAFF',
  },
  playButtonSuccess: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00FF88',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metadataContainer: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 12,
  },
  metadataBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 184, 0, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.3)',
  },
  metadataText: {
    fontSize: 12,
    color: '#FFB800',
    marginLeft: 6,
    fontWeight: '500',
  },
  chipScroll: {
    flexDirection: 'row',
    overflow: 'visible',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#0A1628',
    borderWidth: 1,
    borderColor: 'rgba(0, 170, 255, 0.18)',
    marginRight: 12,
  },
  chipActive: {
    backgroundColor: 'rgba(0, 170, 255, 0.2)',
    borderColor: '#00AAFF',
  },
  chipText: {
    fontSize: 14,
    color: '#7EB8E0',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#00CCFF',
    fontWeight: '600',
  },
  styleContainer: {
    backgroundColor: '#0A1628',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 170, 255, 0.18)',
    overflow: 'hidden',
  },
  styleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 170, 255, 0.1)',
  },
  styleOptionActive: {
    backgroundColor: 'rgba(0, 170, 255, 0.05)',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#3D5A7A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioOuterActive: {
    borderColor: '#00AAFF',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00CCFF',
  },
  styleOptionText: {
    fontSize: 15,
    color: '#FFFFFF',
  },
  translateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00CCFF',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 12,
    shadowColor: '#00CCFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  translateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#040810',
    marginLeft: 8,
  },
  processingSection: {
    backgroundColor: '#0A1628',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 170, 255, 0.3)',
    marginTop: 12,
  },
  processingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00CCFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  stepsContainer: {
    gap: 16,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepIconContainer: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepText: {
    fontSize: 14,
    color: '#3D5A7A',
  },
  stepTextActive: {
    color: '#00AAFF',
    fontWeight: '500',
  },
  stepTextCompleted: {
    color: '#00FF88',
  },
  resultSection: {
    marginTop: 12,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButtonSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 170, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#00AAFF',
  },
  actionButtonSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00AAFF',
    marginLeft: 8,
  },
  actionButtonPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#00CCFF',
  },
  actionButtonPrimaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#040810',
    marginLeft: 8,
  },
  resetButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 16,
  },
  resetButtonText: {
    fontSize: 14,
    color: '#7EB8E0',
    fontWeight: '500',
  },
});
