# Screen Template Reference for ConnectWorld AI

## Required Imports Pattern
```tsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  FlatList, Platform, Switch, Alert, Modal, TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
```

## Theme Colors (from useColors hook)
- `colors.primary` - accent/tint color
- `colors.background` - screen background
- `colors.foreground` - primary text
- `colors.muted` - secondary text
- `colors.surface` - card backgrounds
- `colors.border` - borders/dividers
- `colors.success` - success states
- `colors.warning` - warning states
- `colors.error` - error states

## Alternative Theme (from Colors constant - neon futuristic)
```tsx
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";
```
Use Colors.primary (#040810), Colors.secondary (#00AAFF), Colors.glow (#00CCFF), Colors.gold (#FFB800), Colors.surfaceCard (#0A1628), Colors.textPrimary (#FFFFFF), Colors.textSecondary (#7EB8E0), Colors.textMuted (#3D5A7A), Colors.border, Colors.success, Colors.error, Colors.warning.

## Screen Structure
```tsx
export default function ScreenName() {
  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-background">
      {/* content */}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({ /* ... */ });
```

## Rules
- Use FlatList for lists, never ScrollView with .map()
- Use StyleSheet.create() outside component
- Never use className on Pressable
- Use Haptics sparingly (Light for taps, Medium for toggles)
- Export default function, not named export
- File must be a complete, self-contained screen
- Use the neon Colors constant theme (import from "../constants/Colors")
