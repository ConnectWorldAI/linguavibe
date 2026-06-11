import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, ScrollView, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { trpc } from "@/lib/trpc";

// Mocking ScreenContainer and useColors since they are external dependencies
const ScreenContainer = ({ children, style }: any) => (
  <SafeAreaView style={[{ flex: 1, backgroundColor: '#040810' }, style]}>
    {children}
  </SafeAreaView>
);

const useColors = () => ({
  primary: '#040810',
  surfaceCard: '#0A1628',
  surfaceElevated: '#0E1E38',
  secondary: '#00AAFF',
  glow: '#00CCFF',
  gold: '#FFB800',
  textPrimary: '#FFFFFF',
  textSecondary: '#7EB8E0',
  textMuted: '#3D5A7A',
  success: '#00FF88',
  error: '#FF4444',
  border: 'rgba(0, 170, 255, 0.18)',
});

// Mock Data
const MOCK_CANDIDATES = [
  {
    id: '1',
    name: 'Elena Rodriguez',
    initials: 'ER',
    avatarColor: '#00AAFF',
    languages: [
      { name: 'Spanish', proficiency: 'C2' },
      { name: 'English', proficiency: 'C1' },
    ],
    certifications: ['Medical Interpreter', 'Legal Translation'],
    trustScore: 98,
    matchScore: 95,
    availability: 'Full-time',
  },
  {
    id: '2',
    name: 'Kenji Sato',
    initials: 'KS',
    avatarColor: '#FFB800',
    languages: [
      { name: 'Japanese', proficiency: 'C2' },
      { name: 'English', proficiency: 'B2' },
    ],
    certifications: ['Business Japanese'],
    trustScore: 92,
    matchScore: 88,
    availability: 'Part-time',
  },
  {
    id: '3',
    name: 'Amara Diallo',
    initials: 'AD',
    avatarColor: '#00FF88',
    languages: [
      { name: 'French', proficiency: 'C2' },
      { name: 'Wolof', proficiency: 'C2' },
      { name: 'English', proficiency: 'B1' },
    ],
    certifications: ['UN Interpreter'],
    trustScore: 99,
    matchScore: 85,
    availability: 'Contract',
  },
  {
    id: '4',
    name: 'Lucas Silva',
    initials: 'LS',
    avatarColor: '#FF4444',
    languages: [
      { name: 'Portuguese', proficiency: 'C2' },
      { name: 'English', proficiency: 'A2' },
    ],
    certifications: [],
    trustScore: 75,
    matchScore: 60,
    availability: 'Full-time',
  },
  {
    id: '5',
    name: 'Mei Lin',
    initials: 'ML',
    avatarColor: '#00CCFF',
    languages: [
      { name: 'Mandarin', proficiency: 'C2' },
      { name: 'English', proficiency: 'C1' },
      { name: 'Cantonese', proficiency: 'B2' },
    ],
    certifications: ['Technical Translation', 'Court Interpreter'],
    trustScore: 96,
    matchScore: 92,
    availability: 'Full-time',
  },
  {
    id: '6',
    name: 'Omar Hassan',
    initials: 'OH',
    avatarColor: '#9D00FF',
    languages: [
      { name: 'Arabic', proficiency: 'C2' },
      { name: 'English', proficiency: 'B2' },
      { name: 'French', proficiency: 'B1' },
    ],
    certifications: ['Diplomatic Translation'],
    trustScore: 88,
    matchScore: 78,
    availability: 'Part-time',
  },
];

const FILTERS = ['Language', 'Proficiency', 'Certification', 'Availability'];
const SORT_OPTIONS = ['Match Score', 'Trust Score', 'Proficiency'];

export default function CandidateSearchScreen() {
  const router = useRouter();
  const colors = useColors();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('Match Score');
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleFilterPress = (filter: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveFilter(activeFilter === filter ? null : filter);
  };

  const handleSortPress = (option: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSortBy(option);
    setShowSortDropdown(false);
  };

  const getProficiencyColor = (level: string) => {
    switch (level) {
      case 'A1':
      case 'A2':
        return colors.error;
      case 'B1':
        return colors.gold;
      case 'B2':
        return colors.secondary;
      case 'C1':
        return colors.success;
      case 'C2':
        return colors.gold;
      default:
        return colors.textMuted;
    }
  };

  const getTrustScoreColor = (score: number) => {
    if (score >= 95) return colors.success;
    if (score >= 85) return colors.secondary;
    if (score >= 70) return colors.gold;
    return colors.error;
  };

  const sortedCandidates = [...MOCK_CANDIDATES].sort((a, b) => {
    if (sortBy === 'Match Score') return b.matchScore - a.matchScore;
    if (sortBy === 'Trust Score') return b.trustScore - a.trustScore;
    // Simple proficiency sort based on first language
    if (sortBy === 'Proficiency') {
      const levelValues: Record<string, number> = { 'A1': 1, 'A2': 2, 'B1': 3, 'B2': 4, 'C1': 5, 'C2': 6 };
      const aLevel = levelValues[a.languages[0]?.proficiency] || 0;
      const bLevel = levelValues[b.languages[0]?.proficiency] || 0;
      return bLevel - aLevel;
    }
    return 0;
  });

  const filteredCandidates = sortedCandidates.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.languages.some(l => l.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderCandidateCard = ({ item }: { item: typeof MOCK_CANDIDATES[0] }) => (
    <View style={[styles.card, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <View style={styles.userInfo}>
          <View style={[styles.avatar, { backgroundColor: item.avatarColor + '33', borderColor: item.avatarColor }]}>
            <Text style={[styles.avatarText, { color: item.avatarColor }]}>{item.initials}</Text>
          </View>
          <View style={styles.nameContainer}>
            <Text style={[styles.name, { color: colors.textPrimary }]}>{item.name}</Text>
            <Text style={[styles.availability, { color: colors.textSecondary }]}>{item.availability}</Text>
          </View>
        </View>
        <View style={styles.scoresContainer}>
          <View style={styles.scoreBadge}>
            <Text style={[styles.scoreLabel, { color: colors.textMuted }]}>Match</Text>
            <Text style={[styles.scoreValue, { color: colors.glow }]}>{item.matchScore}%</Text>
          </View>
          <View style={styles.scoreBadge}>
            <Text style={[styles.scoreLabel, { color: colors.textMuted }]}>Trust</Text>
            <Text style={[styles.scoreValue, { color: getTrustScoreColor(item.trustScore) }]}>{item.trustScore}%</Text>
          </View>
        </View>
      </View>

      <View style={styles.languagesContainer}>
        {item.languages.map((lang, index) => (
          <View key={index} style={[styles.languageBadge, { backgroundColor: colors.surfaceElevated }]}>
            <Text style={[styles.languageName, { color: colors.textPrimary }]}>{lang.name}</Text>
            <View style={[styles.proficiencyDot, { backgroundColor: getProficiencyColor(lang.proficiency) }]} />
            <Text style={[styles.proficiencyText, { color: getProficiencyColor(lang.proficiency) }]}>{lang.proficiency}</Text>
          </View>
        ))}
      </View>

      {item.certifications.length > 0 && (
        <View style={styles.certificationsContainer}>
          {item.certifications.map((cert, index) => (
            <View key={index} style={[styles.certBadge, { borderColor: colors.textMuted }]}>
              <Ionicons name="ribbon" size={12} color={colors.gold} style={styles.certIcon} />
              <Text style={[styles.certText, { color: colors.textSecondary }]}>{cert}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.cardActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.secondaryButton, { borderColor: colors.secondary }]}
          onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.secondary }]}>View Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.primaryButton, { backgroundColor: colors.secondary }]}
          onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
        >
          <Text style={[styles.primaryButtonText, { color: colors.primary }]}>Invite to Interview</Text>
        </TouchableOpacity>
      </View>
    </View>
  );


  // Load persisted data from AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('@candidate_search_data');
        if (stored) {
          // Data available from sync/server
        }
      } catch {}
    })();
  }, []);
  return (
    <ScreenContainer>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Candidate Search</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
          <Ionicons name="search" size={20} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search by name or language..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
          {FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterChip,
                { backgroundColor: colors.surfaceCard, borderColor: colors.border },
                activeFilter === filter && { backgroundColor: colors.secondary + '33', borderColor: colors.secondary }
              ]}
              onPress={() => handleFilterPress(filter)}
            >
              <Text style={[
                styles.filterText,
                { color: colors.textSecondary },
                activeFilter === filter && { color: colors.secondary, fontWeight: '600' }
              ]}>
                {filter}
              </Text>
              <Ionicons 
                name="chevron-down" 
                size={14} 
                color={activeFilter === filter ? colors.secondary : colors.textMuted} 
                style={styles.filterIcon} 
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.sortContainer}>
        <Text style={[styles.resultsCount, { color: colors.textMuted }]}>
          {filteredCandidates.length} candidates found
        </Text>
        <View style={styles.sortWrapper}>
          <TouchableOpacity 
            style={styles.sortButton}
            onPress={() => setShowSortDropdown(!showSortDropdown)}
          >
            <Text style={[styles.sortText, { color: colors.textSecondary }]}>Sort by: {sortBy}</Text>
            <Ionicons name="swap-vertical" size={16} color={colors.textSecondary} style={styles.sortIcon} />
          </TouchableOpacity>
          
          {showSortDropdown && (
            <View style={[styles.sortDropdown, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              {SORT_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.sortOption, sortBy === option && { backgroundColor: colors.surfaceCard }]}
                  onPress={() => handleSortPress(option)}
                >
                  <Text style={[
                    styles.sortOptionText, 
                    { color: colors.textSecondary },
                    sortBy === option && { color: colors.secondary, fontWeight: '600' }
                  ]}>
                    {option}
                  </Text>
                  {sortBy === option && <Ionicons name="checkmark" size={16} color={colors.secondary} />}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      <FlatList
        data={filteredCandidates}
        keyExtractor={(item) => item.id}
        renderItem={renderCandidateCard}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  filtersContainer: {
    marginBottom: 16,
  },
  filtersScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  filterIcon: {
    marginLeft: 4,
  },
  sortContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
    zIndex: 10,
  },
  resultsCount: {
    fontSize: 14,
  },
  sortWrapper: {
    position: 'relative',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortText: {
    fontSize: 14,
    fontWeight: '500',
  },
  sortIcon: {
    marginLeft: 4,
  },
  sortDropdown: {
    position: 'absolute',
    top: 24,
    right: 0,
    borderWidth: 1,
    borderRadius: 8,
    width: 160,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sortOptionText: {
    fontSize: 14,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 16,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  nameContainer: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  availability: {
    fontSize: 12,
  },
  scoresContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scoreLabel: {
    fontSize: 12,
  },
  scoreValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  languagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  languageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  languageName: {
    fontSize: 13,
    marginRight: 6,
  },
  proficiencyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  proficiencyText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  certificationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  certBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  certIcon: {
    marginRight: 4,
  },
  certText: {
    fontSize: 11,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  actionButton: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: {
  },
  secondaryButton: {
    borderWidth: 1,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
