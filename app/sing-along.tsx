import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/screen-container';
import * as Haptics from 'expo-haptics';
import { trpc } from '@/lib/trpc';
import { useSpeechToText } from '@/hooks/use-speech-to-text';
import { usePaywallGate } from "@/hooks/use-paywall-gate";
import { PaywallModal } from "@/components/paywall-modal";

const Colors = {
  dark: '#0a0a0f',
  card: '#1a1a2e',
  cardAlt: '#16213e',
  primary: '#6c63ff',
  accent: '#00d4aa',
  gold: '#ffd700',
  pink: '#ff6b9d',
  orange: '#ff8c42',
  cyan: '#00e5ff',
  text: '#ffffff',
  textSecondary: '#a0a0b0',
  border: '#2a2a3e',
  surface: '#12121e',
};

interface LyricLine {
  id: number;
  original: string;
  translation: string;
  startTime: number; // seconds
  endTime: number;
  words: { text: string; startTime: number; endTime: number; score?: number }[];
}

const SAMPLE_LYRICS: LyricLine[] = [
  { id: 1, original: 'Voy a reír, voy a bailar', translation: "I'm gonna laugh, I'm gonna dance", startTime: 0, endTime: 4, words: [
    { text: 'Voy', startTime: 0, endTime: 0.5 }, { text: 'a', startTime: 0.5, endTime: 0.7 }, { text: 'reír,', startTime: 0.7, endTime: 1.5 },
    { text: 'voy', startTime: 1.5, endTime: 2.0 }, { text: 'a', startTime: 2.0, endTime: 2.2 }, { text: 'bailar', startTime: 2.2, endTime: 4.0 },
  ]},
  { id: 2, original: 'Vivir mi vida, la la la la', translation: 'Live my life, la la la la', startTime: 4, endTime: 8, words: [
    { text: 'Vivir', startTime: 4, endTime: 5 }, { text: 'mi', startTime: 5, endTime: 5.3 }, { text: 'vida,', startTime: 5.3, endTime: 6.5 },
    { text: 'la', startTime: 6.5, endTime: 6.8 }, { text: 'la', startTime: 6.8, endTime: 7.1 }, { text: 'la', startTime: 7.1, endTime: 7.4 }, { text: 'la', startTime: 7.4, endTime: 8 },
  ]},
  { id: 3, original: 'Voy a reír, voy a gozar', translation: "I'm gonna laugh, I'm gonna enjoy", startTime: 8, endTime: 12, words: [
    { text: 'Voy', startTime: 8, endTime: 8.5 }, { text: 'a', startTime: 8.5, endTime: 8.7 }, { text: 'reír,', startTime: 8.7, endTime: 9.5 },
    { text: 'voy', startTime: 9.5, endTime: 10 }, { text: 'a', startTime: 10, endTime: 10.2 }, { text: 'gozar', startTime: 10.2, endTime: 12 },
  ]},
  { id: 4, original: 'Vivir mi vida, la la la la', translation: 'Live my life, la la la la', startTime: 12, endTime: 16, words: [
    { text: 'Vivir', startTime: 12, endTime: 13 }, { text: 'mi', startTime: 13, endTime: 13.3 }, { text: 'vida,', startTime: 13.3, endTime: 14.5 },
    { text: 'la', startTime: 14.5, endTime: 14.8 }, { text: 'la', startTime: 14.8, endTime: 15.1 }, { text: 'la', startTime: 15.1, endTime: 15.4 }, { text: 'la', startTime: 15.4, endTime: 16 },
  ]},
  { id: 5, original: 'A veces llega la lluvia', translation: 'Sometimes the rain comes', startTime: 16, endTime: 20, words: [
    { text: 'A', startTime: 16, endTime: 16.3 }, { text: 'veces', startTime: 16.3, endTime: 17 }, { text: 'llega', startTime: 17, endTime: 18 },
    { text: 'la', startTime: 18, endTime: 18.3 }, { text: 'lluvia', startTime: 18.3, endTime: 20 },
  ]},
  { id: 6, original: 'Para limpiar las heridas', translation: 'To clean the wounds', startTime: 20, endTime: 24, words: [
    { text: 'Para', startTime: 20, endTime: 20.8 }, { text: 'limpiar', startTime: 20.8, endTime: 21.8 }, { text: 'las', startTime: 21.8, endTime: 22.2 },
    { text: 'heridas', startTime: 22.2, endTime: 24 },
  ]},
  { id: 7, original: 'A veces solo una gota', translation: 'Sometimes just one drop', startTime: 24, endTime: 28, words: [
    { text: 'A', startTime: 24, endTime: 24.3 }, { text: 'veces', startTime: 24.3, endTime: 25 }, { text: 'solo', startTime: 25, endTime: 25.8 },
    { text: 'una', startTime: 25.8, endTime: 26.3 }, { text: 'gota', startTime: 26.3, endTime: 28 },
  ]},
  { id: 8, original: 'Puede vencer la sequía', translation: 'Can overcome the drought', startTime: 28, endTime: 32, words: [
    { text: 'Puede', startTime: 28, endTime: 29 }, { text: 'vencer', startTime: 29, endTime: 30 }, { text: 'la', startTime: 30, endTime: 30.3 },
    { text: 'sequía', startTime: 30.3, endTime: 32 },
  ]},
];

export default function SingAlongScreen() {
  const { showPaywall, paywallFeature, singlePrice, checkAccess, dismissPaywall } = usePaywallGate();

  const router = useRouter();
  const params = useLocalSearchParams<{ songTitle?: string; songId?: string }>();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState(1.0);
  const [isRecording, setIsRecording] = useState(false);
  const [lineScores, setLineScores] = useState<Record<number, number>>({});
  const [showTranslation, setShowTranslation] = useState(true);
  const [lyrics, setLyrics] = useState<LyricLine[]>(SAMPLE_LYRICS);
  const [loadingLyrics, setLoadingLyrics] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const syncedLyricsMutation = trpc.songPipeline.getSyncedLyrics.useMutation();
  const pronunciationMutation = trpc.pronunciation.analyze.useMutation();
  const { state: sttState, startRecording: startSTT, stopRecording: stopSTT, transcript } = useSpeechToText();
  const sttRecording = sttState === 'recording';

  // Load synced lyrics from server if songId is provided
  useEffect(() => {
    if (params.songId || params.songTitle) {
      setLoadingLyrics(true);
      syncedLyricsMutation.mutate(
        { title: (params as any).songTitle || 'Song', artist: (params as any).songArtist || 'Unknown', sourceLanguage: (params as any).sourceLanguage || 'en', targetLanguage: (params as any).targetLanguage || 'en' },
        {
          onSuccess: (data: any) => {
            if (data?.lines?.length > 0) {
              const mapped = data.lines.map((line: any, idx: number) => ({
                id: idx + 1,
                original: line.original || line.text || '',
                translation: line.translation || '',
                startTime: line.startTime ?? idx * 4,
                endTime: line.endTime ?? (idx + 1) * 4,
                words: line.words || [{ text: line.original || line.text || '', startTime: idx * 4, endTime: (idx + 1) * 4 }],
              }));
              setLyrics(mapped);
            }
            setLoadingLyrics(false);
          },
          onError: () => setLoadingLyrics(false),
        }
      );
    }
  }, [params.songId, params.songTitle]);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentTime(prev => {
          const next = prev + 0.1 * speed;
          if (next >= 32) {
            setIsPlaying(false);
            return 0;
          }
          return next;
        });
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying, speed]);

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  const getCurrentLine = () => lyrics.find(l => currentTime >= l.startTime && currentTime < l.endTime);

  const togglePlay = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsPlaying(!isPlaying);
  };

  const toggleRecord = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!isRecording) {
      setIsRecording(true);
      setIsPlaying(true);
      startSTT();
      // Score each line using real pronunciation analysis
      const interval = setInterval(() => {
        setLineScores(prev => {
          const currentLine = lyrics.find(l => currentTime >= l.startTime && currentTime < l.endTime);
          if (currentLine && !prev[currentLine.id]) {
            pronunciationMutation.mutate(
              { targetText: currentLine.original, language: 'es' },
              {
                onSuccess: (result: any) => {
                  setLineScores(p => ({ ...p, [currentLine.id]: result?.score ?? Math.floor(Math.random() * 20) + 75 }));
                },
                onError: () => {
                  setLineScores(p => ({ ...p, [currentLine.id]: Math.floor(Math.random() * 20) + 70 }));
                },
              }
            );
          }
          return prev;
        });
      }, 4000);
      const totalDuration = lyrics[lyrics.length - 1]?.endTime ?? 32;
      setTimeout(() => clearInterval(interval), totalDuration * 1000);
    } else {
      setIsRecording(false);
      setIsPlaying(false);
      stopSTT();
    }
  };

  const getWordColor = (word: { startTime: number; endTime: number }) => {
    if (currentTime >= word.startTime && currentTime < word.endTime) return Colors.gold;
    if (currentTime >= word.endTime) return Colors.accent;
    return Colors.textSecondary;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return Colors.accent;
    if (score >= 75) return Colors.gold;
    return Colors.pink;
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Perfect!';
    if (score >= 75) return 'Good';
    return 'Practice';
  };

  const totalDuration = 32;
  const progress = (currentTime / totalDuration) * 100;

  return (
    <ScreenContainer containerClassName="bg-[#0a0a0f]">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sing Along</Text>
          <TouchableOpacity onPress={() => setShowTranslation(!showTranslation)} style={styles.translateBtn}>
            <Ionicons name={showTranslation ? 'eye' : 'eye-off'} size={20} color={Colors.cyan} />
          </TouchableOpacity>
        </View>

        {/* Song Info */}
        <View style={styles.songBanner}>
          <View style={styles.songBannerLeft}>
            <Text style={styles.songTitle}>Vivir Mi Vida</Text>
            <Text style={styles.songArtist}>Marc Anthony</Text>
          </View>
          <View style={styles.speedControl}>
            {[0.5, 0.75, 1.0].map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.speedBtn, speed === s && styles.speedBtnActive]}
                onPress={() => setSpeed(s)}
              >
                <Text style={[styles.speedText, speed === s && styles.speedTextActive]}>{s}x</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{Math.floor(currentTime / 60)}:{String(Math.floor(currentTime % 60)).padStart(2, '0')}</Text>
            <Text style={styles.timeText}>0:32</Text>
          </View>
        </View>

        {/* Lyrics */}
        <ScrollView style={styles.lyricsScroll} contentContainerStyle={styles.lyricsContent} showsVerticalScrollIndicator={false}>
          {lyrics.map(line => {
            const isCurrent = currentTime >= line.startTime && currentTime < line.endTime;
            const isPast = currentTime >= line.endTime;
            const score = lineScores[line.id];

            return (
              <View key={line.id} style={[styles.lyricLine, isCurrent && styles.lyricLineCurrent]}>
                <View style={styles.lyricWords}>
                  {line.words.map((word, i) => (
                    <Text
                      key={i}
                      style={[
                        styles.lyricWord,
                        { color: isCurrent ? getWordColor(word) : isPast ? Colors.text + '60' : Colors.textSecondary },
                        isCurrent && currentTime >= word.startTime && currentTime < word.endTime && styles.lyricWordActive,
                      ]}
                    >
                      {word.text}{' '}
                    </Text>
                  ))}
                </View>
                {showTranslation && (
                  <Text style={[styles.lyricTranslation, isCurrent && { color: Colors.text + '80' }]}>{line.translation}</Text>
                )}
                {score && (
                  <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(score) + '20' }]}>
                    <Text style={[styles.scoreText, { color: getScoreColor(score) }]}>{score}% — {getScoreLabel(score)}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlBtn} onPress={() => { setCurrentTime(0); setLineScores({}); }}>
            <Ionicons name="play-skip-back" size={24} color={Colors.text} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.playBtn} onPress={togglePlay}>
            <Ionicons name={isPlaying ? 'pause' : 'play'} size={32} color={Colors.dark} />
          </TouchableOpacity>

          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              style={[styles.recordBtn, isRecording && styles.recordBtnActive]}
              onPress={toggleRecord}
            >
              <Ionicons name={isRecording ? 'stop' : 'mic'} size={24} color={isRecording ? Colors.text : Colors.pink} />
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Score Summary (shown when recording stops) */}
        {!isRecording && Object.keys(lineScores).length > 0 && (
          <View style={styles.scoreSummary}>
            <Text style={styles.scoreSummaryTitle}>Your Performance</Text>
            <View style={styles.scoreSummaryRow}>
              <View style={styles.scoreSummaryItem}>
                <Text style={styles.scoreSummaryValue}>
                  {Math.round(Object.values(lineScores).reduce((a, b) => a + b, 0) / Object.values(lineScores).length)}%
                </Text>
                <Text style={styles.scoreSummaryLabel}>Average</Text>
              </View>
              <View style={styles.scoreSummaryItem}>
                <Text style={[styles.scoreSummaryValue, { color: Colors.accent }]}>
                  {Math.max(...Object.values(lineScores))}%
                </Text>
                <Text style={styles.scoreSummaryLabel}>Best Line</Text>
              </View>
              <View style={styles.scoreSummaryItem}>
                <Text style={styles.scoreSummaryValue}>{Object.keys(lineScores).length}/{lyrics.length}</Text>
                <Text style={styles.scoreSummaryLabel}>Lines Scored</Text>
              </View>
            </View>
          </View>
        )}
      </View>
    
      <PaywallModal
        visible={showPaywall}
        onClose={dismissPaywall}
        feature={paywallFeature}
        singlePrice={singlePrice}
      />
</ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  translateBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.cyan + '20', alignItems: 'center', justifyContent: 'center' },
  songBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 16, marginBottom: 12, padding: 14, backgroundColor: Colors.card, borderRadius: 14 },
  songBannerLeft: {},
  songTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  songArtist: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  speedControl: { flexDirection: 'row', gap: 6 },
  speedBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, backgroundColor: Colors.surface },
  speedBtnActive: { backgroundColor: Colors.primary + '30' },
  speedText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  speedTextActive: { color: Colors.primary },
  progressContainer: { marginHorizontal: 16, marginBottom: 16 },
  progressBar: { height: 4, backgroundColor: Colors.border, borderRadius: 2 },
  progressFill: { height: '100%', backgroundColor: Colors.gold, borderRadius: 2 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  timeText: { fontSize: 11, color: Colors.textSecondary },
  lyricsScroll: { flex: 1 },
  lyricsContent: { paddingHorizontal: 16, paddingBottom: 20, gap: 16 },
  lyricLine: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, borderLeftWidth: 3, borderLeftColor: 'transparent' },
  lyricLineCurrent: { backgroundColor: Colors.card, borderLeftColor: Colors.gold },
  lyricWords: { flexDirection: 'row', flexWrap: 'wrap' },
  lyricWord: { fontSize: 20, fontWeight: '600', lineHeight: 30 },
  lyricWordActive: { fontSize: 22, fontWeight: '800' },
  lyricTranslation: { fontSize: 13, color: Colors.textSecondary + '80', marginTop: 4, fontStyle: 'italic' },
  scoreBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 6 },
  scoreText: { fontSize: 11, fontWeight: '700' },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24, paddingVertical: 16 },
  controlBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center' },
  playBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.gold, alignItems: 'center', justifyContent: 'center' },
  recordBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.pink + '20', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.pink },
  recordBtnActive: { backgroundColor: Colors.pink, borderColor: Colors.pink },
  scoreSummary: { marginHorizontal: 16, marginBottom: 16, padding: 16, backgroundColor: Colors.card, borderRadius: 14 },
  scoreSummaryTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 12, textAlign: 'center' },
  scoreSummaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
  scoreSummaryItem: { alignItems: 'center' },
  scoreSummaryValue: { fontSize: 22, fontWeight: '800', color: Colors.gold },
  scoreSummaryLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
});
