import { ScrollView, Text, View, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

export default function VideoSummaryScreen() {
  const colors = useColors();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<{ title: string; description: string; keyPhrases: string[]; language: string } | null>(null);
  const [error, setError] = useState("");

  const analyzeMutation = trpc.tasteIntelligence.analyzeVideoContent.useMutation({
    onSuccess: (data: any) => {
      setSummary(data);
      setLoading(false);
    },
    onError: (err: any) => {
      setError(err.message || "Failed to analyze video");
      setLoading(false);
    },
  });

  const handleAnalyze = () => {
    if (!url.trim()) return;
    setLoading(true);
    setError("");
    setSummary(null);
    analyzeMutation.mutate({ url: url.trim() });
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View className="gap-5">
          <View className="items-center gap-2 pt-4">
            <Text className="text-2xl font-bold text-foreground">AI Video Summary</Text>
            <Text className="text-sm text-muted text-center">
              Paste any video URL to get an instant AI summary of what is happening
            </Text>
          </View>

          <View className="bg-surface rounded-2xl p-4 border border-border">
            <TextInput
              className="text-foreground text-base p-3 bg-background rounded-xl border border-border"
              placeholder="Paste video URL (YouTube, TikTok, Instagram...)"
              placeholderTextColor={colors.muted}
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleAnalyze}
            />
            <TouchableOpacity
              className="bg-primary rounded-xl p-4 items-center mt-3"
              onPress={handleAnalyze}
              disabled={loading || !url.trim()}
              style={{ opacity: loading || !url.trim() ? 0.5 : 1 }}
            >
              {loading ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text className="text-background font-bold text-base">Analyze Video</Text>
              )}
            </TouchableOpacity>
          </View>

          {error ? (
            <View className="bg-error/10 rounded-xl p-4">
              <Text className="text-error text-sm">{error}</Text>
            </View>
          ) : null}

          {summary && (
            <View className="gap-4">
              <View className="bg-surface rounded-2xl p-5 border border-border">
                <Text className="text-lg font-bold text-foreground mb-2">{summary.title}</Text>
                <Text className="text-sm text-muted mb-1">Language: {summary.language}</Text>
                <Text className="text-base text-foreground leading-relaxed mt-2">{summary.description}</Text>
              </View>

              {summary.keyPhrases?.length > 0 && (
                <View className="bg-surface rounded-2xl p-5 border border-border">
                  <Text className="text-base font-bold text-foreground mb-3">Key Phrases to Learn</Text>
                  {summary.keyPhrases.map((phrase, i) => (
                    <View key={i} className="flex-row items-center py-2 border-b border-border">
                      <View className="w-6 h-6 rounded-full bg-primary/20 items-center justify-center mr-3">
                        <Text className="text-primary text-xs font-bold">{i + 1}</Text>
                      </View>
                      <Text className="text-foreground text-sm flex-1">{phrase}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
