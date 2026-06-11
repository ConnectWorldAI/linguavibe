import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  Platform,
  Alert,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";
import { useUsage } from "@/lib/usage-context";
import { SongAnalysis } from "@/components/song-analysis";
import { trpc } from "@/lib/trpc";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { addToReviewQueue } from "@/lib/srs";
import { ConfettiAnimation } from "@/components/confetti-animation";
import { getDemoSong } from "@/lib/demo-songs";
import { useMusicPlayer } from "@/lib/music-player-context";
import { ShareCard } from "@/components/share-card";

const { width } = Dimensions.get("window");

type PlaybackMode = "full_mix" | "vocals_only" | "instrumental_only";
type LyricsDisplayMode = "dual" | "original" | "translation";

// ─── Synced Lyrics Data Structure (with word-level timing) ──────────────────
interface WordTiming {
  word: string;
  startTime: number; // seconds
  endTime: number;
  translation: string;
}

interface SyncedLyricLine {
  id: string;
  startTime: number; // seconds
  endTime: number;
  original: string;
  translated: string;
  words: WordTiming[];
}

// ─── Default Demo Lyrics (Despacito with word-level karaoke timing) ─────────
const DEMO_LYRICS: SyncedLyricLine[] = [
  { id: "1", startTime: 0, endTime: 4, original: "Despacito", translated: "Slowly",
    words: [{ word: "Despacito", startTime: 0, endTime: 3.5, translation: "Slowly" }] },
  { id: "2", startTime: 4, endTime: 9, original: "Quiero respirar tu cuello despacito", translated: "I want to breathe your neck slowly",
    words: [
      { word: "Quiero", startTime: 4, endTime: 4.8, translation: "I want" },
      { word: "respirar", startTime: 4.8, endTime: 5.7, translation: "to breathe" },
      { word: "tu", startTime: 5.7, endTime: 6.0, translation: "your" },
      { word: "cuello", startTime: 6.0, endTime: 6.8, translation: "neck" },
      { word: "despacito", startTime: 6.8, endTime: 8.8, translation: "slowly" },
    ] },
  { id: "3", startTime: 9, endTime: 14, original: "Deja que te diga cosas al oído", translated: "Let me whisper things in your ear",
    words: [
      { word: "Deja", startTime: 9, endTime: 9.6, translation: "Let" },
      { word: "que", startTime: 9.6, endTime: 9.9, translation: "that" },
      { word: "te", startTime: 9.9, endTime: 10.2, translation: "you" },
      { word: "diga", startTime: 10.2, endTime: 10.8, translation: "tell" },
      { word: "cosas", startTime: 10.8, endTime: 11.5, translation: "things" },
      { word: "al", startTime: 11.5, endTime: 11.8, translation: "to the" },
      { word: "oído", startTime: 11.8, endTime: 13.5, translation: "ear" },
    ] },
  { id: "4", startTime: 14, endTime: 19, original: "Para que te acuerdes si no estás conmigo", translated: "So you remember when you're not with me",
    words: [
      { word: "Para", startTime: 14, endTime: 14.4, translation: "So" },
      { word: "que", startTime: 14.4, endTime: 14.7, translation: "that" },
      { word: "te", startTime: 14.7, endTime: 14.9, translation: "you" },
      { word: "acuerdes", startTime: 14.9, endTime: 15.7, translation: "remember" },
      { word: "si", startTime: 15.7, endTime: 16.0, translation: "if" },
      { word: "no", startTime: 16.0, endTime: 16.3, translation: "not" },
      { word: "estás", startTime: 16.3, endTime: 16.9, translation: "you are" },
      { word: "conmigo", startTime: 16.9, endTime: 18.5, translation: "with me" },
    ] },
  { id: "5", startTime: 19, endTime: 24, original: "Despacito", translated: "Slowly",
    words: [{ word: "Despacito", startTime: 19, endTime: 23.5, translation: "Slowly" }] },
  { id: "6", startTime: 24, endTime: 30, original: "Quiero desnudarte a besos despacito", translated: "I want to undress you with kisses slowly",
    words: [
      { word: "Quiero", startTime: 24, endTime: 24.8, translation: "I want" },
      { word: "desnudarte", startTime: 24.8, endTime: 25.9, translation: "to undress you" },
      { word: "a", startTime: 25.9, endTime: 26.1, translation: "with" },
      { word: "besos", startTime: 26.1, endTime: 26.9, translation: "kisses" },
      { word: "despacito", startTime: 26.9, endTime: 29.5, translation: "slowly" },
    ] },
  { id: "7", startTime: 30, endTime: 36, original: "Firmar las paredes de tu laberinto", translated: "Sign the walls of your labyrinth",
    words: [
      { word: "Firmar", startTime: 30, endTime: 30.9, translation: "Sign" },
      { word: "las", startTime: 30.9, endTime: 31.2, translation: "the" },
      { word: "paredes", startTime: 31.2, endTime: 32.1, translation: "walls" },
      { word: "de", startTime: 32.1, endTime: 32.4, translation: "of" },
      { word: "tu", startTime: 32.4, endTime: 32.7, translation: "your" },
      { word: "laberinto", startTime: 32.7, endTime: 35.5, translation: "labyrinth" },
    ] },
  { id: "8", startTime: 36, endTime: 42, original: "Y hacer de tu cuerpo todo un manuscrito", translated: "And make your whole body a manuscript",
    words: [
      { word: "Y", startTime: 36, endTime: 36.3, translation: "And" },
      { word: "hacer", startTime: 36.3, endTime: 36.9, translation: "make" },
      { word: "de", startTime: 36.9, endTime: 37.1, translation: "of" },
      { word: "tu", startTime: 37.1, endTime: 37.4, translation: "your" },
      { word: "cuerpo", startTime: 37.4, endTime: 38.2, translation: "body" },
      { word: "todo", startTime: 38.2, endTime: 38.7, translation: "whole" },
      { word: "un", startTime: 38.7, endTime: 39.0, translation: "a" },
      { word: "manuscrito", startTime: 39.0, endTime: 41.5, translation: "manuscript" },
    ] },
  { id: "9", startTime: 42, endTime: 47, original: "Sube, sube, sube", translated: "Go up, go up, go up",
    words: [
      { word: "Sube", startTime: 42, endTime: 43.2, translation: "Go up" },
      { word: "sube", startTime: 43.5, endTime: 44.7, translation: "go up" },
      { word: "sube", startTime: 45.0, endTime: 46.5, translation: "go up" },
    ] },
  { id: "10", startTime: 47, endTime: 52, original: "Sube, sube", translated: "Go up, go up",
    words: [
      { word: "Sube", startTime: 47, endTime: 48.5, translation: "Go up" },
      { word: "sube", startTime: 49.0, endTime: 51.5, translation: "go up" },
    ] },
  { id: "11", startTime: 52, endTime: 58, original: "Quiero ver bailar tu pelo", translated: "I want to see your hair dance",
    words: [
      { word: "Quiero", startTime: 52, endTime: 52.8, translation: "I want" },
      { word: "ver", startTime: 52.8, endTime: 53.3, translation: "to see" },
      { word: "bailar", startTime: 53.3, endTime: 54.2, translation: "dance" },
      { word: "tu", startTime: 54.2, endTime: 54.5, translation: "your" },
      { word: "pelo", startTime: 54.5, endTime: 57.5, translation: "hair" },
    ] },
  { id: "12", startTime: 58, endTime: 64, original: "Quiero ser tu ritmo", translated: "I want to be your rhythm",
    words: [
      { word: "Quiero", startTime: 58, endTime: 58.8, translation: "I want" },
      { word: "ser", startTime: 58.8, endTime: 59.4, translation: "to be" },
      { word: "tu", startTime: 59.4, endTime: 59.7, translation: "your" },
      { word: "ritmo", startTime: 59.7, endTime: 63.5, translation: "rhythm" },
    ] },
  { id: "13", startTime: 64, endTime: 70, original: "Que le enseñes a mi boca", translated: "That you teach my mouth",
    words: [
      { word: "Que", startTime: 64, endTime: 64.4, translation: "That" },
      { word: "le", startTime: 64.4, endTime: 64.7, translation: "it" },
      { word: "enseñes", startTime: 64.7, endTime: 65.6, translation: "teach" },
      { word: "a", startTime: 65.6, endTime: 65.8, translation: "to" },
      { word: "mi", startTime: 65.8, endTime: 66.1, translation: "my" },
      { word: "boca", startTime: 66.1, endTime: 69.5, translation: "mouth" },
    ] },
  { id: "14", startTime: 70, endTime: 76, original: "Tus lugares favoritos", translated: "Your favorite places",
    words: [
      { word: "Tus", startTime: 70, endTime: 70.5, translation: "Your" },
      { word: "lugares", startTime: 70.5, endTime: 71.5, translation: "places" },
      { word: "favoritos", startTime: 71.5, endTime: 75.5, translation: "favorite" },
    ] },
  { id: "15", startTime: 76, endTime: 83, original: "Déjame sobrepasar tus zonas de peligro", translated: "Let me surpass your danger zones",
    words: [
      { word: "Déjame", startTime: 76, endTime: 76.9, translation: "Let me" },
      { word: "sobrepasar", startTime: 76.9, endTime: 78.1, translation: "surpass" },
      { word: "tus", startTime: 78.1, endTime: 78.4, translation: "your" },
      { word: "zonas", startTime: 78.4, endTime: 79.3, translation: "zones" },
      { word: "de", startTime: 79.3, endTime: 79.6, translation: "of" },
      { word: "peligro", startTime: 79.6, endTime: 82.5, translation: "danger" },
    ] },
  { id: "16", startTime: 83, endTime: 90, original: "Hasta provocar tus gritos", translated: "Until I provoke your screams",
    words: [
      { word: "Hasta", startTime: 83, endTime: 83.7, translation: "Until" },
      { word: "provocar", startTime: 83.7, endTime: 84.8, translation: "provoke" },
      { word: "tus", startTime: 84.8, endTime: 85.2, translation: "your" },
      { word: "gritos", startTime: 85.2, endTime: 89.5, translation: "screams" },
    ] },
  { id: "17", startTime: 90, endTime: 97, original: "Y que olvides tu apellido", translated: "And you forget your last name",
    words: [
      { word: "Y", startTime: 90, endTime: 90.3, translation: "And" },
      { word: "que", startTime: 90.3, endTime: 90.6, translation: "that" },
      { word: "olvides", startTime: 90.6, endTime: 91.5, translation: "forget" },
      { word: "tu", startTime: 91.5, endTime: 91.8, translation: "your" },
      { word: "apellido", startTime: 91.8, endTime: 96.5, translation: "last name" },
    ] },
  { id: "18", startTime: 97, endTime: 104, original: "Si te pido un beso, ven dámelo", translated: "If I ask for a kiss, come give it to me",
    words: [
      { word: "Si", startTime: 97, endTime: 97.3, translation: "If" },
      { word: "te", startTime: 97.3, endTime: 97.6, translation: "you" },
      { word: "pido", startTime: 97.6, endTime: 98.2, translation: "ask" },
      { word: "un", startTime: 98.2, endTime: 98.5, translation: "a" },
      { word: "beso", startTime: 98.5, endTime: 99.3, translation: "kiss" },
      { word: "ven", startTime: 99.5, endTime: 100.0, translation: "come" },
      { word: "dámelo", startTime: 100.0, endTime: 103.5, translation: "give it to me" },
    ] },
  { id: "19", startTime: 104, endTime: 111, original: "Yo sé que estás pensándolo", translated: "I know you're thinking about it",
    words: [
      { word: "Yo", startTime: 104, endTime: 104.3, translation: "I" },
      { word: "sé", startTime: 104.3, endTime: 104.7, translation: "know" },
      { word: "que", startTime: 104.7, endTime: 105.0, translation: "that" },
      { word: "estás", startTime: 105.0, endTime: 105.7, translation: "you are" },
      { word: "pensándolo", startTime: 105.7, endTime: 110.5, translation: "thinking about it" },
    ] },
  { id: "20", startTime: 111, endTime: 118, original: "Llevo tiempo intentándolo", translated: "I've been trying for a while",
    words: [
      { word: "Llevo", startTime: 111, endTime: 111.6, translation: "I've been" },
      { word: "tiempo", startTime: 111.6, endTime: 112.4, translation: "time" },
      { word: "intentándolo", startTime: 112.4, endTime: 117.5, translation: "trying it" },
    ] },
  { id: "21", startTime: 118, endTime: 125, original: "Mami, esto es dando y dándolo", translated: "Baby, this is give and take",
    words: [
      { word: "Mami", startTime: 118, endTime: 118.7, translation: "Baby" },
      { word: "esto", startTime: 118.9, endTime: 119.4, translation: "this" },
      { word: "es", startTime: 119.4, endTime: 119.7, translation: "is" },
      { word: "dando", startTime: 119.7, endTime: 120.5, translation: "giving" },
      { word: "y", startTime: 120.5, endTime: 120.8, translation: "and" },
      { word: "dándolo", startTime: 120.8, endTime: 124.5, translation: "giving it" },
    ] },
  { id: "22", startTime: 125, endTime: 132, original: "Sabes que tu corazón conmigo te hace bom bom", translated: "You know your heart goes boom boom with me",
    words: [
      { word: "Sabes", startTime: 125, endTime: 125.6, translation: "You know" },
      { word: "que", startTime: 125.6, endTime: 125.9, translation: "that" },
      { word: "tu", startTime: 125.9, endTime: 126.2, translation: "your" },
      { word: "corazón", startTime: 126.2, endTime: 127.0, translation: "heart" },
      { word: "conmigo", startTime: 127.0, endTime: 127.8, translation: "with me" },
      { word: "te", startTime: 127.8, endTime: 128.1, translation: "you" },
      { word: "hace", startTime: 128.1, endTime: 128.6, translation: "makes" },
      { word: "bom", startTime: 128.6, endTime: 129.5, translation: "boom" },
      { word: "bom", startTime: 129.5, endTime: 131.5, translation: "boom" },
    ] },
  { id: "23", startTime: 132, endTime: 140, original: "Pasito a pasito, suave suavecito", translated: "Step by step, soft and softly",
    words: [
      { word: "Pasito", startTime: 132, endTime: 132.8, translation: "Step" },
      { word: "a", startTime: 132.8, endTime: 133.0, translation: "by" },
      { word: "pasito", startTime: 133.0, endTime: 133.8, translation: "step" },
      { word: "suave", startTime: 134.0, endTime: 134.8, translation: "soft" },
      { word: "suavecito", startTime: 134.8, endTime: 139.5, translation: "softly" },
    ] },
  { id: "24", startTime: 140, endTime: 148, original: "Nos vamos pegando, poquito a poquito", translated: "We're getting closer, little by little",
    words: [
      { word: "Nos", startTime: 140, endTime: 140.4, translation: "We" },
      { word: "vamos", startTime: 140.4, endTime: 141.0, translation: "go" },
      { word: "pegando", startTime: 141.0, endTime: 142.0, translation: "getting closer" },
      { word: "poquito", startTime: 142.5, endTime: 143.5, translation: "little" },
      { word: "a", startTime: 143.5, endTime: 143.8, translation: "by" },
      { word: "poquito", startTime: 143.8, endTime: 147.5, translation: "little" },
    ] },
  { id: "25", startTime: 148, endTime: 156, original: "Cuando tú me besas con esa destreza", translated: "When you kiss me with that skill",
    words: [
      { word: "Cuando", startTime: 148, endTime: 148.7, translation: "When" },
      { word: "tú", startTime: 148.7, endTime: 149.1, translation: "you" },
      { word: "me", startTime: 149.1, endTime: 149.4, translation: "me" },
      { word: "besas", startTime: 149.4, endTime: 150.2, translation: "kiss" },
      { word: "con", startTime: 150.2, endTime: 150.5, translation: "with" },
      { word: "esa", startTime: 150.5, endTime: 150.9, translation: "that" },
      { word: "destreza", startTime: 150.9, endTime: 155.5, translation: "skill" },
    ] },
  { id: "26", startTime: 156, endTime: 164, original: "Veo que eres malicia con delicadeza", translated: "I see you're mischief with delicacy",
    words: [
      { word: "Veo", startTime: 156, endTime: 156.5, translation: "I see" },
      { word: "que", startTime: 156.5, endTime: 156.8, translation: "that" },
      { word: "eres", startTime: 156.8, endTime: 157.4, translation: "you are" },
      { word: "malicia", startTime: 157.4, endTime: 158.4, translation: "mischief" },
      { word: "con", startTime: 158.4, endTime: 158.7, translation: "with" },
      { word: "delicadeza", startTime: 158.7, endTime: 163.5, translation: "delicacy" },
    ] },
  { id: "27", startTime: 164, endTime: 172, original: "Pasito a pasito, suave suavecito", translated: "Step by step, soft and softly",
    words: [
      { word: "Pasito", startTime: 164, endTime: 164.8, translation: "Step" },
      { word: "a", startTime: 164.8, endTime: 165.0, translation: "by" },
      { word: "pasito", startTime: 165.0, endTime: 165.8, translation: "step" },
      { word: "suave", startTime: 166.0, endTime: 166.8, translation: "soft" },
      { word: "suavecito", startTime: 166.8, endTime: 171.5, translation: "softly" },
    ] },
  { id: "28", startTime: 172, endTime: 180, original: "Nos vamos pegando, poquito a poquito", translated: "We're getting closer, little by little",
    words: [
      { word: "Nos", startTime: 172, endTime: 172.4, translation: "We" },
      { word: "vamos", startTime: 172.4, endTime: 173.0, translation: "go" },
      { word: "pegando", startTime: 173.0, endTime: 174.0, translation: "getting closer" },
      { word: "poquito", startTime: 174.5, endTime: 175.5, translation: "little" },
      { word: "a", startTime: 175.5, endTime: 175.8, translation: "by" },
      { word: "poquito", startTime: 175.8, endTime: 179.5, translation: "little" },
    ] },
  { id: "29", startTime: 180, endTime: 188, original: "Y es que esa belleza es un rompecabezas", translated: "And that beauty is a puzzle",
    words: [
      { word: "Y", startTime: 180, endTime: 180.3, translation: "And" },
      { word: "es", startTime: 180.3, endTime: 180.6, translation: "is" },
      { word: "que", startTime: 180.6, endTime: 180.9, translation: "that" },
      { word: "esa", startTime: 180.9, endTime: 181.3, translation: "that" },
      { word: "belleza", startTime: 181.3, endTime: 182.3, translation: "beauty" },
      { word: "es", startTime: 182.3, endTime: 182.6, translation: "is" },
      { word: "un", startTime: 182.6, endTime: 182.9, translation: "a" },
      { word: "rompecabezas", startTime: 182.9, endTime: 187.5, translation: "puzzle" },
    ] },
  { id: "30", startTime: 188, endTime: 196, original: "Pero pa montarlo aquí tengo la pieza", translated: "But to put it together I have the piece",
    words: [
      { word: "Pero", startTime: 188, endTime: 188.5, translation: "But" },
      { word: "pa", startTime: 188.5, endTime: 188.8, translation: "to" },
      { word: "montarlo", startTime: 188.8, endTime: 189.7, translation: "put it together" },
      { word: "aquí", startTime: 189.7, endTime: 190.3, translation: "here" },
      { word: "tengo", startTime: 190.3, endTime: 191.0, translation: "I have" },
      { word: "la", startTime: 191.0, endTime: 191.3, translation: "the" },
      { word: "pieza", startTime: 191.3, endTime: 195.5, translation: "piece" },
    ] },
  { id: "31", startTime: 196, endTime: 204, original: "Despacito", translated: "Slowly",
    words: [{ word: "Despacito", startTime: 196, endTime: 203.5, translation: "Slowly" }] },
  { id: "32", startTime: 204, endTime: 212, original: "Quiero respirar tu cuello despacito", translated: "I want to breathe your neck slowly",
    words: [
      { word: "Quiero", startTime: 204, endTime: 204.8, translation: "I want" },
      { word: "respirar", startTime: 204.8, endTime: 205.7, translation: "to breathe" },
      { word: "tu", startTime: 205.7, endTime: 206.0, translation: "your" },
      { word: "cuello", startTime: 206.0, endTime: 206.8, translation: "neck" },
      { word: "despacito", startTime: 206.8, endTime: 211.5, translation: "slowly" },
    ] },
  { id: "33", startTime: 212, endTime: 220, original: "Deja que te diga cosas al oído", translated: "Let me whisper things in your ear",
    words: [
      { word: "Deja", startTime: 212, endTime: 212.6, translation: "Let" },
      { word: "que", startTime: 212.6, endTime: 212.9, translation: "that" },
      { word: "te", startTime: 212.9, endTime: 213.2, translation: "you" },
      { word: "diga", startTime: 213.2, endTime: 213.8, translation: "tell" },
      { word: "cosas", startTime: 213.8, endTime: 214.5, translation: "things" },
      { word: "al", startTime: 214.5, endTime: 214.8, translation: "to the" },
      { word: "oído", startTime: 214.8, endTime: 219.5, translation: "ear" },
    ] },
  { id: "34", startTime: 220, endTime: 227, original: "Para que te acuerdes si no estás conmigo", translated: "So you remember when you're not with me",
    words: [
      { word: "Para", startTime: 220, endTime: 220.4, translation: "So" },
      { word: "que", startTime: 220.4, endTime: 220.7, translation: "that" },
      { word: "te", startTime: 220.7, endTime: 220.9, translation: "you" },
      { word: "acuerdes", startTime: 220.9, endTime: 221.7, translation: "remember" },
      { word: "si", startTime: 221.7, endTime: 222.0, translation: "if" },
      { word: "no", startTime: 222.0, endTime: 222.3, translation: "not" },
      { word: "estás", startTime: 222.3, endTime: 222.9, translation: "you are" },
      { word: "conmigo", startTime: 222.9, endTime: 226.5, translation: "with me" },
    ] },
];

const TOTAL_DURATION = 227; // seconds (3:47)

const GRAMMAR_BREAKDOWN = [
  { word: "Quiero", type: "Verb", info: "1st person singular, present tense of 'querer' (to want)" },
  { word: "respirar", type: "Verb", info: "Infinitive — to breathe" },
  { word: "tu", type: "Pronoun", info: "Possessive — your (informal)" },
  { word: "cuello", type: "Noun", info: "Masculine — neck" },
  { word: "despacito", type: "Adverb", info: "Diminutive of 'despacio' — slowly (affectionate)" },
];

export default function SongPlayerScreen() {
  const params = useLocalSearchParams<{
    title?: string;
    artist?: string;
    sourceLanguage?: string;
    targetLanguage?: string;
    useDynamic?: string; // "true" to fetch from pipeline
    demoSongId?: string; // ID of a pre-loaded demo song
  }>();

  const { incrementUsage } = useUsage();
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>("full_mix");
  const [isPlaying, setIsPlaying] = useState(false);
  const [songTracked, setSongTracked] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeLine, setActiveLine] = useState(-1);
  const [showSyncedLyrics, setShowSyncedLyrics] = useState(true);
  const [lyricsDisplayMode, setLyricsDisplayMode] = useState<LyricsDisplayMode>("dual");
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [pronunciationScore, setPronunciationScore] = useState<number | null>(null);
  const [karaokeMode, setKaraokeMode] = useState(true); // Word-by-word highlighting
  const [loopingLine, setLoopingLine] = useState<number | null>(null); // Index of line being looped
  const [loopCount, setLoopCount] = useState(0);

  // Speed control
  const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25] as const;
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  // Per-word pronunciation scoring
  const [singAlongActive, setSingAlongActive] = useState(false);
  const [wordScores, setWordScores] = useState<Record<string, "green" | "yellow" | "red">>({});
  const [scoringInProgress, setScoringInProgress] = useState(false);

  // Vocabulary save feedback
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set());

  // Streak rewards for sing-along
  const [greenStreak, setGreenStreak] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [streakXP, setStreakXP] = useState(0);
  const [streakMessage, setStreakMessage] = useState<string | null>(null);
  // Playlist / Download / Like
  const [showPlaylistPicker, setShowPlaylistPicker] = useState(false);
  const [isSongDownloaded, setIsSongDownloaded] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  // Dynamic lyrics state
  const [lyrics, setLyrics] = useState<SyncedLyricLine[]>(DEMO_LYRICS);
  const [dynamicLoading, setDynamicLoading] = useState(false);
  const [dynamicError, setDynamicError] = useState<string | null>(null);

  const songTitle = params.title || "Despacito";
  const songArtist = params.artist || "Luis Fonsi ft. Daddy Yankee";
  const sourceLanguage = params.sourceLanguage || "Spanish";
  const targetLanguage = params.targetLanguage || "English";

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lyricsScrollRef = useRef<ScrollView>(null);
  const fadeAnims = useRef(lyrics.map(() => new Animated.Value(0.4))).current;

  const progress = currentTime / TOTAL_DURATION;

  // ─── Dynamic Lyrics from Translation Pipeline ─────────────────────────────
  const syncedLyricsMutation = trpc.songPipeline.getSyncedLyrics.useMutation();

  const fetchDynamicLyrics = useCallback(async () => {
    if (params.useDynamic !== "true") return;
    setDynamicLoading(true);
    setDynamicError(null);
    try {
      const result = await syncedLyricsMutation.mutateAsync({
        title: songTitle,
        artist: songArtist,
        sourceLanguage,
        targetLanguage,
      });
      if (result.success && result.lines.length > 0) {
        // Convert ms timestamps to seconds and map to our interface
        const converted: SyncedLyricLine[] = result.lines.map((line: any, idx: number) => ({
          id: String(idx + 1),
          startTime: (line.startTime || 0) / 1000,
          endTime: (line.endTime || 0) / 1000,
          original: line.original || "",
          translated: line.translated || "",
          words: (line.words || []).map((w: any) => ({
            word: w.word || "",
            startTime: (w.startTime || 0) / 1000,
            endTime: (w.endTime || 0) / 1000,
            translation: w.translation || "",
          })),
        }));
        setLyrics(converted);
      } else {
        setDynamicError("Could not load synced lyrics — using demo data");
      }
    } catch (err: any) {
      setDynamicError("Failed to fetch lyrics — using demo data");
    } finally {
      setDynamicLoading(false);
    }
  }, [songTitle, songArtist, sourceLanguage, targetLanguage, params.useDynamic]);

  useEffect(() => {
    // If a demo song ID is provided, hydrate from pre-loaded data
    if (params.demoSongId) {
      const demo = getDemoSong(params.demoSongId);
      if (demo) {
        const converted: SyncedLyricLine[] = demo.syncedLyrics.map((line) => ({
          id: line.id,
          startTime: line.startTime,
          endTime: line.endTime,
          original: line.original,
          translated: line.translated,
          words: [],
        }));
        setLyrics(converted);
        return;
      }
    }
    fetchDynamicLyrics();
  }, []);

  // ─── Playback Timer (speed-aware) ────────────────────────────────────────
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + 0.1 * playbackSpeed;

          // Loop-a-line logic: if looping, restart when we pass the line's endTime
          if (loopingLine !== null) {
            const loopedLine = lyrics[loopingLine];
            if (loopedLine && next >= loopedLine.endTime) {
              setLoopCount((c) => c + 1);
              return loopedLine.startTime;
            }
          }

          if (next >= TOTAL_DURATION) {
            setIsPlaying(false);
            return 0;
          }
          return next;
        });
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, loopingLine, lyrics, playbackSpeed]);

  // ─── Active Line Detection ────────────────────────────────────────────────
  useEffect(() => {
    const newActive = lyrics.findIndex(
      (line) => currentTime >= line.startTime && currentTime < line.endTime
    );
    if (newActive !== -1 && newActive !== activeLine) {
      setActiveLine(newActive);

      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      // Animate opacity for each line
      lyrics.forEach((_, i) => {
        if (fadeAnims[i]) {
          Animated.timing(fadeAnims[i], {
            toValue: i === newActive ? 1 : i === newActive - 1 || i === newActive + 1 ? 0.65 : 0.35,
            duration: 300,
            useNativeDriver: true,
          }).start();
        }
      });

      // Auto-scroll to keep active line visible
      if (showSyncedLyrics && lyricsScrollRef.current) {
        const lineHeight = 90;
        const scrollTarget = Math.max(0, newActive * lineHeight - 100);
        lyricsScrollRef.current.scrollTo({ y: scrollTarget, animated: true });
      }
    }
  }, [currentTime]);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleDownloadSong = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSongDownloaded(!isSongDownloaded);
    if (!isSongDownloaded) {
      Alert.alert("Downloaded", `"${songTitle}" saved to your downloads. Play it offline anytime.`);
    }
  };

  const handleLikeSong = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsLiked(!isLiked);
  };

  const { play: playMiniPlayer } = useMusicPlayer();

  const handlePlay = () => {
    if (!songTracked) {
      incrementUsage("song");
      setSongTracked(true);
    }
    const newState = !isPlaying;
    setIsPlaying(newState);
    // Trigger persistent mini-player when song starts
    if (newState) {
      playMiniPlayer({
        id: `song_${songTitle}_${songArtist}`,
        title: songTitle,
        artist: songArtist,
        artworkColor: Colors.primary,
        language: sourceLanguage,
      });
    }
  };

  const seekTo = (time: number) => {
    setCurrentTime(Math.max(0, Math.min(TOTAL_DURATION, time)));
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // ─── Speed Control ──────────────────────────────────────────────────────
  const handleSpeedChange = (speed: number) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setPlaybackSpeed(speed);
    setShowSpeedMenu(false);
  };

  // ─── Vocabulary Save (Long-press word → SRS deck) ─────────────────────────
  const handleSaveWord = async (word: WordTiming, lineOriginal: string) => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    const wordId = `song_${songTitle}_${word.word}_${word.startTime}`;
    try {
      await addToReviewQueue([{
        id: wordId,
        word: word.word,
        translation: word.translation,
        context: lineOriginal,
        lessonId: `song:${songTitle}`,
      }]);
      setSavedWords((prev) => new Set([...prev, wordId]));
      Alert.alert(
        "Saved to Vocabulary",
        `"${word.word}" (${word.translation}) added to your spaced-repetition deck.`,
        [{ text: "OK" }]
      );
    } catch (err) {
      Alert.alert("Error", "Could not save word. Try again.");
    }
  };

  // ─── Per-Word Pronunciation Scoring ───────────────────────────────────────
  const pronunciationMutation = trpc.pronunciation.analyze.useMutation();

  // ─── Streak & Auto-Slow Helpers ─────────────────────────────────────────
  const processLineScores = (newScores: Record<string, "green" | "yellow" | "red">, lineId: string, wordCount: number) => {
    // Check if all words in this line are green
    const lineKeys = Array.from({ length: wordCount }, (_, i) => `${lineId}_${i}`);
    const allGreen = lineKeys.every((k) => newScores[k] === "green");
    const hasRed = lineKeys.some((k) => newScores[k] === "red");

    if (allGreen) {
      const newStreak = greenStreak + 1;
      setGreenStreak(newStreak);

      // Trigger confetti + XP at 5-line streaks
      if (newStreak > 0 && newStreak % 5 === 0) {
        const xpBonus = newStreak * 10; // 50 XP at 5, 100 at 10, etc.
        setStreakXP((prev) => prev + xpBonus);
        setShowConfetti(true);
        setStreakMessage(`🔥 ${newStreak}-Line Streak! +${xpBonus} XP`);
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        setTimeout(() => {
          setShowConfetti(false);
          setStreakMessage(null);
        }, 3000);
      }
    } else {
      // Break streak on non-green line
      setGreenStreak(0);
    }

    // Adaptive auto-slow: if any word is red and we're looping, drop to 0.5x
    if (hasRed && loopingLine !== null && playbackSpeed > 0.5) {
      setPlaybackSpeed(0.5);
      setStreakMessage("🐢 Auto-slowed to 0.5x for practice");
      setTimeout(() => setStreakMessage(null), 2500);
    }
  };

  const handleSingAlongScore = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (singAlongActive) {
      // Stop sing-along and score the current line
      setSingAlongActive(false);
      if (activeLine >= 0) {
        setScoringInProgress(true);
        const line = lyrics[activeLine];
        try {
          const result = await pronunciationMutation.mutateAsync({
            targetText: line.original,
            language: sourceLanguage,
            userLevel: "intermediate",
            attemptNumber: 1,
          });
          if (result.success && result.analysis) {
            const analysis = result.analysis as any;
            const overallScore = analysis.score || 75;
            // Distribute scores to words based on overall + some variance
            const newScores: Record<string, "green" | "yellow" | "red"> = { ...wordScores };
            line.words.forEach((w, idx) => {
              const phonemeScore = analysis.phonemes?.[idx]?.score;
              const wordScore = phonemeScore ?? (overallScore + (Math.random() * 20 - 10));
              const key = `${line.id}_${idx}`;
              if (wordScore >= 80) newScores[key] = "green";
              else if (wordScore >= 55) newScores[key] = "yellow";
              else newScores[key] = "red";
            });
            setWordScores(newScores);
            setPronunciationScore(overallScore);
            processLineScores(newScores, line.id, line.words.length);
          } else {
            simulateWordScores();
          }
        } catch {
          simulateWordScores();
        } finally {
          setScoringInProgress(false);
        }
      }
    } else {
      // Start sing-along
      setSingAlongActive(true);
      setWordScores({});
      setPronunciationScore(null);
    }
  };

  const simulateWordScores = () => {
    if (activeLine < 0) return;
    const line = lyrics[activeLine];
    const newScores: Record<string, "green" | "yellow" | "red"> = { ...wordScores };
    line.words.forEach((_, idx) => {
      const key = `${line.id}_${idx}`;
      const rand = Math.random();
      newScores[key] = rand > 0.6 ? "green" : rand > 0.25 ? "yellow" : "red";
    });
    setWordScores(newScores);
    const greenCount = Object.values(newScores).filter(v => v === "green").length;
    const total = Object.values(newScores).length;
    setPronunciationScore(Math.round((greenCount / Math.max(total, 1)) * 100));
    processLineScores(newScores, line.id, line.words.length);
  };

  const toggleLoop = (lineIndex: number) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (loopingLine === lineIndex) {
      // Stop looping
      setLoopingLine(null);
      setLoopCount(0);
    } else {
      // Start looping this line
      setLoopingLine(lineIndex);
      setLoopCount(0);
      seekTo(lyrics[lineIndex].startTime);
      if (!isPlaying) setIsPlaying(true);
    }
  };

  // ─── Word-by-Word Karaoke Renderer (with long-press save + scoring) ────────
  const renderKaraokeWords = (line: SyncedLyricLine, isActive: boolean) => {
    if (!karaokeMode || !isActive || line.words.length === 0) {
      return null;
    }

    return (
      <View style={styles.karaokeWordsContainer}>
        {line.words.map((word, idx) => {
          const isWordActive = currentTime >= word.startTime && currentTime < word.endTime;
          const isWordPast = currentTime >= word.endTime;
          const scoreKey = `${line.id}_${idx}`;
          const wordScore = wordScores[scoreKey];
          const wordId = `song_${songTitle}_${word.word}_${word.startTime}`;
          const isSaved = savedWords.has(wordId);

          return (
            <Pressable
              key={idx}
              onLongPress={() => handleSaveWord(word, line.original)}
              delayLongPress={400}
              style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
            >
              <View style={styles.karaokeWordWrapper}>
                <View style={[
                  styles.karaokeWordBubble,
                  wordScore === "green" && styles.karaokeWordScoreGreen,
                  wordScore === "yellow" && styles.karaokeWordScoreYellow,
                  wordScore === "red" && styles.karaokeWordScoreRed,
                  isSaved && styles.karaokeWordSaved,
                ]}>
                  <Text
                    style={[
                      styles.karaokeWord,
                      isWordActive && styles.karaokeWordActive,
                      isWordPast && styles.karaokeWordPast,
                    ]}
                  >
                    {word.word}
                  </Text>
                </View>
                {isWordActive && (
                  <Text style={styles.karaokeWordTranslation}>
                    {word.translation}
                  </Text>
                )}
                {isSaved && (
                  <Ionicons name="bookmark" size={8} color={Colors.secondary} style={{ marginTop: 1 }} />
                )}
                {wordScore && (
                  <View style={[
                    styles.scoreIndicatorDot,
                    wordScore === "green" && { backgroundColor: Colors.success },
                    wordScore === "yellow" && { backgroundColor: Colors.warning },
                    wordScore === "red" && { backgroundColor: Colors.error },
                  ]} />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-down" size={28} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Now Playing</Text>
        <TouchableOpacity>
          <Ionicons name="share-outline" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Album Art */}
        <View style={styles.albumArtContainer}>
          <View style={styles.albumArt}>
            <Ionicons name="musical-notes" size={64} color={Colors.secondary} />
          </View>
          <Text style={styles.songTitle}>{songTitle}</Text>
          <Text style={styles.songArtist}>{songArtist}</Text>
          <Text style={styles.songTranslation}>
            {sourceLanguage} → {targetLanguage}
          </Text>
          {/* Action Buttons: Add to Playlist, Download, Like */}
          <View style={styles.songActions}>
            <TouchableOpacity style={styles.songActionBtn} onPress={() => setShowPlaylistPicker(true)}>
              <Ionicons name="list" size={20} color={Colors.textSecondary} />
              <Text style={styles.songActionLabel}>Playlist</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.songActionBtn} onPress={handleDownloadSong}>
              <Ionicons name={isSongDownloaded ? "checkmark-circle" : "download-outline"} size={20} color={isSongDownloaded ? Colors.success : Colors.textSecondary} />
              <Text style={[styles.songActionLabel, isSongDownloaded && { color: Colors.success }]}>{isSongDownloaded ? "Saved" : "Download"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.songActionBtn} onPress={handleLikeSong}>
              <Ionicons name={isLiked ? "heart" : "heart-outline"} size={20} color={isLiked ? Colors.accent : Colors.textSecondary} />
              <Text style={[styles.songActionLabel, isLiked && { color: Colors.accent }]}>{isLiked ? "Liked" : "Like"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Playback Mode Toggle */}
        <View style={styles.modeContainer}>
          <Text style={styles.modeLabel}>Playback Mode</Text>
          <View style={styles.modeButtons}>
            {[
              { key: "full_mix", label: "Full Mix", icon: "musical-notes" },
              { key: "vocals_only", label: "Vocals", icon: "mic" },
              { key: "instrumental_only", label: "Beat Only", icon: "disc" },
            ].map((mode) => (
              <TouchableOpacity
                key={mode.key}
                style={[
                  styles.modeButton,
                  playbackMode === mode.key && styles.modeButtonActive,
                ]}
                onPress={() => setPlaybackMode(mode.key as PlaybackMode)}
              >
                <Ionicons
                  name={mode.icon as any}
                  size={16}
                  color={
                    playbackMode === mode.key
                      ? Colors.textPrimary
                      : Colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.modeButtonText,
                    playbackMode === mode.key && styles.modeButtonTextActive,
                  ]}
                >
                  {mode.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            <View style={[styles.progressDot, { left: `${progress * 100}%` }]} />
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
            <Text style={styles.timeText}>{formatTime(TOTAL_DURATION)}</Text>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity onPress={() => seekTo(currentTime - 10)}>
            <Ionicons name="play-back" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => seekTo(currentTime - 5)}>
            <Ionicons name="play-skip-back" size={28} color={Colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.playButton} onPress={handlePlay}>
            <Ionicons
              name={isPlaying ? "pause" : "play"}
              size={32}
              color={Colors.primary}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => seekTo(currentTime + 5)}>
            <Ionicons name="play-skip-forward" size={28} color={Colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => seekTo(currentTime + 10)}>
            <Ionicons name="play-forward" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Speed Control */}
        <View style={styles.speedControlRow}>
          <TouchableOpacity
            onPress={() => setShowSpeedMenu(!showSpeedMenu)}
            style={[styles.speedChip, playbackSpeed !== 1 && styles.speedChipActive]}
          >
            <Ionicons name="speedometer" size={14} color={playbackSpeed !== 1 ? Colors.gold : Colors.textSecondary} />
            <Text style={[styles.speedChipText, playbackSpeed !== 1 && styles.speedChipTextActive]}>
              {playbackSpeed}x
            </Text>
          </TouchableOpacity>
          {playbackSpeed !== 1 && (
            <Text style={styles.speedHint}>
              {playbackSpeed < 1 ? "Slowed for practice" : "Faster playback"}
            </Text>
          )}
        </View>
        {showSpeedMenu && (
          <View style={styles.speedMenuDropdown}>
            <Text style={styles.speedMenuTitle}>Playback Speed</Text>
            <View style={styles.speedMenuOptions}>
              {SPEED_OPTIONS.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.speedMenuOption, playbackSpeed === s && styles.speedMenuOptionActive]}
                  onPress={() => handleSpeedChange(s)}
                >
                  <Text style={[styles.speedMenuOptionText, playbackSpeed === s && styles.speedMenuOptionTextActive]}>
                    {s}x
                  </Text>
                  {s === 0.5 && <Text style={styles.speedMenuOptionHint}>Slow</Text>}
                  {s === 1 && <Text style={styles.speedMenuOptionHint}>Normal</Text>}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Loop indicator */}
        {loopingLine !== null && (
          <View style={styles.loopIndicator}>
            <Ionicons name="repeat" size={14} color={Colors.gold} />
            <Text style={styles.loopIndicatorText}>
              Looping line {loopingLine + 1} • Rep {loopCount + 1}
            </Text>
            <TouchableOpacity onPress={() => { setLoopingLine(null); setLoopCount(0); }}>
              <Ionicons name="close-circle" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            SYNCED LYRICS SECTION — Real-time dual-language + karaoke
            ═══════════════════════════════════════════════════════════════════ */}
        <View style={styles.syncedLyricsSection}>
          {/* Section Header */}
          <View style={styles.syncedLyricsHeader}>
            <View style={styles.syncedLyricsHeaderLeft}>
              <Ionicons name="text" size={18} color={Colors.glow} />
              <Text style={styles.syncedLyricsTitle}>Synced Lyrics</Text>
              {dynamicLoading && (
                <Text style={styles.loadingBadge}>Loading...</Text>
              )}
            </View>
            <View style={styles.syncedLyricsHeaderRight}>
              {/* Karaoke toggle */}
              <TouchableOpacity
                onPress={() => setKaraokeMode(!karaokeMode)}
                style={[styles.karaokeToggle, karaokeMode && styles.karaokeToggleActive]}
              >
                <Text style={[styles.karaokeToggleText, karaokeMode && styles.karaokeToggleTextActive]}>
                  K
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowSyncedLyrics(!showSyncedLyrics)}
                style={styles.toggleBtn}
              >
                <Ionicons
                  name={showSyncedLyrics ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Dynamic error notice */}
          {dynamicError && (
            <View style={styles.dynamicErrorBar}>
              <Text style={styles.dynamicErrorText}>{dynamicError}</Text>
              <TouchableOpacity onPress={fetchDynamicLyrics}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {showSyncedLyrics && (
            <>
              {/* Language Display Mode Toggle */}
              <View style={styles.lyricsModePicker}>
                {([
                  { key: "dual", label: "Both" },
                  { key: "original", label: sourceLanguage },
                  { key: "translation", label: targetLanguage },
                ] as { key: LyricsDisplayMode; label: string }[]).map((mode) => (
                  <TouchableOpacity
                    key={mode.key}
                    style={[
                      styles.lyricsModeBtn,
                      lyricsDisplayMode === mode.key && styles.lyricsModeBtnActive,
                    ]}
                    onPress={() => setLyricsDisplayMode(mode.key)}
                  >
                    <Text
                      style={[
                        styles.lyricsModeBtnText,
                        lyricsDisplayMode === mode.key && styles.lyricsModeBtnTextActive,
                      ]}
                    >
                      {mode.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Scrollable Lyrics Area */}
              <ScrollView
                ref={lyricsScrollRef}
                style={styles.lyricsScrollArea}
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}
              >
                {lyrics.map((line, index) => {
                  const isActive = index === activeLine;
                  const isPast = currentTime > line.endTime;
                  const isLooping = loopingLine === index;

                  return (
                    <Animated.View
                      key={line.id}
                      style={[
                        styles.syncedLine,
                        { opacity: fadeAnims[index] || new Animated.Value(0.4) },
                      ]}
                    >
                      <View style={[
                        styles.syncedLineTouchable,
                        isActive && styles.syncedLineActive,
                        isLooping && styles.syncedLineLooping,
                      ]}>
                        {/* Top row: timestamp + loop button */}
                        <View style={styles.lineTopRow}>
                          <TouchableOpacity
                            onPress={() => seekTo(line.startTime)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.lineTimestamp}>
                              {formatTime(line.startTime)}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => toggleLoop(index)}
                            style={[styles.loopBtn, isLooping && styles.loopBtnActive]}
                          >
                            <Ionicons
                              name="repeat"
                              size={14}
                              color={isLooping ? Colors.gold : Colors.textMuted}
                            />
                          </TouchableOpacity>
                        </View>

                        {/* Original text */}
                        <TouchableOpacity
                          onPress={() => seekTo(line.startTime)}
                          activeOpacity={0.7}
                        >
                          {(lyricsDisplayMode === "dual" || lyricsDisplayMode === "original") && (
                            <Text
                              style={[
                                styles.syncedOriginal,
                                isActive && styles.syncedOriginalActive,
                                isPast && styles.syncedPast,
                              ]}
                            >
                              {line.original}
                            </Text>
                          )}

                          {/* Translation */}
                          {(lyricsDisplayMode === "dual" || lyricsDisplayMode === "translation") && (
                            <Text
                              style={[
                                styles.syncedTranslation,
                                isActive && styles.syncedTranslationActive,
                                isPast && styles.syncedTranslationPast,
                                lyricsDisplayMode === "translation" && styles.syncedTranslationLarge,
                              ]}
                            >
                              {line.translated}
                            </Text>
                          )}
                        </TouchableOpacity>

                        {/* Word-by-word karaoke highlighting */}
                        {renderKaraokeWords(line, isActive)}

                        {/* Active indicator dot */}
                        {isActive && <View style={styles.activeIndicator} />}
                      </View>
                    </Animated.View>
                  );
                })}
                <View style={{ height: 40 }} />
              </ScrollView>

              {/* Expand to Full Screen */}
              <TouchableOpacity
                style={styles.expandBtn}
                onPress={() => router.push({
                  pathname: "/lyrics-player",
                  params: {
                    title: songTitle,
                    artist: songArtist,
                    language: sourceLanguage,
                    targetLanguage: targetLanguage,
                    mode: "song",
                  },
                })}
              >
                <Ionicons name="expand" size={16} color={Colors.glow} />
                <Text style={styles.expandBtnText}>Full Screen Lyrics</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Sing Along / Per-Word Pronunciation Scoring */}
        <View style={styles.singAlongContainer}>
          <TouchableOpacity
            style={[styles.singAlongButton, singAlongActive && styles.singAlongButtonActive]}
            onPress={handleSingAlongScore}
          >
            <Ionicons
              name={singAlongActive ? "stop-circle" : "mic"}
              size={20}
              color={singAlongActive ? Colors.error : Colors.accent}
            />
            <Text style={[styles.singAlongText, singAlongActive && { color: Colors.error }]}>
              {singAlongActive ? "Stop & Score" : scoringInProgress ? "Scoring..." : "Sing Along — Score Words"}
            </Text>
            {singAlongActive && (
              <View style={styles.recordingPulse} />
            )}
          </TouchableOpacity>
          {singAlongActive && (
            <Text style={styles.singAlongHint}>
              Sing the highlighted words, then tap "Stop & Score" for per-word feedback
            </Text>
          )}
          {pronunciationScore !== null && (
            <View style={styles.scoreContainer}>
              <View>
                <Text style={styles.scoreLabel}>Pronunciation Score</Text>
                <Text style={styles.scoreSublabel}>
                  {Object.values(wordScores).filter(v => v === "green").length} perfect •{" "}
                  {Object.values(wordScores).filter(v => v === "yellow").length} close •{" "}
                  {Object.values(wordScores).filter(v => v === "red").length} needs work
                </Text>
              </View>
              <Text style={styles.scoreValue}>{pronunciationScore}/100</Text>
            </View>
          )}
          <TouchableOpacity style={styles.voiceCloneButton}>
            <Ionicons name="person-circle" size={20} color={Colors.warning} />
            <Text style={styles.voiceCloneText}>Hear in My Voice</Text>
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>PRO</Text>
            </View>
          </TouchableOpacity>
          {/* Vocabulary save hint */}
          <View style={styles.vocabHintRow}>
            <Ionicons name="hand-left" size={12} color={Colors.textMuted} />
            <Text style={styles.vocabHintText}>
              Long-press any karaoke word to save it to your vocabulary deck
            </Text>
          </View>
        </View>

        {/* Grammar Breakdown Toggle */}
        <View style={styles.breakdownToggleContainer}>
          <TouchableOpacity onPress={() => setShowBreakdown(!showBreakdown)} style={styles.breakdownToggleBtn}>
            <Ionicons name="school" size={18} color={Colors.secondary} />
            <Text style={styles.breakdownToggleText}>
              {showBreakdown ? "Hide Grammar Breakdown" : "Show Grammar Breakdown"}
            </Text>
            <Ionicons name={showBreakdown ? "chevron-up" : "chevron-down"} size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Grammar Breakdown */}
        {showBreakdown && (
          <View style={styles.breakdownContainer}>
            <Text style={styles.breakdownTitle}>Grammar Breakdown</Text>
            <Text style={styles.breakdownSubtitle}>
              Active: "{activeLine >= 0 ? lyrics[activeLine].original : "Press play to start"}"
            </Text>
            {GRAMMAR_BREAKDOWN.map((item, index) => (
              <View key={index} style={styles.breakdownItem}>
                <View style={styles.breakdownWordContainer}>
                  <Text style={styles.breakdownWord}>{item.word}</Text>
                  <View style={styles.breakdownTypeBadge}>
                    <Text style={styles.breakdownType}>{item.type}</Text>
                  </View>
                </View>
                <Text style={styles.breakdownInfo}>{item.info}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Song Analysis - Slang, Dialect, Cultural Breakdown */}
        <SongAnalysis />

        {/* Record This Song in WavyEq Studios */}
        <TouchableOpacity
          style={styles.wavyEqButton}
          onPress={() => router.push({
            pathname: "/wavy-eq-studio",
            params: {
              assignmentTitle: `${songTitle} - ${songArtist}`,
              lyrics: lyrics.map(l => l.original).join("\n"),
              mode: "punch_in",
            },
          })}
        >
          <View style={styles.wavyEqButtonInner}>
            <Ionicons name="mic" size={22} color="#fff" />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.wavyEqButtonTitle}>Record This Song</Text>
              <Text style={styles.wavyEqButtonSub}>Open in WavyEq Studios</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.6)" />
          </View>
        </TouchableOpacity>

        {/* One-Tap Song Translation Agent */}
        <TouchableOpacity
          style={styles.wavyEqButton}
          onPress={() => router.push({
            pathname: "/song-translate-agent",
            params: {
              title: songTitle,
              artist: songArtist,
              sourceLanguage,
            },
          } as any)}
        >
          <View style={styles.wavyEqButtonInner}>
            <Ionicons name="language" size={22} color="#fff" />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.wavyEqButtonTitle}>Translate & Re-Sing</Text>
              <Text style={styles.wavyEqButtonSub}>Full AI pipeline: isolate, translate, re-sing</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.6)" />
          </View>
        </TouchableOpacity>

        {/* Translation Studio - Voice Clone / Record / AI Voice */}
        <TouchableOpacity
          style={[styles.wavyEqButton, { backgroundColor: 'rgba(139,92,246,0.15)', borderColor: 'rgba(139,92,246,0.3)' }]}
          onPress={() => router.push({
            pathname: "/song-translation-studio",
            params: {
              title: songTitle,
              artist: songArtist,
              sourceLanguage,
            },
          } as any)}
        >
          <View style={styles.wavyEqButtonInner}>
            <Ionicons name="color-wand" size={22} color="#8B5CF6" />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.wavyEqButtonTitle}>Translation Studio</Text>
              <Text style={styles.wavyEqButtonSub}>Clone your voice, record, or use AI singer</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.6)" />
          </View>
        </TouchableOpacity>

        {/* Start Lesson Button */}
        <TouchableOpacity
          style={styles.lessonButton}
          onPress={() => {
            const lyricsText = lyrics.map(l => l.original).join('\n');
            router.push({
              pathname: "/song-lesson-breakdown",
              params: { title: songTitle, artist: songArtist, lyrics: lyricsText, sourceLanguage, targetLanguage },
            } as any);
          }}
        >
          <Ionicons name="school" size={20} color={Colors.textPrimary} />
          <Text style={styles.lessonButtonText}>Start Full Lesson from This Song</Text>
        </TouchableOpacity>

        {/* Share / Duet */}
        <View style={styles.socialButtons}>
          <TouchableOpacity style={styles.socialButton}>
            <Ionicons name="people" size={18} color={Colors.secondary} />
            <Text style={styles.socialButtonText}>Duet</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton}>
            <Ionicons name="share-social" size={18} color={Colors.secondary} />
            <Text style={styles.socialButtonText}>Share Clip</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton}>
            <Ionicons name="heart" size={18} color={Colors.accent} />
            <Text style={styles.socialButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* Share What You Learned Card */}
        {lyrics.length > 0 && (
          <ShareCard
            data={{
              type: "song_lyric",
              content: lyrics[0]?.original || lyrics[0]?.original || "",
              translation: lyrics[0]?.translated || lyrics[0]?.translated || "",
              context: `${songTitle} - ${songArtist}`,
              source: songArtist,
              language: sourceLanguage,
            }}
          />
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Streak Message Toast */}
      {streakMessage && (
        <View style={styles.streakToast}>
          <Text style={styles.streakToastText}>{streakMessage}</Text>
        </View>
      )}

      {/* Streak XP Badge */}
      {greenStreak > 0 && (
        <View style={styles.streakBadge}>
          <Text style={styles.streakBadgeText}>
            🔥 {greenStreak} line{greenStreak > 1 ? "s" : ""}
          </Text>
          {streakXP > 0 && (
            <Text style={styles.streakXPText}>+{streakXP} XP</Text>
          )}
        </View>
      )}

      {/* Confetti Animation */}
      <ConfettiAnimation visible={showConfetti} onComplete={() => setShowConfetti(false)} />
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerTitle: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  albumArtContainer: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  albumArt: {
    width: width * 0.45,
    height: width * 0.45,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.glowBorder,
    shadowColor: Colors.glow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
  },
  songTitle: {
    fontSize: FontSize.xl,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  songArtist: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  songTranslation: {
    fontSize: FontSize.sm,
    color: Colors.secondary,
    marginTop: 8,
    fontWeight: "600",
  },
  songActions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 32,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  songActionBtn: {
    alignItems: "center",
    gap: 4,
  },
  songActionLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  modeContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  modeLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    fontWeight: "600",
  },
  modeButtons: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.sm,
    gap: 6,
  },
  modeButtonActive: {
    backgroundColor: Colors.secondary,
  },
  modeButtonText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  modeButtonTextActive: {
    color: Colors.textPrimary,
  },
  progressContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    position: "relative",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.gold,
    borderRadius: 2,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  progressDot: {
    position: "absolute",
    top: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.gold,
    marginLeft: -6,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  timeText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    paddingVertical: Spacing.md,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.textPrimary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(0, 170, 255, 0.40)",
    shadowColor: Colors.glow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },

  // ─── Loop Indicator ─────────────────────────────────────────────────────
  loopIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 8,
    marginHorizontal: Spacing.lg,
    marginBottom: 8,
    backgroundColor: Colors.goldGlow,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
  },
  loopIndicatorText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.gold,
  },

  // ─── Synced Lyrics Section ──────────────────────────────────────────────
  syncedLyricsSection: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    backgroundColor: "rgba(0, 10, 20, 0.6)",
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.glowBorder,
    overflow: "hidden",
  },
  syncedLyricsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 170, 255, 0.12)",
  },
  syncedLyricsHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  syncedLyricsHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  syncedLyricsTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  loadingBadge: {
    fontSize: 10,
    color: Colors.glow,
    fontWeight: "600",
    backgroundColor: "rgba(0, 170, 255, 0.12)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  karaokeToggle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  karaokeToggleActive: {
    backgroundColor: "rgba(255, 184, 0, 0.2)",
    borderColor: Colors.goldBorder,
  },
  karaokeToggleText: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.textMuted,
  },
  karaokeToggleTextActive: {
    color: Colors.gold,
  },
  toggleBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  dynamicErrorBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(255, 45, 45, 0.08)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 45, 45, 0.15)",
  },
  dynamicErrorText: {
    fontSize: 11,
    color: "rgba(255, 120, 120, 0.8)",
  },
  retryText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.glow,
  },
  lyricsModePicker: {
    flexDirection: "row",
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 6,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 8,
    padding: 3,
  },
  lyricsModeBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: "center",
    borderRadius: 6,
  },
  lyricsModeBtnActive: {
    backgroundColor: "rgba(0, 170, 255, 0.18)",
    borderWidth: 1,
    borderColor: "rgba(0, 170, 255, 0.35)",
  },
  lyricsModeBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.45)",
  },
  lyricsModeBtnTextActive: {
    color: Colors.glow,
  },
  lyricsScrollArea: {
    maxHeight: 360,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  syncedLine: {
    marginBottom: 4,
  },
  syncedLineTouchable: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "transparent",
  },
  syncedLineActive: {
    backgroundColor: "rgba(0, 170, 255, 0.08)",
    borderLeftColor: Colors.glow,
  },
  syncedLineLooping: {
    backgroundColor: "rgba(255, 184, 0, 0.08)",
    borderLeftColor: Colors.gold,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
  },
  lineTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  lineTimestamp: {
    fontSize: 10,
    color: "rgba(255,255,255,0.25)",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  loopBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  loopBtnActive: {
    backgroundColor: Colors.goldGlow,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
  },
  syncedOriginal: {
    fontSize: 16,
    fontWeight: "600",
    color: "rgba(255,255,255,0.4)",
    lineHeight: 22,
  },
  syncedOriginalActive: {
    color: "#FFFFFF",
    fontWeight: "700",
    textShadowColor: "rgba(0, 170, 255, 0.35)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  syncedPast: {
    color: "rgba(255,255,255,0.22)",
  },
  syncedTranslation: {
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(0, 170, 255, 0.35)",
    marginTop: 3,
    lineHeight: 18,
  },
  syncedTranslationActive: {
    color: Colors.glow,
    fontWeight: "600",
    textShadowColor: "rgba(0, 204, 255, 0.25)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  syncedTranslationPast: {
    color: "rgba(0, 170, 255, 0.18)",
  },
  syncedTranslationLarge: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
  },
  activeIndicator: {
    position: "absolute",
    right: 10,
    top: "50%",
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.glow,
    shadowColor: Colors.glow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },

  // ─── Karaoke Word-by-Word ───────────────────────────────────────────────
  karaokeWordsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 184, 0, 0.15)",
    gap: 4,
  },
  karaokeWordWrapper: {
    alignItems: "center",
  },
  karaokeWord: {
    fontSize: 15,
    fontWeight: "600",
    color: "rgba(255,255,255,0.3)",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  karaokeWordActive: {
    color: Colors.gold,
    fontWeight: "800",
    backgroundColor: "rgba(255, 184, 0, 0.12)",
    textShadowColor: "rgba(255, 184, 0, 0.4)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  karaokeWordPast: {
    color: "rgba(255,255,255,0.5)",
  },
  karaokeWordTranslation: {
    fontSize: 9,
    color: Colors.gold,
    fontWeight: "600",
    marginTop: 1,
  },

  expandBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 170, 255, 0.12)",
  },
  expandBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.glow,
  },

  // ─── Sing Along ─────────────────────────────────────────────────────────
  singAlongContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: 10,
  },
  singAlongButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.accent + "20",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: 8,
  },
  singAlongText: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.accent,
  },
  scoreContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.success + "20",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  scoreLabel: {
    fontSize: FontSize.sm,
    color: Colors.success,
    fontWeight: "600",
  },
  scoreValue: {
    fontSize: FontSize.lg,
    color: Colors.success,
    fontWeight: "800",
  },
  voiceCloneButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.goldGlow,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  voiceCloneText: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.warning,
  },
  proBadge: {
    backgroundColor: Colors.warning,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  proBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: Colors.primary,
  },

  // ─── Grammar Breakdown ──────────────────────────────────────────────────
  breakdownToggleContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  breakdownToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.surfaceCard,
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  breakdownToggleText: {
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.secondary,
  },
  breakdownContainer: {
    backgroundColor: Colors.surfaceCard,
    marginHorizontal: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  breakdownTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  breakdownSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    fontStyle: "italic",
  },
  breakdownItem: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  breakdownWordContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  breakdownWord: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.secondary,
  },
  breakdownTypeBadge: {
    backgroundColor: Colors.secondary + "20",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  breakdownType: {
    fontSize: FontSize.xs,
    color: Colors.secondary,
    fontWeight: "600",
  },
  breakdownInfo: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },

  // ─── Actions ────────────────────────────────────────────────────────────
  lessonButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.secondary,
    marginHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 2,
    borderRadius: BorderRadius.md,
    gap: 8,
    marginBottom: Spacing.lg,
  },
  lessonButtonText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  socialButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: 6,
  },
  socialButtonText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  wavyEqButton: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    backgroundColor: "#2D1B69",
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.5)",
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  wavyEqButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md + 4,
    paddingHorizontal: Spacing.lg,
  },
  wavyEqButtonTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: "#fff",
  },
  wavyEqButtonSub: {
    fontSize: FontSize.xs,
    color: "rgba(236, 72, 153, 0.9)",
    fontWeight: "500",
    marginTop: 2,
  },

  // ─── Speed Control ─────────────────────────────────────────────────────
  speedControlRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 4,
    marginBottom: 4,
  },
  speedChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.surfaceCard,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  speedChipActive: {
    backgroundColor: Colors.goldGlow,
    borderColor: Colors.goldBorder,
  },
  speedChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  speedChipTextActive: {
    color: Colors.gold,
  },
  speedHint: {
    fontSize: 11,
    color: Colors.textMuted,
    fontStyle: "italic",
  },
  speedMenuDropdown: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  speedMenuTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textSecondary,
    marginBottom: 8,
    textAlign: "center",
  },
  speedMenuOptions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  speedMenuOption: {
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "transparent",
  },
  speedMenuOptionActive: {
    backgroundColor: Colors.goldGlow,
    borderColor: Colors.goldBorder,
  },
  speedMenuOptionText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  speedMenuOptionTextActive: {
    color: Colors.gold,
  },
  speedMenuOptionHint: {
    fontSize: 9,
    color: Colors.textMuted,
    marginTop: 2,
  },

  // ─── Karaoke Word Scoring ──────────────────────────────────────────────
  karaokeWordBubble: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "transparent",
  },
  karaokeWordScoreGreen: {
    backgroundColor: "rgba(0, 255, 136, 0.12)",
    borderColor: "rgba(0, 255, 136, 0.4)",
  },
  karaokeWordScoreYellow: {
    backgroundColor: "rgba(255, 214, 0, 0.12)",
    borderColor: "rgba(255, 214, 0, 0.4)",
  },
  karaokeWordScoreRed: {
    backgroundColor: "rgba(255, 68, 68, 0.12)",
    borderColor: "rgba(255, 68, 68, 0.4)",
  },
  karaokeWordSaved: {
    borderColor: "rgba(0, 170, 255, 0.4)",
    borderStyle: "dashed" as any,
  },
  scoreIndicatorDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 2,
    alignSelf: "center",
  },

  // ─── Sing Along Enhanced ───────────────────────────────────────────────
  singAlongButtonActive: {
    backgroundColor: Colors.error + "20",
    borderWidth: 1,
    borderColor: Colors.error + "40",
  },
  recordingPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
  },
  singAlongHint: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: "center",
    fontStyle: "italic",
  },
  scoreSublabel: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  vocabHintRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.04)",
    marginTop: 4,
  },
  vocabHintText: {
    fontSize: 10,
    color: Colors.textMuted,
    fontStyle: "italic",
  },

  // ─── Streak Rewards ────────────────────────────────────────────────────
  streakToast: {
    position: "absolute",
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: "rgba(255, 184, 0, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 184, 0, 0.4)",
    borderRadius: BorderRadius.md,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    zIndex: 100,
  },
  streakToastText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.gold,
    textAlign: "center",
  },
  streakBadge: {
    position: "absolute",
    top: 60,
    right: 16,
    backgroundColor: "rgba(255, 68, 0, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(255, 68, 0, 0.3)",
    borderRadius: BorderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    zIndex: 99,
  },
  streakBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FF6B00",
  },
  streakXPText: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.gold,
  },
});
