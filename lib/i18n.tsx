import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Supported languages (60+)
export type AppLanguage =
  | "en" | "es" | "fr" | "pt" | "ja" | "ko" | "zh" | "ar" | "hi" | "sw"
  | "it" | "de" | "ru" | "tl" | "vi" | "th" | "tr" | "pl" | "nl" | "sv"
  | "no" | "da" | "fi" | "el" | "he" | "hu" | "cs" | "ro" | "sk" | "hr"
  | "bg" | "uk" | "id" | "ms" | "bn" | "ta" | "te" | "mr" | "gu" | "kn"
  | "ml" | "ur" | "pa" | "am" | "yo" | "ig" | "zu" | "af" | "fa" | "my"
  | "km" | "mn" | "ht" | "ca" | "lt" | "kk" | "ps" | "ne" | "si" | "lo"
  | "ka" | "az";

export interface LanguageInfo {
  code: AppLanguage;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷" },
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇧🇷" },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "Korean", nativeName: "한국어", flag: "🇰🇷" },
  { code: "zh", name: "Chinese", nativeName: "中文", flag: "🇨🇳" },
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
  { code: "sw", name: "Swahili", nativeName: "Kiswahili", flag: "🇰🇪" },
  { code: "it", name: "Italian", nativeName: "Italiano", flag: "🇮🇹" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  { code: "ru", name: "Russian", nativeName: "Русский", flag: "🇷🇺" },
  { code: "tl", name: "Filipino", nativeName: "Tagalog", flag: "🇵🇭" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt", flag: "🇻🇳" },
  { code: "th", name: "Thai", nativeName: "ไทย", flag: "🇹🇭" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe", flag: "🇹🇷" },
  { code: "pl", name: "Polish", nativeName: "Polski", flag: "🇵🇱" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands", flag: "🇳🇱" },
  { code: "sv", name: "Swedish", nativeName: "Svenska", flag: "🇸🇪" },
  { code: "no", name: "Norwegian", nativeName: "Norsk", flag: "🇳🇴" },
  { code: "da", name: "Danish", nativeName: "Dansk", flag: "🇩🇰" },
  { code: "fi", name: "Finnish", nativeName: "Suomi", flag: "🇫🇮" },
  { code: "el", name: "Greek", nativeName: "Ελληνικά", flag: "🇬🇷" },
  { code: "he", name: "Hebrew", nativeName: "עברית", flag: "🇮🇱" },
  { code: "hu", name: "Hungarian", nativeName: "Magyar", flag: "🇭🇺" },
  { code: "cs", name: "Czech", nativeName: "Čeština", flag: "🇨🇿" },
  { code: "ro", name: "Romanian", nativeName: "Română", flag: "🇷🇴" },
  { code: "sk", name: "Slovak", nativeName: "Slovenčina", flag: "🇸🇰" },
  { code: "hr", name: "Croatian", nativeName: "Hrvatski", flag: "🇭🇷" },
  { code: "bg", name: "Bulgarian", nativeName: "Български", flag: "🇧🇬" },
  { code: "uk", name: "Ukrainian", nativeName: "Українська", flag: "🇺🇦" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia", flag: "🇮🇩" },
  { code: "ms", name: "Malay", nativeName: "Bahasa Melayu", flag: "🇲🇾" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", flag: "🇧🇩" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", flag: "🇮🇳" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", flag: "🇮🇳" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", flag: "🇮🇳" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", flag: "🇮🇳" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", flag: "🇮🇳" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം", flag: "🇮🇳" },
  { code: "ur", name: "Urdu", nativeName: "اردو", flag: "🇵🇰" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", flag: "🇮🇳" },
  { code: "am", name: "Amharic", nativeName: "አማርኛ", flag: "🇪🇹" },
  { code: "yo", name: "Yoruba", nativeName: "Yorùbá", flag: "🇳🇬" },
  { code: "ig", name: "Igbo", nativeName: "Igbo", flag: "🇳🇬" },
  { code: "zu", name: "Zulu", nativeName: "isiZulu", flag: "🇿🇦" },
  { code: "af", name: "Afrikaans", nativeName: "Afrikaans", flag: "🇿🇦" },
  { code: "fa", name: "Persian", nativeName: "فارسی", flag: "🇮🇷" },
  { code: "my", name: "Burmese", nativeName: "မြန်မာ", flag: "🇲🇲" },
  { code: "km", name: "Khmer", nativeName: "ខ្មែរ", flag: "🇰🇭" },
  { code: "mn", name: "Mongolian", nativeName: "Монгол", flag: "🇲🇳" },
  { code: "ht", name: "Haitian Creole", nativeName: "Kreyòl Ayisyen", flag: "🇭🇹" },
  { code: "ca", name: "Catalan", nativeName: "Català", flag: "🇪🇸" },
  { code: "lt", name: "Lithuanian", nativeName: "Lietuvių", flag: "🇱🇹" },
  { code: "kk", name: "Kazakh", nativeName: "Қазақ", flag: "🇰🇿" },
  { code: "ps", name: "Pashto", nativeName: "پښتو", flag: "🇦🇫" },
  { code: "ne", name: "Nepali", nativeName: "नेपाली", flag: "🇳🇵" },
  { code: "si", name: "Sinhala", nativeName: "සිංහල", flag: "🇱🇰" },
  { code: "lo", name: "Lao", nativeName: "ລາວ", flag: "🇱🇦" },
  { code: "ka", name: "Georgian", nativeName: "ქართული", flag: "🇬🇪" },
  { code: "az", name: "Azerbaijani", nativeName: "Azərbaycan", flag: "🇦🇿" },
];

// Translation keys
export interface Translations {
  // Tab labels
  home: string;
  learn: string;
  songs: string;
  translate: string;
  calls: string;
  messages: string;
  explore: string;
  profile: string;

  // Home screen
  welcome: string;
  goodMorning: string;
  goodAfternoon: string;
  goodEvening: string;
  todaysSlang: string;
  quickActions: string;
  continueLesson: string;
  recordStudio: string;
  translateSong: string;
  watchAndLearn: string;
  virtualClassroom: string;
  aiPenPal: string;
  karaoke: string;
  travelCompanion: string;
  podcast: string;
  radio: string;
  dating: string;
  kids: string;

  // Learn tab
  overview: string;
  teachers: string;
  classes: string;
  lessons: string;
  progress: string;
  recordings: string;
  calendar: string;
  activeLessons: string;
  streak: string;
  wordsLearned: string;
  xpEarned: string;

  // Songs tab
  trending: string;
  myLibrary: string;
  aiGenerated: string;
  recordNow: string;
  karaokeMode: string;
  searchSongs: string;

  // Translate tab
  typeOrPaste: string;
  translateNow: string;
  pasteUrl: string;
  camera: string;
  voice: string;
  history: string;
  urlTranslate: string;
  socialTranslate: string;

  // Calls tab
  recents: string;
  contacts: string;
  dialpad: string;
  voicemail: string;
  videoCall: string;
  callTranslator: string;

  // Messages tab
  chats: string;
  groups: string;
  aiChat: string;
  newMessage: string;

  // Profile
  settings: string;
  subscription: string;
  achievements: string;
  languagePack: string;
  darkMode: string;
  notifications: string;
  privacy: string;
  helpSupport: string;
  logOut: string;

  // Home screen sections
  learningHub: string;
  coreFeatures: string;
  communication: string;
  dailyChallenge: string;
  streakRewards: string;
  continueLearning: string;
  myProgress: string;
  dailyGoals: string;
  weeklyDigest: string;
  upgradeToPro: string;
  myUsageBalance: string;
  upcomingClasses: string;
  aiTipOfDay: string;
  reviewDueCards: string;
  learningPace: string;
  smartSchedule: string;
  todaysProgress: string;
  words: string;
  startChallenge: string;
  challengeComplete: string;
  watchTour: string;
  watchNow: string;
  listen: string;
  onTrack: string;
  dailyGoal: string;
  remaining: string;
  thisWeek: string;

  // Settings screen
  account: string;
  editProfile: string;
  appMedia: string;
  appearance: string;
  appUiLanguage: string;
  learningLanguage: string;
  about: string;
  version: string;
  rateApp: string;
  shareApp: string;
  deleteAccount: string;

  // Common
  cancel: string;
  save: string;
  done: string;
  next: string;
  back: string;
  search: string;
  loading: string;
  error: string;
  retry: string;
  free: string;
  pro: string;
  premium: string;
  upgrade: string;
  minutes: string;
  hours: string;
  days: string;
}

// English base translations
const en: Translations = {
  home: "Home", learn: "Learn", songs: "Songs", translate: "Translate",
  calls: "Calls", messages: "Messages", explore: "Explore", profile: "Profile",
  welcome: "Welcome", goodMorning: "Good Morning", goodAfternoon: "Good Afternoon",
  goodEvening: "Good Evening", todaysSlang: "Today's Slang", quickActions: "Quick Actions",
  continueLesson: "Continue Lesson", recordStudio: "Record Studio",
  translateSong: "Translate Song", watchAndLearn: "Watch & Learn",
  virtualClassroom: "Virtual Classroom", aiPenPal: "AI Pen Pal",
  karaoke: "Karaoke", travelCompanion: "Travel Companion",
  podcast: "Podcast", radio: "Radio", dating: "Dating", kids: "Kids",
  overview: "Overview", teachers: "Teachers", classes: "Classes",
  lessons: "Lessons", progress: "Progress", recordings: "Recordings",
  calendar: "Calendar", activeLessons: "Active Lessons", streak: "Streak",
  wordsLearned: "Words Learned", xpEarned: "XP Earned",
  trending: "Trending", myLibrary: "My Library", aiGenerated: "AI Generated",
  recordNow: "Record Now", karaokeMode: "Karaoke Mode", searchSongs: "Search songs...",
  typeOrPaste: "Type or paste text...", translateNow: "Translate",
  pasteUrl: "Paste URL", camera: "Camera", voice: "Voice",
  history: "History", urlTranslate: "URL Translate", socialTranslate: "Social Translate",
  recents: "Recents", contacts: "Contacts", dialpad: "Dialpad",
  voicemail: "Voicemail", videoCall: "Video Call", callTranslator: "Call Translator",
  chats: "Chats", groups: "Groups", aiChat: "AI Chat", newMessage: "New Message",
  settings: "Settings", subscription: "Subscription", achievements: "Achievements",
  languagePack: "Language Pack", darkMode: "Dark Mode", notifications: "Notifications",
  privacy: "Privacy", helpSupport: "Help & Support", logOut: "Log Out",
  cancel: "Cancel", save: "Save", done: "Done", next: "Next", back: "Back",
  search: "Search", loading: "Loading...", error: "Error", retry: "Retry",
  free: "Free", pro: "Pro", premium: "Premium", upgrade: "Upgrade",
  minutes: "minutes", hours: "hours", days: "days",
  // Home screen sections
  learningHub: "Learning Hub", coreFeatures: "Core Features", communication: "Communication",
  dailyChallenge: "Daily Challenge", streakRewards: "Streak Rewards",
  continueLearning: "Continue Learning", myProgress: "My Progress",
  dailyGoals: "Daily Goals", weeklyDigest: "Weekly Digest",
  upgradeToPro: "Upgrade to Pro", myUsageBalance: "My Usage & Balance",
  upcomingClasses: "Upcoming Classes", aiTipOfDay: "AI Tip of the Day",
  reviewDueCards: "Review Due Cards", learningPace: "Learning Pace",
  smartSchedule: "Smart Schedule", todaysProgress: "Today's Progress",
  words: "Words", startChallenge: "Start Challenge",
  challengeComplete: "Challenge Complete!", watchTour: "Watch Tour",
  watchNow: "Watch Now", listen: "Listen", onTrack: "On Track",
  dailyGoal: "daily goal", remaining: "remaining", thisWeek: "this week",
  // Settings
  account: "Account", editProfile: "Edit Profile", appMedia: "App & Media",
  appearance: "Appearance", appUiLanguage: "App UI Language",
  learningLanguage: "Learning Language", about: "About",
  version: "Version", rateApp: "Rate App", shareApp: "Share App",
  deleteAccount: "Delete Account",
};

// All 62 language translations
const translations: Record<AppLanguage, Translations> = {
  en,
  es: {
    home: "Casa", learn: "Aprender", songs: "Canciones", translate: "Traducir",
    calls: "Llamadas", messages: "Mensajes", explore: "Explorar", profile: "Perfil",
    welcome: "Bienvenido", goodMorning: "Buenos Días", goodAfternoon: "Buenas Tardes",
    goodEvening: "Buenas Noches", todaysSlang: "Jerga del Día", quickActions: "Acciones Rápidas",
    continueLesson: "Continuar Lección", recordStudio: "Estudio de Grabación",
    translateSong: "Traducir Canción", watchAndLearn: "Mira y Aprende",
    virtualClassroom: "Aula Virtual", aiPenPal: "Amigo por IA",
    karaoke: "Karaoke", travelCompanion: "Compañero de Viaje",
    podcast: "Podcast", radio: "Radio", dating: "Citas", kids: "Niños",
    overview: "Resumen", teachers: "Profesores", classes: "Clases",
    lessons: "Lecciones", progress: "Progreso", recordings: "Grabaciones",
    calendar: "Calendario", activeLessons: "Lecciones Activas", streak: "Racha",
    wordsLearned: "Palabras Aprendidas", xpEarned: "XP Ganado",
    trending: "Tendencias", myLibrary: "Mi Biblioteca", aiGenerated: "Generado por IA",
    recordNow: "Grabar Ahora", karaokeMode: "Modo Karaoke", searchSongs: "Buscar canciones...",
    typeOrPaste: "Escribe o pega texto...", translateNow: "Traducir",
    pasteUrl: "Pegar URL", camera: "Cámara", voice: "Voz",
    history: "Historial", urlTranslate: "Traducir URL", socialTranslate: "Traducir Redes",
    recents: "Recientes", contacts: "Contactos", dialpad: "Teclado",
    voicemail: "Buzón de Voz", videoCall: "Videollamada", callTranslator: "Traductor de Llamadas",
    chats: "Chats", groups: "Grupos", aiChat: "Chat IA", newMessage: "Nuevo Mensaje",
    settings: "Ajustes", subscription: "Suscripción", achievements: "Logros",
    languagePack: "Paquete de Idioma", darkMode: "Modo Oscuro", notifications: "Notificaciones",
    privacy: "Privacidad", helpSupport: "Ayuda y Soporte", logOut: "Cerrar Sesión",
    cancel: "Cancelar", save: "Guardar", done: "Listo", next: "Siguiente", back: "Atrás",
    search: "Buscar", loading: "Cargando...", error: "Error", retry: "Reintentar",
    free: "Gratis", pro: "Pro", premium: "Premium", upgrade: "Mejorar",
    minutes: "minutos", hours: "horas", days: "días",
    learningHub: "Centro de Aprendizaje", coreFeatures: "Funciones Principales", communication: "Comunicación",
    dailyChallenge: "Desafío Diario", streakRewards: "Recompensas de Racha",
    continueLearning: "Continuar Aprendiendo", myProgress: "Mi Progreso",
    dailyGoals: "Metas Diarias", weeklyDigest: "Resumen Semanal",
    upgradeToPro: "Mejorar a Pro", myUsageBalance: "Mi Uso y Saldo",
    upcomingClasses: "Próximas Clases", aiTipOfDay: "Consejo IA del Día",
    reviewDueCards: "Repasar Tarjetas", learningPace: "Ritmo de Aprendizaje",
    smartSchedule: "Horario Inteligente", todaysProgress: "Progreso de Hoy",
    words: "Palabras", startChallenge: "Iniciar Desafío",
    challengeComplete: "¡Desafío Completado!", watchTour: "Ver Tour",
    watchNow: "Ver Ahora", listen: "Escuchar", onTrack: "En Camino",
    dailyGoal: "meta diaria", remaining: "restante", thisWeek: "esta semana",
    account: "Cuenta", editProfile: "Editar Perfil", appMedia: "App y Medios",
    appearance: "Apariencia", appUiLanguage: "Idioma de la App",
    learningLanguage: "Idioma de Aprendizaje", about: "Acerca de",
    version: "Versión", rateApp: "Calificar App", shareApp: "Compartir App",
    deleteAccount: "Eliminar Cuenta",
  },
  fr: {
    home: "Accueil", learn: "Apprendre", songs: "Chansons", translate: "Traduire",
    calls: "Appels", messages: "Messages", explore: "Explorer", profile: "Profil",
    welcome: "Bienvenue", goodMorning: "Bonjour", goodAfternoon: "Bon Après-midi",
    goodEvening: "Bonsoir", todaysSlang: "Argot du Jour", quickActions: "Actions Rapides",
    continueLesson: "Continuer la Leçon", recordStudio: "Studio d'Enregistrement",
    translateSong: "Traduire Chanson", watchAndLearn: "Regarde et Apprends",
    virtualClassroom: "Classe Virtuelle", aiPenPal: "Correspondant IA",
    karaoke: "Karaoké", travelCompanion: "Compagnon de Voyage",
    podcast: "Podcast", radio: "Radio", dating: "Rencontres", kids: "Enfants",
    overview: "Aperçu", teachers: "Professeurs", classes: "Cours",
    lessons: "Leçons", progress: "Progrès", recordings: "Enregistrements",
    calendar: "Calendrier", activeLessons: "Leçons Actives", streak: "Série",
    wordsLearned: "Mots Appris", xpEarned: "XP Gagné",
    trending: "Tendances", myLibrary: "Ma Bibliothèque", aiGenerated: "Généré par IA",
    recordNow: "Enregistrer", karaokeMode: "Mode Karaoké", searchSongs: "Chercher chansons...",
    typeOrPaste: "Tapez ou collez du texte...", translateNow: "Traduire",
    pasteUrl: "Coller URL", camera: "Caméra", voice: "Voix",
    history: "Historique", urlTranslate: "Traduire URL", socialTranslate: "Traduire Réseaux",
    recents: "Récents", contacts: "Contacts", dialpad: "Clavier",
    voicemail: "Messagerie", videoCall: "Appel Vidéo", callTranslator: "Traducteur d'Appels",
    chats: "Discussions", groups: "Groupes", aiChat: "Chat IA", newMessage: "Nouveau Message",
    settings: "Paramètres", subscription: "Abonnement", achievements: "Réalisations",
    languagePack: "Pack de Langue", darkMode: "Mode Sombre", notifications: "Notifications",
    privacy: "Confidentialité", helpSupport: "Aide et Support", logOut: "Déconnexion",
    cancel: "Annuler", save: "Enregistrer", done: "Terminé", next: "Suivant", back: "Retour",
    search: "Rechercher", loading: "Chargement...", error: "Erreur", retry: "Réessayer",
    free: "Gratuit", pro: "Pro", premium: "Premium", upgrade: "Améliorer",
    minutes: "minutes", hours: "heures", days: "jours",
    learningHub: "Centre d'Apprentissage", coreFeatures: "Fonctions Principales", communication: "Communication",
    dailyChallenge: "Défi du Jour", streakRewards: "Récompenses de Série",
    continueLearning: "Continuer à Apprendre", myProgress: "Mon Progrès",
    dailyGoals: "Objectifs Quotidiens", weeklyDigest: "Résumé Hebdomadaire",
    upgradeToPro: "Passer à Pro", myUsageBalance: "Mon Utilisation",
    upcomingClasses: "Prochains Cours", aiTipOfDay: "Conseil IA du Jour",
    reviewDueCards: "Réviser les Cartes", learningPace: "Rythme d'Apprentissage",
    smartSchedule: "Planning Intelligent", todaysProgress: "Progrès du Jour",
    words: "Mots", startChallenge: "Commencer le Défi",
    challengeComplete: "Défi Terminé !", watchTour: "Voir la Visite",
    watchNow: "Regarder", listen: "Écouter", onTrack: "En Bonne Voie",
    dailyGoal: "objectif quotidien", remaining: "restant", thisWeek: "cette semaine",
    account: "Compte", editProfile: "Modifier le Profil", appMedia: "App et Médias",
    appearance: "Apparence", appUiLanguage: "Langue de l'App",
    learningLanguage: "Langue d'Apprentissage", about: "À Propos",
    version: "Version", rateApp: "Noter l'App", shareApp: "Partager l'App",
    deleteAccount: "Supprimer le Compte",
  },
  pt: {
    home: "Início", learn: "Aprender", songs: "Músicas", translate: "Traduzir",
    calls: "Chamadas", messages: "Mensagens", explore: "Explorar", profile: "Perfil",
    welcome: "Bem-vindo", goodMorning: "Bom Dia", goodAfternoon: "Boa Tarde",
    goodEvening: "Boa Noite", todaysSlang: "Gíria do Dia", quickActions: "Ações Rápidas",
    continueLesson: "Continuar Lição", recordStudio: "Estúdio de Gravação",
    translateSong: "Traduzir Música", watchAndLearn: "Assista e Aprenda",
    virtualClassroom: "Sala Virtual", aiPenPal: "Amigo por IA",
    karaoke: "Karaokê", travelCompanion: "Companheiro de Viagem",
    podcast: "Podcast", radio: "Rádio", dating: "Encontros", kids: "Crianças",
    overview: "Visão Geral", teachers: "Professores", classes: "Aulas",
    lessons: "Lições", progress: "Progresso", recordings: "Gravações",
    calendar: "Calendário", activeLessons: "Lições Ativas", streak: "Sequência",
    wordsLearned: "Palavras Aprendidas", xpEarned: "XP Ganho",
    trending: "Em Alta", myLibrary: "Minha Biblioteca", aiGenerated: "Gerado por IA",
    recordNow: "Gravar Agora", karaokeMode: "Modo Karaokê", searchSongs: "Buscar músicas...",
    typeOrPaste: "Digite ou cole texto...", translateNow: "Traduzir",
    pasteUrl: "Colar URL", camera: "Câmera", voice: "Voz",
    history: "Histórico", urlTranslate: "Traduzir URL", socialTranslate: "Traduzir Redes",
    recents: "Recentes", contacts: "Contatos", dialpad: "Teclado",
    voicemail: "Correio de Voz", videoCall: "Videochamada", callTranslator: "Tradutor de Chamadas",
    chats: "Conversas", groups: "Grupos", aiChat: "Chat IA", newMessage: "Nova Mensagem",
    settings: "Configurações", subscription: "Assinatura", achievements: "Conquistas",
    languagePack: "Pacote de Idioma", darkMode: "Modo Escuro", notifications: "Notificações",
    privacy: "Privacidade", helpSupport: "Ajuda e Suporte", logOut: "Sair",
    cancel: "Cancelar", save: "Salvar", done: "Pronto", next: "Próximo", back: "Voltar",
    search: "Buscar", loading: "Carregando...", error: "Erro", retry: "Tentar Novamente",
    free: "Grátis", pro: "Pro", premium: "Premium", upgrade: "Melhorar",
    minutes: "minutos", hours: "horas", days: "dias",
    learningHub: "Centro de Aprendizado", coreFeatures: "Funções Principais", communication: "Comunicação",
    dailyChallenge: "Desafio Diário", streakRewards: "Recompensas de Sequência",
    continueLearning: "Continuar Aprendendo", myProgress: "Meu Progresso",
    dailyGoals: "Metas Diárias", weeklyDigest: "Resumo Semanal",
    upgradeToPro: "Melhorar para Pro", myUsageBalance: "Meu Uso e Saldo",
    upcomingClasses: "Próximas Aulas", aiTipOfDay: "Dica IA do Dia",
    reviewDueCards: "Revisar Cartões", learningPace: "Ritmo de Aprendizado",
    smartSchedule: "Horário Inteligente", todaysProgress: "Progresso de Hoje",
    words: "Palavras", startChallenge: "Iniciar Desafio",
    challengeComplete: "Desafio Concluído!", watchTour: "Ver Tour",
    watchNow: "Assistir Agora", listen: "Ouvir", onTrack: "No Caminho",
    dailyGoal: "meta diária", remaining: "restante", thisWeek: "esta semana",
    account: "Conta", editProfile: "Editar Perfil", appMedia: "App e Mídia",
    appearance: "Aparência", appUiLanguage: "Idioma do App",
    learningLanguage: "Idioma de Aprendizado", about: "Sobre",
    version: "Versão", rateApp: "Avaliar App", shareApp: "Compartilhar App",
    deleteAccount: "Excluir Conta",
  },
  ja: {
    home: "ホーム", learn: "学ぶ", songs: "曲", translate: "翻訳",
    calls: "通話", messages: "メッセージ", explore: "探索", profile: "プロフィール",
    welcome: "ようこそ", goodMorning: "おはようございます", goodAfternoon: "こんにちは",
    goodEvening: "こんばんは", todaysSlang: "今日のスラング", quickActions: "クイックアクション",
    continueLesson: "レッスンを続ける", recordStudio: "録音スタジオ",
    translateSong: "曲を翻訳", watchAndLearn: "見て学ぶ",
    virtualClassroom: "バーチャル教室", aiPenPal: "AIペンパル",
    karaoke: "カラオケ", travelCompanion: "旅行コンパニオン",
    podcast: "ポッドキャスト", radio: "ラジオ", dating: "デート", kids: "キッズ",
    overview: "概要", teachers: "先生", classes: "クラス",
    lessons: "レッスン", progress: "進捗", recordings: "録音",
    calendar: "カレンダー", activeLessons: "アクティブレッスン", streak: "連続記録",
    wordsLearned: "学んだ単語", xpEarned: "獲得XP",
    trending: "トレンド", myLibrary: "マイライブラリ", aiGenerated: "AI生成",
    recordNow: "今すぐ録音", karaokeMode: "カラオケモード", searchSongs: "曲を検索...",
    typeOrPaste: "テキストを入力または貼り付け...", translateNow: "翻訳する",
    pasteUrl: "URLを貼り付け", camera: "カメラ", voice: "音声",
    history: "履歴", urlTranslate: "URL翻訳", socialTranslate: "SNS翻訳",
    recents: "最近", contacts: "連絡先", dialpad: "ダイヤルパッド",
    voicemail: "ボイスメール", videoCall: "ビデオ通話", callTranslator: "通話翻訳",
    chats: "チャット", groups: "グループ", aiChat: "AIチャット", newMessage: "新規メッセージ",
    settings: "設定", subscription: "サブスクリプション", achievements: "実績",
    languagePack: "言語パック", darkMode: "ダークモード", notifications: "通知",
    privacy: "プライバシー", helpSupport: "ヘルプ＆サポート", logOut: "ログアウト",
    cancel: "キャンセル", save: "保存", done: "完了", next: "次へ", back: "戻る",
    search: "検索", loading: "読み込み中...", error: "エラー", retry: "再試行",
    free: "無料", pro: "プロ", premium: "プレミアム", upgrade: "アップグレード",
    minutes: "分", hours: "時間", days: "日",
    learningHub: "学習ハブ", coreFeatures: "主要機能", communication: "コミュニケーション",
    dailyChallenge: "デイリーチャレンジ", streakRewards: "連続報酬",
    continueLearning: "学習を続ける", myProgress: "マイ進捗",
    dailyGoals: "デイリー目標", weeklyDigest: "週間まとめ",
    upgradeToPro: "Proにアップグレード", myUsageBalance: "使用量と残高",
    upcomingClasses: "今後のクラス", aiTipOfDay: "今日のAIヒント",
    reviewDueCards: "復習カード", learningPace: "学習ペース",
    smartSchedule: "スマートスケジュール", todaysProgress: "今日の進捗",
    words: "単語", startChallenge: "チャレンジ開始",
    challengeComplete: "チャレンジ完了！", watchTour: "ツアーを見る",
    watchNow: "今すぐ見る", listen: "聴く", onTrack: "順調",
    dailyGoal: "日目標", remaining: "残り", thisWeek: "今週",
    account: "アカウント", editProfile: "プロフィール編集", appMedia: "アプリとメディア",
    appearance: "外観", appUiLanguage: "アプリの言語",
    learningLanguage: "学習言語", about: "について",
    version: "バージョン", rateApp: "アプリを評価", shareApp: "アプリを共有",
    deleteAccount: "アカウント削除",
  },
  ko: {
    home: "홈", learn: "학습", songs: "노래", translate: "번역",
    calls: "통화", messages: "메시지", explore: "탐색", profile: "프로필",
    welcome: "환영합니다", goodMorning: "좋은 아침", goodAfternoon: "좋은 오후",
    goodEvening: "좋은 저녁", todaysSlang: "오늘의 슬랭", quickActions: "빠른 작업",
    continueLesson: "레슨 계속하기", recordStudio: "녹음 스튜디오",
    translateSong: "노래 번역", watchAndLearn: "보고 배우기",
    virtualClassroom: "가상 교실", aiPenPal: "AI 펜팔",
    karaoke: "노래방", travelCompanion: "여행 동반자",
    podcast: "팟캐스트", radio: "라디오", dating: "데이트", kids: "키즈",
    overview: "개요", teachers: "선생님", classes: "수업",
    lessons: "레슨", progress: "진행", recordings: "녹음",
    calendar: "캘린더", activeLessons: "활성 레슨", streak: "연속 기록",
    wordsLearned: "배운 단어", xpEarned: "획득 XP",
    trending: "인기", myLibrary: "내 라이브러리", aiGenerated: "AI 생성",
    recordNow: "지금 녹음", karaokeMode: "노래방 모드", searchSongs: "노래 검색...",
    typeOrPaste: "텍스트 입력 또는 붙여넣기...", translateNow: "번역하기",
    pasteUrl: "URL 붙여넣기", camera: "카메라", voice: "음성",
    history: "기록", urlTranslate: "URL 번역", socialTranslate: "소셜 번역",
    recents: "최근", contacts: "연락처", dialpad: "다이얼패드",
    voicemail: "음성메일", videoCall: "영상통화", callTranslator: "통화 번역기",
    chats: "채팅", groups: "그룹", aiChat: "AI 채팅", newMessage: "새 메시지",
    settings: "설정", subscription: "구독", achievements: "업적",
    languagePack: "언어 팩", darkMode: "다크 모드", notifications: "알림",
    privacy: "개인정보", helpSupport: "도움말 및 지원", logOut: "로그아웃",
    cancel: "취소", save: "저장", done: "완료", next: "다음", back: "뒤로",
    search: "검색", loading: "로딩 중...", error: "오류", retry: "재시도",
    free: "무료", pro: "프로", premium: "프리미엄", upgrade: "업그레이드",
    minutes: "분", hours: "시간", days: "일",
    learningHub: "학습 허브", coreFeatures: "핵심 기능", communication: "커뮤니케이션",
    dailyChallenge: "일일 도전", streakRewards: "연속 보상",
    continueLearning: "학습 계속", myProgress: "내 진행상황",
    dailyGoals: "일일 목표", weeklyDigest: "주간 요약",
    upgradeToPro: "Pro로 업그레이드", myUsageBalance: "사용량 및 잔액",
    upcomingClasses: "예정된 수업", aiTipOfDay: "오늘의 AI 팁",
    reviewDueCards: "복습 카드", learningPace: "학습 속도",
    smartSchedule: "스마트 일정", todaysProgress: "오늘의 진행",
    words: "단어", startChallenge: "도전 시작",
    challengeComplete: "도전 완료!", watchTour: "투어 보기",
    watchNow: "지금 보기", listen: "듣기", onTrack: "순조로움",
    dailyGoal: "일일 목표", remaining: "남음", thisWeek: "이번 주",
    account: "계정", editProfile: "프로필 편집", appMedia: "앱 및 미디어",
    appearance: "외관", appUiLanguage: "앱 언어",
    learningLanguage: "학습 언어", about: "정보",
    version: "버전", rateApp: "앱 평가", shareApp: "앱 공유",
    deleteAccount: "계정 삭제",
  },
  zh: {
    home: "首页", learn: "学习", songs: "歌曲", translate: "翻译",
    calls: "通话", messages: "消息", explore: "发现", profile: "个人",
    welcome: "欢迎", goodMorning: "早上好", goodAfternoon: "下午好",
    goodEvening: "晚上好", todaysSlang: "今日俚语", quickActions: "快捷操作",
    continueLesson: "继续课程", recordStudio: "录音棚",
    translateSong: "翻译歌曲", watchAndLearn: "看视频学",
    virtualClassroom: "虚拟教室", aiPenPal: "AI笔友",
    karaoke: "卡拉OK", travelCompanion: "旅行伴侣",
    podcast: "播客", radio: "电台", dating: "约会", kids: "儿童",
    overview: "概览", teachers: "老师", classes: "课程",
    lessons: "课时", progress: "进度", recordings: "录音",
    calendar: "日历", activeLessons: "进行中课程", streak: "连续天数",
    wordsLearned: "已学单词", xpEarned: "获得经验",
    trending: "热门", myLibrary: "我的库", aiGenerated: "AI生成",
    recordNow: "立即录音", karaokeMode: "卡拉OK模式", searchSongs: "搜索歌曲...",
    typeOrPaste: "输入或粘贴文本...", translateNow: "翻译",
    pasteUrl: "粘贴链接", camera: "相机", voice: "语音",
    history: "历史", urlTranslate: "链接翻译", socialTranslate: "社交翻译",
    recents: "最近", contacts: "联系人", dialpad: "拨号盘",
    voicemail: "语音信箱", videoCall: "视频通话", callTranslator: "通话翻译",
    chats: "聊天", groups: "群组", aiChat: "AI聊天", newMessage: "新消息",
    settings: "设置", subscription: "订阅", achievements: "成就",
    languagePack: "语言包", darkMode: "深色模式", notifications: "通知",
    privacy: "隐私", helpSupport: "帮助与支持", logOut: "退出登录",
    cancel: "取消", save: "保存", done: "完成", next: "下一步", back: "返回",
    search: "搜索", loading: "加载中...", error: "错误", retry: "重试",
    free: "免费", pro: "专业", premium: "高级", upgrade: "升级",
    minutes: "分钟", hours: "小时", days: "天",
    learningHub: "学习中心", coreFeatures: "核心功能", communication: "通讯",
    dailyChallenge: "每日挑战", streakRewards: "连续奖励",
    continueLearning: "继续学习", myProgress: "我的进度",
    dailyGoals: "每日目标", weeklyDigest: "每周摘要",
    upgradeToPro: "升级到Pro", myUsageBalance: "使用量和余额",
    upcomingClasses: "即将到来的课程", aiTipOfDay: "今日AI提示",
    reviewDueCards: "复习卡片", learningPace: "学习节奏",
    smartSchedule: "智能日程", todaysProgress: "今日进度",
    words: "单词", startChallenge: "开始挑战",
    challengeComplete: "挑战完成！", watchTour: "观看导览",
    watchNow: "立即观看", listen: "听", onTrack: "进展顺利",
    dailyGoal: "每日目标", remaining: "剩余", thisWeek: "本周",
    account: "账户", editProfile: "编辑资料", appMedia: "应用和媒体",
    appearance: "外观", appUiLanguage: "应用语言",
    learningLanguage: "学习语言", about: "关于",
    version: "版本", rateApp: "评价应用", shareApp: "分享应用",
    deleteAccount: "删除账户",
  },
  ar: {
    home: "الرئيسية", learn: "تعلّم", songs: "أغاني", translate: "ترجمة",
    calls: "مكالمات", messages: "رسائل", explore: "استكشاف", profile: "الملف",
    welcome: "مرحباً", goodMorning: "صباح الخير", goodAfternoon: "مساء الخير",
    goodEvening: "مساء الخير", todaysSlang: "عامية اليوم", quickActions: "إجراءات سريعة",
    continueLesson: "متابعة الدرس", recordStudio: "استوديو التسجيل",
    translateSong: "ترجمة أغنية", watchAndLearn: "شاهد وتعلّم",
    virtualClassroom: "فصل افتراضي", aiPenPal: "صديق مراسلة AI",
    karaoke: "كاريوكي", travelCompanion: "رفيق السفر",
    podcast: "بودكاست", radio: "راديو", dating: "مواعدة", kids: "أطفال",
    overview: "نظرة عامة", teachers: "معلمون", classes: "صفوف",
    lessons: "دروس", progress: "تقدم", recordings: "تسجيلات",
    calendar: "تقويم", activeLessons: "دروس نشطة", streak: "سلسلة",
    wordsLearned: "كلمات تعلمتها", xpEarned: "نقاط مكتسبة",
    trending: "رائج", myLibrary: "مكتبتي", aiGenerated: "مولّد بالذكاء",
    recordNow: "سجّل الآن", karaokeMode: "وضع كاريوكي", searchSongs: "ابحث عن أغاني...",
    typeOrPaste: "اكتب أو الصق نصاً...", translateNow: "ترجم",
    pasteUrl: "لصق رابط", camera: "كاميرا", voice: "صوت",
    history: "السجل", urlTranslate: "ترجمة رابط", socialTranslate: "ترجمة اجتماعية",
    recents: "الأخيرة", contacts: "جهات الاتصال", dialpad: "لوحة الاتصال",
    voicemail: "البريد الصوتي", videoCall: "مكالمة فيديو", callTranslator: "مترجم المكالمات",
    chats: "محادثات", groups: "مجموعات", aiChat: "دردشة AI", newMessage: "رسالة جديدة",
    settings: "الإعدادات", subscription: "الاشتراك", achievements: "الإنجازات",
    languagePack: "حزمة اللغة", darkMode: "الوضع الداكن", notifications: "الإشعارات",
    privacy: "الخصوصية", helpSupport: "المساعدة والدعم", logOut: "تسجيل الخروج",
    cancel: "إلغاء", save: "حفظ", done: "تم", next: "التالي", back: "رجوع",
    search: "بحث", loading: "جارٍ التحميل...", error: "خطأ", retry: "إعادة المحاولة",
    free: "مجاني", pro: "احترافي", premium: "مميز", upgrade: "ترقية",
    minutes: "دقائق", hours: "ساعات", days: "أيام",
    learningHub: "مركز التعلم", coreFeatures: "الميزات الأساسية", communication: "التواصل",
    dailyChallenge: "التحدي اليومي", streakRewards: "مكافآت السلسلة",
    continueLearning: "متابعة التعلم", myProgress: "تقدمي",
    dailyGoals: "الأهداف اليومية", weeklyDigest: "الملخص الأسبوعي",
    upgradeToPro: "ترقية إلى Pro", myUsageBalance: "استخدامي ورصيدي",
    upcomingClasses: "الدروس القادمة", aiTipOfDay: "نصيحة الذكاء الاصطناعي",
    reviewDueCards: "مراجعة البطاقات", learningPace: "وتيرة التعلم",
    smartSchedule: "الجدول الذكي", todaysProgress: "تقدم اليوم",
    words: "كلمات", startChallenge: "بدء التحدي",
    challengeComplete: "تم التحدي!", watchTour: "شاهد الجولة",
    watchNow: "شاهد الآن", listen: "استمع", onTrack: "على المسار",
    dailyGoal: "هدف يومي", remaining: "متبقي", thisWeek: "هذا الأسبوع",
    account: "الحساب", editProfile: "تعديل الملف", appMedia: "التطبيق والوسائط",
    appearance: "المظهر", appUiLanguage: "لغة التطبيق",
    learningLanguage: "لغة التعلم", about: "حول",
    version: "الإصدار", rateApp: "تقييم التطبيق", shareApp: "مشاركة التطبيق",
    deleteAccount: "حذف الحساب",
  },
  hi: {
    home: "होम", learn: "सीखें", songs: "गाने", translate: "अनुवाद",
    calls: "कॉल", messages: "संदेश", explore: "खोजें", profile: "प्रोफ़ाइल",
    welcome: "स्वागत है", goodMorning: "सुप्रभात", goodAfternoon: "शुभ दोपहर",
    goodEvening: "शुभ संध्या", todaysSlang: "आज की स्लैंग", quickActions: "त्वरित कार्य",
    continueLesson: "पाठ जारी रखें", recordStudio: "रिकॉर्डिंग स्टूडियो",
    translateSong: "गाना अनुवाद करें", watchAndLearn: "देखें और सीखें",
    virtualClassroom: "वर्चुअल क्लास", aiPenPal: "AI पेन पाल",
    karaoke: "कराओके", travelCompanion: "यात्रा साथी",
    podcast: "पॉडकास्ट", radio: "रेडियो", dating: "डेटिंग", kids: "बच्चे",
    overview: "अवलोकन", teachers: "शिक्षक", classes: "कक्षाएं",
    lessons: "पाठ", progress: "प्रगति", recordings: "रिकॉर्डिंग",
    calendar: "कैलेंडर", activeLessons: "सक्रिय पाठ", streak: "स्ट्रीक",
    wordsLearned: "सीखे गए शब्द", xpEarned: "अर्जित XP",
    trending: "ट्रेंडिंग", myLibrary: "मेरी लाइब्रेरी", aiGenerated: "AI जनित",
    recordNow: "अभी रिकॉर्ड करें", karaokeMode: "कराओके मोड", searchSongs: "गाने खोजें...",
    typeOrPaste: "टेक्स्ट टाइप या पेस्ट करें...", translateNow: "अनुवाद करें",
    pasteUrl: "URL पेस्ट करें", camera: "कैमरा", voice: "आवाज़",
    history: "इतिहास", urlTranslate: "URL अनुवाद", socialTranslate: "सोशल अनुवाद",
    recents: "हाल के", contacts: "संपर्क", dialpad: "डायलपैड",
    voicemail: "वॉइसमेल", videoCall: "वीडियो कॉल", callTranslator: "कॉल अनुवादक",
    chats: "चैट", groups: "समूह", aiChat: "AI चैट", newMessage: "नया संदेश",
    settings: "सेटिंग्स", subscription: "सदस्यता", achievements: "उपलब्धियां",
    languagePack: "भाषा पैक", darkMode: "डार्क मोड", notifications: "सूचनाएं",
    privacy: "गोपनीयता", helpSupport: "सहायता", logOut: "लॉग आउट",
    cancel: "रद्द करें", save: "सहेजें", done: "हो गया", next: "अगला", back: "वापस",
    search: "खोजें", loading: "लोड हो रहा...", error: "त्रुटि", retry: "पुनः प्रयास",
    free: "मुफ़्त", pro: "प्रो", premium: "प्रीमियम", upgrade: "अपग्रेड",
    minutes: "मिनट", hours: "घंटे", days: "दिन",
    learningHub: "लर्निंग हब", coreFeatures: "मुख्य सुविधाएं", communication: "संचार",
    dailyChallenge: "दैनिक चुनौती", streakRewards: "स्ट्रीक पुरस्कार",
    continueLearning: "सीखना जारी रखें", myProgress: "मेरी प्रगति",
    dailyGoals: "दैनिक लक्ष्य", weeklyDigest: "साप्ताहिक सारांश",
    upgradeToPro: "Pro में अपग्रेड", myUsageBalance: "मेरा उपयोग और शेष",
    upcomingClasses: "आगामी कक्षाएं", aiTipOfDay: "आज की AI टिप",
    reviewDueCards: "कार्ड समीक्षा", learningPace: "सीखने की गति",
    smartSchedule: "स्मार्ट शेड्यूल", todaysProgress: "आज की प्रगति",
    words: "शब्द", startChallenge: "चुनौती शुरू करें",
    challengeComplete: "चुनौती पूरी!", watchTour: "टूर देखें",
    watchNow: "अभी देखें", listen: "सुनें", onTrack: "सही रास्ते पर",
    dailyGoal: "दैनिक लक्ष्य", remaining: "शेष", thisWeek: "इस सप्ताह",
    account: "खाता", editProfile: "प्रोफ़ाइल संपादित करें", appMedia: "ऐप और मीडिया",
    appearance: "दिखावट", appUiLanguage: "ऐप की भाषा",
    learningLanguage: "सीखने की भाषा", about: "के बारे में",
    version: "संस्करण", rateApp: "ऐप रेट करें", shareApp: "ऐप शेयर करें",
    deleteAccount: "खाता हटाएं",
  },
  sw: {
    home: "Nyumbani", learn: "Jifunze", songs: "Nyimbo", translate: "Tafsiri",
    calls: "Simu", messages: "Ujumbe", explore: "Gundua", profile: "Wasifu",
    welcome: "Karibu", goodMorning: "Habari za Asubuhi", goodAfternoon: "Habari za Mchana",
    goodEvening: "Habari za Jioni", todaysSlang: "Slang ya Leo", quickActions: "Vitendo Haraka",
    continueLesson: "Endelea Somo", recordStudio: "Studio ya Kurekodi",
    translateSong: "Tafsiri Wimbo", watchAndLearn: "Tazama na Ujifunze",
    virtualClassroom: "Darasa Pepe", aiPenPal: "Rafiki wa AI",
    karaoke: "Karaoke", travelCompanion: "Mwenzako wa Safari",
    podcast: "Podcast", radio: "Redio", dating: "Miadi", kids: "Watoto",
    overview: "Muhtasari", teachers: "Walimu", classes: "Madarasa",
    lessons: "Masomo", progress: "Maendeleo", recordings: "Rekodi",
    calendar: "Kalenda", activeLessons: "Masomo Hai", streak: "Mfululizo",
    wordsLearned: "Maneno Uliyojifunza", xpEarned: "XP Uliyopata",
    trending: "Maarufu", myLibrary: "Maktaba Yangu", aiGenerated: "Imetengenezwa na AI",
    recordNow: "Rekodi Sasa", karaokeMode: "Hali ya Karaoke", searchSongs: "Tafuta nyimbo...",
    typeOrPaste: "Andika au bandika maandishi...", translateNow: "Tafsiri",
    pasteUrl: "Bandika URL", camera: "Kamera", voice: "Sauti",
    history: "Historia", urlTranslate: "Tafsiri URL", socialTranslate: "Tafsiri Mitandao",
    recents: "Hivi Karibuni", contacts: "Anwani", dialpad: "Kibonyezo",
    voicemail: "Ujumbe wa Sauti", videoCall: "Simu ya Video", callTranslator: "Mtafsiri wa Simu",
    chats: "Mazungumzo", groups: "Vikundi", aiChat: "Mazungumzo ya AI", newMessage: "Ujumbe Mpya",
    settings: "Mipangilio", subscription: "Usajili", achievements: "Mafanikio",
    languagePack: "Pakiti ya Lugha", darkMode: "Hali ya Giza", notifications: "Arifa",
    privacy: "Faragha", helpSupport: "Msaada", logOut: "Ondoka",
    cancel: "Ghairi", save: "Hifadhi", done: "Imekamilika", next: "Ifuatayo", back: "Rudi",
    search: "Tafuta", loading: "Inapakia...", error: "Hitilafu", retry: "Jaribu Tena",
    free: "Bure", pro: "Pro", premium: "Premium", upgrade: "Boresha",
    minutes: "dakika", hours: "masaa", days: "siku",
    learningHub: "Kituo cha Kujifunza", coreFeatures: "Vipengele Vikuu", communication: "Mawasiliano",
    dailyChallenge: "Changamoto ya Leo", streakRewards: "Tuzo za Mfululizo",
    continueLearning: "Endelea Kujifunza", myProgress: "Maendeleo Yangu",
    dailyGoals: "Malengo ya Kila Siku", weeklyDigest: "Muhtasari wa Wiki",
    upgradeToPro: "Panda hadi Pro", myUsageBalance: "Matumizi na Salio",
    upcomingClasses: "Madarasa Yajayo", aiTipOfDay: "Kidokezo cha AI",
    reviewDueCards: "Kagua Kadi", learningPace: "Kasi ya Kujifunza",
    smartSchedule: "Ratiba Bora", todaysProgress: "Maendeleo ya Leo",
    words: "Maneno", startChallenge: "Anza Changamoto",
    challengeComplete: "Changamoto Imekamilika!", watchTour: "Tazama Ziara",
    watchNow: "Tazama Sasa", listen: "Sikiliza", onTrack: "Njia Sahihi",
    dailyGoal: "lengo la kila siku", remaining: "imebaki", thisWeek: "wiki hii",
    account: "Akaunti", editProfile: "Hariri Wasifu", appMedia: "App na Vyombo",
    appearance: "Mwonekano", appUiLanguage: "Lugha ya App",
    learningLanguage: "Lugha ya Kujifunza", about: "Kuhusu",
    version: "Toleo", rateApp: "Kadiria App", shareApp: "Shiriki App",
    deleteAccount: "Futa Akaunti",
  },
  it: {
    home: "Home", learn: "Impara", songs: "Canzoni", translate: "Traduci",
    calls: "Chiamate", messages: "Messaggi", explore: "Esplora", profile: "Profilo",
    welcome: "Benvenuto", goodMorning: "Buongiorno", goodAfternoon: "Buon Pomeriggio",
    goodEvening: "Buonasera", todaysSlang: "Slang del Giorno", quickActions: "Azioni Rapide",
    continueLesson: "Continua Lezione", recordStudio: "Studio di Registrazione",
    translateSong: "Traduci Canzone", watchAndLearn: "Guarda e Impara",
    virtualClassroom: "Aula Virtuale", aiPenPal: "Amico di Penna AI",
    karaoke: "Karaoke", travelCompanion: "Compagno di Viaggio",
    podcast: "Podcast", radio: "Radio", dating: "Incontri", kids: "Bambini",
    overview: "Panoramica", teachers: "Insegnanti", classes: "Classi",
    lessons: "Lezioni", progress: "Progresso", recordings: "Registrazioni",
    calendar: "Calendario", activeLessons: "Lezioni Attive", streak: "Serie",
    wordsLearned: "Parole Imparate", xpEarned: "XP Guadagnati",
    trending: "Di Tendenza", myLibrary: "La Mia Libreria", aiGenerated: "Generato da AI",
    recordNow: "Registra Ora", karaokeMode: "Modalità Karaoke", searchSongs: "Cerca canzoni...",
    typeOrPaste: "Scrivi o incolla testo...", translateNow: "Traduci",
    pasteUrl: "Incolla URL", camera: "Fotocamera", voice: "Voce",
    history: "Cronologia", urlTranslate: "Traduci URL", socialTranslate: "Traduci Social",
    recents: "Recenti", contacts: "Contatti", dialpad: "Tastierino",
    voicemail: "Segreteria", videoCall: "Videochiamata", callTranslator: "Traduttore Chiamate",
    chats: "Chat", groups: "Gruppi", aiChat: "Chat AI", newMessage: "Nuovo Messaggio",
    settings: "Impostazioni", subscription: "Abbonamento", achievements: "Traguardi",
    languagePack: "Pacchetto Lingua", darkMode: "Modalità Scura", notifications: "Notifiche",
    privacy: "Privacy", helpSupport: "Aiuto e Supporto", logOut: "Esci",
    cancel: "Annulla", save: "Salva", done: "Fatto", next: "Avanti", back: "Indietro",
    search: "Cerca", loading: "Caricamento...", error: "Errore", retry: "Riprova",
    free: "Gratis", pro: "Pro", premium: "Premium", upgrade: "Aggiorna",
    minutes: "minuti", hours: "ore", days: "giorni",
    learningHub: "Centro Apprendimento", coreFeatures: "Funzioni Principali", communication: "Comunicazione",
    dailyChallenge: "Sfida Giornaliera", streakRewards: "Premi Serie",
    continueLearning: "Continua ad Imparare", myProgress: "I Miei Progressi",
    dailyGoals: "Obiettivi Giornalieri", weeklyDigest: "Riepilogo Settimanale",
    upgradeToPro: "Passa a Pro", myUsageBalance: "Uso e Saldo",
    upcomingClasses: "Prossime Lezioni", aiTipOfDay: "Consiglio IA del Giorno",
    reviewDueCards: "Rivedi le Carte", learningPace: "Ritmo di Apprendimento",
    smartSchedule: "Programma Intelligente", todaysProgress: "Progressi di Oggi",
    words: "Parole", startChallenge: "Inizia Sfida",
    challengeComplete: "Sfida Completata!", watchTour: "Guarda il Tour",
    watchNow: "Guarda Ora", listen: "Ascolta", onTrack: "In Linea",
    dailyGoal: "obiettivo giornaliero", remaining: "rimanente", thisWeek: "questa settimana",
    account: "Account", editProfile: "Modifica Profilo", appMedia: "App e Media",
    appearance: "Aspetto", appUiLanguage: "Lingua dell'App",
    learningLanguage: "Lingua di Studio", about: "Info",
    version: "Versione", rateApp: "Valuta App", shareApp: "Condividi App",
    deleteAccount: "Elimina Account",
  },
  de: {
    home: "Start", learn: "Lernen", songs: "Lieder", translate: "Übersetzen",
    calls: "Anrufe", messages: "Nachrichten", explore: "Entdecken", profile: "Profil",
    welcome: "Willkommen", goodMorning: "Guten Morgen", goodAfternoon: "Guten Tag",
    goodEvening: "Guten Abend", todaysSlang: "Slang des Tages", quickActions: "Schnellaktionen",
    continueLesson: "Lektion fortsetzen", recordStudio: "Aufnahmestudio",
    translateSong: "Lied übersetzen", watchAndLearn: "Schau und Lerne",
    virtualClassroom: "Virtuelles Klassenzimmer", aiPenPal: "AI Brieffreund",
    karaoke: "Karaoke", travelCompanion: "Reisebegleiter",
    podcast: "Podcast", radio: "Radio", dating: "Dating", kids: "Kinder",
    overview: "Übersicht", teachers: "Lehrer", classes: "Kurse",
    lessons: "Lektionen", progress: "Fortschritt", recordings: "Aufnahmen",
    calendar: "Kalender", activeLessons: "Aktive Lektionen", streak: "Serie",
    wordsLearned: "Gelernte Wörter", xpEarned: "Verdiente XP",
    trending: "Beliebt", myLibrary: "Meine Bibliothek", aiGenerated: "KI-Generiert",
    recordNow: "Jetzt Aufnehmen", karaokeMode: "Karaoke-Modus", searchSongs: "Lieder suchen...",
    typeOrPaste: "Text eingeben oder einfügen...", translateNow: "Übersetzen",
    pasteUrl: "URL einfügen", camera: "Kamera", voice: "Stimme",
    history: "Verlauf", urlTranslate: "URL übersetzen", socialTranslate: "Social übersetzen",
    recents: "Kürzlich", contacts: "Kontakte", dialpad: "Wähltasten",
    voicemail: "Voicemail", videoCall: "Videoanruf", callTranslator: "Anruf-Übersetzer",
    chats: "Chats", groups: "Gruppen", aiChat: "KI-Chat", newMessage: "Neue Nachricht",
    settings: "Einstellungen", subscription: "Abonnement", achievements: "Erfolge",
    languagePack: "Sprachpaket", darkMode: "Dunkelmodus", notifications: "Benachrichtigungen",
    privacy: "Datenschutz", helpSupport: "Hilfe & Support", logOut: "Abmelden",
    cancel: "Abbrechen", save: "Speichern", done: "Fertig", next: "Weiter", back: "Zurück",
    search: "Suchen", loading: "Laden...", error: "Fehler", retry: "Erneut versuchen",
    free: "Kostenlos", pro: "Pro", premium: "Premium", upgrade: "Upgraden",
    minutes: "Minuten", hours: "Stunden", days: "Tage",
    learningHub: "Lernzentrum", coreFeatures: "Hauptfunktionen", communication: "Kommunikation",
    dailyChallenge: "Tägliche Herausforderung", streakRewards: "Serien-Belohnungen",
    continueLearning: "Weiterlernen", myProgress: "Mein Fortschritt",
    dailyGoals: "Tagesziele", weeklyDigest: "Wochenzusammenfassung",
    upgradeToPro: "Auf Pro upgraden", myUsageBalance: "Nutzung und Guthaben",
    upcomingClasses: "Kommende Kurse", aiTipOfDay: "KI-Tipp des Tages",
    reviewDueCards: "Karten wiederholen", learningPace: "Lerntempo",
    smartSchedule: "Intelligenter Zeitplan", todaysProgress: "Heutiger Fortschritt",
    words: "Wörter", startChallenge: "Herausforderung starten",
    challengeComplete: "Herausforderung geschafft!", watchTour: "Tour ansehen",
    watchNow: "Jetzt ansehen", listen: "Anhören", onTrack: "Auf Kurs",
    dailyGoal: "Tagesziel", remaining: "verbleibend", thisWeek: "diese Woche",
    account: "Konto", editProfile: "Profil bearbeiten", appMedia: "App & Medien",
    appearance: "Erscheinungsbild", appUiLanguage: "App-Sprache",
    learningLanguage: "Lernsprache", about: "Über",
    version: "Version", rateApp: "App bewerten", shareApp: "App teilen",
    deleteAccount: "Konto löschen",
  },
  ru: {
    home: "Главная", learn: "Учить", songs: "Песни", translate: "Перевод",
    calls: "Звонки", messages: "Сообщения", explore: "Обзор", profile: "Профиль",
    welcome: "Добро пожаловать", goodMorning: "Доброе утро", goodAfternoon: "Добрый день",
    goodEvening: "Добрый вечер", todaysSlang: "Сленг дня", quickActions: "Быстрые действия",
    continueLesson: "Продолжить урок", recordStudio: "Студия записи",
    translateSong: "Перевести песню", watchAndLearn: "Смотри и учись",
    virtualClassroom: "Виртуальный класс", aiPenPal: "AI друг по переписке",
    karaoke: "Караоке", travelCompanion: "Попутчик",
    podcast: "Подкаст", radio: "Радио", dating: "Знакомства", kids: "Дети",
    overview: "Обзор", teachers: "Учителя", classes: "Занятия",
    lessons: "Уроки", progress: "Прогресс", recordings: "Записи",
    calendar: "Календарь", activeLessons: "Активные уроки", streak: "Серия",
    wordsLearned: "Выученные слова", xpEarned: "Заработано XP",
    trending: "В тренде", myLibrary: "Моя библиотека", aiGenerated: "Сгенерировано AI",
    recordNow: "Записать сейчас", karaokeMode: "Режим караоке", searchSongs: "Поиск песен...",
    typeOrPaste: "Введите или вставьте текст...", translateNow: "Перевести",
    pasteUrl: "Вставить URL", camera: "Камера", voice: "Голос",
    history: "История", urlTranslate: "Перевод URL", socialTranslate: "Перевод соцсетей",
    recents: "Недавние", contacts: "Контакты", dialpad: "Набор номера",
    voicemail: "Голосовая почта", videoCall: "Видеозвонок", callTranslator: "Переводчик звонков",
    chats: "Чаты", groups: "Группы", aiChat: "AI чат", newMessage: "Новое сообщение",
    settings: "Настройки", subscription: "Подписка", achievements: "Достижения",
    languagePack: "Языковой пакет", darkMode: "Тёмная тема", notifications: "Уведомления",
    privacy: "Конфиденциальность", helpSupport: "Помощь", logOut: "Выйти",
    cancel: "Отмена", save: "Сохранить", done: "Готово", next: "Далее", back: "Назад",
    search: "Поиск", loading: "Загрузка...", error: "Ошибка", retry: "Повторить",
    free: "Бесплатно", pro: "Про", premium: "Премиум", upgrade: "Улучшить",
    minutes: "минут", hours: "часов", days: "дней",
    learningHub: "Учебный центр", coreFeatures: "Основные функции", communication: "Общение",
    dailyChallenge: "Ежедневный вызов", streakRewards: "Награды за серию",
    continueLearning: "Продолжить обучение", myProgress: "Мой прогресс",
    dailyGoals: "Ежедневные цели", weeklyDigest: "Еженедельный обзор",
    upgradeToPro: "Перейти на Pro", myUsageBalance: "Использование и баланс",
    upcomingClasses: "Предстоящие занятия", aiTipOfDay: "Совет ИИ дня",
    reviewDueCards: "Повторить карточки", learningPace: "Темп обучения",
    smartSchedule: "Умное расписание", todaysProgress: "Прогресс за сегодня",
    words: "Слова", startChallenge: "Начать вызов",
    challengeComplete: "Вызов выполнен!", watchTour: "Смотреть тур",
    watchNow: "Смотреть сейчас", listen: "Слушать", onTrack: "На верном пути",
    dailyGoal: "дневная цель", remaining: "осталось", thisWeek: "на этой неделе",
    account: "Аккаунт", editProfile: "Редактировать профиль", appMedia: "Приложение и медиа",
    appearance: "Внешний вид", appUiLanguage: "Язык приложения",
    learningLanguage: "Язык обучения", about: "О приложении",
    version: "Версия", rateApp: "Оценить приложение", shareApp: "Поделиться",
    deleteAccount: "Удалить аккаунт",
  },
  tl: {
    home: "Home", learn: "Matuto", songs: "Kanta", translate: "Isalin",
    calls: "Tawag", messages: "Mensahe", explore: "Tuklasin", profile: "Profile",
    welcome: "Maligayang pagdating", goodMorning: "Magandang Umaga", goodAfternoon: "Magandang Hapon",
    goodEvening: "Magandang Gabi", todaysSlang: "Slang Ngayon", quickActions: "Mabilis na Aksyon",
    continueLesson: "Ituloy ang Aralin", recordStudio: "Recording Studio",
    translateSong: "Isalin ang Kanta", watchAndLearn: "Manood at Matuto",
    virtualClassroom: "Virtual na Klase", aiPenPal: "AI Pen Pal",
    karaoke: "Karaoke", travelCompanion: "Kasama sa Byahe",
    podcast: "Podcast", radio: "Radyo", dating: "Dating", kids: "Bata",
    overview: "Buod", teachers: "Guro", classes: "Klase",
    lessons: "Aralin", progress: "Progreso", recordings: "Mga Recording",
    calendar: "Kalendaryo", activeLessons: "Aktibong Aralin", streak: "Streak",
    wordsLearned: "Natutunan na Salita", xpEarned: "Nakuhang XP",
    trending: "Trending", myLibrary: "Aking Library", aiGenerated: "Gawa ng AI",
    recordNow: "Mag-record Ngayon", karaokeMode: "Karaoke Mode", searchSongs: "Maghanap ng kanta...",
    typeOrPaste: "Mag-type o mag-paste...", translateNow: "Isalin",
    pasteUrl: "I-paste ang URL", camera: "Camera", voice: "Boses",
    history: "Kasaysayan", urlTranslate: "Isalin URL", socialTranslate: "Social Translate",
    recents: "Kamakailan", contacts: "Contacts", dialpad: "Dialpad",
    voicemail: "Voicemail", videoCall: "Video Call", callTranslator: "Call Translator",
    chats: "Chats", groups: "Grupo", aiChat: "AI Chat", newMessage: "Bagong Mensahe",
    settings: "Settings", subscription: "Subscription", achievements: "Mga Tagumpay",
    languagePack: "Language Pack", darkMode: "Dark Mode", notifications: "Notifications",
    privacy: "Privacy", helpSupport: "Tulong", logOut: "Mag-log Out",
    cancel: "Kanselahin", save: "I-save", done: "Tapos", next: "Susunod", back: "Bumalik",
    search: "Maghanap", loading: "Naglo-load...", error: "Error", retry: "Ulitin",
    free: "Libre", pro: "Pro", premium: "Premium", upgrade: "I-upgrade",
    minutes: "minuto", hours: "oras", days: "araw",
    learningHub: "Learning Hub", coreFeatures: "Pangunahing Tampok", communication: "Komunikasyon",
    dailyChallenge: "Hamon ng Araw", streakRewards: "Gantimpala ng Streak",
    continueLearning: "Magpatuloy sa Pag-aaral", myProgress: "Aking Progreso",
    dailyGoals: "Layunin sa Araw", weeklyDigest: "Lingguhang Buod",
    upgradeToPro: "I-upgrade sa Pro", myUsageBalance: "Gamit at Balanse",
    upcomingClasses: "Mga Susunod na Klase", aiTipOfDay: "AI Tip ng Araw",
    reviewDueCards: "Rebyuhin ang Mga Card", learningPace: "Bilis ng Pag-aaral",
    smartSchedule: "Smart na Iskedyul", todaysProgress: "Progreso Ngayon",
    words: "Salita", startChallenge: "Simulan ang Hamon",
    challengeComplete: "Hamon Tapos Na!", watchTour: "Panoorin ang Tour",
    watchNow: "Panoorin Ngayon", listen: "Makinig", onTrack: "Nasa Tamang Landas",
    dailyGoal: "layunin sa araw", remaining: "natitira", thisWeek: "ngayong linggo",
    account: "Account", editProfile: "I-edit ang Profile", appMedia: "App at Media",
    appearance: "Hitsura", appUiLanguage: "Wika ng App",
    learningLanguage: "Wikang Pinag-aaralan", about: "Tungkol",
    version: "Bersyon", rateApp: "I-rate ang App", shareApp: "I-share ang App",
    deleteAccount: "Burahin ang Account",
  },
  vi: {
    home: "Trang chủ", learn: "Học", songs: "Bài hát", translate: "Dịch",
    calls: "Cuộc gọi", messages: "Tin nhắn", explore: "Khám phá", profile: "Hồ sơ",
    welcome: "Chào mừng", goodMorning: "Chào buổi sáng", goodAfternoon: "Chào buổi chiều",
    goodEvening: "Chào buổi tối", todaysSlang: "Tiếng lóng hôm nay", quickActions: "Thao tác nhanh",
    continueLesson: "Tiếp tục bài học", recordStudio: "Phòng thu",
    translateSong: "Dịch bài hát", watchAndLearn: "Xem và học",
    virtualClassroom: "Lớp học ảo", aiPenPal: "Bạn qua thư AI",
    karaoke: "Karaoke", travelCompanion: "Bạn đồng hành",
    podcast: "Podcast", radio: "Radio", dating: "Hẹn hò", kids: "Trẻ em",
    overview: "Tổng quan", teachers: "Giáo viên", classes: "Lớp học",
    lessons: "Bài học", progress: "Tiến trình", recordings: "Bản ghi",
    calendar: "Lịch", activeLessons: "Bài học đang học", streak: "Chuỗi ngày",
    wordsLearned: "Từ đã học", xpEarned: "XP đạt được",
    trending: "Thịnh hành", myLibrary: "Thư viện", aiGenerated: "AI tạo",
    recordNow: "Thu ngay", karaokeMode: "Chế độ Karaoke", searchSongs: "Tìm bài hát...",
    typeOrPaste: "Nhập hoặc dán văn bản...", translateNow: "Dịch",
    pasteUrl: "Dán URL", camera: "Camera", voice: "Giọng nói",
    history: "Lịch sử", urlTranslate: "Dịch URL", socialTranslate: "Dịch mạng xã hội",
    recents: "Gần đây", contacts: "Danh bạ", dialpad: "Bàn phím số",
    voicemail: "Thư thoại", videoCall: "Gọi video", callTranslator: "Dịch cuộc gọi",
    chats: "Trò chuyện", groups: "Nhóm", aiChat: "Chat AI", newMessage: "Tin nhắn mới",
    settings: "Cài đặt", subscription: "Đăng ký", achievements: "Thành tựu",
    languagePack: "Gói ngôn ngữ", darkMode: "Chế độ tối", notifications: "Thông báo",
    privacy: "Quyền riêng tư", helpSupport: "Hỗ trợ", logOut: "Đăng xuất",
    cancel: "Hủy", save: "Lưu", done: "Xong", next: "Tiếp", back: "Quay lại",
    search: "Tìm kiếm", loading: "Đang tải...", error: "Lỗi", retry: "Thử lại",
    free: "Miễn phí", pro: "Pro", premium: "Premium", upgrade: "Nâng cấp",
    minutes: "phút", hours: "giờ", days: "ngày",
    learningHub: "Trung tâm Học", coreFeatures: "Tính năng Chính", communication: "Giao tiếp",
    dailyChallenge: "Thử thách Hàng ngày", streakRewards: "Phần thưởng Chuỗi",
    continueLearning: "Tiếp tục Học", myProgress: "Tiến độ của Tôi",
    dailyGoals: "Mục tiêu Hàng ngày", weeklyDigest: "Tóm tắt Tuần",
    upgradeToPro: "Nâng cấp Pro", myUsageBalance: "Sử dụng và Số dư",
    upcomingClasses: "Lớp Sắp tới", aiTipOfDay: "Mẹo AI Hôm nay",
    reviewDueCards: "Ôn tập Thẻ", learningPace: "Tốc độ Học",
    smartSchedule: "Lịch Thông minh", todaysProgress: "Tiến độ Hôm nay",
    words: "Từ", startChallenge: "Bắt đầu Thử thách",
    challengeComplete: "Hoàn thành Thử thách!", watchTour: "Xem Tour",
    watchNow: "Xem Ngay", listen: "Nghe", onTrack: "Đúng hướng",
    dailyGoal: "mục tiêu ngày", remaining: "còn lại", thisWeek: "tuần này",
    account: "Tài khoản", editProfile: "Sửa Hồ sơ", appMedia: "App và Media",
    appearance: "Giao diện", appUiLanguage: "Ngôn ngữ App",
    learningLanguage: "Ngôn ngữ Học", about: "Giới thiệu",
    version: "Phiên bản", rateApp: "Đánh giá App", shareApp: "Chia sẻ App",
    deleteAccount: "Xóa Tài khoản",
  },
  th: {
    home: "หน้าหลัก", learn: "เรียน", songs: "เพลง", translate: "แปล",
    calls: "โทร", messages: "ข้อความ", explore: "สำรวจ", profile: "โปรไฟล์",
    welcome: "ยินดีต้อนรับ", goodMorning: "สวัสดีตอนเช้า", goodAfternoon: "สวัสดีตอนบ่าย",
    goodEvening: "สวัสดีตอนเย็น", todaysSlang: "สแลงวันนี้", quickActions: "ทางลัด",
    continueLesson: "เรียนต่อ", recordStudio: "ห้องอัด",
    translateSong: "แปลเพลง", watchAndLearn: "ดูและเรียนรู้",
    virtualClassroom: "ห้องเรียนเสมือน", aiPenPal: "เพื่อนทาง AI",
    karaoke: "คาราโอเกะ", travelCompanion: "เพื่อนร่วมทาง",
    podcast: "พอดแคสต์", radio: "วิทยุ", dating: "เดท", kids: "เด็ก",
    overview: "ภาพรวม", teachers: "ครู", classes: "ชั้นเรียน",
    lessons: "บทเรียน", progress: "ความก้าวหน้า", recordings: "บันทึกเสียง",
    calendar: "ปฏิทิน", activeLessons: "บทเรียนที่กำลังเรียน", streak: "สตรีค",
    wordsLearned: "คำที่เรียนรู้", xpEarned: "XP ที่ได้",
    trending: "มาแรง", myLibrary: "คลังของฉัน", aiGenerated: "สร้างโดย AI",
    recordNow: "อัดเลย", karaokeMode: "โหมดคาราโอเกะ", searchSongs: "ค้นหาเพลง...",
    typeOrPaste: "พิมพ์หรือวางข้อความ...", translateNow: "แปล",
    pasteUrl: "วาง URL", camera: "กล้อง", voice: "เสียง",
    history: "ประวัติ", urlTranslate: "แปล URL", socialTranslate: "แปลโซเชียล",
    recents: "ล่าสุด", contacts: "รายชื่อ", dialpad: "แป้นโทร",
    voicemail: "ข้อความเสียง", videoCall: "วิดีโอคอล", callTranslator: "แปลสาย",
    chats: "แชท", groups: "กลุ่ม", aiChat: "แชท AI", newMessage: "ข้อความใหม่",
    settings: "ตั้งค่า", subscription: "สมาชิก", achievements: "ความสำเร็จ",
    languagePack: "แพ็คภาษา", darkMode: "โหมดมืด", notifications: "แจ้งเตือน",
    privacy: "ความเป็นส่วนตัว", helpSupport: "ช่วยเหลือ", logOut: "ออกจากระบบ",
    cancel: "ยกเลิก", save: "บันทึก", done: "เสร็จ", next: "ถัดไป", back: "กลับ",
    search: "ค้นหา", loading: "กำลังโหลด...", error: "ข้อผิดพลาด", retry: "ลองอีกครั้ง",
    free: "ฟรี", pro: "โปร", premium: "พรีเมียม", upgrade: "อัปเกรด",
    minutes: "นาที", hours: "ชั่วโมง", days: "วัน",
    learningHub: "ศูนย์การเรียนรู้", coreFeatures: "ฟีเจอร์หลัก", communication: "การสื่อสาร",
    dailyChallenge: "ท้าทายประจำวัน", streakRewards: "รางวัลสตรีค",
    continueLearning: "เรียนต่อ", myProgress: "ความก้าวหน้าของฉัน",
    dailyGoals: "เป้าหมายประจำวัน", weeklyDigest: "สรุปประจำสัปดาห์",
    upgradeToPro: "อัปเกรดเป็น Pro", myUsageBalance: "การใช้งานและยอดคงเหลือ",
    upcomingClasses: "คลาสที่จะมาถึง", aiTipOfDay: "เคล็ดลับ AI วันนี้",
    reviewDueCards: "ทบทวนการ์ด", learningPace: "ความเร็วในการเรียน",
    smartSchedule: "ตารางอัจฉริยะ", todaysProgress: "ความก้าวหน้าวันนี้",
    words: "คำ", startChallenge: "เริ่มท้าทาย",
    challengeComplete: "ท้าทายสำเร็จ!", watchTour: "ดูทัวร์",
    watchNow: "ดูเลย", listen: "ฟัง", onTrack: "อยู่ในเส้นทาง",
    dailyGoal: "เป้าหมายวัน", remaining: "เหลือ", thisWeek: "สัปดาห์นี้",
    account: "บัญชี", editProfile: "แก้ไขโปรไฟล์", appMedia: "แอปและสื่อ",
    appearance: "ลักษณะ", appUiLanguage: "ภาษาแอป",
    learningLanguage: "ภาษาที่เรียน", about: "เกี่ยวกับ",
    version: "เวอร์ชัน", rateApp: "ให้คะแนนแอป", shareApp: "แชร์แอป",
    deleteAccount: "ลบบัญชี",
  },
  tr: {
    home: "Ana Sayfa", learn: "Öğren", songs: "Şarkılar", translate: "Çevir",
    calls: "Aramalar", messages: "Mesajlar", explore: "Keşfet", profile: "Profil",
    welcome: "Hoş Geldiniz", goodMorning: "Günaydın", goodAfternoon: "İyi Günler",
    goodEvening: "İyi Akşamlar", todaysSlang: "Günün Argosu", quickActions: "Hızlı İşlemler",
    continueLesson: "Derse Devam Et", recordStudio: "Kayıt Stüdyosu",
    translateSong: "Şarkı Çevir", watchAndLearn: "İzle ve Öğren",
    virtualClassroom: "Sanal Sınıf", aiPenPal: "AI Mektup Arkadaşı",
    karaoke: "Karaoke", travelCompanion: "Seyahat Arkadaşı",
    podcast: "Podcast", radio: "Radyo", dating: "Flört", kids: "Çocuklar",
    overview: "Genel Bakış", teachers: "Öğretmenler", classes: "Sınıflar",
    lessons: "Dersler", progress: "İlerleme", recordings: "Kayıtlar",
    calendar: "Takvim", activeLessons: "Aktif Dersler", streak: "Seri",
    wordsLearned: "Öğrenilen Kelimeler", xpEarned: "Kazanılan XP",
    trending: "Popüler", myLibrary: "Kütüphanem", aiGenerated: "AI Üretimi",
    recordNow: "Şimdi Kaydet", karaokeMode: "Karaoke Modu", searchSongs: "Şarkı ara...",
    typeOrPaste: "Metin yazın veya yapıştırın...", translateNow: "Çevir",
    pasteUrl: "URL Yapıştır", camera: "Kamera", voice: "Ses",
    history: "Geçmiş", urlTranslate: "URL Çevir", socialTranslate: "Sosyal Çevir",
    recents: "Son", contacts: "Kişiler", dialpad: "Tuş Takımı",
    voicemail: "Sesli Mesaj", videoCall: "Görüntülü Arama", callTranslator: "Arama Çevirmeni",
    chats: "Sohbetler", groups: "Gruplar", aiChat: "AI Sohbet", newMessage: "Yeni Mesaj",
    settings: "Ayarlar", subscription: "Abonelik", achievements: "Başarılar",
    languagePack: "Dil Paketi", darkMode: "Karanlık Mod", notifications: "Bildirimler",
    privacy: "Gizlilik", helpSupport: "Yardım ve Destek", logOut: "Çıkış Yap",
    cancel: "İptal", save: "Kaydet", done: "Tamam", next: "İleri", back: "Geri",
    search: "Ara", loading: "Yükleniyor...", error: "Hata", retry: "Tekrar Dene",
    free: "Ücretsiz", pro: "Pro", premium: "Premium", upgrade: "Yükselt",
    minutes: "dakika", hours: "saat", days: "gün",
    learningHub: "Öğrenme Merkezi", coreFeatures: "Ana Özellikler", communication: "İletişim",
    dailyChallenge: "Günlük Meydan Okuma", streakRewards: "Seri Ödülleri",
    continueLearning: "Öğrenmeye Devam Et", myProgress: "İlerlemem",
    dailyGoals: "Günlük Hedefler", weeklyDigest: "Haftalık Özet",
    upgradeToPro: "Pro'ya Yükselt", myUsageBalance: "Kullanım ve Bakiye",
    upcomingClasses: "Yaklaşan Dersler", aiTipOfDay: "Günün AI İpucu",
    reviewDueCards: "Kartları Gözden Geçir", learningPace: "Öğrenme Hızı",
    smartSchedule: "Akıllı Program", todaysProgress: "Bugünkü İlerleme",
    words: "Kelimeler", startChallenge: "Meydan Okumayı Başlat",
    challengeComplete: "Meydan Okuma Tamamlandı!", watchTour: "Turu İzle",
    watchNow: "Şimdi İzle", listen: "Dinle", onTrack: "Yolunda",
    dailyGoal: "günlük hedef", remaining: "kalan", thisWeek: "bu hafta",
    account: "Hesap", editProfile: "Profili Düzenle", appMedia: "Uygulama ve Medya",
    appearance: "Görünüm", appUiLanguage: "Uygulama Dili",
    learningLanguage: "Öğrenme Dili", about: "Hakkında",
    version: "Sürüm", rateApp: "Uygulamayı Değerlendir", shareApp: "Uygulamayı Paylaş",
    deleteAccount: "Hesabı Sil",
  },
  // Remaining 45 languages use English as fallback with localized tab labels
  pl: { ...en, home: "Strona główna", learn: "Nauka", songs: "Piosenki", translate: "Tłumacz", calls: "Połączenia", messages: "Wiadomości", profile: "Profil", welcome: "Witaj", settings: "Ustawienia", search: "Szukaj", cancel: "Anuluj", save: "Zapisz", done: "Gotowe", next: "Dalej", back: "Wstecz", loading: "Ładowanie...", error: "Błąd", retry: "Ponów", free: "Darmowe", upgrade: "Ulepsz", minutes: "minut", hours: "godzin", days: "dni" },
  nl: { ...en, home: "Start", learn: "Leren", songs: "Liedjes", translate: "Vertalen", calls: "Oproepen", messages: "Berichten", profile: "Profiel", welcome: "Welkom", settings: "Instellingen", search: "Zoeken", cancel: "Annuleren", save: "Opslaan", done: "Klaar", next: "Volgende", back: "Terug", loading: "Laden...", error: "Fout", retry: "Opnieuw", free: "Gratis", upgrade: "Upgraden", minutes: "minuten", hours: "uren", days: "dagen" },
  sv: { ...en, home: "Hem", learn: "Lär dig", songs: "Låtar", translate: "Översätt", calls: "Samtal", messages: "Meddelanden", profile: "Profil", welcome: "Välkommen", settings: "Inställningar", search: "Sök", cancel: "Avbryt", save: "Spara", done: "Klar", next: "Nästa", back: "Tillbaka", loading: "Laddar...", error: "Fel", retry: "Försök igen", free: "Gratis", upgrade: "Uppgradera", minutes: "minuter", hours: "timmar", days: "dagar" },
  no: { ...en, home: "Hjem", learn: "Lær", songs: "Sanger", translate: "Oversett", calls: "Samtaler", messages: "Meldinger", profile: "Profil", welcome: "Velkommen", settings: "Innstillinger", search: "Søk", cancel: "Avbryt", save: "Lagre", done: "Ferdig", next: "Neste", back: "Tilbake", loading: "Laster...", error: "Feil", retry: "Prøv igjen", free: "Gratis", upgrade: "Oppgrader", minutes: "minutter", hours: "timer", days: "dager" },
  da: { ...en, home: "Hjem", learn: "Lær", songs: "Sange", translate: "Oversæt", calls: "Opkald", messages: "Beskeder", profile: "Profil", welcome: "Velkommen", settings: "Indstillinger", search: "Søg", cancel: "Annuller", save: "Gem", done: "Færdig", next: "Næste", back: "Tilbage", loading: "Indlæser...", error: "Fejl", retry: "Prøv igen", free: "Gratis", upgrade: "Opgrader", minutes: "minutter", hours: "timer", days: "dage" },
  fi: { ...en, home: "Koti", learn: "Opi", songs: "Kappaleet", translate: "Käännä", calls: "Puhelut", messages: "Viestit", profile: "Profiili", welcome: "Tervetuloa", settings: "Asetukset", search: "Hae", cancel: "Peruuta", save: "Tallenna", done: "Valmis", next: "Seuraava", back: "Takaisin", loading: "Ladataan...", error: "Virhe", retry: "Yritä uudelleen", free: "Ilmainen", upgrade: "Päivitä", minutes: "minuuttia", hours: "tuntia", days: "päivää" },
  el: { ...en, home: "Αρχική", learn: "Μάθε", songs: "Τραγούδια", translate: "Μετάφραση", calls: "Κλήσεις", messages: "Μηνύματα", profile: "Προφίλ", welcome: "Καλώς ήρθατε", settings: "Ρυθμίσεις", search: "Αναζήτηση", cancel: "Ακύρωση", save: "Αποθήκευση", done: "Έτοιμο", next: "Επόμενο", back: "Πίσω", loading: "Φόρτωση...", error: "Σφάλμα", retry: "Δοκιμάστε ξανά", free: "Δωρεάν", upgrade: "Αναβάθμιση", minutes: "λεπτά", hours: "ώρες", days: "ημέρες" },
  he: { ...en, home: "בית", learn: "למד", songs: "שירים", translate: "תרגום", calls: "שיחות", messages: "הודעות", profile: "פרופיל", welcome: "ברוך הבא", settings: "הגדרות", search: "חיפוש", cancel: "ביטול", save: "שמור", done: "סיום", next: "הבא", back: "חזרה", loading: "טוען...", error: "שגיאה", retry: "נסה שוב", free: "חינם", upgrade: "שדרג", minutes: "דקות", hours: "שעות", days: "ימים" },
  hu: { ...en, home: "Kezdőlap", learn: "Tanulás", songs: "Dalok", translate: "Fordítás", calls: "Hívások", messages: "Üzenetek", profile: "Profil", welcome: "Üdvözöljük", settings: "Beállítások", search: "Keresés", cancel: "Mégse", save: "Mentés", done: "Kész", next: "Következő", back: "Vissza", loading: "Betöltés...", error: "Hiba", retry: "Újra", free: "Ingyenes", upgrade: "Frissítés", minutes: "perc", hours: "óra", days: "nap" },
  cs: { ...en, home: "Domů", learn: "Učit se", songs: "Písně", translate: "Přeložit", calls: "Hovory", messages: "Zprávy", profile: "Profil", welcome: "Vítejte", settings: "Nastavení", search: "Hledat", cancel: "Zrušit", save: "Uložit", done: "Hotovo", next: "Další", back: "Zpět", loading: "Načítání...", error: "Chyba", retry: "Zkusit znovu", free: "Zdarma", upgrade: "Vylepšit", minutes: "minut", hours: "hodin", days: "dní" },
  ro: { ...en, home: "Acasă", learn: "Învață", songs: "Cântece", translate: "Traduce", calls: "Apeluri", messages: "Mesaje", profile: "Profil", welcome: "Bun venit", settings: "Setări", search: "Caută", cancel: "Anulează", save: "Salvează", done: "Gata", next: "Următor", back: "Înapoi", loading: "Se încarcă...", error: "Eroare", retry: "Reîncearcă", free: "Gratuit", upgrade: "Îmbunătățește", minutes: "minute", hours: "ore", days: "zile" },
  sk: { ...en, home: "Domov", learn: "Učiť sa", songs: "Piesne", translate: "Preložiť", calls: "Hovory", messages: "Správy", profile: "Profil", welcome: "Vitajte", settings: "Nastavenia", search: "Hľadať", cancel: "Zrušiť", save: "Uložiť", done: "Hotovo", next: "Ďalej", back: "Späť", loading: "Načítava sa...", error: "Chyba", retry: "Skúsiť znova", free: "Zadarmo", upgrade: "Vylepšiť", minutes: "minút", hours: "hodín", days: "dní" },
  hr: { ...en, home: "Početna", learn: "Uči", songs: "Pjesme", translate: "Prevedi", calls: "Pozivi", messages: "Poruke", profile: "Profil", welcome: "Dobrodošli", settings: "Postavke", search: "Traži", cancel: "Odustani", save: "Spremi", done: "Gotovo", next: "Sljedeće", back: "Natrag", loading: "Učitavanje...", error: "Greška", retry: "Pokušaj ponovno", free: "Besplatno", upgrade: "Nadogradi", minutes: "minuta", hours: "sati", days: "dana" },
  bg: { ...en, home: "Начало", learn: "Учи", songs: "Песни", translate: "Преведи", calls: "Обаждания", messages: "Съобщения", profile: "Профил", welcome: "Добре дошли", settings: "Настройки", search: "Търси", cancel: "Отказ", save: "Запази", done: "Готово", next: "Напред", back: "Назад", loading: "Зареждане...", error: "Грешка", retry: "Опитай отново", free: "Безплатно", upgrade: "Надгради", minutes: "минути", hours: "часа", days: "дни" },
  uk: { ...en, home: "Головна", learn: "Вчити", songs: "Пісні", translate: "Переклад", calls: "Дзвінки", messages: "Повідомлення", profile: "Профіль", welcome: "Ласкаво просимо", settings: "Налаштування", search: "Пошук", cancel: "Скасувати", save: "Зберегти", done: "Готово", next: "Далі", back: "Назад", loading: "Завантаження...", error: "Помилка", retry: "Повторити", free: "Безкоштовно", upgrade: "Оновити", minutes: "хвилин", hours: "годин", days: "днів" },
  id: { ...en, home: "Beranda", learn: "Belajar", songs: "Lagu", translate: "Terjemah", calls: "Panggilan", messages: "Pesan", profile: "Profil", welcome: "Selamat datang", settings: "Pengaturan", search: "Cari", cancel: "Batal", save: "Simpan", done: "Selesai", next: "Berikutnya", back: "Kembali", loading: "Memuat...", error: "Kesalahan", retry: "Coba lagi", free: "Gratis", upgrade: "Tingkatkan", minutes: "menit", hours: "jam", days: "hari" },
  ms: { ...en, home: "Laman Utama", learn: "Belajar", songs: "Lagu", translate: "Terjemah", calls: "Panggilan", messages: "Mesej", profile: "Profil", welcome: "Selamat datang", settings: "Tetapan", search: "Cari", cancel: "Batal", save: "Simpan", done: "Selesai", next: "Seterusnya", back: "Kembali", loading: "Memuatkan...", error: "Ralat", retry: "Cuba lagi", free: "Percuma", upgrade: "Naik taraf", minutes: "minit", hours: "jam", days: "hari" },
  bn: { ...en, home: "হোম", learn: "শিখুন", songs: "গান", translate: "অনুবাদ", calls: "কল", messages: "বার্তা", profile: "প্রোফাইল", welcome: "স্বাগতম", settings: "সেটিংস", search: "খুঁজুন", cancel: "বাতিল", save: "সংরক্ষণ", done: "সম্পন্ন", next: "পরবর্তী", back: "পিছনে", free: "বিনামূল্যে", upgrade: "আপগ্রেড", minutes: "মিনিট", hours: "ঘণ্টা", days: "দিন" },
  ta: { ...en, home: "முகப்பு", learn: "கற்றுக்கொள்", songs: "பாடல்கள்", translate: "மொழிபெயர்", calls: "அழைப்புகள்", messages: "செய்திகள்", profile: "சுயவிவரம்", welcome: "வரவேற்கிறோம்", settings: "அமைப்புகள்", search: "தேடு", cancel: "ரத்து", save: "சேமி", done: "முடிந்தது", next: "அடுத்து", back: "பின்", free: "இலவசம்", upgrade: "மேம்படுத்து", minutes: "நிமிடங்கள்", hours: "மணி", days: "நாட்கள்" },
  te: { ...en, home: "హోమ్", learn: "నేర్చుకో", songs: "పాటలు", translate: "అనువాదం", calls: "కాల్స్", messages: "సందేశాలు", profile: "ప్రొఫైల్", welcome: "స్వాగతం", settings: "సెట్టింగ్స్", search: "వెతుకు", cancel: "రద్దు", save: "సేవ్", done: "పూర్తి", next: "తదుపరి", back: "వెనుకకు", free: "ఉచితం", upgrade: "అప్‌గ్రేడ్", minutes: "నిమిషాలు", hours: "గంటలు", days: "రోజులు" },
  mr: { ...en, home: "मुख्यपृष्ठ", learn: "शिका", songs: "गाणी", translate: "भाषांतर", calls: "कॉल", messages: "संदेश", profile: "प्रोफाइल", welcome: "स्वागत", settings: "सेटिंग्ज", search: "शोधा", cancel: "रद्द", save: "जतन करा", done: "झाले", next: "पुढे", back: "मागे", free: "मोफत", upgrade: "अपग्रेड", minutes: "मिनिटे", hours: "तास", days: "दिवस" },
  gu: { ...en, home: "હોમ", learn: "શીખો", songs: "ગીતો", translate: "અનુવાદ", calls: "કૉલ", messages: "સંદેશા", profile: "પ્રોફાઇલ", welcome: "સ્વાગત છે", settings: "સેટિંગ્સ", search: "શોધો", cancel: "રદ", save: "સાચવો", done: "થઈ ગયું", next: "આગળ", back: "પાછળ", free: "મફત", upgrade: "અપગ્રેડ", minutes: "મિનિટ", hours: "કલાક", days: "દિવસ" },
  kn: { ...en, home: "ಮುಖಪುಟ", learn: "ಕಲಿ", songs: "ಹಾಡುಗಳು", translate: "ಅನುವಾದ", calls: "ಕರೆಗಳು", messages: "ಸಂದೇಶಗಳು", profile: "ಪ್ರೊಫೈಲ್", welcome: "ಸ್ವಾಗತ", settings: "ಸೆಟ್ಟಿಂಗ್ಸ್", search: "ಹುಡುಕಿ", cancel: "ರದ್ದು", save: "ಉಳಿಸಿ", done: "ಮುಗಿಯಿತು", next: "ಮುಂದೆ", back: "ಹಿಂದೆ", free: "ಉಚಿತ", upgrade: "ಅಪ್‌ಗ್ರೇಡ್", minutes: "ನಿಮಿಷ", hours: "ಗಂಟೆ", days: "ದಿನ" },
  ml: { ...en, home: "ഹോം", learn: "പഠിക്കുക", songs: "പാട്ടുകൾ", translate: "വിവർത്തനം", calls: "കോളുകൾ", messages: "സന്ദേശങ്ങൾ", profile: "പ്രൊഫൈൽ", welcome: "സ്വാഗതം", settings: "ക്രമീകരണങ്ങൾ", search: "തിരയുക", cancel: "റദ്ദാക്കുക", save: "സേവ്", done: "പൂർത്തിയായി", next: "അടുത്തത്", back: "പിന്നിലേക്ക്", free: "സൗജന്യം", upgrade: "അപ്‌ഗ്രേഡ്", minutes: "മിനിറ്റ്", hours: "മണിക്കൂർ", days: "ദിവസം" },
  ur: { ...en, home: "ہوم", learn: "سیکھیں", songs: "گانے", translate: "ترجمہ", calls: "کالز", messages: "پیغامات", profile: "پروفائل", welcome: "خوش آمدید", settings: "ترتیبات", search: "تلاش", cancel: "منسوخ", save: "محفوظ", done: "ہو گیا", next: "اگلا", back: "واپس", free: "مفت", upgrade: "اپ گریڈ", minutes: "منٹ", hours: "گھنٹے", days: "دن" },
  pa: { ...en, home: "ਹੋਮ", learn: "ਸਿੱਖੋ", songs: "ਗੀਤ", translate: "ਅਨੁਵਾਦ", calls: "ਕਾਲ", messages: "ਸੁਨੇਹੇ", profile: "ਪ੍ਰੋਫਾਈਲ", welcome: "ਜੀ ਆਇਆਂ ਨੂੰ", settings: "ਸੈਟਿੰਗਾਂ", search: "ਖੋਜੋ", cancel: "ਰੱਦ", save: "ਸੇਵ", done: "ਹੋ ਗਿਆ", next: "ਅੱਗੇ", back: "ਪਿੱਛੇ", free: "ਮੁਫ਼ਤ", upgrade: "ਅੱਪਗ੍ਰੇਡ", minutes: "ਮਿੰਟ", hours: "ਘੰਟੇ", days: "ਦਿਨ" },
  am: { ...en, home: "መነሻ", learn: "ተማር", songs: "ዘፈኖች", translate: "ተርጉም", calls: "ጥሪዎች", messages: "መልዕክቶች", profile: "ፕሮፋይል", welcome: "እንኳን ደህና መጡ", settings: "ቅንብሮች", search: "ፈልግ", cancel: "ሰርዝ", save: "አስቀምጥ", done: "ተጠናቅቋል", next: "ቀጣይ", back: "ተመለስ", free: "ነፃ", upgrade: "አሻሽል", minutes: "ደቂቃ", hours: "ሰዓት", days: "ቀናት" },
  yo: { ...en, home: "Ilé", learn: "Kọ́", songs: "Orin", translate: "Túmọ̀", calls: "Ìpè", messages: "Ìfiránṣẹ́", profile: "Àkọsílẹ̀", welcome: "Ẹ kú àbọ̀", settings: "Ètò", search: "Wá", cancel: "Fagilé", save: "Tọ́jú", done: "Parí", next: "Tẹ̀lé", back: "Padà", free: "Ọ̀fẹ́", upgrade: "Ìmúdàgba", minutes: "ìṣẹ́jú", hours: "wákàtí", days: "ọjọ́" },
  ig: { ...en, home: "Ụlọ", learn: "Mụta", songs: "Egwu", translate: "Sụgharịa", calls: "Oku", messages: "Ozi", profile: "Profaịlụ", welcome: "Nnọọ", settings: "Ntọala", search: "Chọọ", cancel: "Kagbuo", save: "Chekwaa", done: "Emechara", next: "Ọzọ", back: "Azụ", free: "N'efu", upgrade: "Kwalite", minutes: "nkeji", hours: "awa", days: "ụbọchị" },
  zu: { ...en, home: "Ikhaya", learn: "Funda", songs: "Izingoma", translate: "Humusha", calls: "Izingcingo", messages: "Imilayezo", profile: "Iphrofayela", welcome: "Siyakwamukela", settings: "Izilungiselelo", search: "Sesha", cancel: "Khansela", save: "Gcina", done: "Kwenziwe", next: "Okulandelayo", back: "Emuva", free: "Mahhala", upgrade: "Thuthukisa", minutes: "imizuzu", hours: "amahora", days: "izinsuku" },
  af: { ...en, home: "Tuis", learn: "Leer", songs: "Liedjies", translate: "Vertaal", calls: "Oproepe", messages: "Boodskappe", profile: "Profiel", welcome: "Welkom", settings: "Instellings", search: "Soek", cancel: "Kanselleer", save: "Stoor", done: "Klaar", next: "Volgende", back: "Terug", free: "Gratis", upgrade: "Opgradeer", minutes: "minute", hours: "ure", days: "dae" },
  fa: { ...en, home: "خانه", learn: "یادگیری", songs: "آهنگ‌ها", translate: "ترجمه", calls: "تماس‌ها", messages: "پیام‌ها", profile: "پروفایل", welcome: "خوش آمدید", settings: "تنظیمات", search: "جستجو", cancel: "لغو", save: "ذخیره", done: "انجام شد", next: "بعدی", back: "برگشت", free: "رایگان", upgrade: "ارتقا", minutes: "دقیقه", hours: "ساعت", days: "روز" },
  my: { ...en, home: "ပင်မ", learn: "သင်ယူ", songs: "သီချင်း", translate: "ဘာသာပြန်", calls: "ခေါ်ဆိုမှု", messages: "မက်ဆေ့ခ်ျ", profile: "ပရိုဖိုင်", welcome: "ကြိုဆိုပါတယ်", settings: "ဆက်တင်", search: "ရှာဖွေ", cancel: "ပယ်ဖျက်", save: "သိမ်းဆည်း", done: "ပြီးပါပြီ", next: "ရှေ့", back: "နောက်", free: "အခမဲ့", upgrade: "အဆင့်မြှင့်", minutes: "မိနစ်", hours: "နာရီ", days: "ရက်" },
  km: { ...en, home: "ទំព័រដើម", learn: "រៀន", songs: "បទចម្រៀង", translate: "បកប្រែ", calls: "ការហៅ", messages: "សារ", profile: "ប្រវត្តិរូប", welcome: "សូមស្វាគមន៍", settings: "ការកំណត់", search: "ស្វែងរក", cancel: "បោះបង់", save: "រក្សាទុក", done: "រួចរាល់", next: "បន្ទាប់", back: "ថយក្រោយ", free: "ឥតគិតថ្លៃ", upgrade: "ដំឡើង", minutes: "នាទី", hours: "ម៉ោង", days: "ថ្ងៃ" },
  mn: { ...en, home: "Нүүр", learn: "Сурах", songs: "Дуу", translate: "Орчуулах", calls: "Дуудлага", messages: "Мессеж", profile: "Профайл", welcome: "Тавтай морил", settings: "Тохиргоо", search: "Хайх", cancel: "Цуцлах", save: "Хадгалах", done: "Дууссан", next: "Дараах", back: "Буцах", free: "Үнэгүй", upgrade: "Сайжруулах", minutes: "минут", hours: "цаг", days: "өдөр" },
  ht: { ...en, home: "Akèy", learn: "Aprann", songs: "Chante", translate: "Tradui", calls: "Apèl", messages: "Mesaj", profile: "Pwofil", welcome: "Byenveni", settings: "Paramèt", search: "Chèche", cancel: "Anile", save: "Sove", done: "Fini", next: "Pwochen", back: "Retounen", free: "Gratis", upgrade: "Amelyore", minutes: "minit", hours: "èdtan", days: "jou" },
  ca: { ...en, home: "Inici", learn: "Aprèn", songs: "Cançons", translate: "Tradueix", calls: "Trucades", messages: "Missatges", profile: "Perfil", welcome: "Benvingut", settings: "Configuració", search: "Cerca", cancel: "Cancel·la", save: "Desa", done: "Fet", next: "Següent", back: "Enrere", free: "Gratuït", upgrade: "Millora", minutes: "minuts", hours: "hores", days: "dies" },
  lt: { ...en, home: "Pradžia", learn: "Mokytis", songs: "Dainos", translate: "Versti", calls: "Skambučiai", messages: "Žinutės", profile: "Profilis", welcome: "Sveiki", settings: "Nustatymai", search: "Ieškoti", cancel: "Atšaukti", save: "Išsaugoti", done: "Atlikta", next: "Kitas", back: "Atgal", free: "Nemokama", upgrade: "Atnaujinti", minutes: "minučių", hours: "valandų", days: "dienų" },
  kk: { ...en, home: "Басты", learn: "Үйрену", songs: "Әндер", translate: "Аудару", calls: "Қоңыраулар", messages: "Хабарламалар", profile: "Профиль", welcome: "Қош келдіңіз", settings: "Параметрлер", search: "Іздеу", cancel: "Болдырмау", save: "Сақтау", done: "Дайын", next: "Келесі", back: "Артқа", free: "Тегін", upgrade: "Жаңарту", minutes: "минут", hours: "сағат", days: "күн" },
  ps: { ...en, home: "کور", learn: "زده کړئ", songs: "سندرې", translate: "ژباړه", calls: "زنګونه", messages: "پیغامونه", profile: "پروفایل", welcome: "ښه راغلاست", settings: "ترتیبات", search: "لټون", cancel: "لغوه", save: "خوندي", done: "ترسره شو", next: "بل", back: "شاته", free: "وړیا", upgrade: "لوړول", minutes: "دقیقې", hours: "ساعتونه", days: "ورځې" },
  ne: { ...en, home: "गृहपृष्ठ", learn: "सिक्नुहोस्", songs: "गीतहरू", translate: "अनुवाद", calls: "कलहरू", messages: "सन्देशहरू", profile: "प्रोफाइल", welcome: "स्वागत छ", settings: "सेटिङ", search: "खोज्नुहोस्", cancel: "रद्द", save: "सेभ", done: "भयो", next: "अर्को", back: "पछाडि", free: "निःशुल्क", upgrade: "अपग्रेड", minutes: "मिनेट", hours: "घण्टा", days: "दिन" },
  si: { ...en, home: "මුල් පිටුව", learn: "ඉගෙන ගන්න", songs: "ගීත", translate: "පරිවර්තනය", calls: "ඇමතුම්", messages: "පණිවිඩ", profile: "පැතිකඩ", welcome: "සාදරයෙන් පිළිගනිමු", settings: "සැකසුම්", search: "සොයන්න", cancel: "අවලංගු", save: "සුරකින්න", done: "හරි", next: "ඊළඟ", back: "ආපසු", free: "නොමිලේ", upgrade: "උත්ශ්‍රේණි", minutes: "මිනිත්තු", hours: "පැය", days: "දින" },
  lo: { ...en, home: "ໜ້າຫຼັກ", learn: "ຮຽນ", songs: "ເພງ", translate: "ແປ", calls: "ໂທ", messages: "ຂໍ້ຄວາມ", profile: "ໂປຣໄຟລ໌", welcome: "ຍິນດີຕ້ອນຮັບ", settings: "ການຕັ້ງຄ່າ", search: "ຄົ້ນຫາ", cancel: "ຍົກເລີກ", save: "ບັນທຶກ", done: "ແລ້ວ", next: "ຕໍ່ໄປ", back: "ກັບຄືນ", free: "ຟຣີ", upgrade: "ອັບເກຣດ", minutes: "ນາທີ", hours: "ຊົ່ວໂມງ", days: "ມື້" },
  ka: { ...en, home: "მთავარი", learn: "სწავლა", songs: "სიმღერები", translate: "თარგმნა", calls: "ზარები", messages: "შეტყობინებები", profile: "პროფილი", welcome: "მოგესალმებით", settings: "პარამეტრები", search: "ძიება", cancel: "გაუქმება", save: "შენახვა", done: "მზადაა", next: "შემდეგი", back: "უკან", free: "უფასო", upgrade: "განახლება", minutes: "წუთი", hours: "საათი", days: "დღე" },
  az: { ...en, home: "Əsas", learn: "Öyrən", songs: "Mahnılar", translate: "Tərcümə", calls: "Zənglər", messages: "Mesajlar", profile: "Profil", welcome: "Xoş gəldiniz", settings: "Parametrlər", search: "Axtar", cancel: "Ləğv et", save: "Saxla", done: "Hazır", next: "Növbəti", back: "Geri", free: "Pulsuz", upgrade: "Yüksəlt", minutes: "dəqiqə", hours: "saat", days: "gün" },
};

// Context
interface I18nContextType {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  t: Translations;
}

const I18nContext = createContext<I18nContextType>({
  language: "en",
  setLanguage: () => {},
  t: translations.en,
});

const STORAGE_KEY = "@connectworld_app_language";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>("en");

  useEffect(() => {
    // Load saved language preference
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved && saved in translations) {
        setLanguageState(saved as AppLanguage);
      }
    });
  }, []);

  const setLanguage = useCallback((lang: AppLanguage) => {
    setLanguageState(lang);
    AsyncStorage.setItem(STORAGE_KEY, lang);
  }, []);

  const t = translations[language];

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export function useTranslation() {
  const { t } = useContext(I18nContext);
  return t;
}
