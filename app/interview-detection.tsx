import React, { useState, useEffect, useCallback } from 'react';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { Colors, Spacing, BorderRadius, FontSize } from '@/constants/Colors';
import { trpc } from '@/lib/trpc';
import { useSpeechToText } from '@/hooks/use-speech-to-text';

type DetectionEvent = {
  id: string;
  time: string;
  text: string;
  type: 'success' | 'warning' | 'info' | 'error';
};

const CircularProgress = ({ value, label, color }: { value: number, label: string, color: string }) => {
  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressCircle}>
        <View style={[styles.circleBase, { borderColor: 'rgba(255,255,255,0.1)' }]} />
        <View style={[
          styles.circleProgress, 
          { 
            borderColor: color,
            borderTopColor: value > 25 ? color : 'transparent',
            borderRightColor: value > 50 ? color : 'transparent',
            borderBottomColor: value > 75 ? color : 'transparent',
            borderLeftColor: color,
            transform: [{ rotate: '45deg' }]
          }
        ]} />
        <View style={styles.progressTextContainer}>
          <Text style={[styles.progressValue, { color }]}>{value}%</Text>
        </View>
      </View>
      <Text style={styles.progressLabel}>{label}</Text>
    </View>
  );
};

export default function InterviewDetectionScreen() {
  const router = useRouter();
  const colors = useColors();
  const [duration, setDuration] = useState(0);
  const [events, setEvents] = useState<DetectionEvent[]>([]);
  const [sessionId] = useState(`int_${Date.now()}`);
  const [isActive, setIsActive] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [challengePhrase, setChallengePhrase] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);

  // Real scores from AI analysis
  const [voiceScore, setVoiceScore] = useState(0);
  const [videoScore, setVideoScore] = useState(0);
  const [answerScore, setAnswerScore] = useState(0);
  const [presenceScore, setPresenceScore] = useState(0);
  const [overallScore, setOverallScore] = useState(0);

  // Real NLP hooks
  const stt = useSpeechToText();
  const analyzeVoiceMutation = trpc.interviewDetection.analyzeVoice.useMutation();
  const analyzeAnswerMutation = trpc.interviewDetection.analyzeAnswer.useMutation();
  const generateChallengeMutation = trpc.interviewDetection.generatePresenceChallenge.useMutation();
  const getReportQuery = trpc.interviewDetection.getInterviewReport.useQuery(
    { sessionId },
    { enabled: showReport }
  );

  // Timer
  useEffect(() => {
    if (!isActive) return;
    const timer = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isActive]);

  // Periodic voice analysis (every 30 seconds)
  useEffect(() => {
    if (!isActive || duration === 0) return;
    if (duration % 30 === 0) {
      runVoiceAnalysis();
    }
  }, [duration, isActive]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const addEvent = useCallback((text: string, type: DetectionEvent['type']) => {
    setEvents(prev => [{
      id: Date.now().toString(),
      time: formatTime(duration),
      text,
      type,
    }, ...prev]);
  }, [duration]);

  // Real voice analysis via server AI
  const runVoiceAnalysis = useCallback(async () => {
    try {
      const result = await analyzeVoiceMutation.mutateAsync({
        sessionId,
        audioUrl: `session://${sessionId}/audio_${duration}`,
        timestamp: Date.now(),
      });
      const score = result.confidence_score;
      setVoiceScore(score);
      updateOverall(score, videoScore, answerScore, presenceScore);

      if (result.risk_flags && result.risk_flags.length > 0) {
        addEvent(`Voice alert: ${result.risk_flags[0]}`, 'warning');
      } else if (result.indicators && result.indicators.length > 0) {
        addEvent(`Voice: ${result.indicators[0]}`, 'success');
      }
    } catch {
      // Silent fail — don't interrupt interview
    }
  }, [sessionId, duration, videoScore, answerScore, presenceScore]);

  // Analyze a candidate's answer in real-time
  const analyzeAnswer = useCallback(async (answerText: string, questionText: string, responseTimeMs: number) => {
    try {
      setIsAnalyzing(true);
      const result = await analyzeAnswerMutation.mutateAsync({
        sessionId,
        answerText,
        questionText,
        responseTimeMs,
      });
      const score = result.confidence_score;
      setAnswerScore(score);
      updateOverall(voiceScore, videoScore, score, presenceScore);

      const level = result.authenticity_level;
      if (level === 'likely_ai') {
        addEvent(`Answer flagged: possible AI-generated response (${score}%)`, 'error');
      } else if (level === 'suspicious') {
        addEvent(`Answer: unusual pattern detected (${score}%)`, 'warning');
      } else {
        addEvent(`Answer verified: natural response (${score}%)`, 'success');
      }
    } catch {
      addEvent('Answer analysis unavailable', 'info');
    } finally {
      setIsAnalyzing(false);
    }
  }, [sessionId, voiceScore, videoScore, presenceScore]);

  const updateOverall = (v: number, vid: number, a: number, p: number) => {
    const scores = [v, vid, a, p].filter(s => s > 0);
    if (scores.length > 0) {
      setOverallScore(Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length));
    }
  };

  const handleBack = () => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    router.back();
  };

  // Generate a real presence challenge via server
  const handleGenerateChallenge = useCallback(async () => {
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      const challenge = await generateChallengeMutation.mutateAsync({ sessionId });
      setChallengePhrase(challenge.phrase);
      addEvent(`Challenge sent: "${challenge.phrase}" (${challenge.timeLimit}s limit)`, 'warning');
      setPresenceScore(prev => prev || 85); // Initial presence score
      updateOverall(voiceScore, videoScore, answerScore, presenceScore || 85);
    } catch {
      addEvent('Challenge generation failed', 'info');
    }
  }, [sessionId, voiceScore, videoScore, answerScore, presenceScore]);

  const handleEndInterview = useCallback(() => {
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setIsActive(false);
    addEvent('Interview session ended', 'info');
    // Persist session data
    AsyncStorage.setItem(`@interview_${sessionId}`, JSON.stringify({
      duration,
      events,
      scores: { voiceScore, videoScore, answerScore, presenceScore, overallScore },
    }));
  }, [sessionId, duration, events, voiceScore, videoScore, answerScore, presenceScore, overallScore]);

  const handleViewReport = useCallback(() => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowReport(true);
  }, []);

  const getStatusColor = (score: number) => {
    if (score > 85) return "#00FF88";
    if (score >= 60) return "#FFB800";
    if (score === 0) return "#555";
    return "#FF4444";
  };
  return (
    <ScreenContainer style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#00AAFF" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.candidateName}>Alex Chen</Text>
          <Text style={styles.interviewId}>ID: INT-8492 • {formatTime(duration)}</Text>
        </View>
        <View style={styles.overallScoreContainer}>
          <Text style={styles.overallScoreLabel}>Authenticity</Text>
          <Text style={styles.overallScoreValue}>{overallScore > 0 ? `${overallScore}%` : '—'}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Meters Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Real-Time Authenticity</Text>
          <View style={styles.metersGrid}>
            <CircularProgress value={voiceScore} label="Voice" color={getStatusColor(voiceScore)} />
            <CircularProgress value={videoScore} label="Video" color={getStatusColor(videoScore)} />
            <CircularProgress value={answerScore} label="Answers" color={getStatusColor(answerScore)} />
            <CircularProgress value={presenceScore} label="Presence" color={getStatusColor(presenceScore)} />
          </View>
        </View>

        {/* Live Feed Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detection Events</Text>
          <View style={styles.feedContainer}>
            {events.map((event) => (
              <View key={event.id} style={styles.feedItem}>
                <Text style={styles.feedTime}>{event.time}</Text>
                <View style={[
                  styles.feedDot, 
                  { backgroundColor: event.type === 'success' ? '#00FF88' : event.type === 'warning' ? '#FFB800' : '#00AAFF' }
                ]} />
                <Text style={styles.feedText}>{event.text}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.challengeButton} onPress={handleGenerateChallenge}>
          <Ionicons name="shield-checkmark" size={20} color="#040810" />
          <Text style={styles.challengeButtonText}>Generate Challenge</Text>
        </TouchableOpacity>
        
        <View style={styles.rowButtons}>
          <TouchableOpacity style={styles.endButton} onPress={handleEndInterview}>
            <Text style={styles.endButtonText}>End Interview</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.reportButton} onPress={handleViewReport}>
            <Text style={styles.reportButtonText}>View Full Report</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 170, 255, 0.18)',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
    marginLeft: -8,
  },
  headerInfo: {
    flex: 1,
  },
  candidateName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  interviewId: {
    color: '#7EB8E0',
    fontSize: 12,
    marginTop: 2,
  },
  overallScoreContainer: {
    alignItems: 'flex-end',
    backgroundColor: 'rgba(0, 204, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 204, 255, 0.3)',
    shadowColor: '#00CCFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  overallScoreLabel: {
    color: '#00CCFF',
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  overallScoreValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    textShadowColor: '#00CCFF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  metersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    backgroundColor: '#0A1628',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 170, 255, 0.18)',
  },
  progressContainer: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressCircle: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  circleBase: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 6,
  },
  circleProgress: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 6,
  },
  progressTextContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressLabel: {
    color: '#7EB8E0',
    fontSize: 12,
    fontWeight: '500',
  },
  feedContainer: {
    backgroundColor: '#0A1628',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 170, 255, 0.18)',
  },
  feedItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  feedTime: {
    color: '#3D5A7A',
    fontSize: 12,
    width: 40,
    marginTop: 2,
  },
  feedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    marginHorizontal: 12,
    shadowColor: '#00FF88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  feedText: {
    color: '#FFFFFF',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    backgroundColor: '#0A1628',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 170, 255, 0.18)',
  },
  challengeButton: {
    backgroundColor: '#00CCFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#00CCFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  challengeButtonText: {
    color: '#040810',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  rowButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  endButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.3)',
    paddingVertical: 14,
    borderRadius: 12,
    marginRight: 8,
    alignItems: 'center',
  },
  endButtonText: {
    color: '#FF4444',
    fontSize: 14,
    fontWeight: '600',
  },
  reportButton: {
    flex: 1,
    backgroundColor: 'rgba(0, 170, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 170, 255, 0.3)',
    paddingVertical: 14,
    borderRadius: 12,
    marginLeft: 8,
    alignItems: 'center',
  },
  reportButtonText: {
    color: '#00AAFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
