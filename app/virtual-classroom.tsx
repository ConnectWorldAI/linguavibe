import { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";
import { usePip } from "@/lib/pip-context";
import { useHumeTeacher, type HumeMessage } from "@/hooks/use-hume-voice";
import { ReportAIResponse } from "@/components/report-ai-response";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const TILE_SIZE = (SCREEN_WIDTH - 48) / 2;

interface Participant {
  id: string;
  name: string;
  avatar: string;
  role: "teacher" | "student";
  status: string;
  isMuted: boolean;
  cameraOn: boolean;
  handRaised: boolean;
  language: string;
}

interface ChatMessage {
  id: string;
  sender: string;
  senderRole: "teacher" | "student" | "system";
  text: string;
  timestamp: Date;
  isQuestion: boolean;
}

export default function VirtualClassroomScreen() {
  const params = useLocalSearchParams<{
    classId?: string;
    className?: string;
    teacherName?: string;
    language?: string;
    topic?: string;
  }>();

  const { minimizeCall } = usePip();
  const className = params.className || "Spanish Conversation Practice";
  const teacherName = params.teacherName || "Profesora Maria";
  const topic = params.topic || "Ordering food at a restaurant";
  const language = params.language || "Spanish";

  const [isMuted, setIsMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [handRaised, setHandRaised] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showParticipants, setShowParticipants] = useState(false);

  // Real Hume AI Teacher connection
  const humeTeacher = useHumeTeacher({
    teacherName,
    language,
    dialect: params.language,
    level: "intermediate",
    lessonTopic: topic,
    scenarioType: "classroom",
    onMessage: (msg: HumeMessage) => {
      if (msg.role === "assistant") {
        setChatMessages((prev) => [...prev, {
          id: `hume-${Date.now()}`,
          sender: teacherName,
          senderRole: "teacher" as const,
          text: msg.content,
          timestamp: new Date(),
          isQuestion: false,
        }]);
      } else if (msg.role === "user") {
        setChatMessages((prev) => [...prev, {
          id: `user-${Date.now()}`,
          sender: "You",
          senderRole: "student" as const,
          text: msg.content,
          timestamp: new Date(),
          isQuestion: msg.content.endsWith("?"),
        }]);
      }
    },
    onError: (err) => console.warn("[Classroom] Hume error:", err),
  });

  // Auto-connect to Hume when screen mounts
  useEffect(() => {
    humeTeacher.connect();
    return () => { humeTeacher.disconnect(); };
  }, []);

  const participants: Participant[] = [
    { id: "teacher-1", name: teacherName, avatar: "\uD83D\uDC69\u200D\uD83C\uDFEB", role: "teacher", status: "speaking", isMuted: false, cameraOn: true, handRaised: false, language: "Spanish" },
    { id: "me", name: "You", avatar: "\uD83E\uDDD1", role: "student", status: "active", isMuted: false, cameraOn: true, handRaised: false, language: "English" },
    { id: "s1", name: "Carlos M.", avatar: "\uD83D\uDC68", role: "student", status: "active", isMuted: true, cameraOn: true, handRaised: false, language: "English" },
    { id: "s2", name: "Aisha K.", avatar: "\uD83D\uDC69", role: "student", status: "muted", isMuted: true, cameraOn: false, handRaised: false, language: "English" },
    { id: "s3", name: "James L.", avatar: "\uD83E\uDDD1\u200D\uD83E\uDDB1", role: "student", status: "active", isMuted: true, cameraOn: true, handRaised: false, language: "English" },
    { id: "s4", name: "Yuki T.", avatar: "\uD83D\uDC69\u200D\uD83E\uDDB0", role: "student", status: "hand-raised", isMuted: true, cameraOn: true, handRaised: true, language: "Japanese" },
  ];

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: "sys-1", sender: "System", senderRole: "system", text: `Class started: "${topic}"`, timestamp: new Date(), isQuestion: false },
    { id: "sys-2", sender: "System", senderRole: "system", text: humeTeacher.isConnecting ? "Connecting to AI teacher..." : humeTeacher.isConnected ? "AI teacher connected — speak to interact!" : "Waiting for connection...", timestamp: new Date(), isQuestion: false },
  ]);

  const chatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const interval = setInterval(() => setElapsedTime((p) => p + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const handleSendMessage = useCallback(() => {
    if (!chatMessage.trim()) return;
    const newMsg: ChatMessage = { id: `msg-${Date.now()}`, sender: "You", senderRole: "student", text: chatMessage.trim(), timestamp: new Date(), isQuestion: chatMessage.trim().endsWith("?") };
    setChatMessages((prev) => [...prev, newMsg]);
    setChatMessage("");
    if (newMsg.isQuestion) {
      setTimeout(() => {
        setChatMessages((prev) => [...prev, { id: `tr-${Date.now()}`, sender: teacherName, senderRole: "teacher", text: "Great question! I'll answer in the chat since we're running low on time.", timestamp: new Date(), isQuestion: false }]);
      }, 2000);
    }
  }, [chatMessage, teacherName]);

  const handleLeave = () => router.back();
  const handleMinimize = () => { minimizeCall("hume" as any, className, teacherName); router.back(); };

  const renderTile = ({ item }: { item: Participant }) => (
    <View style={[styles.tile, item.role === "teacher" && styles.teacherTile, item.status === "speaking" && styles.speakingTile]}>
      <View style={styles.tileInner}>
        {item.cameraOn || item.id === "me" ? (
          <View style={styles.cameraView}>
            <Text style={styles.avatar}>{item.avatar}</Text>
            {item.role === "teacher" && <View style={styles.aiLabel}><Ionicons name="videocam" size={10} color="#fff" /><Text style={styles.aiText}>AI Avatar</Text></View>}
          </View>
        ) : (
          <View style={styles.camOff}><Text style={styles.avatarLg}>{item.avatar}</Text></View>
        )}
        <View style={styles.nameBadge}>
          {item.isMuted && item.id !== "me" && <Ionicons name="mic-off" size={11} color={Colors.error} />}
          <Text style={styles.nameText} numberOfLines={1}>{item.id === "me" ? "You" : item.name}</Text>
          {item.handRaised && <Text style={{ fontSize: 11 }}>{"\u270B"}</Text>}
          {item.role === "teacher" && <View style={styles.teachBadge}><Text style={styles.teachBadgeText}>Teacher</Text></View>}
        </View>
        {item.status === "speaking" && <View style={styles.speakDots}><View style={styles.dot} /><View style={[styles.dot, { height: 10 }]} /><View style={styles.dot} /></View>}
      </View>
    </View>
  );

  const renderMsg = ({ item }: { item: ChatMessage }) => {
    if (item.senderRole === "system") return <View style={styles.sysMsg}><Text style={styles.sysMsgText}>{item.text}</Text></View>;
    return (
        <View style={[styles.bubble, item.sender === "You" && styles.bubbleMe]}>
        <View style={styles.bubbleHead}><Text style={[styles.bubbleSender, item.senderRole === "teacher" && { color: Colors.secondary }]}>{item.sender}</Text>{item.isQuestion && <View style={styles.qBadge}><Text style={styles.qText}>Q</Text></View>}</View>
        <Text style={styles.bubbleText}>{item.text}</Text>
        {item.senderRole === "teacher" && <ReportAIResponse messageContent={item.text} size="small" />}
      </View>
    );
  };

  if (showChat) {
    return (
      <ScreenContainer edges={["top", "left", "right", "bottom"]}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={styles.chatHead}>
            <TouchableOpacity onPress={() => setShowChat(false)} style={styles.backBtn}><Ionicons name="chevron-back" size={24} color={Colors.text} /></TouchableOpacity>
            <Text style={styles.chatTitle}>Class Chat</Text>
            <View style={styles.chatCount}><Text style={styles.chatCountText}>{chatMessages.length}</Text></View>
          </View>
          <FlatList ref={chatListRef} data={chatMessages} keyExtractor={(i) => i.id} renderItem={renderMsg} contentContainerStyle={{ padding: Spacing.md }} onContentSizeChange={() => chatListRef.current?.scrollToEnd()} />
          <View style={styles.inputRow}>
            <TextInput style={styles.input} placeholder="Type a message or question..." placeholderTextColor={Colors.textSecondary} value={chatMessage} onChangeText={setChatMessage} returnKeyType="send" onSubmitEditing={handleSendMessage} />
            <TouchableOpacity style={[styles.sendBtn, !chatMessage.trim() && { backgroundColor: Colors.surface }]} onPress={handleSendMessage} disabled={!chatMessage.trim()}>
              <Ionicons name="send" size={18} color={chatMessage.trim() ? Colors.primary : Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View style={{ flex: 1 }}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <View style={styles.topLeft}>
            <View style={styles.recDot} />
            <Text style={styles.timer}>{formatTime(elapsedTime)}</Text>
            <Text style={styles.classLbl} numberOfLines={1}>{className}</Text>
          </View>
          <View style={styles.topRight}>
            <TouchableOpacity onPress={handleMinimize} style={styles.topBtn}><Ionicons name="remove" size={20} color={Colors.text} /></TouchableOpacity>
            <TouchableOpacity onPress={() => setShowParticipants(!showParticipants)} style={styles.topBtn}><Ionicons name="people" size={18} color={Colors.text} /><Text style={styles.pCount}>{participants.length}</Text></TouchableOpacity>
          </View>
        </View>

        {/* Topic */}
        <View style={styles.topicBar}><Ionicons name="book" size={14} color={Colors.secondary} /><Text style={styles.topicText} numberOfLines={1}>Topic: {topic}</Text></View>

        {/* Grid */}
        <FlatList data={participants} keyExtractor={(i) => i.id} renderItem={renderTile} numColumns={2} columnWrapperStyle={styles.gridRow} contentContainerStyle={{ paddingVertical: 4 }} style={{ flex: 1 }} />

        {/* Participants overlay */}
        {showParticipants && (
          <View style={styles.panel}>
            <View style={styles.panelHead}><Text style={styles.panelTitle}>Participants ({participants.length})</Text><TouchableOpacity onPress={() => setShowParticipants(false)}><Ionicons name="close" size={22} color={Colors.text} /></TouchableOpacity></View>
            <ScrollView>{participants.map((p) => (
              <View key={p.id} style={styles.pRow}>
                <Text style={{ fontSize: 22 }}>{p.avatar}</Text>
                <View style={{ flex: 1 }}><Text style={styles.pName}>{p.id === "me" ? "You" : p.name}{p.role === "teacher" ? " (Teacher)" : ""}</Text><Text style={styles.pLang}>{p.language}</Text></View>
                {p.handRaised && <Text>{"\u270B"}</Text>}
                <Ionicons name={p.isMuted ? "mic-off" : "mic"} size={16} color={p.isMuted ? Colors.error : Colors.success} />
              </View>
            ))}</ScrollView>
          </View>
        )}

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity style={[styles.ctrlBtn, isMuted && styles.ctrlActive]} onPress={() => setIsMuted(!isMuted)}>
            <Ionicons name={isMuted ? "mic-off" : "mic"} size={22} color={isMuted ? Colors.error : Colors.text} />
            <Text style={styles.ctrlLbl}>{isMuted ? "Unmute" : "Mute"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.ctrlBtn, !cameraOn && styles.ctrlActive]} onPress={() => setCameraOn(!cameraOn)}>
            <Ionicons name={cameraOn ? "videocam" : "videocam-off"} size={22} color={!cameraOn ? Colors.error : Colors.text} />
            <Text style={styles.ctrlLbl}>{cameraOn ? "Camera" : "Off"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.ctrlBtn, handRaised && styles.ctrlRaised]} onPress={() => setHandRaised(!handRaised)}>
            <Ionicons name="hand-left" size={22} color={handRaised ? Colors.warning : Colors.text} />
            <Text style={styles.ctrlLbl}>{handRaised ? "Lower" : "Raise"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ctrlBtn} onPress={() => setShowChat(true)}>
            <View><Ionicons name="chatbubble-ellipses" size={22} color={Colors.text} />{chatMessages.length > 0 && <View style={styles.chatDot} />}</View>
            <Text style={styles.ctrlLbl}>Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.ctrlBtn, styles.leaveBtn]} onPress={handleLeave}>
            <Ionicons name="call" size={22} color="#fff" />
            <Text style={[styles.ctrlLbl, { color: "#fff" }]}>Leave</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Spacing.md, paddingVertical: 10 },
  topLeft: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.error },
  timer: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.text, fontVariant: ["tabular-nums"] },
  classLbl: { fontSize: FontSize.sm, color: Colors.textSecondary, flex: 1 },
  topRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  topBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: Colors.surface, borderRadius: BorderRadius.md },
  pCount: { fontSize: FontSize.xs, color: Colors.text, fontWeight: "600" },
  topicBar: { flexDirection: "row", alignItems: "center", gap: 6, marginHorizontal: Spacing.md, marginBottom: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: Colors.secondary + "12", borderRadius: BorderRadius.md },
  topicText: { fontSize: FontSize.xs, color: Colors.secondary, fontWeight: "500", flex: 1 },
  gridRow: { justifyContent: "space-between", paddingHorizontal: Spacing.md, marginBottom: 8 },
  tile: { width: TILE_SIZE, height: TILE_SIZE * 0.75, borderRadius: BorderRadius.lg, overflow: "hidden", backgroundColor: Colors.surface, borderWidth: 2, borderColor: "transparent" },
  teacherTile: { borderColor: Colors.secondary + "40" },
  speakingTile: { borderColor: Colors.success },
  tileInner: { flex: 1, position: "relative" },
  cameraView: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.surface },
  camOff: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#1a1a2e" },
  avatar: { fontSize: 36 },
  avatarLg: { fontSize: 44 },
  aiLabel: { position: "absolute", top: 6, right: 6, flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  aiText: { fontSize: 9, color: "#fff", fontWeight: "500" },
  nameBadge: { position: "absolute", bottom: 6, left: 6, right: 6, flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  nameText: { fontSize: 11, color: "#fff", fontWeight: "500", flex: 1 },
  teachBadge: { backgroundColor: Colors.secondary, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 },
  teachBadgeText: { fontSize: 8, color: Colors.primary, fontWeight: "700" },
  speakDots: { position: "absolute", top: 6, left: 6, flexDirection: "row", alignItems: "center", gap: 2 },
  dot: { width: 3, height: 8, borderRadius: 1.5, backgroundColor: Colors.success },
  panel: { position: "absolute", top: 100, right: Spacing.md, width: 240, maxHeight: 300, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, elevation: 5 },
  panelHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  panelTitle: { fontSize: FontSize.md, fontWeight: "700", color: Colors.text },
  pRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  pName: { fontSize: FontSize.sm, fontWeight: "500", color: Colors.text },
  pLang: { fontSize: FontSize.xs, color: Colors.textSecondary },
  controls: { flexDirection: "row", alignItems: "center", justifyContent: "space-around", paddingVertical: 14, paddingHorizontal: Spacing.md, backgroundColor: Colors.surface, borderTopWidth: 0.5, borderTopColor: Colors.border },
  ctrlBtn: { alignItems: "center", gap: 4, paddingVertical: 6, paddingHorizontal: 10, borderRadius: BorderRadius.md },
  ctrlActive: { backgroundColor: Colors.error + "15" },
  ctrlRaised: { backgroundColor: Colors.warning + "15" },
  leaveBtn: { backgroundColor: Colors.error, paddingHorizontal: 16, borderRadius: BorderRadius.full },
  ctrlLbl: { fontSize: 10, color: Colors.textSecondary, fontWeight: "500" },
  chatDot: { position: "absolute", top: -2, right: -4, width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.secondary },
  chatHead: { flexDirection: "row", alignItems: "center", paddingHorizontal: Spacing.md, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface, alignItems: "center", justifyContent: "center" },
  chatTitle: { flex: 1, fontSize: FontSize.lg, fontWeight: "700", color: Colors.text, marginLeft: 12 },
  chatCount: { backgroundColor: Colors.secondary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  chatCountText: { fontSize: 11, color: Colors.primary, fontWeight: "700" },
  sysMsg: { alignItems: "center", marginVertical: 8 },
  sysMsgText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontStyle: "italic" },
  bubble: { backgroundColor: Colors.surface, padding: 12, borderRadius: BorderRadius.lg, marginBottom: 8, maxWidth: "85%", borderWidth: 0.5, borderColor: Colors.border },
  bubbleMe: { alignSelf: "flex-end", backgroundColor: Colors.secondary + "15", borderColor: Colors.secondary + "30" },
  bubbleHead: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  bubbleSender: { fontSize: FontSize.xs, fontWeight: "600", color: Colors.textSecondary },
  qBadge: { backgroundColor: Colors.warning, width: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  qText: { fontSize: 9, fontWeight: "700", color: Colors.primary },
  bubbleText: { fontSize: FontSize.sm, color: Colors.text, lineHeight: 18 },
  inputRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: Spacing.md, paddingVertical: 10, borderTopWidth: 0.5, borderTopColor: Colors.border, gap: 10 },
  input: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.full, paddingHorizontal: 16, paddingVertical: 10, fontSize: FontSize.sm, color: Colors.text, borderWidth: 0.5, borderColor: Colors.border },
  sendBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.secondary, alignItems: "center", justifyContent: "center" },
});
