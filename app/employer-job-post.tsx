import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { Colors, Spacing, BorderRadius, FontSize } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';

const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Remote'];
const LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Portuguese',
  'Mandarin', 'Japanese', 'Arabic', 'Korean', 'Italian'
];
const PROFICIENCY_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const CERTIFICATIONS = [
  'ConnectWorld AI Certified',
  'Anti-Cheat Verified',
  'Business Communication',
  'Medical Terminology'
];

export default function EmployerJobPostScreen() {
  const router = useRouter();
  const colors = useColors();

  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [jobType, setJobType] = useState('Full-time');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [proficiency, setProficiency] = useState('B2');
  const [selectedCerts, setSelectedCerts] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');

  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const toggleLanguage = (lang: string) => {
    Haptics.selectionAsync();
    setSelectedLanguages(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  const toggleCert = (cert: string) => {
    Haptics.selectionAsync();
    setSelectedCerts(prev =>
      prev.includes(cert) ? prev.filter(c => c !== cert) : [...prev, cert]
    );
  };

  const handlePostJob = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Submit logic would go here
    router.back();
  };

  const getInputStyle = (inputName: string) => [
    styles.input,
    {
      backgroundColor: colors.surface || '#0E1E38',
      color: colors.foreground || '#FFFFFF',
      borderColor: focusedInput === inputName ? (colors.glow || '#00CCFF') : (colors.border || 'rgba(0, 170, 255, 0.18)'),
      shadowColor: focusedInput === inputName ? (colors.glow || '#00CCFF') : 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: focusedInput === inputName ? 0.5 : 0,
      shadowRadius: focusedInput === inputName ? 8 : 0,
      elevation: focusedInput === inputName ? 4 : 0,
    }
  ];

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.foreground || '#FFFFFF'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground || '#FFFFFF' }]}>
            Create Job Post
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Job Title */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.muted || '#7EB8E0' }]}>Job Title</Text>
            <TextInput
              style={getInputStyle('title')}
              placeholder="e.g. Senior AI Translator"
              placeholderTextColor={colors.muted || '#3D5A7A'}
              value={title}
              onChangeText={setTitle}
              onFocus={() => setFocusedInput('title')}
              onBlur={() => setFocusedInput(null)}
            />
          </View>

          {/* Company Name */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.muted || '#7EB8E0' }]}>Company Name</Text>
            <TextInput
              style={getInputStyle('company')}
              placeholder="e.g. LinguaVibe Inc."
              placeholderTextColor={colors.muted || '#3D5A7A'}
              value={company}
              onChangeText={setCompany}
              onFocus={() => setFocusedInput('company')}
              onBlur={() => setFocusedInput(null)}
            />
          </View>

          {/* Location */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.muted || '#7EB8E0' }]}>Location</Text>
            <TextInput
              style={getInputStyle('location')}
              placeholder="e.g. Neo-Tokyo / Remote"
              placeholderTextColor={colors.muted || '#3D5A7A'}
              value={location}
              onChangeText={setLocation}
              onFocus={() => setFocusedInput('location')}
              onBlur={() => setFocusedInput(null)}
            />
          </View>

          {/* Job Type */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.muted || '#7EB8E0' }]}>Job Type</Text>
            <View style={styles.chipContainer}>
              {JOB_TYPES.map(type => {
                const isSelected = jobType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: isSelected ? (colors.primary || '#00AAFF') : (colors.surface || '#0E1E38'),
                        borderColor: isSelected ? (colors.glow || '#00CCFF') : (colors.border || 'rgba(0, 170, 255, 0.18)'),
                      }
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setJobType(type);
                    }}
                  >
                    <Text style={[
                      styles.chipText,
                      { color: isSelected ? '#FFFFFF' : (colors.muted || '#7EB8E0') }
                    ]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Required Languages */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.muted || '#7EB8E0' }]}>Required Languages</Text>
            <View style={styles.chipContainer}>
              {LANGUAGES.map(lang => {
                const isSelected = selectedLanguages.includes(lang);
                return (
                  <TouchableOpacity
                    key={lang}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: isSelected ? (colors.primary || '#00AAFF') : (colors.surface || '#0E1E38'),
                        borderColor: isSelected ? (colors.glow || '#00CCFF') : (colors.border || 'rgba(0, 170, 255, 0.18)'),
                      }
                    ]}
                    onPress={() => toggleLanguage(lang)}
                  >
                    <Text style={[
                      styles.chipText,
                      { color: isSelected ? '#FFFFFF' : (colors.muted || '#7EB8E0') }
                    ]}>
                      {lang}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Minimum Proficiency Level */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.muted || '#7EB8E0' }]}>Minimum Proficiency Level</Text>
            <View style={styles.chipContainer}>
              {PROFICIENCY_LEVELS.map(level => {
                const isSelected = proficiency === level;
                return (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: isSelected ? (colors.primary || '#00AAFF') : (colors.surface || '#0E1E38'),
                        borderColor: isSelected ? (colors.glow || '#00CCFF') : (colors.border || 'rgba(0, 170, 255, 0.18)'),
                      }
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setProficiency(level);
                    }}
                  >
                    <Text style={[
                      styles.chipText,
                      { color: isSelected ? '#FFFFFF' : (colors.muted || '#7EB8E0') }
                    ]}>
                      {level}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Required Certifications */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.muted || '#7EB8E0' }]}>Required Certifications</Text>
            {CERTIFICATIONS.map(cert => {
              const isSelected = selectedCerts.includes(cert);
              return (
                <TouchableOpacity
                  key={cert}
                  style={[
                    styles.checkboxRow,
                    {
                      backgroundColor: colors.surface || '#0E1E38',
                      borderColor: isSelected ? (colors.glow || '#00CCFF') : (colors.border || 'rgba(0, 170, 255, 0.18)'),
                    }
                  ]}
                  onPress={() => toggleCert(cert)}
                >
                  <View style={[
                    styles.checkbox,
                    {
                      borderColor: isSelected ? (colors.glow || '#00CCFF') : (colors.muted || '#3D5A7A'),
                      backgroundColor: isSelected ? (colors.primary || '#00AAFF') : 'transparent',
                    }
                  ]}>
                    {isSelected && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                  </View>
                  <Text style={[styles.checkboxText, { color: colors.foreground || '#FFFFFF' }]}>
                    {cert}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Salary Range */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.muted || '#7EB8E0' }]}>Salary Range (USD)</Text>
            <View style={styles.row}>
              <TextInput
                style={[getInputStyle('salaryMin'), { flex: 1, marginRight: 8 }]}
                placeholder="Min"
                placeholderTextColor={colors.muted || '#3D5A7A'}
                keyboardType="numeric"
                value={salaryMin}
                onChangeText={setSalaryMin}
                onFocus={() => setFocusedInput('salaryMin')}
                onBlur={() => setFocusedInput(null)}
              />
              <TextInput
                style={[getInputStyle('salaryMax'), { flex: 1, marginLeft: 8 }]}
                placeholder="Max"
                placeholderTextColor={colors.muted || '#3D5A7A'}
                keyboardType="numeric"
                value={salaryMax}
                onChangeText={setSalaryMax}
                onFocus={() => setFocusedInput('salaryMax')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>
          </View>

          {/* Job Description */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.muted || '#7EB8E0' }]}>Job Description</Text>
            <TextInput
              style={[getInputStyle('description'), styles.textArea]}
              placeholder="Describe the role, responsibilities, and requirements..."
              placeholderTextColor={colors.muted || '#3D5A7A'}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              value={description}
              onChangeText={setDescription}
              onFocus={() => setFocusedInput('description')}
              onBlur={() => setFocusedInput(null)}
            />
          </View>

          {/* Post Button */}
          <TouchableOpacity
            style={[styles.postButton, { backgroundColor: colors.primary || '#00AAFF' }]}
            onPress={handlePostJob}
          >
            <Text style={styles.postButtonText}>Post Job</Text>
          </TouchableOpacity>
          
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingHorizontal: Spacing?.lg || 24,
    paddingVertical: Spacing?.md || 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: FontSize?.xl || 20,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing?.lg || 24,
  },
  inputGroup: {
    marginBottom: Spacing?.xl || 24,
  },
  label: {
    fontSize: FontSize?.sm || 14,
    fontWeight: '600',
    marginBottom: Spacing?.sm || 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius?.md || 12,
    paddingHorizontal: Spacing?.md || 16,
    paddingVertical: Spacing?.md || 16,
    fontSize: FontSize?.md || 16,
  },
  textArea: {
    minHeight: 120,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing?.sm || 8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: BorderRadius?.full || 9999,
    paddingHorizontal: Spacing?.md || 16,
    paddingVertical: Spacing?.sm || 8,
    marginBottom: Spacing?.sm || 8,
    marginRight: Spacing?.sm || 8,
  },
  chipText: {
    fontSize: FontSize?.sm || 14,
    fontWeight: '600',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius?.md || 12,
    padding: Spacing?.md || 16,
    marginBottom: Spacing?.sm || 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderRadius: BorderRadius?.sm || 6,
    marginRight: Spacing?.md || 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxText: {
    fontSize: FontSize?.md || 16,
    fontWeight: '500',
  },
  postButton: {
    borderRadius: BorderRadius?.lg || 16,
    paddingVertical: Spacing?.lg || 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing?.md || 16,
    shadowColor: '#00CCFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
  },
  postButtonText: {
    color: '#FFFFFF',
    fontSize: FontSize?.lg || 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
