import { TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export function ChatWallpaperShortcut() {
  const router = useRouter();
  const colors = useColors();

  return (
    <TouchableOpacity
      onPress={() => router.push("/chat-theme-picker" as any)}
      style={{ padding: 8, marginRight: 4 }}
      activeOpacity={0.6}
    >
      <IconSymbol name="paperplane.fill" size={20} color={colors.muted} />
    </TouchableOpacity>
  );
}
