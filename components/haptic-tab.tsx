import { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import { PlatformPressable } from "@react-navigation/elements";
import * as Haptics from "expo-haptics";
import { shouldPlayHaptic } from "@/lib/sound-settings";

export function HapticTab(props: BottomTabBarButtonProps) {
  return (
    <PlatformPressable
      {...props}
      onPressIn={(ev) => {
        if (process.env.EXPO_OS === "ios") {
          // Add a soft haptic feedback when pressing down on the tabs (gated by preference).
          shouldPlayHaptic().then((on) => {
            if (on) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          });
        }
        props.onPressIn?.(ev);
      }}
    />
  );
}
