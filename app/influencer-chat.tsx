import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { Image } from "expo-image";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import {
  getInfluencerById,
  type InfluencerAvatar,
} from "@/lib/influencer-avatars";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useChatWallpaper } from "@/hooks/use-chat-wallpaper";
import { ChatWallpaperBackground } from "@/components/chat-wallpaper-background";

interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "influencer";
  timestamp: number;
  translated?: string;
}

const CHAT_STORAGE_KEY = "connectworld_influencer_chats_";

export default function InfluencerChatScreen() {
  const { theme: chatWallpaper } = useChatWallpaper("influencer-chat");

  const router = useRouter();
  const { influencerId } = useLocalSearchParams<{ influencerId: string }>();
  const [influencer, setInfluencer] = useState<InfluencerAvatar | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (influencerId) {
      const data = getInfluencerById(influencerId);
      if (data) setInfluencer(data);
      loadMessages(influencerId);
    }
  }, [influencerId]);

  const loadMessages = async (id: string) => {
    try {
      const stored = await AsyncStorage.getItem(CHAT_STORAGE_KEY + id);
      if (stored) {
        setMessages(JSON.parse(stored));
      } else {
        // Initial greeting message from influencer
        const inf = getInfluencerById(id);
        if (inf) {
          const greeting: ChatMessage = {
            id: "greeting_1",
            text: getGreeting(inf),
            sender: "influencer",
            timestamp: Date.now() - 60000,
          };
          setMessages([greeting]);
        }
      }
    } catch {
      // ignore
    }
  };

  const saveMessages = async (msgs: ChatMessage[]) => {
    if (!influencerId) return;
    try {
      await AsyncStorage.setItem(CHAT_STORAGE_KEY + influencerId, JSON.stringify(msgs));
    } catch {
      // ignore
    }
  };

  const getGreeting = (inf: InfluencerAvatar): string => {
    const greetings: Record<string, string> = {
      natasha_rd: "Klk! 🇩🇴 Dímelo, qué lo que? I'm Natasha. Wanna learn some real Dominican Spanish? Let's gooo 💃",
      carlos_mx: "Qué onda güey! 🇲🇽 Soy Carlos. Ready to learn Spanish through music? Drop me a message, neta 🎵",
      valentina_co: "Hola parcero! 🇨🇴 Soy Valentina from Medellín. Let's chat about fashion, nightlife, and Colombian Spanish 💅",
      thierry_fr: "Bonjour mon ami! 🇫🇷 C'est Thierry. Shall we discuss food, wine, or the art of French conversation? 🍷",
      bianca_br: "E aí! 🇧🇷 Sou a Bianca do Rio! Bora aprender português com funk e samba? Let's dance and learn! 💃",
      kenji_jp: "よう！🇯🇵 Kenji here. Wanna learn Japanese through anime and games? Let's level up your nihongo! 🎮",
      soojin_kr: "안녕~ 🇰🇷 I'm Soo-Jin! Ready to learn Korean through K-pop and K-dramas? 대박! Let's chat! 💜",
      omar_ar: "يلا بينا! 🇪🇬 Ana Omar from Cairo. Ready to learn Arabic through stories and Egyptian humor? Let's go habibi! 📖",
      mei_cn: "你好！🇨🇳 I'm Mei Lin from Shanghai. Ready to learn Mandarin through business and culture? 加油! ✨",
      marco_it: "Ciao bello! 🇮🇹 Sono Marco from Roma. Vuoi imparare l'italiano? Let's cook, eat, and learn together! 🤌🍝",
      lena_de: "Na, Leute! 🇩🇪 Ich bin Lena from Berlin. Ready for some real German? No fake stuff, just Berlin vibes 🎧",
      arjun_in: "Kya baat hai dost! 🇮🇳 Main Arjun hoon, Delhi se. Bollywood, cricket, street food — let's learn Hindi filmy style! 🎬",
    };
    return greetings[inf.id] || `Hey! I'm ${inf.name}. Let's chat and learn ${inf.teachingLanguage} together! 🌍`;
  };

  const generateResponse = (inf: InfluencerAvatar, userMessage: string): string => {
    // LLM-powered responses - in production this calls the server's built-in LLM
    // For now, personality-matched responses based on influencer character
    const responses: Record<string, string[]> = {
      natasha_rd: [
        "Ay pero dímelo! 😂 That's a good question. In Dominican we say it like this...",
        "Klk manito! Mira, let me break this down for you the Dominican way 🇩🇴",
        "Jajaja eso está bueno! Here in Santo Domingo we'd say...",
        "Oye, I was just making mangu and thought of you! Let me explain...",
        "Vaina! That's exactly what my abuela says. In Dominican Spanish...",
      ],
      carlos_mx: [
        "No mames güey, that's a great question! 🎵 Let me break it down like a lyric...",
        "Chido, chido. So in Mexican Spanish, we'd say it like this...",
        "Neta? I was just listening to a track that uses that exact phrase...",
        "Órale! Let me explain this the way we say it in CDMX...",
        "A huevo! Good question. In Mexican slang that means...",
      ],
      valentina_co: [
        "Ay parcero! 💅 That's such a good question. In Colombian we say...",
        "Bacano! Let me tell you how we'd say that in Medellín...",
        "Chimba! I love that you're asking about this. So in Paisa Spanish...",
        "Uy parce, I was just at a party where everyone was saying that! It means...",
        "Qué nota! Let me break this down the Colombian way for you 🇨🇴",
      ],
      thierry_fr: [
        "Ah, quelle bonne question! 🍷 In French, we express this with elegance...",
        "Mon ami, let me explain this over a virtual glass of wine...",
        "Voilà! This is one of those beautiful French expressions that...",
        "C'est magnifique that you're asking! In Parisian French we say...",
        "Ah oui, this reminds me of a phrase we use at the boulangerie...",
      ],
      bianca_br: [
        "Bora! 💃 That's such a fun question! In Brazilian Portuguese we say...",
        "Mano, I love that! Here in Rio we'd express it like...",
        "Top demais! Let me teach you how we say that at the beach...",
        "Saudade dessa pergunta! In Carioca Portuguese, it goes like this...",
        "Que massa! I was just at samba practice and we used that word!",
      ],
      kenji_jp: [
        "まじで！🎮 Great question! In anime you hear this all the time...",
        "やばい！That's exactly what they say in the latest episode of...",
        "おれが教えてやるよ！So in casual Japanese, we'd say...",
        "すげー question! This is like a level-up moment. In Japanese...",
        "ちょっと待って! Let me explain this like a game tutorial...",
      ],
      soojin_kr: [
        "대박! 💜 That's such a good question! In Korean we say...",
        "오빠 would say it like this in a K-drama! Let me explain...",
        "화이팅! You're doing so well! In Korean that expression means...",
        "ㅋㅋㅋ I love that! So in Seoul Korean we'd say...",
        "언니 is here to help! In K-pop lyrics you hear this a lot...",
      ],
      omar_ar: [
        "يلا بينا! 📖 Great question habibi! In Egyptian Arabic we say...",
        "Ah, this reminds me of an old Arabic proverb...",
        "يا جماعة! Let me tell you a story about this expression...",
        "حلو! That's beautiful. In Masri (Egyptian) we express it as...",
        "ازيك! Good question. The wise ones in Cairo say...",
      ],
      mei_cn: [
        "太好了！✨ Great question! In Mandarin we express this as...",
        "加油! You're learning fast. In business Chinese we'd say...",
        "没问题! Let me explain this with a tea ceremony analogy...",
        "Very good question! In Shanghai, we have a saying for this...",
        "这个很有意思! In standard Mandarin, the expression is...",
      ],
      marco_it: [
        "Mamma mia! 🤌 What a great question! In Italian we say...",
        "Dai, dai! Let me explain this like nonna would at dinner...",
        "Bello! This reminds me of what we say at the football match...",
        "Andiamo! In Roman Italian, we express this with passion...",
        "Madonna! I was just making carbonara and thinking about this word!",
      ],
      lena_de: [
        "Na! 🎧 Good question. In Berlin German we keep it direct...",
        "Digga, let me break this down for you. In Berlinerisch...",
        "Ick sag dir was — in real German, not textbook stuff, we say...",
        "Krass! That's actually a common expression at the club...",
        "Alles klar. So in Berlin, we'd express that as...",
      ],
      arjun_in: [
        "Kya baat hai! 🎬 That's like a Bollywood dialogue! In Hindi...",
        "Yaar, great question! In Delhi Hindi we say it like this...",
        "Mast! Let me explain this the filmy way...",
        "Bhai, this is exactly what they say in the cricket commentary...",
        "Jugaad time! Let me break this down Dilli-style for you...",
      ],
    };

    const infResponses = responses[inf.id] || [
      `Great question! In ${inf.teachingLanguage}, we'd express that as...`,
      `I love that you're curious about this! Let me explain...`,
      `That's something I get asked a lot! Here's how we say it...`,
    ];

    return infResponses[Math.floor(Math.random() * infResponses.length)];
  };

  const handleSend = useCallback(async () => {
    if (!inputText.trim() || !influencer || !influencerId) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      text: inputText.trim(),
      sender: "user",
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputText("");
    setIsTyping(true);

    // Simulate LLM response delay (in production, calls server LLM with chatSystemPrompt)
    setTimeout(() => {
      const response = generateResponse(influencer, userMsg.text);
      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        text: response,
        sender: "influencer",
        timestamp: Date.now(),
      };
      const updatedMessages = [...newMessages, botMsg];
      setMessages(updatedMessages);
      setIsTyping(false);
      saveMessages(updatedMessages);
    }, 1200 + Math.random() * 2000);

    saveMessages(newMessages);
  }, [inputText, influencer, influencerId, messages]);

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.sender === "user";
    return (
      <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.influencerBubble]}>
        {!isUser && influencer?.avatarImageUrl && (
          <Image
            source={{ uri: influencer.avatarImageUrl }}
            style={styles.messageAvatar}
            contentFit="cover"
          />
        )}
        <View style={[styles.messageContent, isUser ? styles.userContent : styles.influencerContent]}>
          <Text style={[styles.messageText, isUser ? styles.userText : styles.influencerText]}>
            {item.text}
          </Text>
          <Text style={styles.messageTime}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </Text>
        </View>
      </View>
    );
  };

  if (!influencer) {
    return (
      <ScreenContainer className="flex-1 bg-background">
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="flex-1 bg-background" edges={["top", "left", "right", "bottom"]}>
      <ChatWallpaperBackground theme={chatWallpaper} fallbackColor="#0A1628">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={styles.chatHeader}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [pressed && { opacity: 0.7 }]}>
            <Text style={styles.backBtn}>←</Text>
          </Pressable>
          {influencer.avatarImageUrl ? (
            <Image source={{ uri: influencer.avatarImageUrl }} style={styles.headerAvatar} contentFit="cover" />
          ) : (
            <View style={[styles.headerAvatarFallback, { backgroundColor: influencer.avatarColor }]}>
              <Text style={styles.headerAvatarEmoji}>{influencer.avatarEmoji}</Text>
            </View>
          )}
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{influencer.name}</Text>
            <Text style={styles.headerStatus}>
              {isTyping ? "typing..." : `Teaches ${influencer.teachingLanguage || influencer.language}`}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push({ pathname: "/influencer-call", params: { influencerId } })}
            style={({ pressed }) => [styles.headerCallBtn, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.headerCallIcon}>📞</Text>
          </Pressable>
        </View>

        {/* Language Badge */}
        <View style={styles.languageBanner}>
          <Text style={styles.languageBannerText}>
            🗣️ Native: {influencer.nativeLanguage || influencer.language} → Teaches: {influencer.teachingLanguage || influencer.language}
          </Text>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />

        {/* Typing Indicator */}
        {isTyping && (
          <View style={styles.typingIndicator}>
            <Text style={styles.typingText}>{influencer.name.split(" ")[0]} is typing...</Text>
          </View>
        )}

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            placeholder={`Message ${influencer.name.split(" ")[0]}...`}
            placeholderTextColor="#687076"
            value={inputText}
            onChangeText={setInputText}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            multiline
          />
          <Pressable
            onPress={handleSend}
            style={({ pressed }) => [
              styles.sendBtn,
              !inputText.trim() && styles.sendBtnDisabled,
              pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] },
            ]}
          >
            <Text style={styles.sendBtnText}>→</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
      </ChatWallpaperBackground>
</ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { fontSize: 16, color: "#9BA1A6" },
  chatHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: "#334155" },
  backBtn: { fontSize: 24, color: "#fff", marginRight: 12 },
  headerAvatar: { width: 40, height: 40, borderRadius: 20 },
  headerAvatarFallback: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headerAvatarEmoji: { fontSize: 20 },
  headerInfo: { flex: 1, marginLeft: 10 },
  headerName: { fontSize: 16, fontWeight: "700", color: "#fff" },
  headerStatus: { fontSize: 12, color: "#9BA1A6", marginTop: 1 },
  headerCallBtn: { padding: 8 },
  headerCallIcon: { fontSize: 20 },
  languageBanner: { backgroundColor: "#0a7ea422", paddingVertical: 6, paddingHorizontal: 16 },
  languageBannerText: { fontSize: 11, color: "#0a7ea4", textAlign: "center", fontWeight: "500" },
  messagesList: { flex: 1 },
  messagesContent: { paddingHorizontal: 16, paddingVertical: 12 },
  messageBubble: { flexDirection: "row", marginBottom: 12, alignItems: "flex-end" },
  userBubble: { justifyContent: "flex-end" },
  influencerBubble: { justifyContent: "flex-start" },
  messageAvatar: { width: 28, height: 28, borderRadius: 14, marginRight: 8 },
  messageContent: { maxWidth: "75%", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  userContent: { backgroundColor: "#0a7ea4", borderBottomRightRadius: 4, alignSelf: "flex-end", marginLeft: "auto" },
  influencerContent: { backgroundColor: "#1e2022", borderBottomLeftRadius: 4 },
  messageText: { fontSize: 14, lineHeight: 20 },
  userText: { color: "#fff" },
  influencerText: { color: "#ECEDEE" },
  messageTime: { fontSize: 10, color: "#ffffff88", marginTop: 4, alignSelf: "flex-end" },
  typingIndicator: { paddingHorizontal: 16, paddingVertical: 6 },
  typingText: { fontSize: 12, color: "#9BA1A6", fontStyle: "italic" },
  inputBar: { flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 0.5, borderTopColor: "#334155", gap: 8 },
  textInput: { flex: 1, backgroundColor: "#1e2022", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: "#fff", maxHeight: 100 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#0a7ea4", alignItems: "center", justifyContent: "center" },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { fontSize: 18, color: "#fff", fontWeight: "700" },
});
