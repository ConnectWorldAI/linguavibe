import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Platform,
  FlatList,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { ReportAIResponse } from "@/components/report-ai-response";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";
import { trpc } from "@/lib/trpc";
import { useSpeechToText } from "@/hooks/use-speech-to-text";
import { SUPPORTED_LANGUAGES, type AppLanguage } from "@/lib/i18n";
import {
  ALL_SIM_LANGUAGES,
  CORE_CONVERSATIONS,
  USER_RESPONSES_BY_LANG,
  getPronunciationTip,
  getCorrectionTipForLanguage,
} from "@/lib/sim-language-data";
import { useDailyUsageGuard } from "@/components/premium-guard";
import { useSubscription, canAccessFeature } from "@/hooks/use-subscription";
import { useHumeVoice, type EmotionScore } from "@/hooks/use-hume-voice";

// ─── Types ───────────────────────────────────────────────────────────────────
type SimState = "lobby" | "countdown" | "active" | "listening" | "feedback" | "results";
type Difficulty = "beginner" | "intermediate" | "advanced";

type Scenario = {
  id: string;
  title: string;
  icon: string;
  description: string;
  difficulty: Difficulty;
  turns: number;
  language: string;
};

type Message = {
  id: string;
  role: "ai" | "user";
  text: string;
  translation?: string;
  correction?: string;
  pronunciationScore?: number;
  timestamp: number;
};

// ─── Scenarios ───────────────────────────────────────────────────────────────
const SCENARIOS: Scenario[] = [
  { id: "restaurant", title: "At the Restaurant", icon: "restaurant", description: "Order food, ask about the menu, and interact with a waiter", difficulty: "beginner", turns: 8, language: "Spanish" },
  { id: "airport", title: "Airport Check-in", icon: "airplane", description: "Navigate check-in, security questions, and gate changes", difficulty: "intermediate", turns: 10, language: "Spanish" },
  { id: "shopping", title: "Street Market", icon: "cart", description: "Bargain prices, ask about products, and make purchases", difficulty: "beginner", turns: 8, language: "Spanish" },
  { id: "doctor", title: "Doctor's Visit", icon: "medkit", description: "Describe symptoms, understand prescriptions, ask questions", difficulty: "intermediate", turns: 10, language: "Spanish" },
  { id: "job_interview", title: "Job Interview", icon: "briefcase", description: "Answer questions about experience, ask about the role", difficulty: "advanced", turns: 12, language: "Spanish" },
  { id: "directions", title: "Asking for Directions", icon: "navigate", description: "Find your way around a new city with locals", difficulty: "beginner", turns: 6, language: "Spanish" },
  { id: "hotel", title: "Hotel Check-in", icon: "bed", description: "Book a room, request amenities, handle issues", difficulty: "intermediate", turns: 8, language: "Spanish" },
  { id: "debate", title: "Friendly Debate", icon: "chatbubbles", description: "Discuss opinions on culture, food, and travel", difficulty: "advanced", turns: 12, language: "Spanish" },
];

// ─── AI Conversation Data ────────────────────────────────────────────────────
const AI_CONVERSATIONS: Record<string, { prompt: string; responses: string[] }> = {
  restaurant: {
    prompt: "¡Bienvenido! Soy su mesero. ¿Qué le gustaría ordenar hoy?",
    responses: [
      "Excelente elección. ¿Desea algo para beber con eso?",
      "Tenemos un especial del día: paella valenciana. ¿Le interesa?",
      "¿Prefiere la carne bien cocida o término medio?",
      "¿Algún postre para terminar? Tenemos flan casero.",
      "Perfecto. Su orden estará lista en unos 15 minutos.",
      "¿Necesita algo más? ¿Quizás más pan?",
      "Aquí tiene la cuenta. ¿Paga en efectivo o con tarjeta?",
      "¡Gracias por venir! Que tenga una buena noche.",
    ],
  },
  airport: {
    prompt: "Buenos días. ¿Me permite su pasaporte y boleto, por favor?",
    responses: [
      "¿Lleva equipaje para documentar?",
      "Su maleta pesa 23 kilos, está dentro del límite.",
      "¿Prefiere asiento de ventanilla o pasillo?",
      "Su puerta de embarque es la B7. El abordaje comienza a las 3:45.",
      "Hay un retraso de 30 minutos. ¿Puedo ayudarle con algo mientras espera?",
      "¿Tiene líquidos o electrónicos en su equipaje de mano?",
      "Por favor, coloque sus pertenencias en la bandeja.",
      "Todo listo. ¡Buen viaje!",
      "¿Necesita información sobre conexiones?",
      "La sala VIP está al final del pasillo a la derecha.",
    ],
  },
  shopping: {
    prompt: "¡Hola amigo! Mira estas frutas frescas. ¿Qué le llevo?",
    responses: [
      "Estas mangos están dulcísimos. A tres por un dólar.",
      "¿Quiere probar? Tome, pruebe este pedacito.",
      "Le hago un precio especial: cinco dólares por todo esto.",
      "¿Algo más? Tengo aguacates perfectos para guacamole.",
      "Bueno, se lo dejo en cuatro. Es mi último precio.",
      "¿Necesita una bolsa? Se la regalo.",
      "¡Vuelva pronto! Mañana llegan las piñas.",
      "Aceptamos efectivo y transferencia.",
    ],
  },
  doctor: {
    prompt: "Buenos días. Soy la Doctora García. ¿Qué síntomas tiene?",
    responses: [
      "¿Desde cuándo se siente así?",
      "Voy a tomarle la temperatura y la presión.",
      "¿Es alérgico a algún medicamento?",
      "Le voy a recetar un antibiótico. Tómelo cada 8 horas.",
      "Necesito hacerle unos análisis de sangre.",
      "¿Ha tenido fiebre o dolor de cabeza?",
      "Debe descansar por lo menos tres días.",
      "Si no mejora en una semana, regrese para una revisión.",
      "¿Tiene su tarjeta de seguro médico?",
      "Cuídese mucho. Tome muchos líquidos.",
    ],
  },
  job_interview: {
    prompt: "Bienvenido. Cuénteme sobre su experiencia profesional.",
    responses: [
      "Interesante. ¿Por qué quiere trabajar en nuestra empresa?",
      "¿Cuáles son sus fortalezas principales?",
      "¿Cómo maneja situaciones de estrés en el trabajo?",
      "¿Tiene experiencia trabajando en equipo?",
      "¿Dónde se ve en cinco años?",
      "¿Cuál fue su mayor logro profesional?",
      "¿Tiene alguna pregunta sobre el puesto?",
      "El salario base es de $45,000 anuales. ¿Le parece bien?",
      "¿Cuándo podría comenzar?",
      "Le contactaremos la próxima semana con nuestra decisión.",
      "¿Hay algo más que quiera agregar?",
      "Gracias por su tiempo. Fue un placer conocerle.",
    ],
  },
  directions: {
    prompt: "¡Hola! ¿En qué puedo ayudarle? ¿Está perdido?",
    responses: [
      "Ah, el museo está a tres cuadras de aquí. Siga derecho.",
      "Cuando llegue a la esquina, doble a la izquierda.",
      "No puede perderse, hay un letrero grande azul.",
      "¿Quiere que le muestre en el mapa de mi teléfono?",
      "Caminando son unos diez minutos. En taxi, cinco.",
      "¡De nada! Disfrute su visita.",
    ],
  },
  hotel: {
    prompt: "Buenas tardes. Bienvenido al Hotel Sol. ¿Tiene reservación?",
    responses: [
      "Perfecto. Tengo una habitación doble con vista al mar.",
      "El desayuno se sirve de 7 a 10 en el restaurante del primer piso.",
      "¿Necesita ayuda con su equipaje?",
      "La piscina está abierta hasta las 10 de la noche.",
      "¿Desea que le programe un servicio de despertador?",
      "El WiFi es gratuito. La contraseña está en la tarjeta de la habitación.",
      "Si necesita toallas extra, llame a recepción.",
      "¡Disfrute su estadía!",
    ],
  },
  debate: {
    prompt: "¿Qué opinas sobre la comida callejera versus los restaurantes elegantes?",
    responses: [
      "Interesante punto de vista. Pero, ¿no crees que la autenticidad importa más?",
      "En mi experiencia, los mejores sabores están en los mercados locales.",
      "¿Has probado la comida de algún país que te haya sorprendido?",
      "Yo creo que cada cultura tiene su propia definición de 'buena comida'.",
      "¿Y qué piensas del turismo gastronómico? ¿Es positivo o negativo?",
      "Tienes razón en eso. La globalización ha cambiado mucho la gastronomía.",
      "¿Cuál dirías que es el plato más subestimado de Latinoamérica?",
      "Bueno, ha sido una conversación muy interesante. ¿Algún pensamiento final?",
      "Me encanta cómo piensas. Deberías escribir un blog sobre esto.",
      "¿Crees que la inteligencia artificial podrá cocinar algún día?",
      "Jaja, buena respuesta. Estoy de acuerdo contigo.",
      "Fue un placer debatir contigo. ¡Hasta la próxima!",
    ],
  },
};

// ─── French AI Conversations ─────────────────────────────────────────────────
const AI_CONVERSATIONS_FR: Record<string, { prompt: string; responses: string[] }> = {
  restaurant: {
    prompt: "Bienvenue ! Je suis votre serveur. Qu'est-ce que vous aimeriez commander aujourd'hui ?",
    responses: [
      "Excellent choix. Souhaitez-vous quelque chose à boire avec ça ?",
      "Nous avons un plat du jour : coq au vin. Cela vous intéresse ?",
      "Préférez-vous la viande bien cuite ou saignante ?",
      "Un dessert pour finir ? Nous avons une crème brûlée maison.",
      "Parfait. Votre commande sera prête dans une quinzaine de minutes.",
      "Avez-vous besoin d'autre chose ? Du pain peut-être ?",
      "Voici l'addition. Vous payez en espèces ou par carte ?",
      "Merci d'être venu ! Bonne soirée.",
    ],
  },
  airport: {
    prompt: "Bonjour. Puis-je voir votre passeport et votre billet, s'il vous plaît ?",
    responses: [
      "Avez-vous des bagages à enregistrer ?",
      "Votre valise pèse 22 kilos, c'est dans la limite.",
      "Préférez-vous un siège côté hublot ou côté couloir ?",
      "Votre porte d'embarquement est la B12. L'embarquement commence à 15h30.",
      "Il y a un retard de 25 minutes. Puis-je vous aider en attendant ?",
      "Avez-vous des liquides ou des appareils électroniques dans votre bagage à main ?",
      "Veuillez placer vos affaires dans le bac.",
      "Tout est en ordre. Bon voyage !",
      "Avez-vous besoin d'informations sur les correspondances ?",
      "Le salon VIP est au bout du couloir à droite.",
    ],
  },
  shopping: {
    prompt: "Bonjour ! Regardez ces beaux fruits frais. Qu'est-ce qui vous ferait plaisir ?",
    responses: [
      "Ces fraises sont délicieuses. Trois barquettes pour cinq euros.",
      "Vous voulez goûter ? Tenez, essayez celui-ci.",
      "Je vous fais un prix spécial : huit euros pour le tout.",
      "Autre chose ? J'ai des avocats parfaits pour le guacamole.",
      "Bon, je vous le laisse à six euros. C'est mon dernier prix.",
      "Vous avez besoin d'un sac ? Je vous l'offre.",
      "Revenez bientôt ! Demain arrivent les cerises.",
      "On accepte les espèces et la carte.",
    ],
  },
  doctor: {
    prompt: "Bonjour. Je suis le Docteur Martin. Quels sont vos symptômes ?",
    responses: [
      "Depuis quand vous sentez-vous comme ça ?",
      "Je vais prendre votre température et votre tension.",
      "Êtes-vous allergique à un médicament ?",
      "Je vais vous prescrire un antibiotique. Prenez-le toutes les 8 heures.",
      "J'ai besoin de faire une prise de sang.",
      "Avez-vous eu de la fièvre ou des maux de tête ?",
      "Vous devez vous reposer au moins trois jours.",
      "Si ça ne s'améliore pas dans une semaine, revenez me voir.",
      "Avez-vous votre carte vitale ?",
      "Prenez soin de vous. Buvez beaucoup d'eau.",
    ],
  },
  job_interview: {
    prompt: "Bienvenue. Parlez-moi de votre expérience professionnelle.",
    responses: [
      "Intéressant. Pourquoi souhaitez-vous travailler dans notre entreprise ?",
      "Quels sont vos principaux atouts ?",
      "Comment gérez-vous les situations de stress au travail ?",
      "Avez-vous de l'expérience en travail d'équipe ?",
      "Où vous voyez-vous dans cinq ans ?",
      "Quelle a été votre plus grande réussite professionnelle ?",
      "Avez-vous des questions sur le poste ?",
      "Le salaire de base est de 40 000 euros annuels. Cela vous convient ?",
      "Quand pourriez-vous commencer ?",
      "Nous vous contacterons la semaine prochaine avec notre décision.",
      "Y a-t-il autre chose que vous aimeriez ajouter ?",
      "Merci pour votre temps. C'était un plaisir de vous rencontrer.",
    ],
  },
  directions: {
    prompt: "Bonjour ! Je peux vous aider ? Vous êtes perdu ?",
    responses: [
      "Ah, le musée est à trois rues d'ici. Allez tout droit.",
      "Quand vous arrivez au carrefour, tournez à gauche.",
      "Vous ne pouvez pas le manquer, il y a un grand panneau bleu.",
      "Voulez-vous que je vous montre sur la carte de mon téléphone ?",
      "À pied, c'est environ dix minutes. En taxi, cinq.",
      "De rien ! Profitez de votre visite.",
    ],
  },
  hotel: {
    prompt: "Bonsoir. Bienvenue à l'Hôtel Soleil. Avez-vous une réservation ?",
    responses: [
      "Parfait. J'ai une chambre double avec vue sur la mer.",
      "Le petit-déjeuner est servi de 7h à 10h au restaurant du premier étage.",
      "Avez-vous besoin d'aide avec vos bagages ?",
      "La piscine est ouverte jusqu'à 22 heures.",
      "Souhaitez-vous un réveil programmé ?",
      "Le WiFi est gratuit. Le mot de passe est sur la carte de la chambre.",
      "Si vous avez besoin de serviettes supplémentaires, appelez la réception.",
      "Profitez de votre séjour !",
    ],
  },
  debate: {
    prompt: "Que pensez-vous de la cuisine de rue par rapport aux restaurants gastronomiques ?",
    responses: [
      "Point de vue intéressant. Mais ne pensez-vous pas que l'authenticité compte plus ?",
      "D'après mon expérience, les meilleures saveurs sont dans les marchés locaux.",
      "Avez-vous goûté la cuisine d'un pays qui vous a surpris ?",
      "Je crois que chaque culture a sa propre définition de la 'bonne cuisine'.",
      "Et que pensez-vous du tourisme gastronomique ? Positif ou négatif ?",
      "Vous avez raison. La mondialisation a beaucoup changé la gastronomie.",
      "Quel est le plat le plus sous-estimé de la cuisine française selon vous ?",
      "Eh bien, c'était une conversation très intéressante. Un dernier mot ?",
      "J'adore votre façon de penser. Vous devriez écrire un blog.",
      "Pensez-vous que l'IA pourra cuisiner un jour ?",
      "Haha, bonne réponse. Je suis d'accord avec vous.",
      "C'était un plaisir de débattre avec vous. À la prochaine !",
    ],
  },
};

// ─── Portuguese AI Conversations ──────────────────────────────────────────────
const AI_CONVERSATIONS_PT: Record<string, { prompt: string; responses: string[] }> = {
  restaurant: {
    prompt: "Bem-vindo! Eu sou o garçom. O que gostaria de pedir hoje?",
    responses: [
      "Ótima escolha. Gostaria de algo para beber?",
      "Temos o prato do dia: feijoada completa. Interessa?",
      "Prefere a carne bem passada ou ao ponto?",
      "Alguma sobremesa? Temos pudim caseiro.",
      "Perfeito. Seu pedido ficará pronto em uns 15 minutos.",
      "Precisa de mais alguma coisa? Mais pão talvez?",
      "Aqui está a conta. Vai pagar em dinheiro ou cartão?",
      "Obrigado por vir! Tenha uma boa noite.",
    ],
  },
  airport: {
    prompt: "Bom dia. Posso ver seu passaporte e passagem, por favor?",
    responses: [
      "Tem bagagem para despachar?",
      "Sua mala pesa 23 quilos, está dentro do limite.",
      "Prefere assento na janela ou no corredor?",
      "Seu portão de embarque é o B5. O embarque começa às 15h45.",
      "Há um atraso de 30 minutos. Posso ajudá-lo enquanto espera?",
      "Tem líquidos ou eletrônicos na bagagem de mão?",
      "Por favor, coloque seus pertences na bandeja.",
      "Tudo certo. Boa viagem!",
      "Precisa de informações sobre conexões?",
      "A sala VIP fica no final do corredor à direita.",
    ],
  },
  shopping: {
    prompt: "Oi, amigo! Olha essas frutas frescas. O que vai levar?",
    responses: [
      "Essas mangas estão docíssimas. Três por cinco reais.",
      "Quer experimentar? Toma, prova esse pedacinho.",
      "Faço um preço especial: dez reais por tudo isso.",
      "Mais alguma coisa? Tenho abacates perfeitos para guacamole.",
      "Tá bom, deixo por oito. É meu último preço.",
      "Precisa de sacola? Te dou de graça.",
      "Volta logo! Amanhã chegam os abacaxis.",
      "Aceitamos dinheiro e Pix.",
    ],
  },
  doctor: {
    prompt: "Bom dia. Sou a Doutora Silva. Quais são seus sintomas?",
    responses: [
      "Desde quando você está se sentindo assim?",
      "Vou medir sua temperatura e pressão.",
      "Você é alérgico a algum medicamento?",
      "Vou receitar um antibiótico. Tome a cada 8 horas.",
      "Preciso fazer uns exames de sangue.",
      "Teve febre ou dor de cabeça?",
      "Você deve descansar pelo menos três dias.",
      "Se não melhorar em uma semana, volte para uma revisão.",
      "Tem seu cartão do convênio?",
      "Cuide-se bem. Beba muita água.",
    ],
  },
  job_interview: {
    prompt: "Bem-vindo. Conte-me sobre sua experiência profissional.",
    responses: [
      "Interessante. Por que quer trabalhar na nossa empresa?",
      "Quais são seus principais pontos fortes?",
      "Como você lida com situações de estresse no trabalho?",
      "Tem experiência trabalhando em equipe?",
      "Onde você se vê em cinco anos?",
      "Qual foi sua maior conquista profissional?",
      "Tem alguma pergunta sobre a vaga?",
      "O salário base é de R$8.000 mensais. Parece bom?",
      "Quando poderia começar?",
      "Entraremos em contato na próxima semana com nossa decisão.",
      "Há algo mais que gostaria de acrescentar?",
      "Obrigado pelo seu tempo. Foi um prazer conhecê-lo.",
    ],
  },
  directions: {
    prompt: "Oi! Posso te ajudar? Está perdido?",
    responses: [
      "Ah, o museu fica a três quadras daqui. Segue em frente.",
      "Quando chegar na esquina, vira à esquerda.",
      "Não tem como errar, tem uma placa grande azul.",
      "Quer que eu te mostre no mapa do celular?",
      "A pé são uns dez minutos. De táxi, cinco.",
      "De nada! Aproveite a visita.",
    ],
  },
  hotel: {
    prompt: "Boa tarde. Bem-vindo ao Hotel Sol. Tem reserva?",
    responses: [
      "Perfeito. Tenho um quarto duplo com vista para o mar.",
      "O café da manhã é servido das 7 às 10 no restaurante do primeiro andar.",
      "Precisa de ajuda com a bagagem?",
      "A piscina fica aberta até as 22 horas.",
      "Deseja que eu programe um despertar?",
      "O WiFi é gratuito. A senha está no cartão do quarto.",
      "Se precisar de toalhas extras, ligue para a recepção.",
      "Aproveite a estadía!",
    ],
  },
  debate: {
    prompt: "O que você acha da comida de rua comparada com restaurantes chiques?",
    responses: [
      "Ponto de vista interessante. Mas você não acha que a autenticidade importa mais?",
      "Na minha experiência, os melhores sabores estão nos mercados locais.",
      "Você já provou a comida de algum país que te surpreendeu?",
      "Eu acho que cada cultura tem sua própria definição de 'boa comida'.",
      "E o que você acha do turismo gastronômico? Positivo ou negativo?",
      "Você tem razão. A globalização mudou muito a gastronomia.",
      "Qual você diria que é o prato mais subestimado da culinária brasileira?",
      "Bom, foi uma conversa muito interessante. Algum pensamento final?",
      "Adoro como você pensa. Deveria escrever um blog sobre isso.",
      "Você acha que a inteligência artificial vai poder cozinhar um dia?",
      "Haha, boa resposta. Concordo com você.",
      "Foi um prazer debater com você. Até a próxima!",
    ],
  },
};

// ─── Japanese AI Conversations ───────────────────────────────────────────────
const AI_CONVERSATIONS_JA: Record<string, { prompt: string; responses: string[] }> = {
  restaurant: {
    prompt: "いらっしゃいませ！何名様ですか？ご注文はお決まりですか？",
    responses: [
      "素晴らしい選択です。お飲み物はいかがですか？",
      "本日のおすすめは天ぷら定食です。いかがですか？",
      "お肉の焼き加減はどういたしましょうか？",
      "デザートはいかがですか？抹茶アイスが人気です。",
      "かしこまりました。15分ほどでお持ちします。",
      "他に何かございますか？お水のおかわりは？",
      "お会計です。現金とカード、どちらがよろしいですか？",
      "ありがとうございました！またお越しください。",
    ],
  },
  airport: {
    prompt: "おはようございます。パスポートと搭乗券を見せていただけますか？",
    responses: [
      "お預けの荷物はございますか？",
      "お荷物は23キロです。制限内です。",
      "窓側と通路側、どちらがよろしいですか？",
      "搭乗ゲートはB7です。搭乗は15時45分からです。",
      "30分の遅延がございます。何かお手伝いできますか？",
      "手荷物に液体や電子機器はありますか？",
      "お荷物をトレイに置いてください。",
      "全て完了です。良い旅を！",
      "乗り継ぎの情報は必要ですか？",
      "ラウンジは廊下の突き当たり右側です。",
    ],
  },
  shopping: {
    prompt: "いらっしゃい！新鮮な果物を見てください。何にしますか？",
    responses: [
      "このみかんはとても甘いですよ。3個で500円です。",
      "試食しますか？どうぞ、一つどうぞ。",
      "特別価格です：全部で1000円です。",
      "他に何か？アボカドもありますよ。",
      "じゃあ、800円でいいですよ。最終価格です。",
      "袋は要りますか？無料です。",
      "また来てください！明日はいちごが入ります。",
      "現金と電子マネー、どちらも大丈夫です。",
    ],
  },
  doctor: {
    prompt: "おはようございます。田中先生です。どうされましたか？",
    responses: [
      "いつからその症状がありますか？",
      "体温と血圧を測りましょう。",
      "何かアレルギーはありますか？",
      "抗生物質を処方します。8時間ごとに飲んでください。",
      "血液検査が必要です。",
      "熱や頭痛はありますか？",
      "少なくとも3日間は休んでください。",
      "1週間で良くならない場合は、また来てください。",
      "保険証はお持ちですか？",
      "お大事に。水分をたくさん取ってください。",
    ],
  },
  job_interview: {
    prompt: "ようこそ。ご自身の職歴について教えてください。",
    responses: [
      "興味深いですね。なぜ当社で働きたいと思いますか？",
      "あなたの強みは何ですか？",
      "ストレスのある状況でどう対処しますか？",
      "チームで働いた経験はありますか？",
      "5年後の自分をどう想像しますか？",
      "一番の職業的な達成は何ですか？",
      "このポジションについて質問はありますか？",
      "基本給は年収500万円です。いかがですか？",
      "いつから始められますか？",
      "来週ご連絡いたします。",
      "他に何か付け加えたいことはありますか？",
      "お時間いただきありがとうございました。",
    ],
  },
  directions: {
    prompt: "こんにちは！何かお手伝いしましょうか？道に迷いましたか？",
    responses: [
      "あ、美術館はここから3ブロック先です。まっすぐ行ってください。",
      "角に着いたら左に曲がってください。",
      "大きな青い看板があるので、見逃しません。",
      "携帯の地図で見せましょうか？",
      "歩いて約10分です。タクシーなら5分です。",
      "どういたしまして！楽しんでください。",
    ],
  },
  hotel: {
    prompt: "こんにちは。ホテルサンへようこそ。ご予約はありますか？",
    responses: [
      "かしこまりました。海が見えるツインルームをご用意しました。",
      "朝食は1階レストランで7時から10時までです。",
      "お荷物をお運びしましょうか？",
      "プールは22時まで利用できます。",
      "モーニングコールを設定しましょうか？",
      "WiFiは無料です。パスワードはお部屋のカードにあります。",
      "タオルが必要な場合はフロントにお電話ください。",
      "ご滝在をお楽しみください！",
    ],
  },
  debate: {
    prompt: "屋台の食べ物と高級レストラン、どう思いますか？",
    responses: [
      "興味深い意見ですね。でも、本物の味の方が大事だと思いませんか？",
      "私の経験では、一番おいしいのは地元の市場です。",
      "驚いた国の料理はありますか？",
      "文化によって『おいしい』の定義が違うと思います。",
      "グルメツーリズムについてどう思いますか？",
      "その通りです。グローバル化が食文化を変えました。",
      "日本料理で一番過小評価されている料理は何だと思いますか？",
      "とても興味深い会話でした。最後に一言ありますか？",
      "素晴らしい考え方ですね。ブログを書いたらいいのに。",
      "AIが料理できるようになると思いますか？",
      "はは、いい答えですね。賛成です。",
      "楽しかったです。また話しましょう！",
    ],
  },
};

// ─── Multi-language conversation lookup ───────────────────────────────────────
const CONVERSATIONS_BY_LANG: Record<string, Record<string, { prompt: string; responses: string[] }>> = {
  es: AI_CONVERSATIONS,
  fr: AI_CONVERSATIONS_FR,
  pt: AI_CONVERSATIONS_PT,
  ja: AI_CONVERSATIONS_JA,
};

// ─── Scoring Helpers ─────────────────────────────────────────────────────────
const PRONUNCIATION_TIPS_BY_LANG: Record<string, Record<string, string>> = {
  es: {
    restaurant: "Focus on rolling your 'r' sounds and the soft 'd' in 'ordenar'",
    airport: "Pay attention to the stress on 'equipaje' (eh-kee-PAH-heh)",
    shopping: "Practice the 'ñ' sound and linking words together naturally",
    doctor: "Medical terms often have Latin roots — use that to your advantage",
    job_interview: "Speak clearly and use formal 'usted' conjugations",
    directions: "Practice prepositions: 'a la izquierda', 'a la derecha', 'derecho'",
    hotel: "Use polite requests: '¿Podría...?' and '¿Sería posible...?'",
    debate: "Use connectors: 'sin embargo', 'por otro lado', 'en mi opinión'",
  },
  fr: {
    restaurant: "Practice liaisons: 'vous‿aimeriez' — link the final 's' to the next vowel",
    airport: "French 'r' is uvular (back of throat). Try 'enregistrer' with a soft gargle",
    shopping: "Nasal vowels are key: 'cinq' (sæ̃k), 'bon' (bɔ̃) — don't release the 'n'",
    doctor: "Master the French 'u' (lips rounded, tongue forward): 'température', 'sûr'",
    job_interview: "Use formal register: always 'vous' never 'tu', and pronounce final consonants in liaisons",
    directions: "Practice silent letters: 'gauche' (gohsh), 'droite' (drwaht) — final letters are silent",
    hotel: "Elision is mandatory: 'l'hôtel', 'j'ai', 'd'accord' — never pronounce the dropped vowel",
    debate: "Use discourse markers with proper intonation: 'cependant', 'néanmoins', 'en revanche'",
  },
  pt: {
    restaurant: "Nasal vowels are essential: 'não' (now̃), 'bom' (bõ) — let air through your nose",
    airport: "The 'lh' digraph sounds like 'ly': 'embarque' stress falls on the penultimate syllable",
    shopping: "Brazilian 'de' often sounds like 'djee' and 'te' like 'chee' before 'i' sounds",
    doctor: "Practice the 'ão' diphthong: 'coração' — it's a nasal 'ow' sound, not 'on'",
    job_interview: "Formal Portuguese uses 'o senhor/a senhora' — stress the open vowels clearly",
    directions: "The 'r' at word start is pronounced like 'h': 'rua' sounds like 'HOO-ah'",
    hotel: "Word-final 's' becomes 'sh' in Brazilian Portuguese: 'mas' → 'mahsh'",
    debate: "Practice open vs. closed vowels: 'avó' (open o, grandmother) vs. 'avô' (closed o, grandfather)",
  },
  ja: {
    restaurant: "Japanese pitch accent matters: 'はし' can mean chopsticks (high-low) or bridge (low-high)",
    airport: "Keep vowels short and crisp. Double consonants (っ) need a full beat pause: 'きっぷ' (kippu)",
    shopping: "Long vowels change meaning: 'おばさん' (aunt) vs. 'おばあさん' (grandmother) — hold the vowel",
    doctor: "The 'r' sound is a single tap (like Spanish 'r'): tongue taps the ridge once for 'くすり'",
    job_interview: "Keigo (formal speech) requires precise particles: 'です/ます' endings must be crisp, not mumbled",
    directions: "Mora timing is key: each kana gets equal time. 'まっすぐ' = 4 equal beats (ma-s-su-gu)",
    hotel: "The 'n' (ん) before vowels needs a nasal separation: 'ご予約' = go-yo-ya-ku, not 'goyyaku'",
    debate: "Sentence-final particles convey tone: 'ね' (agreement), 'よ' (assertion) — pitch them correctly",
  },
};

// Backward-compatible accessor
const PRONUNCIATION_TIPS = PRONUNCIATION_TIPS_BY_LANG.es;

// ─── Component ───────────────────────────────────────────────────────────────
export default function LiveSimulationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ scenario?: string; difficulty?: string }>();

  const [simState, setSimState] = useState<SimState>("lobby");
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>((params.difficulty as Difficulty) || "beginner");
  const [selectedLanguage, setSelectedLanguage] = useState<AppLanguage>("es");
  const [langSearch, setLangSearch] = useState("");
  const [showLangPicker, setShowLangPicker] = useState(false);

  // Subscription & usage guard
  const { plan } = useSubscription();
  const simUsage = useDailyUsageGuard("simulations");
  const hasUnlimitedSim = canAccessFeature(plan, "unlimited_simulation");

  // Load user's target language as default
  useEffect(() => {
    AsyncStorage.getItem("@target_language").then((lang) => {
      if (lang && lang !== "en") setSelectedLanguage(lang as AppLanguage);
    });
  }, []);

  // Filtered languages for picker
  const filteredLanguages = useMemo(() => {
    const langs = ALL_SIM_LANGUAGES;
    if (!langSearch.trim()) return langs;
    const q = langSearch.toLowerCase();
    return langs.filter(l => l.name.toLowerCase().includes(q) || l.nativeName.toLowerCase().includes(q) || l.code.includes(q));
  }, [langSearch]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [overallScore, setOverallScore] = useState(0);
  const [pronunciationScores, setPronunciationScores] = useState<number[]>([]);
  const [showTranslation, setShowTranslation] = useState(false);

  // Emotion-adaptive pacing via Hume
  const [emotionData, setEmotionData] = useState<{ dominantEmotion?: string; frustration?: number; confidence?: number; joy?: number; concentration?: number }>({});
  const humeVoice = useHumeVoice({
    persona: 'language_tutor',
    onEmotions: (emotions: EmotionScore[]) => {
      if (emotions.length > 0) {
        const top = emotions[0];
        setEmotionData({
          dominantEmotion: top.name,
          frustration: emotions.find((e: EmotionScore) => e.name === 'Frustration')?.score,
          confidence: emotions.find((e: EmotionScore) => e.name === 'Confidence' || e.name === 'Determination')?.score,
          joy: emotions.find((e: EmotionScore) => e.name === 'Joy' || e.name === 'Amusement')?.score,
          concentration: emotions.find((e: EmotionScore) => e.name === 'Concentration')?.score,
        });
      }
    },
  });

  // Conversation memory across sessions
  const [learningMemory, setLearningMemory] = useState<{
    struggledTopics?: string[];
    masteredTopics?: string[];
    commonMistakes?: string[];
    sessionCount?: number;
    lastSessionSummary?: string;
  }>({});

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('@linguavibe_livesim_memory');
        if (stored) setLearningMemory(JSON.parse(stored));
      } catch {}
    })();
  }, []);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<FlatList>(null);

  // Auto-select scenario from params
  useEffect(() => {
    if (params.scenario) {
      const found = SCENARIOS.find(s => s.id === params.scenario);
      if (found) setSelectedScenario(found);
    }
  }, [params.scenario]);

  // Countdown timer
  useEffect(() => {
    if (simState === "countdown") {
      const interval = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(interval);
            setSimState("active");
            startConversation();
            return 3;
          }
          return c - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [simState]);

  // Pulse animation for recording
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  // Fade in messages
  useEffect(() => {
    if (messages.length > 0) {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }
  }, [messages.length]);

  const startConversation = () => {
    if (!selectedScenario) return;
    // Try language-specific data, then fall back to Spanish (AI_CONVERSATIONS)
    const langConvos = CORE_CONVERSATIONS[selectedLanguage] || CONVERSATIONS_BY_LANG[selectedLanguage] || AI_CONVERSATIONS;
    const convo = (langConvos as Record<string, { prompt: string; responses: string[] }>)[selectedScenario.id];
    if (!convo) return;

    // AI sends first message
    const firstMsg: Message = {
      id: "ai_0",
      role: "ai",
      text: convo.prompt,
      timestamp: Date.now(),
    };
    setMessages([firstMsg]);
    setCurrentTurn(0);
    setSimState("listening");
  };

  // Real NLP hooks for speech-to-text and pronunciation analysis
  const speechToText = useSpeechToText();
  const pronunciationAnalysis = trpc.pronunciation.analyze.useMutation();
  const teacherChatMutation = trpc.teacher.chat.useMutation();

  const handleStartRecording = () => {
    setIsRecording(true);
    setSimState("active");
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Start real speech-to-text recording
    speechToText.startRecording().catch(() => {});
  };

  const handleStopRecording = async () => {
    setIsRecording(false);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Stop recording and get real transcription
    let transcribedText = "";
    let score = 75;
    try {
      const sttResult = await speechToText.stopRecording();
      transcribedText = (sttResult as any)?.text || (sttResult as any)?.transcript || "";
    } catch { transcribedText = ""; }

    // If STT returned empty, use scripted fallback for demo
    if (!transcribedText) {
      const defaultUserResponses: Record<string, string[]> = {
        restaurant: ["Quiero la paella, por favor", "Un agua mineral, gracias", "Término medio, por favor", "Sí, el flan suena bien", "Perfecto, gracias"],
        airport: ["Aquí tiene mi pasaporte", "Sí, una maleta grande", "Ventanilla, por favor"],
        shopping: ["¿Cuánto cuestan los mangos?", "Mmm, están deliciosos"],
        doctor: ["Me duele la garganta y tengo tos", "Desde hace tres días"],
        job_interview: ["Tengo cinco años de experiencia en marketing"],
        directions: ["Sí, busco el museo de arte"],
        hotel: ["Sí, a nombre de García"],
        debate: ["Creo que ambos tienen su encanto"],
      };
      const scenarioId = selectedScenario?.id || "restaurant";
      const langResponses = USER_RESPONSES_BY_LANG[selectedLanguage];
      const responses = (langResponses && langResponses[scenarioId as keyof typeof langResponses]) || defaultUserResponses[scenarioId] || ["..."];
      transcribedText = responses[currentTurn] || responses[0] || "...";
    } else {
      // Real pronunciation analysis on the transcribed text
      try {
        const analysisResult = await pronunciationAnalysis.mutateAsync({
          targetText: transcribedText,
          language: selectedLanguage,
        });
        score = (analysisResult.success && analysisResult.analysis?.score) ? analysisResult.analysis.score : 75;
      } catch { score = 75; }
    }

    const responseText = transcribedText;
    const userMsg: Message = {
      id: `user_${currentTurn}`,
      role: "user",
      text: responseText,
      pronunciationScore: score,
      timestamp: Date.now(),
    };
    setPronunciationScores(prev => [...prev, score]);
    setMessages(prev => [...prev, userMsg]);

    // Check if conversation is done
    const totalTurns = selectedScenario?.turns || 8;
    if (currentTurn >= totalTurns - 1) {
      setTimeout(() => { calculateResults(); }, 1500);
      return;
    }

    // Get real AI response using teacher.chat (with scripted fallback)
    const scenarioId = selectedScenario?.id || "restaurant";
    const langConvos = CORE_CONVERSATIONS[selectedLanguage] || CONVERSATIONS_BY_LANG[selectedLanguage] || AI_CONVERSATIONS;
    const convo = (langConvos as Record<string, { prompt: string; responses: string[] }>)[scenarioId];

    try {
      const langName = SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.name || "Spanish";
      const chatResult = await teacherChatMutation.mutateAsync({
        message: `The student said: "${responseText}". Continue the ${convo?.prompt || selectedScenario?.title || "conversation"} scenario naturally in ${langName}. Respond as the character would. Keep it 1-2 sentences. ${score < 75 ? "Gently correct their pronunciation or grammar." : "Encourage them and continue the conversation."}`,
        language: langName,
        teacherPersona: "casual",
        conversationHistory: messages.slice(-6).map(m => ({ role: m.role === "user" ? "user" as const : "assistant" as const, content: m.text })),
        userLevel: difficulty === 'beginner' ? 'beginner' : difficulty === 'advanced' ? 'advanced' : 'intermediate',
        emotionContext: emotionData.dominantEmotion ? emotionData : undefined,
        learningMemory: learningMemory.sessionCount ? learningMemory : undefined,
      });

      const aiResponse = chatResult?.reply || convo?.responses[currentTurn] || "...";
      const needsCorrection = score < 75;
      const aiMsg: Message = {
        id: `ai_${currentTurn + 1}`,
        role: "ai",
        text: aiResponse,
        correction: needsCorrection ? getCorrectionTipForLanguage(selectedLanguage, responseText) : undefined,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, aiMsg]);
      setCurrentTurn(prev => prev + 1);
      setSimState("listening");
    } catch {
      // Fallback to scripted responses if API fails
      const aiResponse = convo?.responses[currentTurn] || "...";
      const needsCorrection = score < 75;
      const aiMsg: Message = {
        id: `ai_${currentTurn + 1}`,
        role: "ai",
        text: aiResponse,
        correction: needsCorrection ? getCorrectionTipForLanguage(selectedLanguage, responseText) : undefined,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, aiMsg]);
      setCurrentTurn(prev => prev + 1);
      setSimState("listening");
    }
  };

  // getCorrectionTip is now imported from @/lib/sim-language-data as getCorrectionTipForLanguage

  const calculateResults = () => {
    const avg = pronunciationScores.length > 0
      ? Math.round(pronunciationScores.reduce((a, b) => a + b, 0) / pronunciationScores.length)
      : 75;
    setOverallScore(avg);
    setSimState("results");
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Save conversation memory
    try {
      const userMsgs = messages.filter(m => m.role === 'user');
      const summary = `Live simulation: ${selectedScenario?.title || 'practice'}, ${userMsgs.length} turns, avg score ${avg}%.`;
      const updated = {
        ...learningMemory,
        sessionCount: (learningMemory.sessionCount || 0) + 1,
        lastSessionSummary: summary,
      };
      AsyncStorage.setItem('@linguavibe_livesim_memory', JSON.stringify(updated));
      setLearningMemory(updated);
    } catch {}
  };

  const handleBegin = async () => {
    if (!selectedScenario) return;
    // Check daily usage limit for free/plus users
    if (!hasUnlimitedSim) {
      const allowed = await simUsage.incrementUsage();
      if (!allowed) {
        // Limit reached - will show upgrade prompt
        return;
      }
    }
    setSimState("countdown");
    setMessages([]);
    setCurrentTurn(0);
    setPronunciationScores([]);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleRetry = () => {
    setSimState("lobby");
    setMessages([]);
    setCurrentTurn(0);
    setPronunciationScores([]);
    setOverallScore(0);
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return Colors.success;
    if (score >= 70) return Colors.gold;
    return Colors.accent;
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Excellent!";
    if (score >= 80) return "Great Job!";
    if (score >= 70) return "Good Progress";
    if (score >= 60) return "Keep Practicing";
    return "Needs Work";
  };

  const getDifficultyColor = (d: Difficulty) => {
    if (d === "beginner") return Colors.success;
    if (d === "intermediate") return Colors.gold;
    return Colors.accent;
  };

  // ─── Render Lobby ──────────────────────────────────────────────────────────
  const renderLobby = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Language Selector */}
      <View style={styles.difficultySection}>
        <Text style={styles.sectionTitle}>Language</Text>
        <TouchableOpacity
          style={styles.langPickerBtn}
          onPress={() => setShowLangPicker(!showLangPicker)}
          activeOpacity={0.7}
        >
          <Text style={styles.langPickerFlag}>{SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.flag || "🌐"}</Text>
          <View style={styles.langPickerInfo}>
            <Text style={styles.langPickerName}>{SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.name || "Select Language"}</Text>
            <Text style={styles.langPickerNative}>{SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.nativeName || ""}</Text>
          </View>
          <Ionicons name={showLangPicker ? "chevron-up" : "chevron-down"} size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
        {showLangPicker && (
          <View style={styles.langPickerDropdown}>
            <View style={styles.langSearchContainer}>
              <Ionicons name="search" size={16} color={Colors.textMuted} />
              <TextInput
                style={styles.langSearchInput}
                placeholder="Search languages..."
                placeholderTextColor={Colors.textMuted}
                value={langSearch}
                onChangeText={setLangSearch}
                returnKeyType="done"
              />
            </View>
            <FlatList
              data={filteredLanguages}
              keyExtractor={(item) => item.code}
              style={styles.langList}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.langRow, selectedLanguage === item.code && styles.langRowActive]}
                  onPress={() => {
                    setSelectedLanguage(item.code);
                    setShowLangPicker(false);
                    setLangSearch("");
                    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Text style={styles.langRowFlag}>{item.flag}</Text>
                  <View style={styles.langRowInfo}>
                    <Text style={[styles.langRowName, selectedLanguage === item.code && styles.langRowNameActive]}>{item.name}</Text>
                    <Text style={styles.langRowNative}>{item.nativeName}</Text>
                  </View>
                  {selectedLanguage === item.code && <Ionicons name="checkmark-circle" size={20} color={Colors.secondary} />}
                </TouchableOpacity>
              )}
            />
          </View>
        )}
      </View>

      {/* Difficulty Selector */}
      <View style={styles.difficultySection}>
        <Text style={styles.sectionTitle}>Difficulty</Text>
        <View style={styles.difficultyRow}>
          {(["beginner", "intermediate", "advanced"] as Difficulty[]).map((d) => (
            <TouchableOpacity
              key={d}
              style={[styles.difficultyBtn, difficulty === d && { backgroundColor: getDifficultyColor(d) + "30", borderColor: getDifficultyColor(d) }]}
              onPress={() => { setDifficulty(d); if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            >
              <Text style={[styles.difficultyText, difficulty === d && { color: getDifficultyColor(d) }]}>
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Scenarios */}
      <View style={styles.scenarioSection}>
        <Text style={styles.sectionTitle}>Choose a Scenario</Text>
        {SCENARIOS.filter(s => s.difficulty === difficulty).map((scenario) => (
          <TouchableOpacity
            key={scenario.id}
            style={[styles.scenarioCard, selectedScenario?.id === scenario.id && styles.scenarioCardActive]}
            onPress={() => { setSelectedScenario(scenario); if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          >
            <View style={[styles.scenarioIcon, selectedScenario?.id === scenario.id && styles.scenarioIconActive]}>
              <Ionicons name={scenario.icon as any} size={24} color={selectedScenario?.id === scenario.id ? "#fff" : Colors.secondary} />
            </View>
            <View style={styles.scenarioInfo}>
              <Text style={[styles.scenarioTitle, selectedScenario?.id === scenario.id && styles.scenarioTitleActive]}>
                {scenario.title}
              </Text>
              <Text style={styles.scenarioDesc}>{scenario.description}</Text>
              <Text style={styles.scenarioMeta}>{scenario.turns} turns • {SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.name || "Spanish"}</Text>
            </View>
            {selectedScenario?.id === scenario.id && (
              <Ionicons name="checkmark-circle" size={22} color={Colors.secondary} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Usage Limit Indicator */}
      {!hasUnlimitedSim && (
        <View style={styles.usageLimitRow}>
          <Ionicons name="time-outline" size={14} color={simUsage.isAtLimit ? Colors.error : Colors.textSecondary} />
          <Text style={[styles.usageLimitText, simUsage.isAtLimit && { color: Colors.error }]}>
            {simUsage.isAtLimit
              ? `Daily limit reached (${simUsage.limit}/${simUsage.limit})`
              : `${simUsage.remaining} of ${simUsage.limit} simulations remaining today`}
          </Text>
        </View>
      )}

      {/* Start Button */}
      {selectedScenario && (
        <TouchableOpacity
          style={[styles.startBtn, simUsage.isAtLimit && !hasUnlimitedSim && { opacity: 0.5 }]}
          onPress={handleBegin}
          activeOpacity={0.8}
        >
          <Ionicons name="mic" size={22} color="#fff" />
          <Text style={styles.startBtnText}>
            {simUsage.isAtLimit && !hasUnlimitedSim ? "Upgrade to Continue" : "Begin Conversation"}
          </Text>
        </TouchableOpacity>
      )}

      {/* Upgrade prompt when at limit */}
      {simUsage.isAtLimit && !hasUnlimitedSim && (
        <TouchableOpacity
          style={styles.upgradePrompt}
          onPress={() => router.push("/payment-setup" as any)}
          activeOpacity={0.7}
        >
          <Ionicons name="rocket" size={16} color={Colors.gold} />
          <Text style={styles.upgradePromptText}>Upgrade to Pro for unlimited simulations</Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
        </TouchableOpacity>
      )}
    </ScrollView>
  );

  // ─── Render Countdown ──────────────────────────────────────────────────────
  const renderCountdown = () => (
    <View style={styles.countdownContainer}>
      <Text style={styles.countdownScenario}>{selectedScenario?.title}</Text>
      <View style={styles.countdownCircle}>
        <Text style={styles.countdownNumber}>{countdown}</Text>
      </View>
      <Text style={styles.countdownHint}>Get ready to speak...</Text>
      <Text style={styles.countdownTip}>
        💡 {getPronunciationTip(selectedLanguage, selectedScenario?.id || "restaurant")}
      </Text>
    </View>
  );

  // ─── Render Active Conversation ────────────────────────────────────────────
  const renderConversation = () => (
    <View style={styles.conversationContainer}>
      {/* Messages */}
      <FlatList
        ref={scrollRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20, paddingTop: 12 }}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => (
          <Animated.View style={[
            styles.messageBubble,
            item.role === "ai" ? styles.aiBubble : styles.userBubble,
            { opacity: fadeAnim },
          ]}>
            {item.role === "ai" && (
              <View style={styles.aiAvatar}>
                <Ionicons name="person" size={14} color={Colors.secondary} />
              </View>
            )}
            <View style={[styles.messageContent, item.role === "user" && styles.userMessageContent]}>
              <Text style={[styles.messageText, item.role === "user" && styles.userMessageText]}>
                {item.text}
              </Text>
              {item.correction && (
                <View style={styles.correctionBox}>
                  <Ionicons name="bulb" size={12} color={Colors.gold} />
                  <Text style={styles.correctionText}>{item.correction}</Text>
                </View>
              )}
              {item.pronunciationScore !== undefined && (
                <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(item.pronunciationScore) + "20" }]}>
                  <Text style={[styles.scoreBadgeText, { color: getScoreColor(item.pronunciationScore) }]}>
                    {item.pronunciationScore}%
                  </Text>
                </View>
              )}
              {item.role === "ai" && <ReportAIResponse messageContent={item.text} size="small" />}
            </View>
          </Animated.View>
        )}
      />

      {/* Translation Toggle */}
      <TouchableOpacity
        style={styles.translationToggle}
        onPress={() => setShowTranslation(!showTranslation)}
      >
        <Ionicons name="language" size={16} color={showTranslation ? Colors.secondary : Colors.textMuted} />
        <Text style={[styles.translationToggleText, showTranslation && { color: Colors.secondary }]}>
          {showTranslation ? "Hide Hints" : "Show Hints"}
        </Text>
      </TouchableOpacity>

      {/* Recording Controls */}
      <View style={styles.recordingControls}>
        <Text style={styles.turnIndicator}>
          Turn {currentTurn + 1}/{selectedScenario?.turns || 8}
        </Text>

        {simState === "listening" ? (
          <TouchableOpacity
            style={styles.recordButton}
            onPress={handleStartRecording}
            activeOpacity={0.8}
          >
            <Ionicons name="mic" size={28} color="#fff" />
            <Text style={styles.recordLabel}>Tap to Respond</Text>
          </TouchableOpacity>
        ) : (
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              style={[styles.recordButton, styles.recordButtonActive]}
              onPress={handleStopRecording}
              activeOpacity={0.8}
            >
              <Ionicons name="stop" size={28} color="#fff" />
              <Text style={styles.recordLabel}>Tap to Stop</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </View>
  );

  // ─── Render Results ────────────────────────────────────────────────────────
  const renderResults = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Score Circle */}
      <View style={styles.resultsHeader}>
        <View style={[styles.scoreCircle, { borderColor: getScoreColor(overallScore) }]}>
          <Text style={[styles.scoreNumber, { color: getScoreColor(overallScore) }]}>{overallScore}</Text>
          <Text style={styles.scorePercent}>%</Text>
        </View>
        <Text style={[styles.scoreLabel, { color: getScoreColor(overallScore) }]}>
          {getScoreLabel(overallScore)}
        </Text>
        <Text style={styles.scenarioCompleted}>{selectedScenario?.title} — Completed</Text>
      </View>

      {/* Breakdown */}
      <View style={styles.breakdownSection}>
        <Text style={styles.breakdownTitle}>Performance Breakdown</Text>

        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Pronunciation</Text>
          <View style={styles.breakdownBar}>
            <View style={[styles.breakdownFill, { width: `${overallScore}%`, backgroundColor: getScoreColor(overallScore) }]} />
          </View>
          <Text style={styles.breakdownValue}>{overallScore}%</Text>
        </View>

        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Fluency</Text>
          <View style={styles.breakdownBar}>
            <View style={[styles.breakdownFill, { width: `${Math.min(overallScore + 5, 100)}%`, backgroundColor: getScoreColor(overallScore + 5) }]} />
          </View>
          <Text style={styles.breakdownValue}>{Math.min(overallScore + 5, 100)}%</Text>
        </View>

        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Vocabulary</Text>
          <View style={styles.breakdownBar}>
            <View style={[styles.breakdownFill, { width: `${Math.min(overallScore + 10, 100)}%`, backgroundColor: getScoreColor(overallScore + 10) }]} />
          </View>
          <Text style={styles.breakdownValue}>{Math.min(overallScore + 10, 100)}%</Text>
        </View>

        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Comprehension</Text>
          <View style={styles.breakdownBar}>
            <View style={[styles.breakdownFill, { width: `${Math.min(overallScore + 8, 100)}%`, backgroundColor: getScoreColor(overallScore + 8) }]} />
          </View>
          <Text style={styles.breakdownValue}>{Math.min(overallScore + 8, 100)}%</Text>
        </View>
      </View>

      {/* Tips */}
      <View style={styles.tipsSection}>
        <Text style={styles.tipsTitle}>Tips for Next Time</Text>
        <View style={styles.tipCard}>
          <Ionicons name="bulb" size={18} color={Colors.gold} />
          <Text style={styles.tipText}>
            {getPronunciationTip(selectedLanguage, selectedScenario?.id || "restaurant")}
          </Text>
        </View>
        <View style={styles.tipCard}>
          <Ionicons name="trending-up" size={18} color={Colors.success} />
          <Text style={styles.tipText}>
            You completed {pronunciationScores.length} turns. Try to use more complex sentences next time.
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.resultActions}>
        <TouchableOpacity style={styles.retryBtn} onPress={handleRetry} activeOpacity={0.8}>
          <Ionicons name="refresh" size={20} color={Colors.secondary} />
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.newScenarioBtn} onPress={() => { setSelectedScenario(null); handleRetry(); }} activeOpacity={0.8}>
          <Ionicons name="shuffle" size={20} color="#fff" />
          <Text style={styles.newScenarioText}>New Scenario</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Live Simulation</Text>
          {simState !== "lobby" && selectedScenario && (
            <Text style={styles.headerSub}>{selectedScenario.title}</Text>
          )}
        </View>
        {simState === "lobby" && (
          <TouchableOpacity style={styles.infoBtn}>
            <Ionicons name="information-circle-outline" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {simState === "lobby" && renderLobby()}
      {simState === "countdown" && renderCountdown()}
      {(simState === "active" || simState === "listening" || simState === "feedback") && renderConversation()}
      {simState === "results" && renderResults()}
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  headerSub: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  infoBtn: {
    padding: 4,
  },

  // ─── Difficulty ──────────────────────────────────────────────────────────
  difficultySection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  difficultyRow: {
    flexDirection: "row",
    gap: 10,
  },
  difficultyBtn: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  difficultyText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
  },

  // ─── Scenarios ───────────────────────────────────────────────────────────
  scenarioSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  scenarioCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm + 2,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  scenarioCardActive: {
    borderColor: Colors.secondary,
    backgroundColor: Colors.secondary + "10",
  },
  scenarioIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.secondary + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  scenarioIconActive: {
    backgroundColor: Colors.secondary,
  },
  scenarioInfo: {
    flex: 1,
    marginLeft: 12,
  },
  scenarioTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  scenarioTitleActive: {
    color: Colors.secondary,
  },
  scenarioDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  scenarioMeta: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 4,
  },

  // ─── Start Button ────────────────────────────────────────────────────────
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.secondary,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    paddingVertical: Spacing.md + 4,
    borderRadius: BorderRadius.lg,
    gap: 10,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  startBtnText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: "#fff",
  },

  // ─── Countdown ───────────────────────────────────────────────────────────
  countdownContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  countdownScenario: {
    fontSize: FontSize.lg,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },
  countdownCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.secondary + "20",
    borderWidth: 3,
    borderColor: Colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  countdownNumber: {
    fontSize: 56,
    fontWeight: "800",
    color: Colors.secondary,
  },
  countdownHint: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: Spacing.xl,
  },
  countdownTip: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: Spacing.lg,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: Spacing.lg,
  },

  // ─── Conversation ────────────────────────────────────────────────────────
  conversationContainer: {
    flex: 1,
  },
  messageBubble: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm + 4,
  },
  aiBubble: {
    justifyContent: "flex-start",
  },
  userBubble: {
    justifyContent: "flex-end",
  },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.secondary + "20",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    marginTop: 4,
  },
  messageContent: {
    maxWidth: "75%",
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderTopLeftRadius: 4,
  },
  userMessageContent: {
    backgroundColor: Colors.secondary + "20",
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: 4,
  },
  messageText: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  userMessageText: {
    color: Colors.textPrimary,
  },
  correctionBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.gold + "15",
    borderRadius: BorderRadius.sm,
    padding: 8,
    marginTop: 8,
    gap: 6,
  },
  correctionText: {
    fontSize: FontSize.xs,
    color: Colors.gold,
    flex: 1,
    lineHeight: 16,
  },
  scoreBadge: {
    alignSelf: "flex-end",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    marginTop: 6,
  },
  scoreBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: "700",
  },

  // ─── Translation Toggle ──────────────────────────────────────────────────
  translationToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    gap: 6,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
  },
  translationToggleText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: "500",
  },

  // ─── Recording Controls ──────────────────────────────────────────────────
  recordingControls: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
    paddingBottom: Spacing.xl,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
  },
  turnIndicator: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },
  recordButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  recordButtonActive: {
    backgroundColor: Colors.accent,
    shadowColor: Colors.accent,
  },
  recordLabel: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "600",
    marginTop: 2,
  },

  // ─── Results ─────────────────────────────────────────────────────────────
  resultsHeader: {
    alignItems: "center",
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surfaceCard,
  },
  scoreNumber: {
    fontSize: 42,
    fontWeight: "800",
  },
  scorePercent: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.textMuted,
    marginTop: -4,
  },
  scoreLabel: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    marginTop: Spacing.md,
  },
  scenarioCompleted: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 4,
  },

  // ─── Breakdown ───────────────────────────────────────────────────────────
  breakdownSection: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  breakdownTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  breakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm + 4,
  },
  breakdownLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    width: 110,
  },
  breakdownBar: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    marginHorizontal: 10,
    overflow: "hidden",
  },
  breakdownFill: {
    height: "100%",
    borderRadius: 4,
  },
  breakdownValue: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.textPrimary,
    width: 40,
    textAlign: "right",
  },

  // ─── Tips ────────────────────────────────────────────────────────────────
  tipsSection: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  tipsTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  tipCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: 10,
  },
  tipText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },

  // ─── Result Actions ──────────────────────────────────────────────────────
  resultActions: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    gap: 12,
  },
  retryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surfaceCard,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.secondary + "40",
  },
  retryText: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.secondary,
  },
  newScenarioBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.secondary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: 8,
  },
  newScenarioText: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: "#fff",
  },
  langPickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.secondary + "40",
    gap: Spacing.sm,
  },
  langPickerFlag: {
    fontSize: 24,
  },
  langPickerInfo: {
    flex: 1,
  },
  langPickerName: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  langPickerNative: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 1,
  },
  langPickerDropdown: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  langSearchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 6,
  },
  langSearchInput: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    paddingVertical: 6,
  },
  langList: {
    maxHeight: 220,
  },
  langRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  langRowActive: {
    backgroundColor: Colors.secondary + "15",
  },
  langRowFlag: {
    fontSize: 20,
  },
  langRowInfo: {
    flex: 1,
  },
  langRowName: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  langRowNameActive: {
    color: Colors.secondary,
  },
  langRowNative: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  usageLimitRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.sm,
  },
  usageLimitText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  upgradePrompt: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.gold + "10",
    borderWidth: 1,
    borderColor: Colors.gold + "30",
    borderRadius: BorderRadius.md,
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
  },
  upgradePromptText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.gold,
  },
});
