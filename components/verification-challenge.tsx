import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Easing,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

interface Challenge {
  phrase: string;
  timeLimit: number;
}

interface VerificationChallengeProps {
  visible: boolean;
  challenge: Challenge | null;
  onComplete: (passed: boolean) => void;
  onCancel: () => void;
}

export default function VerificationChallenge({
  visible,
  challenge,
  onComplete,
  onCancel,
}: VerificationChallengeProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible && challenge) {
      setTimeLeft(challenge.timeLimit);
      setIsRecording(false);
      setIsProcessing(false);
    }
  }, [visible, challenge]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (visible && timeLeft > 0 && !isRecording && !isProcessing) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            onComplete(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [visible, timeLeft, isRecording, isProcessing, onComplete]);

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [isRecording, pulseAnim]);

  const handleStartRecording = () => {
    if (isRecording || isProcessing) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsRecording(true);
    
    // Simulate recording for 3 seconds
    setTimeout(() => {
      setIsRecording(false);
      setIsProcessing(true);
      
      // Simulate processing for 1.5 seconds
      setTimeout(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onComplete(true);
      }, 1500);
    }, 3000);
  };

  const handleCancel = () => {
    if (isRecording || isProcessing) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCancel();
  };

  if (!challenge) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Live Verification</Text>
            <TouchableOpacity onPress={handleCancel} disabled={isRecording || isProcessing}>
              <Ionicons name="close" size={24} color="#7EB8E0" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={styles.instruction}>
              Please read the following phrase aloud clearly:
            </Text>
            
            <View style={styles.phraseContainer}>
              <Text style={styles.phraseText}>"{challenge.phrase}"</Text>
            </View>

            <View style={styles.timerContainer}>
              <Ionicons name="time-outline" size={20} color={timeLeft <= 5 ? "#FF4444" : "#00AAFF"} />
              <Text style={[styles.timerText, timeLeft <= 5 && styles.timerTextUrgent]}>
                00:{timeLeft.toString().padStart(2, '0')}
              </Text>
            </View>

            <View style={styles.actionContainer}>
              {isProcessing ? (
                <View style={styles.processingContainer}>
                  <ActivityIndicator size="large" color="#00AAFF" />
                  <Text style={styles.processingText}>Analyzing audio...</Text>
                </View>
              ) : (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleStartRecording}
                  disabled={isRecording}
                >
                  <Animated.View
                    style={[
                      styles.micButton,
                      isRecording && styles.micButtonRecording,
                      { transform: [{ scale: pulseAnim }] }
                    ]}
                  >
                    <Ionicons 
                      name={isRecording ? "mic" : "mic-outline"} 
                      size={40} 
                      color="#FFFFFF" 
                    />
                  </Animated.View>
                </TouchableOpacity>
              )}
              
              {!isProcessing && (
                <Text style={styles.actionHint}>
                  {isRecording ? "Recording... Speak now" : "Tap to start recording"}
                </Text>
              )}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(4, 8, 16, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    backgroundColor: '#0A1628',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 170, 255, 0.18)',
    overflow: 'hidden',
    shadowColor: '#00AAFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 170, 255, 0.1)',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  instruction: {
    fontSize: 15,
    color: '#7EB8E0',
    textAlign: 'center',
    marginBottom: 24,
  },
  phraseContainer: {
    backgroundColor: '#0E1E38',
    padding: 24,
    borderRadius: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(0, 170, 255, 0.1)',
    marginBottom: 24,
  },
  phraseText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 32,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 170, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 32,
  },
  timerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00AAFF',
    marginLeft: 8,
    fontVariant: ['tabular-nums'],
  },
  timerTextUrgent: {
    color: '#FF4444',
  },
  actionContainer: {
    alignItems: 'center',
    height: 140,
    justifyContent: 'center',
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0E1E38',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#00AAFF',
    shadowColor: '#00CCFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  micButtonRecording: {
    backgroundColor: '#FF4444',
    borderColor: '#FF4444',
    shadowColor: '#FF4444',
  },
  actionHint: {
    fontSize: 14,
    color: '#7EB8E0',
    marginTop: 16,
  },
  processingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingText: {
    fontSize: 14,
    color: '#00AAFF',
    marginTop: 16,
    fontWeight: '500',
  },
});
