import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

type Transcript = {
  id: string;
  title: string;
  date: string;
  duration: string;
  preview: string;
};

const SAMPLE_TRANSCRIPTS: Transcript[] = [
  { id: "1", title: "Spanish Conversation Practice", date: "Today", duration: "5:32", preview: "Hola, ¿cómo estás? Estoy bien, gracias..." },
  { id: "2", title: "French Pronunciation Drill", date: "Yesterday", duration: "3:15", preview: "Bonjour, je m'appelle..." },
  { id: "3", title: "Japanese Greeting Lesson", date: "2 days ago", duration: "7:48", preview: "こんにちは、元気ですか..." },
];

export default function VoiceTranscriptsScreen() {
  const colors = useColors();

  const renderItem = ({ item }: { item: Transcript }) => (
    <TouchableOpacity style={[styles.card, { backgroundColor: colors.surface }]} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <Text style={[styles.title, { color: colors.foreground }]}>{item.title}</Text>
        <Text style={[styles.duration, { color: colors.muted }]}>{item.duration}</Text>
      </View>
      <Text style={[styles.preview, { color: colors.muted }]} numberOfLines={2}>{item.preview}</Text>
      <Text style={[styles.date, { color: colors.muted }]}>{item.date}</Text>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Voice Transcripts</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={SAMPLE_TRANSCRIPTS}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="mic-off-outline" size={48} color={colors.muted} />
            <Text style={[styles.emptyText, { color: colors.muted }]}>No transcripts yet</Text>
            <Text style={[styles.emptySubtext, { color: colors.muted }]}>
              Complete a voice lesson to see transcripts here
            </Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  list: { paddingHorizontal: 16, paddingBottom: 40, gap: 12 },
  card: { borderRadius: 12, padding: 14, gap: 6 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 15, fontWeight: "600", flex: 1 },
  duration: { fontSize: 12 },
  preview: { fontSize: 13, lineHeight: 18 },
  date: { fontSize: 11, marginTop: 4 },
  empty: { alignItems: "center", paddingTop: 80, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: "600" },
  emptySubtext: { fontSize: 13, textAlign: "center", paddingHorizontal: 40 },
});
