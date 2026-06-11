import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { trpc } from "@/lib/trpc";
import { Colors, Spacing, BorderRadius, FontSize } from '@/constants/Colors';

type Tab = 'Dashboard' | 'Jobs' | 'Candidates';

interface Job {
  id: string;
  title: string;
  languages: string[];
  applicantCount: number;
  status: 'active' | 'closed' | 'draft';
}

interface Candidate {
  id: string;
  name: string;
  languages: string[];
  proficiency: string;
  verified: boolean;
  matchScore: number;
}

const MOCK_JOBS: Job[] = [
  { id: '1', title: 'Senior Frontend Developer', languages: ['English', 'Spanish'], applicantCount: 45, status: 'active' },
  { id: '2', title: 'Product Manager', languages: ['English', 'French'], applicantCount: 12, status: 'active' },
  { id: '3', title: 'Customer Support Specialist', languages: ['German', 'English'], applicantCount: 89, status: 'closed' },
  { id: '4', title: 'Data Analyst', languages: ['English', 'Japanese'], applicantCount: 0, status: 'draft' },
];

const MOCK_CANDIDATES: Candidate[] = [
  { id: '1', name: 'Alex Johnson', languages: ['English', 'Spanish'], proficiency: 'C1', verified: true, matchScore: 95 },
  { id: '2', name: 'Maria Garcia', languages: ['Spanish', 'French'], proficiency: 'B2', verified: true, matchScore: 88 },
  { id: '3', name: 'Kenji Sato', languages: ['Japanese', 'English'], proficiency: 'C2', verified: false, matchScore: 76 },
  { id: '4', name: 'Sophie Martin', languages: ['French', 'German'], proficiency: 'B1', verified: true, matchScore: 92 },
];

export default function EmployerPortalScreen() {
  const router = useRouter();
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<Tab>('Dashboard');
  const [jobsList, setJobsList] = useState(MOCK_JOBS);
  const [candidatesList, setCandidatesList] = useState(MOCK_CANDIDATES);

  // Load employer data from AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const storedJobs = await AsyncStorage.getItem('@employer_jobs');
        if (storedJobs) setJobsList(JSON.parse(storedJobs));
        const storedCandidates = await AsyncStorage.getItem('@employer_candidates');
        if (storedCandidates) setCandidatesList(JSON.parse(storedCandidates));
      } catch {}
    })();
  }, []);

  const handleTabPress = (tab: Tab) => {
    Haptics.selectionAsync();
    setActiveTab(tab);
  };

  const handleActionPress = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route as any);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={[styles.companyName, { color: colors.foreground }]}>Acme Corp</Text>
      <Text style={[styles.tagline, { color: colors.muted }]}>
        <Text style={{ color: '#FFB800' }}>Hire Real.</Text> AI-Verified Talent.
      </Text>
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      {(['Dashboard', 'Jobs', 'Candidates'] as Tab[]).map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[
            styles.tab,
            activeTab === tab && [styles.activeTab, { borderBottomColor: colors.primary }]
          ]}
          onPress={() => handleTabPress(tab)}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === tab ? colors.primary : colors.muted }
            ]}
          >
            {tab}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderDashboard = () => (
    <ScrollView style={styles.tabContent} contentContainerStyle={styles.scrollContent}>
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.statValue, { color: colors.foreground }]}>12</Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>Active Jobs</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.statValue, { color: colors.foreground }]}>847</Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>Candidates Viewed</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.statValue, { color: colors.foreground }]}>5</Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>Interviews Scheduled</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.statValue, { color: colors.success }]}>98%</Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>AI Detection Score</Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => handleActionPress('/employer-job-post')}
        >
          <Text style={[styles.actionText, { color: colors.primary }]}>Post New Job</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => handleActionPress('/candidate-search')}
        >
          <Text style={[styles.actionText, { color: colors.primary }]}>Search Candidates</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => handleActionPress('/interview-detection')}
        >
          <Text style={[styles.actionText, { color: colors.primary }]}>Start Interview</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => handleActionPress('/reports')}
        >
          <Text style={[styles.actionText, { color: colors.primary }]}>View Reports</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Activity</Text>
      <View style={[styles.activityCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.activityText, { color: colors.foreground }]}>Alex Johnson completed an interview.</Text>
        <Text style={[styles.activityTime, { color: colors.muted }]}>2 hours ago</Text>
      </View>
      <View style={[styles.activityCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.activityText, { color: colors.foreground }]}>New application for Senior Frontend Developer.</Text>
        <Text style={[styles.activityTime, { color: colors.muted }]}>5 hours ago</Text>
      </View>
    </ScrollView>
  );

  const renderJobs = () => (
    <FlatList
      data={jobsList}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      renderItem={({ item }) => (
        <View style={[styles.jobCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.jobHeader}>
            <Text style={[styles.jobTitle, { color: colors.foreground }]}>{item.title}</Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: item.status === 'active' ? 'rgba(0, 255, 136, 0.1)' : item.status === 'closed' ? 'rgba(255, 68, 68, 0.1)' : 'rgba(126, 184, 224, 0.1)' }
            ]}>
              <Text style={[
                styles.statusText,
                { color: item.status === 'active' ? colors.success : item.status === 'closed' ? colors.error : colors.muted }
              ]}>
                {item.status.toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={[styles.jobLanguages, { color: colors.muted }]}>
            Requires: {item.languages.join(', ')}
          </Text>
          <Text style={[styles.jobApplicants, { color: colors.muted }]}>
            {item.applicantCount} Applicants
          </Text>
        </View>
      )}
    />
  );

  const renderCandidates = () => (
    <FlatList
      data={candidatesList}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      renderItem={({ item }) => (
        <View style={[styles.candidateCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.candidateHeader}>
            <Text style={[styles.candidateName, { color: colors.foreground }]}>{item.name}</Text>
            <View style={styles.scoreContainer}>
              <Text style={[styles.scoreText, { color: colors.glow }]}>{item.matchScore}% Match</Text>
            </View>
          </View>
          <View style={styles.candidateDetails}>
            <Text style={[styles.candidateLanguages, { color: colors.muted }]}>
              {item.languages.join(', ')} • {item.proficiency}
            </Text>
            {item.verified && (
              <View style={styles.verifiedBadge}>
                <Text style={[styles.verifiedText, { color: colors.success }]}>✓ Anti-Cheat Verified</Text>
              </View>
            )}
          </View>
        </View>
      )}
    />
  );

  return (
    <ScreenContainer style={{ backgroundColor: colors.primary }}>
      {renderHeader()}
      {renderTabs()}
      <View style={styles.contentContainer}>
        {activeTab === 'Dashboard' && renderDashboard()}
        {activeTab === 'Jobs' && renderJobs()}
        {activeTab === 'Candidates' && renderCandidates()}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  companyName: {
    fontSize: FontSize.xxl,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  tagline: {
    fontSize: FontSize.md,
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  listContent: {
    padding: Spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  statCard: {
    width: '48%',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: FontSize.sm,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  actionButton: {
    width: '48%',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  actionText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  activityCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  activityText: {
    fontSize: FontSize.md,
    marginBottom: Spacing.xs,
  },
  activityTime: {
    fontSize: FontSize.sm,
  },
  jobCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  jobTitle: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginLeft: Spacing.sm,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: 'bold',
  },
  jobLanguages: {
    fontSize: FontSize.md,
    marginBottom: Spacing.xs,
  },
  jobApplicants: {
    fontSize: FontSize.sm,
  },
  candidateCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  candidateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  candidateName: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
  },
  scoreContainer: {
    backgroundColor: 'rgba(0, 204, 255, 0.1)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  scoreText: {
    fontSize: FontSize.sm,
    fontWeight: 'bold',
  },
  candidateDetails: {
    flexDirection: 'column',
  },
  candidateLanguages: {
    fontSize: FontSize.md,
    marginBottom: Spacing.xs,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  verifiedText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
});
