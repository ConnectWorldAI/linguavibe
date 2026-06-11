/**
 * French Word Bank for Pronunciation Duels
 *
 * Categories: ABCs, Numbers, Adjectives, Verb Tenses (present/past/future)
 * Each word includes phonetic transcription and English translation.
 */
import type { DuelWord } from "@/lib/pronunciation-duel";

export const FRENCH_WORD_BANK: Record<string, DuelWord[]> = {
  abcs: [
    { id: "fr_abc1", text: "Bonjour", phonetic: "/bɔ̃.ʒuʁ/", translation: "Hello", language: "French", category: "abcs", difficulty: "easy" },
    { id: "fr_abc2", text: "Merci", phonetic: "/mɛʁ.si/", translation: "Thank you", language: "French", category: "abcs", difficulty: "easy" },
    { id: "fr_abc3", text: "Bibliothèque", phonetic: "/bi.bli.ɔ.tɛk/", translation: "Library", language: "French", category: "abcs", difficulty: "medium" },
    { id: "fr_abc4", text: "Papillon", phonetic: "/pa.pi.jɔ̃/", translation: "Butterfly", language: "French", category: "abcs", difficulty: "medium" },
    { id: "fr_abc5", text: "Chrysanthème", phonetic: "/kʁi.zɑ̃.tɛm/", translation: "Chrysanthemum", language: "French", category: "abcs", difficulty: "hard" },
    { id: "fr_abc6", text: "Anticonstitutionnellement", phonetic: "/ɑ̃.ti.kɔ̃.sti.ty.sjɔ.nɛl.mɑ̃/", translation: "Unconstitutionally", language: "French", category: "abcs", difficulty: "hard" },
    { id: "fr_abc7", text: "Croissant", phonetic: "/kʁwa.sɑ̃/", translation: "Crescent/Croissant", language: "French", category: "abcs", difficulty: "easy" },
    { id: "fr_abc8", text: "Grenouille", phonetic: "/ɡʁə.nuj/", translation: "Frog", language: "French", category: "abcs", difficulty: "medium" },
    { id: "fr_abc9", text: "Écureuil", phonetic: "/e.ky.ʁœj/", translation: "Squirrel", language: "French", category: "abcs", difficulty: "hard" },
    { id: "fr_abc10", text: "Restaurant", phonetic: "/ʁɛs.to.ʁɑ̃/", translation: "Restaurant", language: "French", category: "abcs", difficulty: "easy" },
  ],
  numbers: [
    { id: "fr_num1", text: "Un", phonetic: "/œ̃/", translation: "One", language: "French", category: "numbers", difficulty: "easy" },
    { id: "fr_num2", text: "Deux", phonetic: "/dø/", translation: "Two", language: "French", category: "numbers", difficulty: "easy" },
    { id: "fr_num3", text: "Trois", phonetic: "/tʁwa/", translation: "Three", language: "French", category: "numbers", difficulty: "easy" },
    { id: "fr_num4", text: "Vingt-et-un", phonetic: "/vɛ̃.te.œ̃/", translation: "Twenty-one", language: "French", category: "numbers", difficulty: "medium" },
    { id: "fr_num5", text: "Soixante-dix", phonetic: "/swa.sɑ̃t.dis/", translation: "Seventy", language: "French", category: "numbers", difficulty: "medium" },
    { id: "fr_num6", text: "Quatre-vingts", phonetic: "/ka.tʁə.vɛ̃/", translation: "Eighty", language: "French", category: "numbers", difficulty: "medium" },
    { id: "fr_num7", text: "Quatre-vingt-dix-neuf", phonetic: "/ka.tʁə.vɛ̃.dis.nœf/", translation: "Ninety-nine", language: "French", category: "numbers", difficulty: "hard" },
    { id: "fr_num8", text: "Mille", phonetic: "/mil/", translation: "One thousand", language: "French", category: "numbers", difficulty: "easy" },
    { id: "fr_num9", text: "Cent cinquante-trois", phonetic: "/sɑ̃ sɛ̃.kɑ̃t.tʁwa/", translation: "One hundred fifty-three", language: "French", category: "numbers", difficulty: "hard" },
    { id: "fr_num10", text: "Douze", phonetic: "/duz/", translation: "Twelve", language: "French", category: "numbers", difficulty: "easy" },
  ],
  adjectives: [
    { id: "fr_adj1", text: "Magnifique", phonetic: "/ma.ɲi.fik/", translation: "Magnificent", language: "French", category: "adjectives", difficulty: "easy" },
    { id: "fr_adj2", text: "Extraordinaire", phonetic: "/ɛks.tʁa.ɔʁ.di.nɛʁ/", translation: "Extraordinary", language: "French", category: "adjectives", difficulty: "medium" },
    { id: "fr_adj3", text: "Chaleureux", phonetic: "/ʃa.lø.ʁø/", translation: "Warm/Friendly", language: "French", category: "adjectives", difficulty: "medium" },
    { id: "fr_adj4", text: "Invraisemblable", phonetic: "/ɛ̃.vʁɛ.sɑ̃.blabl/", translation: "Unbelievable", language: "French", category: "adjectives", difficulty: "hard" },
    { id: "fr_adj5", text: "Merveilleux", phonetic: "/mɛʁ.vɛ.jø/", translation: "Marvelous", language: "French", category: "adjectives", difficulty: "medium" },
    { id: "fr_adj6", text: "Épouvantable", phonetic: "/e.pu.vɑ̃.tabl/", translation: "Dreadful", language: "French", category: "adjectives", difficulty: "hard" },
    { id: "fr_adj7", text: "Délicieux", phonetic: "/de.li.sjø/", translation: "Delicious", language: "French", category: "adjectives", difficulty: "easy" },
    { id: "fr_adj8", text: "Courageux", phonetic: "/ku.ʁa.ʒø/", translation: "Courageous", language: "French", category: "adjectives", difficulty: "medium" },
    { id: "fr_adj9", text: "Incompréhensible", phonetic: "/ɛ̃.kɔ̃.pʁe.ɑ̃.sibl/", translation: "Incomprehensible", language: "French", category: "adjectives", difficulty: "hard" },
    { id: "fr_adj10", text: "Sympathique", phonetic: "/sɛ̃.pa.tik/", translation: "Nice/Likeable", language: "French", category: "adjectives", difficulty: "easy" },
  ],
  verbs_present: [
    { id: "fr_vp1", text: "Je mange", phonetic: "/ʒə mɑ̃ʒ/", translation: "I eat", language: "French", category: "verbs_present", difficulty: "easy" },
    { id: "fr_vp2", text: "Nous parlons", phonetic: "/nu paʁ.lɔ̃/", translation: "We speak", language: "French", category: "verbs_present", difficulty: "easy" },
    { id: "fr_vp3", text: "Ils comprennent", phonetic: "/il kɔ̃.pʁɛn/", translation: "They understand", language: "French", category: "verbs_present", difficulty: "medium" },
    { id: "fr_vp4", text: "Elle réfléchit", phonetic: "/ɛl ʁe.fle.ʃi/", translation: "She reflects", language: "French", category: "verbs_present", difficulty: "medium" },
    { id: "fr_vp5", text: "Vous choisissez", phonetic: "/vu ʃwa.zi.se/", translation: "You choose", language: "French", category: "verbs_present", difficulty: "medium" },
    { id: "fr_vp6", text: "Je m'appelle", phonetic: "/ʒə ma.pɛl/", translation: "My name is", language: "French", category: "verbs_present", difficulty: "easy" },
    { id: "fr_vp7", text: "Nous nous souvenons", phonetic: "/nu nu suv.nɔ̃/", translation: "We remember", language: "French", category: "verbs_present", difficulty: "hard" },
    { id: "fr_vp8", text: "Ils acquièrent", phonetic: "/il a.kjɛʁ/", translation: "They acquire", language: "French", category: "verbs_present", difficulty: "hard" },
  ],
  verbs_past: [
    { id: "fr_vpast1", text: "J'ai mangé", phonetic: "/ʒe mɑ̃.ʒe/", translation: "I ate", language: "French", category: "verbs_past", difficulty: "easy" },
    { id: "fr_vpast2", text: "Nous avons parlé", phonetic: "/nu.z‿a.vɔ̃ paʁ.le/", translation: "We spoke", language: "French", category: "verbs_past", difficulty: "medium" },
    { id: "fr_vpast3", text: "Elle est allée", phonetic: "/ɛl ɛ.t‿a.le/", translation: "She went", language: "French", category: "verbs_past", difficulty: "medium" },
    { id: "fr_vpast4", text: "Ils ont compris", phonetic: "/il.z‿ɔ̃ kɔ̃.pʁi/", translation: "They understood", language: "French", category: "verbs_past", difficulty: "medium" },
    { id: "fr_vpast5", text: "J'avais fini", phonetic: "/ʒa.vɛ fi.ni/", translation: "I had finished", language: "French", category: "verbs_past", difficulty: "hard" },
    { id: "fr_vpast6", text: "Nous étions partis", phonetic: "/nu.z‿e.tjɔ̃ paʁ.ti/", translation: "We had left", language: "French", category: "verbs_past", difficulty: "hard" },
    { id: "fr_vpast7", text: "Tu as vu", phonetic: "/ty a vy/", translation: "You saw", language: "French", category: "verbs_past", difficulty: "easy" },
    { id: "fr_vpast8", text: "Vous avez réussi", phonetic: "/vu.z‿a.ve ʁe.y.si/", translation: "You succeeded", language: "French", category: "verbs_past", difficulty: "medium" },
  ],
  verbs_future: [
    { id: "fr_vf1", text: "Je mangerai", phonetic: "/ʒə mɑ̃.ʒʁe/", translation: "I will eat", language: "French", category: "verbs_future", difficulty: "easy" },
    { id: "fr_vf2", text: "Nous parlerons", phonetic: "/nu paʁ.lʁɔ̃/", translation: "We will speak", language: "French", category: "verbs_future", difficulty: "medium" },
    { id: "fr_vf3", text: "Ils comprendront", phonetic: "/il kɔ̃.pʁɑ̃.dʁɔ̃/", translation: "They will understand", language: "French", category: "verbs_future", difficulty: "hard" },
    { id: "fr_vf4", text: "Elle réussira", phonetic: "/ɛl ʁe.y.si.ʁa/", translation: "She will succeed", language: "French", category: "verbs_future", difficulty: "medium" },
    { id: "fr_vf5", text: "Vous choisirez", phonetic: "/vu ʃwa.zi.ʁe/", translation: "You will choose", language: "French", category: "verbs_future", difficulty: "medium" },
    { id: "fr_vf6", text: "Tu seras", phonetic: "/ty sə.ʁa/", translation: "You will be", language: "French", category: "verbs_future", difficulty: "easy" },
    { id: "fr_vf7", text: "J'aurai terminé", phonetic: "/ʒo.ʁe tɛʁ.mi.ne/", translation: "I will have finished", language: "French", category: "verbs_future", difficulty: "hard" },
    { id: "fr_vf8", text: "Nous irons", phonetic: "/nu.z‿i.ʁɔ̃/", translation: "We will go", language: "French", category: "verbs_future", difficulty: "easy" },
  ],
};

export const FRENCH_TONGUE_TWISTERS: DuelWord[] = [
  { id: "fr_tt1", text: "Les chaussettes de l'archiduchesse sont-elles sèches ou archi-sèches", phonetic: "/le ʃo.sɛt də laʁ.ʃi.dy.ʃɛs sɔ̃.t‿ɛl sɛʃ u aʁ.ʃi.sɛʃ/", translation: "Are the archduchess's socks dry or very dry", language: "French", category: "mixed", difficulty: "hard" },
  { id: "fr_tt2", text: "Un chasseur sachant chasser sait chasser sans son chien", phonetic: "/œ̃ ʃa.sœʁ sa.ʃɑ̃ ʃa.se sɛ ʃa.se sɑ̃ sɔ̃ ʃjɛ̃/", translation: "A hunter who knows how to hunt can hunt without his dog", language: "French", category: "mixed", difficulty: "hard" },
  { id: "fr_tt3", text: "Si six scies scient six cyprès, six cent six scies scient six cent six cyprès", phonetic: "/si si si si si si.pʁɛ/", translation: "If six saws saw six cypresses, six hundred six saws saw six hundred six cypresses", language: "French", category: "mixed", difficulty: "hard" },
  { id: "fr_tt4", text: "Poisson sans boisson est poison", phonetic: "/pwa.sɔ̃ sɑ̃ bwa.sɔ̃ ɛ pwa.zɔ̃/", translation: "Fish without drink is poison", language: "French", category: "mixed", difficulty: "medium" },
  { id: "fr_tt5", text: "Je suis ce que je suis et si je suis ce que je suis qu'est-ce que je suis", phonetic: "/ʒə sɥi sə kə ʒə sɥi/", translation: "I am what I am and if I am what I am what am I", language: "French", category: "mixed", difficulty: "medium" },
];
