import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Share, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors, Spacing, BorderRadius, FontSize } from '@/constants/Colors';
import { trpc } from "@/lib/trpc";

const { width } = Dimensions.get('window');

type PlaybackMode = 'Full Mix' | 'Original' | 'Translated Vocals Only';

interface LyricLine {
  id: string;
  original: string;
  translated: string;
}

interface VocabularyItem {
  id: string;
  word: string;
  translation: string;
  pos: string;
}

const MOCK_LYRICS: LyricLine[] = [
  { id: '1', original: "I'm walking in the rain", translated: "Je marche sous la pluie" },
  { id: '2', original: "Thinking about you", translated: "En pensant à toi" },
  { id: '3', original: "The city lights are bright", translated: "Les lumières de la ville sont brillantes" },
  { id: '4', original: "But my heart is blue", translated: "Mais mon cœur est bleu" },
  { id: '5', original: "I wish you were here", translated: "J'aimerais que tu sois là" },
  { id: '6', original: "To hold my hand", translated: "Pour tenir ma main" },
];

const MOCK_VOCAB: VocabularyItem[] = [
  { id: '1', word: 'rain', translation: 'pluie', pos: 'noun' },
  { id: '2', word: 'think', translation: 'penser', pos: 'verb' },
  { id: '3', word: 'bright', translation: 'brillant', pos: 'adj' },
  { id: '4', word: 'heart', translation: 'cœur', pos: 'noun' },
];

export default function SongTranslationResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colors = useColors();
  
  const title = (params.title as string) || 'Unknown Title';
  const artist = (params.artist as string) || 'Unknown Artist';
  const targetLanguage = (params.targetLanguage as string) || 'French';
  const originalLanguage = 'English';

  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>('Full Mix');
  const [lyricsData, setLyricsData] = useState(MOCK_LYRICS);
  const [vocabData, setVocabData] = useState(MOCK_VOCAB);

  // Load real translation result from AsyncStorage if available
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(`@song_translation_${title}`);
        if (stored) {
          const data = JSON.parse(stored);
          if (data.lyrics) setLyricsData(data.lyrics);
          if (data.vocab) setVocabData(data.vocab);
        }
      } catch {}
    })();
  }, []);

  const handleBack = () => {
    Haptics.selectionAsync();
    router.back();
  };

  const togglePlay = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsPlaying(!isPlaying);
  };

  const handleModeSelect = (mode: PlaybackMode) => {
    Haptics.selectionAsync();
    setPlaybackMode(mode);
  };

  const handleAction = async (action: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (action === 'Share') {
      try {
        const songTitle = params.title || 'Translated Song';
        const artist = params.artist || 'Unknown Artist';
        await Share.share({
          message: `🎵 Check out "${songTitle}" by ${artist} — translated on ConnectWorld AI!\n\nLearn languages through music you love. Download ConnectWorld AI to translate any song and learn vocabulary from lyrics.`,
          title: `${songTitle} — Translated`,
        });
      } catch (e) {
        // User cancelled share
      }
    } else if (action === 'Save') {
      try {
        const saved = await AsyncStorage.getItem('@saved_songs');
        const songs = saved ? JSON.parse(saved) : [];
        const newSong = {
          id: Date.now().toString(),
          title: params.title || 'Untitled',
          artist: params.artist || 'Unknown',
          savedAt: new Date().toISOString(),
        };
        songs.unshift(newSong);
        await AsyncStorage.setItem('@saved_songs', JSON.stringify(songs.slice(0, 100)));
        Alert.alert('Saved!', 'Song added to your library.');
      } catch {}
    } else if (action === 'Studio') {
      router.push('/song-translation-studio' as any);
    } else if (action === 'Learn') {
      router.push('/vocabulary-from-song' as any);
    }
  };

  return (
    <ScreenContainer style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Translation Result</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Album Art & Info */}
        <View style={styles.heroSection}>
          <View style={[styles.albumArtPlaceholder, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="musical-notes" size={64} color={colors.primary} />
          </View>
          
          <Text style={[styles.songTitle, { color: colors.foreground }]}>{title}</Text>
          <Text style={[styles.artistName, { color: colors.muted }]}>{artist}</Text>
          
          <View style={styles.languageBadges}>
            <View style={[styles.badge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.badgeText, { color: colors.muted }]}>{originalLanguage}</Text>
            </View>
            <Ionicons name="arrow-forward" size={16} color={colors.muted} style={styles.badgeArrow} />
            <View style={[styles.badge, { backgroundColor: colors.surface, borderColor: colors.glow }]}>
              <Text style={[styles.badgeText, { color: colors.glow }]}>{targetLanguage}</Text>
            </View>
          </View>
        </View>

        {/* Playback Controls */}
        <View style={[styles.playbackSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity onPress={togglePlay} style={[styles.playButton, { backgroundColor: colors.primary }]}>
            <Ionicons name={isPlaying ? "pause" : "play"} size={32} color={colors.primary} style={styles.playIcon} />
          </TouchableOpacity>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modeSelector} contentContainerStyle={styles.modeSelectorContent}>
            {(['Full Mix', 'Original', 'Translated Vocals Only'] as PlaybackMode[]).map((mode) => {
              const isActive = playbackMode === mode;
              return (
                <TouchableOpacity
                  key={mode}
                  onPress={() => handleModeSelect(mode)}
                  style={[
                    styles.modeButton,
                    { backgroundColor: isActive ? colors.surface : 'transparent', borderColor: isActive ? colors.primary : colors.border }
                  ]}
                >
                  <Text style={[styles.modeText, { color: isActive ? colors.primary : colors.muted }]}>
                    {mode}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Lyrics Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Dual-Language Lyrics</Text>
          <View style={[styles.lyricsContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {lyricsData.map((line) => (
              <View key={line.id} style={[styles.lyricRow, { borderBottomColor: colors.surface }]}>
                <Text style={[styles.lyricOriginal, { color: colors.muted }]}>{line.original}</Text>
                <Text style={[styles.lyricTranslated, { color: colors.foreground }]}>{line.translated}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Vocabulary Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Key Vocabulary</Text>
          <View style={[styles.vocabContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {vocabData.map((item) => (
              <View key={item.id} style={[styles.vocabItem, { borderBottomColor: colors.surface }]}>
                <View style={styles.vocabWordContainer}>
                  <Text style={[styles.vocabWord, { color: colors.primary }]}>{item.word}</Text>
                  <Text style={[styles.vocabPos, { color: colors.muted }]}>{item.pos}</Text>
                </View>
                <Text style={[styles.vocabTranslation, { color: colors.foreground }]}>{item.translation}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <View style={styles.actionRow}>
            <TouchableOpacity onPress={() => handleAction('Save')} style={[styles.actionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="bookmark-outline" size={20} color={colors.foreground} />
              <Text style={[styles.actionButtonText, { color: colors.foreground }]}>Save to Library</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleAction('Share')} style={[styles.actionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="share-outline" size={20} color={colors.foreground} />
              <Text style={[styles.actionButtonText, { color: colors.foreground }]}>Share</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.actionRow}>
            <TouchableOpacity onPress={() => handleAction('Studio')} style={[styles.actionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="mic-outline" size={20} color={colors.foreground} />
              <Text style={[styles.actionButtonText, { color: colors.foreground }]}>Open in Studio</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleAction('Learn')} style={[styles.actionButton, { backgroundColor: colors.primary, borderColor: colors.glow }]}>
              <Ionicons name="school-outline" size={20} color={colors.primary} />
              <Text style={[styles.actionButtonText, { color: colors.primary, fontWeight: 'bold' }]}>Learn Vocabulary</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  albumArtPlaceholder: {
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    shadowColor: '#00AAFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  songTitle: {
    fontSize: FontSize.xxl,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  artistName: {
    fontSize: FontSize.md,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  languageBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  badgeArrow: {
    marginHorizontal: Spacing.sm,
  },
  playbackSection: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    alignItems: 'center',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    shadowColor: '#00CCFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  playIcon: {
    marginLeft: 4, // Visual center for play icon
  },
  modeSelector: {
    width: '100%',
  },
  modeSelectorContent: {
    paddingHorizontal: Spacing.xs,
    gap: Spacing.sm,
  },
  modeButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  modeText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    marginBottom: Spacing.md,
  },
  lyricsContainer: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  lyricRow: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  lyricOriginal: {
    flex: 1,
    fontSize: FontSize.md,
    paddingRight: Spacing.sm,
  },
  lyricTranslated: {
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: '500',
    paddingLeft: Spacing.sm,
  },
  vocabContainer: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  vocabItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  vocabWordContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flex: 1,
  },
  vocabWord: {
    fontSize: FontSize.md,
    fontWeight: 'bold',
    marginRight: Spacing.sm,
  },
  vocabPos: {
    fontSize: FontSize.xs,
    fontStyle: 'italic',
  },
  vocabTranslation: {
    fontSize: FontSize.md,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  actionSection: {
    gap: Spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  actionButtonText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  bottomPadding: {
    height: Spacing.xxl * 2,
  },
});
