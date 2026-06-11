import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

interface TasteProfile {
  artists: string[];
  songs: string[];
  genres: string[];
  moods: string[];
  tempos: string[];
  vocals: string[];
  signals: Array<{ type: string; data: any; timestamp: number }>;
}

export default function TasteInsightsScreen() {
  const router = useRouter();
  const colors = useColors();
  const [profile, setProfile] = useState<TasteProfile | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const stored = await AsyncStorage.getItem("taste_profile");
      if (stored) setProfile(JSON.parse(stored));
    } catch (e) {
      console.log("Error loading taste profile:", e);
    }
  };

  const getTopItems = (arr: string[], limit = 5) => arr?.slice(0, limit) || [];
  
  const getGenreDistribution = () => {
    if (!profile?.genres?.length) return [];
    const counts: Record<string, number> = {};
    profile.genres.forEach(g => { counts[g] = (counts[g] || 0) + 1; });
    const total = profile.genres.length;
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({ name, percentage: Math.round((count / total) * 100) }));
  };

  const getMoodMap = () => {
    if (!profile?.moods?.length) return [];
    const counts: Record<string, number> = {};
    profile.moods.forEach(m => { counts[m] = (counts[m] || 0) + 1; });
    const total = profile.moods.length;
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, percentage: Math.round((count / total) * 100) }));
  };

  const getTempoPreference = () => {
    if (!profile?.tempos?.length) return "Unknown";
    const counts: Record<string, number> = {};
    profile.tempos.forEach(t => { counts[t] = (counts[t] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Mixed";
  };

  const getSignalCount = () => profile?.signals?.length || 0;

  if (!profile) {
    return (
      <ScreenContainer className="p-6">
        <View className="flex-1 items-center justify-center gap-4">
          <Text className="text-2xl font-bold text-foreground">Your Musical DNA</Text>
          <Text className="text-base text-muted text-center">
            Complete the Music Taste Onboarding to see your personalized insights.
          </Text>
          <TouchableOpacity
            className="bg-primary px-6 py-3 rounded-full mt-4"
            onPress={() => router.push("/music-taste-onboarding" as any)}
          >
            <Text className="text-background font-semibold">Set Up Taste Profile</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  const genres = getGenreDistribution();
  const moods = getMoodMap();
  const tempo = getTempoPreference();

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View className="gap-6">
          {/* Header */}
          <View className="items-center gap-2 pt-4">
            <Text className="text-3xl font-bold text-foreground">Your Musical DNA</Text>
            <Text className="text-sm text-muted">{getSignalCount()} taste signals collected</Text>
          </View>

          {/* Top Artists */}
          {profile.artists?.length > 0 && (
            <View className="bg-surface rounded-2xl p-5 border border-border">
              <Text className="text-lg font-bold text-foreground mb-3">Top Artists</Text>
              {getTopItems(profile.artists).map((artist, i) => (
                <View key={i} className="flex-row items-center py-2 border-b border-border">
                  <View className="w-8 h-8 rounded-full bg-primary items-center justify-center mr-3">
                    <Text className="text-background font-bold text-sm">{i + 1}</Text>
                  </View>
                  <Text className="text-foreground text-base flex-1">{artist}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Genre Distribution */}
          {genres.length > 0 && (
            <View className="bg-surface rounded-2xl p-5 border border-border">
              <Text className="text-lg font-bold text-foreground mb-3">Genre Distribution</Text>
              {genres.map((g, i) => (
                <View key={i} className="mb-3">
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-foreground text-sm">{g.name}</Text>
                    <Text className="text-muted text-sm">{g.percentage}%</Text>
                  </View>
                  <View className="h-2 bg-border rounded-full overflow-hidden">
                    <View
                      style={{ width: `${g.percentage}%`, backgroundColor: colors.primary }}
                      className="h-full rounded-full"
                    />
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Mood Map */}
          {moods.length > 0 && (
            <View className="bg-surface rounded-2xl p-5 border border-border">
              <Text className="text-lg font-bold text-foreground mb-3">Mood Map</Text>
              <View className="flex-row flex-wrap gap-2">
                {moods.map((m, i) => (
                  <View key={i} className="bg-primary/10 px-4 py-2 rounded-full">
                    <Text className="text-primary text-sm font-medium">{m.name} ({m.percentage}%)</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Tempo & Vocals */}
          <View className="flex-row gap-3">
            <View className="flex-1 bg-surface rounded-2xl p-4 border border-border items-center">
              <Text className="text-muted text-xs mb-1">Preferred Tempo</Text>
              <Text className="text-foreground font-bold text-lg">{tempo}</Text>
            </View>
            <View className="flex-1 bg-surface rounded-2xl p-4 border border-border items-center">
              <Text className="text-muted text-xs mb-1">Vocal Style</Text>
              <Text className="text-foreground font-bold text-lg">
                {profile.vocals?.[0] || "Mixed"}
              </Text>
            </View>
          </View>

          {/* Top Songs */}
          {profile.songs?.length > 0 && (
            <View className="bg-surface rounded-2xl p-5 border border-border">
              <Text className="text-lg font-bold text-foreground mb-3">Top Songs</Text>
              {getTopItems(profile.songs).map((song, i) => (
                <View key={i} className="flex-row items-center py-2">
                  <Text className="text-muted text-sm w-6">{i + 1}.</Text>
                  <Text className="text-foreground text-base flex-1">{song}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Update Profile Button */}
          <TouchableOpacity
            className="bg-surface border border-border rounded-2xl p-4 items-center"
            onPress={() => router.push("/music-taste-onboarding" as any)}
          >
            <Text className="text-primary font-semibold">Update Taste Profile</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
