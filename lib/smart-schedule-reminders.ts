import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { loadSmartSchedule, type SmartSchedule } from "./accountability";

// ─── Motivational Messages by Language ────────────────────────────────────────
const MOTIVATIONAL_MESSAGES: Record<string, { title: string; body: string }[]> = {
  "es": [
    { title: "¡Hora de aprender! 📚", body: "Tu clase de español te espera. ¡Vamos!" },
    { title: "¡No pierdas tu racha! 🔥", body: "Unos minutos de práctica hacen la diferencia." },
    { title: "¡Tú puedes! 💪", body: "Cada día mejoras más. ¡A practicar!" },
    { title: "¡Momento de brillar! ✨", body: "Tu profesor te está esperando. ¡Conecta ahora!" },
    { title: "¡Sigue así! 🌟", body: "La constancia es la clave del éxito." },
  ],
  "fr": [
    { title: "C'est l'heure d'apprendre! 📚", body: "Votre cours de français vous attend. Allons-y!" },
    { title: "Ne perdez pas votre série! 🔥", body: "Quelques minutes de pratique font la différence." },
    { title: "Vous pouvez le faire! 💪", body: "Chaque jour vous progressez. Pratiquez!" },
    { title: "Moment de briller! ✨", body: "Votre professeur vous attend. Connectez-vous!" },
    { title: "Continuez comme ça! 🌟", body: "La constance est la clé du succès." },
  ],
  "pt": [
    { title: "Hora de aprender! 📚", body: "Sua aula de português te espera. Vamos!" },
    { title: "Não perca sua sequência! 🔥", body: "Alguns minutos de prática fazem a diferença." },
    { title: "Você consegue! 💪", body: "Cada dia você melhora mais. Pratique!" },
    { title: "Momento de brilhar! ✨", body: "Seu professor está esperando. Conecte-se agora!" },
    { title: "Continue assim! 🌟", body: "A constância é a chave do sucesso." },
  ],
  "ja": [
    { title: "学習の時間です！📚", body: "日本語のレッスンが待っています。頑張りましょう！" },
    { title: "連続記録を守ろう！🔥", body: "数分の練習が大きな違いを生みます。" },
    { title: "あなたならできる！💪", body: "毎日上達しています。練習しましょう！" },
    { title: "輝く時間です！✨", body: "先生が待っています。今すぐ接続しましょう！" },
    { title: "その調子！🌟", body: "継続は力なり。" },
  ],
  "ko": [
    { title: "공부할 시간이에요! 📚", body: "한국어 수업이 기다리고 있어요. 파이팅!" },
    { title: "연속 기록을 지키세요! 🔥", body: "몇 분의 연습이 큰 차이를 만듭니다." },
    { title: "할 수 있어요! 💪", body: "매일 더 나아지고 있어요. 연습하세요!" },
    { title: "빛날 시간이에요! ✨", body: "선생님이 기다리고 있어요. 지금 연결하세요!" },
    { title: "계속 이렇게! 🌟", body: "꾸준함이 성공의 열쇠입니다." },
  ],
  "ar": [
    { title: "حان وقت التعلم! 📚", body: "درس العربية ينتظرك. هيا بنا!" },
    { title: "لا تفقد سلسلتك! 🔥", body: "بضع دقائق من التمرين تصنع الفرق." },
    { title: "أنت تستطيع! 💪", body: "كل يوم تتحسن أكثر. تدرب!" },
    { title: "وقت التألق! ✨", body: "معلمك ينتظرك. اتصل الآن!" },
    { title: "استمر هكذا! 🌟", body: "الاستمرارية هي مفتاح النجاح." },
  ],
  "zh": [
    { title: "学习时间到！📚", body: "中文课在等你。加油！" },
    { title: "别断了连续记录！🔥", body: "几分钟的练习就能产生巨大变化。" },
    { title: "你能行！💪", body: "每天都在进步。继续练习吧！" },
    { title: "闪耀时刻！✨", body: "老师在等你。现在就连接吧！" },
    { title: "继续保持！🌟", body: "坚持就是胜利。" },
  ],
  "hi": [
    { title: "सीखने का समय! 📚", body: "आपकी हिंदी कक्षा आपका इंतजार कर रही है। चलिए!" },
    { title: "अपनी स्ट्रीक मत तोड़ो! 🔥", body: "कुछ मिनट का अभ्यास बड़ा फर्क डालता है।" },
    { title: "तुम कर सकते हो! 💪", body: "हर दिन तुम बेहतर हो रहे हो। अभ्यास करो!" },
    { title: "चमकने का समय! ✨", body: "आपके शिक्षक इंतजार कर रहे हैं। अभी जुड़ें!" },
    { title: "ऐसे ही चलते रहो! 🌟", body: "निरंतरता सफलता की कुंजी है।" },
  ],
  "de": [
    { title: "Zeit zum Lernen! 📚", body: "Dein Deutschkurs wartet auf dich. Los geht's!" },
    { title: "Verlier deine Serie nicht! 🔥", body: "Ein paar Minuten Übung machen den Unterschied." },
    { title: "Du schaffst das! 💪", body: "Jeden Tag wirst du besser. Übe weiter!" },
    { title: "Zeit zu glänzen! ✨", body: "Dein Lehrer wartet. Verbinde dich jetzt!" },
    { title: "Weiter so! 🌟", body: "Beständigkeit ist der Schlüssel zum Erfolg." },
  ],
  "it": [
    { title: "È ora di imparare! 📚", body: "La tua lezione d'italiano ti aspetta. Andiamo!" },
    { title: "Non perdere la tua serie! 🔥", body: "Pochi minuti di pratica fanno la differenza." },
    { title: "Ce la puoi fare! 💪", body: "Ogni giorno migliori. Pratica!" },
    { title: "Momento di brillare! ✨", body: "Il tuo insegnante ti aspetta. Connettiti ora!" },
    { title: "Continua così! 🌟", body: "La costanza è la chiave del successo." },
  ],
  "ru": [
    { title: "Время учиться! 📚", body: "Ваш урок русского ждёт вас. Вперёд!" },
    { title: "Не теряйте серию! 🔥", body: "Несколько минут практики имеют значение." },
    { title: "Вы можете! 💪", body: "Каждый день вы становитесь лучше. Практикуйтесь!" },
    { title: "Время сиять! ✨", body: "Ваш учитель ждёт. Подключитесь сейчас!" },
    { title: "Так держать! 🌟", body: "Постоянство — ключ к успеху." },
  ],
  "en": [
    { title: "Time to learn! 📚", body: "Your English lesson awaits. Let's go!" },
    { title: "Don't break your streak! 🔥", body: "A few minutes of practice make all the difference." },
    { title: "You've got this! 💪", body: "You're getting better every day. Keep practicing!" },
    { title: "Time to shine! ✨", body: "Your teacher is waiting. Connect now!" },
    { title: "Keep it up! 🌟", body: "Consistency is the key to success." },
  ],
};

// Fallback English messages
const FALLBACK_MESSAGES = MOTIVATIONAL_MESSAGES["en"]!;

/**
 * Get a random motivational message in the user's target language
 */
function getMotivationalMessage(langCode: string): { title: string; body: string } {
  // Try exact match first, then base language
  const baseLang = langCode.split("-")[0];
  const messages = MOTIVATIONAL_MESSAGES[langCode] || MOTIVATIONAL_MESSAGES[baseLang] || FALLBACK_MESSAGES;
  return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Schedule smart reminders based on the user's saved schedule.
 * Sends motivational messages in their target language at their chosen study times.
 */
export async function scheduleSmartReminders(): Promise<void> {
  const schedule = await loadSmartSchedule();
  if (!schedule || !schedule.slots.length) return;

  // Get user's target language
  const targetLang = await AsyncStorage.getItem("@target_language") || "es";

  // Cancel existing smart reminders
  const existing = await Notifications.getAllScheduledNotificationsAsync();
  for (const notif of existing) {
    if ((notif.content.data as any)?.type === "smart_schedule_reminder") {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  }

  // Map day names to weekday numbers (1=Sunday, 2=Monday, ..., 7=Saturday for expo)
  const dayToWeekday: Record<string, number> = {
    "Sunday": 1,
    "Monday": 2,
    "Tuesday": 3,
    "Wednesday": 4,
    "Thursday": 5,
    "Friday": 6,
    "Saturday": 7,
  };

  // Schedule a notification for each time slot
  for (const slot of schedule.slots) {
    const weekday = dayToWeekday[slot.day];
    if (!weekday) continue;

    const message = getMotivationalMessage(targetLang);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: message.title,
        body: message.body,
        data: { type: "smart_schedule_reminder", day: slot.day, hour: slot.startHour },
        sound: "default",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday,
        hour: slot.startHour,
        minute: slot.startMinute || 0,
      },
    });
  }
}

/**
 * Cancel all smart schedule reminders
 */
export async function cancelSmartReminders(): Promise<void> {
  const existing = await Notifications.getAllScheduledNotificationsAsync();
  for (const notif of existing) {
    if ((notif.content.data as any)?.type === "smart_schedule_reminder") {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  }
}

/**
 * Check if smart reminders are currently scheduled
 */
export async function hasSmartReminders(): Promise<boolean> {
  const existing = await Notifications.getAllScheduledNotificationsAsync();
  return existing.some((n) => (n.content.data as any)?.type === "smart_schedule_reminder");
}
