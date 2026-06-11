// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "music.note": "music-note",
  "book.fill": "school",
  "person.fill": "person",
  "translate": "translate",
  "message.fill": "chat",
  "phone.fill": "phone",
  "magnifyingglass": "search",
  "calendar": "event",
  "video.fill": "videocam",
  "video.slash.fill": "videocam-off",
  "mic.fill": "mic",
  "mic.slash.fill": "mic-off",
  "phone.down.fill": "call-end",
  "arrow.triangle.2.circlepath.camera": "flip-camera-ios",
  "speaker.wave.2.fill": "volume-up",
  "phone.arrow.up.right": "phone-forwarded",
  "phone.arrow.down.left": "phone-callback",
  "phone.badge.plus": "add-call",
  "tv.fill": "live-tv",
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
