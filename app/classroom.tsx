import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";
import { useUsage } from "@/lib/usage-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { trpc } from "@/lib/trpc";

const MOCK_STUDENTS = [
  { id: "1", name: "You", avatar: "😊", speaking: false, handRaised: false },
  { id: "2", name: "Maria G.", avatar: "👩🏻", speaking: false, handRaised: true },
  { id: "3", name: "James K.", avatar: "👨🏿", speaking: false, handRaised: false },
  { id: "4", name: "Yuki T.", avatar: "👩🏻", speaking: false, handRaised: false },
  { id: "5", name: "Ahmed R.", avatar: "👨🏽", speaking: true, handRaised: false },
  { id: "6", name: "Sarah L.", avatar: "👩🏼", speaking: false, handRaised: false },
  { id: "7", name: "Chen W.", avatar: "👨🏻", speaking: false, handRaised: false },
  { id: "8", name: "Priya S.", avatar: "👩🏽", speaking: false, handRaised: true },
  { id: "9", name: "Lucas M.", avatar: "👨🏼", speaking: false, handRaised: false },
  { id: "10", name: "Fatima A.", avatar: "👩🏽", speaking: false, handRaised: false },
];

const MOCK_CHAT = [
  { id: "1", user: "Maria G.", message: "Can you repeat that last phrase?", time: "2:34" },
  { id: "2", user: "Teacher", message: "Of course! 'Quiero un café con leche' — I want a coffee with milk", time: "2:35" },
  { id: "3", user: "James K.", message: "Is 'leche' always feminine?", time: "2:36" },
  { id: "4", user: "Teacher", message: "Yes! La leche — always feminine in Spanish 🙌", time: "2:36" },
  { id: "5", user: "You", message: "How do you say 'with sugar' in Dominican?", time: "2:37" },
];

export default function ClassroomScreen() {
  const { incrementUsage } = useUsage();
  const [handRaised, setHandRaised] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [students, setStudents] = useState(MOCK_STUDENTS);
  const [chatMessages, setChatMessages] = useState(MOCK_CHAT);

  // Load classroom data from AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const storedStudents = await AsyncStorage.getItem('@classroom_students');
        if (storedStudents) setStudents(JSON.parse(storedStudents));
        const storedChat = await AsyncStorage.getItem('@classroom_chat');
        if (storedChat) setChatMessages(JSON.parse(storedChat));
      } catch {}
    })();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { incrementUsage("teacher", 5); router.back(); }}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.classInfo}>
          <Text style={styles.className}>Dominican Spanish: Beginner</Text>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE • 10 students</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.leaveButton}>
          <Text style={styles.leaveText}>Leave</Text>
        </TouchableOpacity>
      </View>

      {/* Teacher Section */}
      <View style={styles.teacherSection}>
        <View style={styles.teacherAvatar}>
          <Text style={styles.teacherEmoji}>👩🏽</Text>
        </View>
        <View style={styles.teacherInfoBar}>
          <Text style={styles.teacherName}>Sophia Martinez</Text>
          <Text style={styles.teacherTopic}>
            Topic: Ordering at a Dominican restaurant
          </Text>
        </View>
        {/* Teaching Content Area */}
        <View style={styles.teachingBoard}>
          <Text style={styles.boardTitle}>Today's Vocabulary</Text>
          <View style={styles.boardContent}>
            <View style={styles.vocabRow}>
              <Text style={styles.vocabWord}>Un café</Text>
              <Text style={styles.vocabMeaning}>A coffee</Text>
            </View>
            <View style={styles.vocabRow}>
              <Text style={styles.vocabWord}>Con leche</Text>
              <Text style={styles.vocabMeaning}>With milk</Text>
            </View>
            <View style={styles.vocabRow}>
              <Text style={styles.vocabWord}>Sin azúcar</Text>
              <Text style={styles.vocabMeaning}>Without sugar</Text>
            </View>
            <View style={styles.vocabRow}>
              <Text style={styles.vocabWord}>La cuenta</Text>
              <Text style={styles.vocabMeaning}>The check/bill</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Students Grid */}
      <View style={styles.studentsSection}>
        <Text style={styles.studentsLabel}>Students</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {students.map((student) => (
            <View key={student.id} style={styles.studentTile}>
              <View
                style={[
                  styles.studentAvatar,
                  student.speaking && styles.studentSpeaking,
                ]}
              >
                <Text style={styles.studentEmoji}>{student.avatar}</Text>
                {student.handRaised && (
                  <View style={styles.handIcon}>
                    <Text style={{ fontSize: 12 }}>✋</Text>
                  </View>
                )}
              </View>
              <Text style={styles.studentName} numberOfLines={1}>
                {student.name}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Chat Section */}
      {showChat && (
        <View style={styles.chatSection}>
          <FlatList
            data={chatMessages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.chatBubble}>
                <Text
                  style={[
                    styles.chatUser,
                    item.user === "Teacher" && styles.chatUserTeacher,
                    item.user === "You" && styles.chatUserSelf,
                  ]}
                >
                  {item.user}
                </Text>
                <Text style={styles.chatMessage}>{item.message}</Text>
              </View>
            )}
            style={styles.chatList}
          />
          <View style={styles.chatInputRow}>
            <TextInput
              style={styles.chatInput}
              placeholder="Ask a question..."
              placeholderTextColor={Colors.textSecondary}
              value={chatMessage}
              onChangeText={setChatMessage}
            />
            <TouchableOpacity style={styles.chatSendButton}>
              <Ionicons name="send" size={18} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        <TouchableOpacity
          style={[styles.controlBtn, isMuted && styles.controlBtnMuted]}
          onPress={() => setIsMuted(!isMuted)}
        >
          <Ionicons
            name={isMuted ? "mic-off" : "mic"}
            size={22}
            color={isMuted ? Colors.accent : Colors.textPrimary}
          />
          <Text style={styles.controlBtnLabel}>
            {isMuted ? "Muted" : "Mic On"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.raiseHandBtn, handRaised && styles.raiseHandBtnActive]}
          onPress={() => setHandRaised(!handRaised)}
        >
          <Text style={styles.raiseHandEmoji}>{handRaised ? "✋" : "🤚"}</Text>
          <Text
            style={[
              styles.controlBtnLabel,
              handRaised && styles.raiseHandLabelActive,
            ]}
          >
            {handRaised ? "Hand Up" : "Raise Hand"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlBtn, showChat && styles.controlBtnActive]}
          onPress={() => setShowChat(!showChat)}
        >
          <Ionicons
            name="chatbubbles"
            size={22}
            color={showChat ? Colors.secondary : Colors.textPrimary}
          />
          <Text style={styles.controlBtnLabel}>Chat</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlBtn}>
          <Ionicons name="people" size={22} color={Colors.textPrimary} />
          <Text style={styles.controlBtnLabel}>Students</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlBtn}>
          <Ionicons name="happy" size={22} color={Colors.textPrimary} />
          <Text style={styles.controlBtnLabel}>React</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: 8,
  },
  classInfo: {
    flex: 1,
  },
  className: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
  },
  liveText: {
    fontSize: FontSize.xs,
    color: Colors.accent,
    fontWeight: "600",
  },
  leaveButton: {
    backgroundColor: Colors.accent + "20",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  leaveText: {
    fontSize: FontSize.sm,
    color: Colors.accent,
    fontWeight: "700",
  },
  teacherSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  teacherAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.secondary + "20",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: Spacing.sm,
    borderWidth: 2,
    borderColor: Colors.success,
  },
  teacherEmoji: {
    fontSize: 30,
  },
  teacherInfoBar: {
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  teacherName: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  teacherTopic: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  teachingBoard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  boardTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.secondary,
    marginBottom: Spacing.md,
  },
  boardContent: {
    gap: 8,
  },
  vocabRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  vocabWord: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  vocabMeaning: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  studentsSection: {
    paddingLeft: Spacing.lg,
    marginBottom: Spacing.md,
  },
  studentsLabel: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  studentTile: {
    alignItems: "center",
    marginRight: Spacing.md,
    width: 56,
  },
  studentAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    position: "relative",
  },
  studentSpeaking: {
    borderWidth: 2,
    borderColor: Colors.success,
  },
  studentEmoji: {
    fontSize: 22,
  },
  handIcon: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: Colors.warning,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  studentName: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  chatSection: {
    flex: 1,
    backgroundColor: Colors.surfaceCard,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    maxHeight: 200,
  },
  chatList: {
    padding: Spacing.md,
    flex: 1,
  },
  chatBubble: {
    marginBottom: Spacing.sm,
  },
  chatUser: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  chatUserTeacher: {
    color: Colors.secondary,
  },
  chatUserSelf: {
    color: Colors.success,
  },
  chatMessage: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  chatInputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: 8,
  },
  chatInput: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    paddingVertical: 6,
  },
  chatSendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomControls: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surfaceCard,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
  },
  controlBtn: {
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
  },
  controlBtnMuted: {},
  controlBtnActive: {},
  controlBtnLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  raiseHandBtn: {
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
  },
  raiseHandBtnActive: {
    backgroundColor: Colors.warning + "20",
  },
  raiseHandEmoji: {
    fontSize: 22,
  },
  raiseHandLabelActive: {
    color: Colors.warning,
    fontWeight: "700",
  },
});
