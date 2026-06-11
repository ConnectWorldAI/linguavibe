import { useState, useMemo } from 'react';
import { Text, View, FlatList, Pressable, TextInput, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { TEACHER_REGISTRY, getRecommendedTeachers, getDialectMatchedTeachers, type Teacher } from '@/lib/teacher-registry';

const STORAGE_KEY = 'selected_teachers';

export default function ChooseTeacherScreen() {
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ from?: string; targetLanguage?: string; dialectCode?: string }>();
  const isOnboarding = params.from === 'onboarding';
  const targetLanguage = params.targetLanguage || '';
  const dialectCode = params.dialectCode || '';

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGender, setFilterGender] = useState<'all' | 'male' | 'female'>('all');

  const recommended = useMemo(() => {
    if (!targetLanguage) return [];
    // Use dialect-aware matching if a specific dialect was chosen
    if (dialectCode) {
      return getDialectMatchedTeachers(dialectCode, targetLanguage);
    }
    return getRecommendedTeachers(targetLanguage);
  }, [targetLanguage, dialectCode]);

  const filteredTeachers = useMemo(() => {
    let list = TEACHER_REGISTRY;
    if (filterGender !== 'all') {
      list = list.filter(t => t.gender === filterGender);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.origin.toLowerCase().includes(q) ||
        t.nativeLanguages.some(l => l.toLowerCase().includes(q)) ||
        t.dialects.some(d => d.toLowerCase().includes(q))
      );
    }
    return list;
  }, [filterGender, searchQuery]);

  const toggleTeacher = (id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), id];
      }
      return [...prev, id];
    });
  };

  const handleConfirm = async () => {
    if (selectedIds.length === 0) return;
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(selectedIds));
    if (isOnboarding) {
      router.replace('/permissions-setup');
    } else {
      router.back();
    }
  };

  const renderTeacherCard = ({ item }: { item: Teacher }) => {
    const isSelected = selectedIds.includes(item.id);
    const isRecommended = recommended.some(r => r.id === item.id);

    return (
      <Pressable
        onPress={() => toggleTeacher(item.id)}
        style={({ pressed }) => [
          {
            flex: 1,
            margin: 6,
            borderRadius: 16,
            padding: 12,
            backgroundColor: isSelected ? colors.primary + '20' : colors.surface,
            borderWidth: isSelected ? 2 : 1,
            borderColor: isSelected ? colors.primary : colors.border,
            opacity: pressed ? 0.8 : 1,
            maxWidth: '48%',
          },
        ]}
      >
        {isRecommended && (
          <View style={{
            position: 'absolute',
            top: 8,
            right: 8,
            backgroundColor: colors.success,
            borderRadius: 8,
            paddingHorizontal: 6,
            paddingVertical: 2,
          }}>
            <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>RECOMMENDED</Text>
          </View>
        )}
        {isSelected && (
          <View style={{
            position: 'absolute',
            top: 8,
            left: 8,
            backgroundColor: colors.primary,
            borderRadius: 12,
            width: 24,
            height: 24,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>
              {selectedIds.indexOf(item.id) + 1}
            </Text>
          </View>
        )}
        <Image
          source={{ uri: item.photoUrl }}
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            alignSelf: 'center',
            marginBottom: 8,
          }}
        />
        <Text style={{
          fontSize: 15,
          fontWeight: '700',
          color: colors.foreground,
          textAlign: 'center',
        }}>
          {item.name}
        </Text>
        <Text style={{
          fontSize: 11,
          color: colors.muted,
          textAlign: 'center',
          marginTop: 2,
        }}>
          {item.origin}
        </Text>
        <Text style={{
          fontSize: 10,
          color: colors.muted,
          textAlign: 'center',
          marginTop: 4,
          lineHeight: 14,
        }} numberOfLines={2}>
          {item.style}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 6, gap: 3 }}>
          {item.nativeLanguages.slice(0, 2).map(lang => (
            <View key={lang} style={{
              backgroundColor: colors.primary + '15',
              borderRadius: 6,
              paddingHorizontal: 5,
              paddingVertical: 1,
            }}>
              <Text style={{ fontSize: 9, color: colors.primary }}>{lang}</Text>
            </View>
          ))}
        </View>
      </Pressable>
    );
  };

  return (
    <ScreenContainer edges={['top', 'left', 'right', 'bottom']}>
      <View style={{ flex: 1, paddingHorizontal: 16 }}>
        {/* Header */}
        <View style={{ paddingTop: 16, paddingBottom: 12 }}>
          <Text style={{ fontSize: 26, fontWeight: '800', color: colors.foreground }}>
            Choose Your Teachers
          </Text>
          <Text style={{ fontSize: 14, color: colors.muted, marginTop: 4, lineHeight: 20 }}>
            Pick up to 3 teachers you vibe with. They can teach you ANY language — choose based on who you feel comfortable learning from.
          </Text>
        </View>

        {/* Search */}
        <View style={{
          backgroundColor: colors.surface,
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 10,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: colors.border,
        }}>
          <TextInput
            placeholder="Search by name, country, or language..."
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{ fontSize: 14, color: colors.foreground }}
          />
        </View>

        {/* Gender Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12, maxHeight: 36 }}>
          {(['all', 'female', 'male'] as const).map(g => (
            <Pressable
              key={g}
              onPress={() => setFilterGender(g)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 7,
                borderRadius: 18,
                backgroundColor: filterGender === g ? colors.primary : colors.surface,
                marginRight: 8,
                borderWidth: 1,
                borderColor: filterGender === g ? colors.primary : colors.border,
              }}
            >
              <Text style={{
                fontSize: 12,
                fontWeight: '600',
                color: filterGender === g ? '#fff' : colors.foreground,
              }}>
                {g === 'all' ? 'All Teachers' : g === 'female' ? 'Female' : 'Male'}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Teacher Grid */}
        <FlatList
          data={filteredTeachers}
          renderItem={renderTeacherCard}
          keyExtractor={item => item.id}
          numColumns={2}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />

        {/* Confirm Button */}
        <View style={{
          position: 'absolute',
          bottom: 20,
          left: 16,
          right: 16,
        }}>
          <Pressable
            onPress={handleConfirm}
            style={({ pressed }) => [{
              backgroundColor: selectedIds.length > 0 ? colors.primary : colors.muted,
              borderRadius: 14,
              paddingVertical: 16,
              alignItems: 'center',
              opacity: pressed && selectedIds.length > 0 ? 0.9 : 1,
              transform: [{ scale: pressed && selectedIds.length > 0 ? 0.97 : 1 }],
            }]}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
              {selectedIds.length === 0
                ? 'Select at least 1 teacher'
                : `Continue with ${selectedIds.length} teacher${selectedIds.length > 1 ? 's' : ''}`}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              // Skip teacher selection — go to next step
              router.replace('/permissions-setup' as any);
            }}
            style={({ pressed }) => [{
              marginTop: 12,
              paddingVertical: 12,
              alignItems: 'center',
              opacity: pressed ? 0.6 : 1,
            }]}
          >
            <Text style={{ color: colors.muted, fontSize: 14, fontWeight: '500' }}>
              Skip for now
            </Text>
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
}
