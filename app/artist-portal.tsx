import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  TextInput,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/screen-container';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { trpc } from "@/lib/trpc";
import * as Haptics from 'expo-haptics';

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

type TabKey = 'dashboard' | 'upload' | 'catalog' | 'earnings';

interface Song {
  id: string;
  title: string;
  status: 'pending' | 'translating' | 'complete' | 'live';
  languages: string[];
  plays: number;
  earnings: number;
  uploadDate: string;
}

const SAMPLE_SONGS: Song[] = [
  { id: '1', title: 'Mi Corazón Roto', status: 'live', languages: ['English', 'French', 'Portuguese'], plays: 12400, earnings: 186.00, uploadDate: '2025-12-15' },
  { id: '2', title: 'Noche de Fuego', status: 'live', languages: ['English', 'Japanese', 'German'], plays: 8700, earnings: 130.50, uploadDate: '2026-01-20' },
  { id: '3', title: 'Bailando en la Luna', status: 'translating', languages: ['English', 'Korean'], plays: 0, earnings: 0, uploadDate: '2026-05-10' },
  { id: '4', title: 'Amor Prohibido', status: 'pending', languages: ['English', 'Italian', 'Mandarin'], plays: 0, earnings: 0, uploadDate: '2026-05-20' },
];

const GENRES = ['Reggaeton', 'Bachata', 'Pop', 'R&B', 'Hip-Hop', 'Rock', 'Electronic', 'Latin Trap', 'Salsa', 'Cumbia'];
const LANGUAGES = ['English', 'Spanish', 'French', 'Portuguese', 'Japanese', 'Korean', 'German', 'Italian', 'Mandarin', 'Arabic', 'Hindi'];

export default function ArtistPortalScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [uploadStep, setUploadStep] = useState(0);
  const [songTitle, setSongTitle] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [songLanguage, setSongLanguage] = useState('');

  const [songs, setSongs] = useState(SAMPLE_SONGS);
  const haptic = () => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); };

  // Load artist songs from AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('@artist_songs');
        if (stored) setSongs(JSON.parse(stored));
      } catch {}
    })();
  }, []);

  const totalPlays = songs.reduce((sum, s) => sum + s.plays, 0);
  const totalEarnings = songs.reduce((sum, s) => sum + s.earnings, 0);
  const liveSongs = songs.filter(s => s.status === 'live').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return Colors.accent;
      case 'translating': return Colors.gold;
      case 'complete': return Colors.cyan;
      case 'pending': return Colors.textSecondary;
      default: return Colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'live': return 'radio-outline';
      case 'translating': return 'sync-outline';
      case 'complete': return 'checkmark-circle-outline';
      case 'pending': return 'time-outline';
      default: return 'ellipse-outline';
    }
  };

  const toggleLanguage = (lang: string) => {
    haptic();
    setSelectedLanguages(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  const renderDashboard = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      {/* Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Ionicons name="musical-notes" size={24} color={Colors.primary} />
          <Text style={styles.statValue}>{songs.length}</Text>
          <Text style={styles.statLabel}>Songs</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="radio-outline" size={24} color={Colors.accent} />
          <Text style={styles.statValue}>{liveSongs}</Text>
          <Text style={styles.statLabel}>Live</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="play-circle-outline" size={24} color={Colors.cyan} />
          <Text style={styles.statValue}>{(totalPlays / 1000).toFixed(1)}k</Text>
          <Text style={styles.statLabel}>Plays</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="cash-outline" size={24} color={Colors.gold} />
          <Text style={styles.statValue}>${totalEarnings.toFixed(0)}</Text>
          <Text style={styles.statLabel}>Earned</Text>
        </View>
      </View>

      {/* Revenue Chart Placeholder */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Monthly Revenue</Text>
        <View style={styles.chartBars}>
          {[45, 62, 78, 95, 130, 186].map((val, i) => (
            <View key={i} style={styles.chartBarCol}>
              <View style={[styles.chartBar, { height: (val / 186) * 80 }]} />
              <Text style={styles.chartBarLabel}>{['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'][i]}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
      </View>
      {songs.slice(0, 3).map(song => (
        <View key={song.id} style={styles.activityCard}>
          <View style={[styles.activityDot, { backgroundColor: getStatusColor(song.status) }]} />
          <View style={styles.activityInfo}>
            <Text style={styles.activityTitle}>{song.title}</Text>
            <Text style={styles.activityMeta}>
              {song.status === 'live' ? `${song.plays.toLocaleString()} plays` : song.status.charAt(0).toUpperCase() + song.status.slice(1)}
            </Text>
          </View>
          <Ionicons name={getStatusIcon(song.status) as any} size={20} color={getStatusColor(song.status)} />
        </View>
      ))}

      {/* How It Works */}
      <View style={styles.howItWorks}>
        <Text style={styles.howTitle}>How It Works</Text>
        <View style={styles.howStep}>
          <View style={styles.howStepNum}><Text style={styles.howStepNumText}>1</Text></View>
          <View style={styles.howStepContent}>
            <Text style={styles.howStepTitle}>Upload Your Song</Text>
            <Text style={styles.howStepDesc}>Upload audio + lyrics in any language</Text>
          </View>
        </View>
        <View style={styles.howStep}>
          <View style={styles.howStepNum}><Text style={styles.howStepNumText}>2</Text></View>
          <View style={styles.howStepContent}>
            <Text style={styles.howStepTitle}>Choose Target Languages</Text>
            <Text style={styles.howStepDesc}>Select which languages to translate into</Text>
          </View>
        </View>
        <View style={styles.howStep}>
          <View style={styles.howStepNum}><Text style={styles.howStepNumText}>3</Text></View>
          <View style={styles.howStepContent}>
            <Text style={styles.howStepTitle}>AI Translates & Adapts</Text>
            <Text style={styles.howStepDesc}>We translate lyrics while preserving rhythm and meaning</Text>
          </View>
        </View>
        <View style={styles.howStep}>
          <View style={styles.howStepNum}><Text style={styles.howStepNumText}>4</Text></View>
          <View style={styles.howStepContent}>
            <Text style={styles.howStepTitle}>Earn From Learners</Text>
            <Text style={styles.howStepDesc}>Get paid when learners use your songs to study</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderUpload = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      {/* Step Indicator */}
      <View style={styles.stepIndicator}>
        {['Song File', 'Details', 'Languages', 'Review'].map((step, i) => (
          <View key={i} style={styles.stepItem}>
            <View style={[styles.stepDot, i <= uploadStep && styles.stepDotActive]}>
              <Text style={[styles.stepDotText, i <= uploadStep && styles.stepDotTextActive]}>{i + 1}</Text>
            </View>
            <Text style={[styles.stepLabel, i <= uploadStep && styles.stepLabelActive]}>{step}</Text>
          </View>
        ))}
      </View>

      {uploadStep === 0 && (
        <View style={styles.uploadArea}>
          <TouchableOpacity style={styles.uploadBox} onPress={() => { haptic(); setUploadStep(1); }}>
            <Ionicons name="cloud-upload-outline" size={48} color={Colors.primary} />
            <Text style={styles.uploadBoxTitle}>Upload Song File</Text>
            <Text style={styles.uploadBoxDesc}>MP3, WAV, M4A, FLAC • Max 50MB</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.uploadBox} onPress={() => { haptic(); setUploadStep(1); }}>
            <Ionicons name="document-text-outline" size={48} color={Colors.accent} />
            <Text style={styles.uploadBoxTitle}>Upload Lyrics</Text>
            <Text style={styles.uploadBoxDesc}>TXT, LRC, or paste directly</Text>
          </TouchableOpacity>
        </View>
      )}

      {uploadStep === 1 && (
        <View style={styles.formSection}>
          <Text style={styles.formLabel}>Song Title</Text>
          <TextInput
            style={styles.formInput}
            value={songTitle}
            onChangeText={setSongTitle}
            placeholder="Enter song title..."
            placeholderTextColor={Colors.textSecondary}
          />
          <Text style={styles.formLabel}>Original Language</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            <View style={styles.chipRow}>
              {['Spanish', 'English', 'Portuguese', 'French', 'Korean', 'Japanese'].map(lang => (
                <TouchableOpacity
                  key={lang}
                  style={[styles.chip, songLanguage === lang && styles.chipActive]}
                  onPress={() => { haptic(); setSongLanguage(lang); }}
                >
                  <Text style={[styles.chipText, songLanguage === lang && styles.chipTextActive]}>{lang}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <Text style={styles.formLabel}>Genre</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            <View style={styles.chipRow}>
              {GENRES.map(g => (
                <TouchableOpacity
                  key={g}
                  style={[styles.chip, selectedGenre === g && styles.chipActive]}
                  onPress={() => { haptic(); setSelectedGenre(g); }}
                >
                  <Text style={[styles.chipText, selectedGenre === g && styles.chipTextActive]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <TouchableOpacity style={styles.nextBtn} onPress={() => setUploadStep(2)}>
            <Text style={styles.nextBtnText}>Next: Choose Languages</Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.dark} />
          </TouchableOpacity>
        </View>
      )}

      {uploadStep === 2 && (
        <View style={styles.formSection}>
          <Text style={styles.formLabel}>Translate Into ({selectedLanguages.length} selected)</Text>
          <Text style={styles.formHint}>Choose languages your song will be translated into for learners</Text>
          <View style={styles.languageGrid}>
            {LANGUAGES.map(lang => (
              <TouchableOpacity
                key={lang}
                style={[styles.langChip, selectedLanguages.includes(lang) && styles.langChipActive]}
                onPress={() => toggleLanguage(lang)}
              >
                <Ionicons
                  name={selectedLanguages.includes(lang) ? 'checkmark-circle' : 'add-circle-outline'}
                  size={18}
                  color={selectedLanguages.includes(lang) ? Colors.accent : Colors.textSecondary}
                />
                <Text style={[styles.langChipText, selectedLanguages.includes(lang) && styles.langChipTextActive]}>{lang}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.priorityNote}>
            <Ionicons name="flash" size={16} color={Colors.gold} />
            <Text style={styles.priorityNoteText}>Priority translations (English, Spanish, Portuguese) are processed within 24 hours</Text>
          </View>
          <TouchableOpacity style={styles.nextBtn} onPress={() => setUploadStep(3)}>
            <Text style={styles.nextBtnText}>Next: Review</Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.dark} />
          </TouchableOpacity>
        </View>
      )}

      {uploadStep === 3 && (
        <View style={styles.formSection}>
          <View style={styles.reviewCard}>
            <Text style={styles.reviewTitle}>Review Submission</Text>
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Title</Text>
              <Text style={styles.reviewValue}>{songTitle || 'Untitled'}</Text>
            </View>
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Language</Text>
              <Text style={styles.reviewValue}>{songLanguage || 'Not set'}</Text>
            </View>
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Genre</Text>
              <Text style={styles.reviewValue}>{selectedGenre || 'Not set'}</Text>
            </View>
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Translate Into</Text>
              <Text style={styles.reviewValue}>{selectedLanguages.join(', ') || 'None'}</Text>
            </View>
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Revenue Share</Text>
              <Text style={[styles.reviewValue, { color: Colors.gold }]}>70% to you</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: Colors.accent }]}
            onPress={() => { haptic(); setUploadStep(0); setSongTitle(''); setSelectedGenre(''); setSelectedLanguages([]); setSongLanguage(''); }}
          >
            <Ionicons name="checkmark-circle" size={18} color={Colors.dark} />
            <Text style={[styles.nextBtnText, { color: Colors.dark }]}>Submit for Translation</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );

  const renderCatalog = () => (
    <FlatList
      data={songs}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.scrollContent}
      renderItem={({ item }) => (
        <View style={styles.catalogCard}>
          <View style={styles.catalogHeader}>
            <View style={styles.catalogIcon}>
              <Ionicons name="musical-note" size={20} color={Colors.primary} />
            </View>
            <View style={styles.catalogInfo}>
              <Text style={styles.catalogTitle}>{item.title}</Text>
              <Text style={styles.catalogMeta}>Uploaded {item.uploadDate}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
            </View>
          </View>
          <View style={styles.catalogLanguages}>
            {item.languages.map((lang, i) => (
              <View key={i} style={styles.langTag}>
                <Text style={styles.langTagText}>{lang}</Text>
              </View>
            ))}
          </View>
          {item.status === 'live' && (
            <View style={styles.catalogStats}>
              <View style={styles.catalogStatItem}>
                <Ionicons name="play" size={14} color={Colors.cyan} />
                <Text style={styles.catalogStatText}>{item.plays.toLocaleString()} plays</Text>
              </View>
              <View style={styles.catalogStatItem}>
                <Ionicons name="cash" size={14} color={Colors.gold} />
                <Text style={styles.catalogStatText}>${item.earnings.toFixed(2)}</Text>
              </View>
            </View>
          )}
        </View>
      )}
    />
  );

  const renderEarnings = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      <View style={styles.earningsHeader}>
        <Text style={styles.earningsTotal}>${totalEarnings.toFixed(2)}</Text>
        <Text style={styles.earningsLabel}>Total Earnings</Text>
      </View>
      <View style={styles.earningsBreakdown}>
        <Text style={styles.breakdownTitle}>Revenue Model</Text>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Your Share</Text>
          <Text style={[styles.breakdownValue, { color: Colors.accent }]}>70%</Text>
        </View>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Platform Fee</Text>
          <Text style={styles.breakdownValue}>30%</Text>
        </View>
        <View style={styles.breakdownDivider} />
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Per Play Rate</Text>
          <Text style={styles.breakdownValue}>$0.015</Text>
        </View>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Per Lesson Use</Text>
          <Text style={styles.breakdownValue}>$0.025</Text>
        </View>
      </View>
      <View style={styles.payoutCard}>
        <Ionicons name="wallet-outline" size={24} color={Colors.gold} />
        <View style={styles.payoutInfo}>
          <Text style={styles.payoutTitle}>Next Payout</Text>
          <Text style={styles.payoutAmount}>${totalEarnings.toFixed(2)} on June 1, 2026</Text>
        </View>
      </View>
      <View style={styles.songEarnings}>
        <Text style={styles.sectionTitle}>Earnings by Song</Text>
        {songs.filter(s => s.earnings > 0).map(song => (
          <View key={song.id} style={styles.songEarningRow}>
            <Text style={styles.songEarningTitle}>{song.title}</Text>
            <Text style={styles.songEarningAmount}>${song.earnings.toFixed(2)}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'dashboard', label: 'Home', icon: 'grid-outline' },
    { key: 'upload', label: 'Upload', icon: 'cloud-upload-outline' },
    { key: 'catalog', label: 'Songs', icon: 'musical-notes-outline' },
    { key: 'earnings', label: 'Earnings', icon: 'cash-outline' },
  ];

  return (
    <ScreenContainer containerClassName="bg-[#0a0a0f]">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Artist Portal</Text>
          <TouchableOpacity style={styles.profileBtn}>
            <Ionicons name="person-circle-outline" size={28} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Tab Bar */}
        <View style={styles.tabBar}>
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => { haptic(); setActiveTab(tab.key); }}
            >
              <Ionicons name={tab.icon as any} size={20} color={activeTab === tab.key ? Colors.primary : Colors.textSecondary} />
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'upload' && renderUpload()}
        {activeTab === 'catalog' && renderCatalog()}
        {activeTab === 'earnings' && renderEarnings()}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  profileBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  tabBar: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, backgroundColor: Colors.surface, borderRadius: 14, padding: 4 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 10, borderRadius: 10 },
  tabActive: { backgroundColor: Colors.primary + '20' },
  tabText: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary },
  tabTextActive: { color: Colors.primary },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 100 },
  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: Colors.card, borderRadius: 14, padding: 14, alignItems: 'center', gap: 6 },
  statValue: { fontSize: 20, fontWeight: '800', color: Colors.text },
  statLabel: { fontSize: 10, color: Colors.textSecondary },
  chartCard: { backgroundColor: Colors.card, borderRadius: 16, padding: 16, marginBottom: 16 },
  chartTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 16 },
  chartBars: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 100 },
  chartBarCol: { alignItems: 'center', gap: 6 },
  chartBar: { width: 28, backgroundColor: Colors.primary, borderRadius: 6 },
  chartBarLabel: { fontSize: 10, color: Colors.textSecondary },
  sectionHeader: { marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  activityCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 12, padding: 14, marginBottom: 10, gap: 12 },
  activityDot: { width: 10, height: 10, borderRadius: 5 },
  activityInfo: { flex: 1 },
  activityTitle: { fontSize: 14, fontWeight: '600', color: Colors.text },
  activityMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  howItWorks: { backgroundColor: Colors.card, borderRadius: 16, padding: 16, marginTop: 16 },
  howTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 16 },
  howStep: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16, gap: 12 },
  howStepNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primary + '30', alignItems: 'center', justifyContent: 'center' },
  howStepNumText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  howStepContent: { flex: 1 },
  howStepTitle: { fontSize: 14, fontWeight: '600', color: Colors.text },
  howStepDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  uploadArea: { gap: 16 },
  uploadBox: { backgroundColor: Colors.card, borderRadius: 16, padding: 30, alignItems: 'center', gap: 10, borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed' },
  uploadBoxTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  uploadBoxDesc: { fontSize: 12, color: Colors.textSecondary },
  formSection: { gap: 16 },
  formLabel: { fontSize: 14, fontWeight: '700', color: Colors.text },
  formHint: { fontSize: 12, color: Colors.textSecondary, marginTop: -8 },
  formInput: { backgroundColor: Colors.card, borderRadius: 12, padding: 14, fontSize: 15, color: Colors.text, borderWidth: 1, borderColor: Colors.border },
  chipScroll: { maxHeight: 44 },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primary + '30', borderColor: Colors.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive: { color: Colors.primary },
  languageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  langChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  langChipActive: { borderColor: Colors.accent, backgroundColor: Colors.accent + '10' },
  langChipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  langChipTextActive: { color: Colors.accent },
  priorityNote: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.gold + '10', padding: 12, borderRadius: 10 },
  priorityNoteText: { fontSize: 12, color: Colors.gold, flex: 1 },
  nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.gold, paddingVertical: 14, borderRadius: 14 },
  nextBtnText: { fontSize: 15, fontWeight: '700', color: Colors.dark },
  reviewCard: { backgroundColor: Colors.card, borderRadius: 16, padding: 16, gap: 12 },
  reviewTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between' },
  reviewLabel: { fontSize: 13, color: Colors.textSecondary },
  reviewValue: { fontSize: 13, fontWeight: '600', color: Colors.text },
  catalogCard: { backgroundColor: Colors.card, borderRadius: 14, padding: 14, marginBottom: 12 },
  catalogHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  catalogIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: Colors.primary + '20', alignItems: 'center', justifyContent: 'center' },
  catalogInfo: { flex: 1 },
  catalogTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  catalogMeta: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  catalogLanguages: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  langTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: Colors.surface },
  langTagText: { fontSize: 11, color: Colors.textSecondary },
  catalogStats: { flexDirection: 'row', gap: 16, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border },
  catalogStatItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  catalogStatText: { fontSize: 12, color: Colors.textSecondary },
  earningsHeader: { alignItems: 'center', paddingVertical: 30, backgroundColor: Colors.card, borderRadius: 16, marginBottom: 16 },
  earningsTotal: { fontSize: 36, fontWeight: '800', color: Colors.gold },
  earningsLabel: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  earningsBreakdown: { backgroundColor: Colors.card, borderRadius: 16, padding: 16, marginBottom: 16, gap: 12 },
  breakdownTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between' },
  breakdownLabel: { fontSize: 13, color: Colors.textSecondary },
  breakdownValue: { fontSize: 13, fontWeight: '700', color: Colors.text },
  breakdownDivider: { height: 1, backgroundColor: Colors.border },
  payoutCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: Colors.gold + '10', borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.gold + '30' },
  payoutInfo: { flex: 1 },
  payoutTitle: { fontSize: 13, fontWeight: '700', color: Colors.gold },
  payoutAmount: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  songEarnings: { gap: 10 },
  songEarningRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: Colors.card, borderRadius: 12, padding: 14 },
  songEarningTitle: { fontSize: 14, fontWeight: '600', color: Colors.text },
  songEarningAmount: { fontSize: 14, fontWeight: '700', color: Colors.gold },
  stepIndicator: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  stepItem: { alignItems: 'center', gap: 6 },
  stepDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  stepDotActive: { backgroundColor: Colors.primary + '30', borderColor: Colors.primary },
  stepDotText: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  stepDotTextActive: { color: Colors.primary },
  stepLabel: { fontSize: 10, color: Colors.textSecondary },
  stepLabelActive: { color: Colors.primary },
});
