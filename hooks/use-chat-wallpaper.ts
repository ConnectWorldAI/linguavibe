import { useState, useEffect } from "react";
import { getChatTheme, type ChatTheme } from "@/lib/chat-media-store";

/**
 * Hook to load the chat wallpaper/theme for a given contact.
 * Returns the theme (including imageUri for custom photo wallpapers)
 * and a reload function to refresh after changes.
 */
export function useChatWallpaper(contactId: string) {
  const [theme, setTheme] = useState<ChatTheme | null>(null);

  const load = async () => {
    if (!contactId) return;
    const t = await getChatTheme(contactId);
    setTheme(t);
  };

  useEffect(() => {
    load();
  }, [contactId]);

  return { theme, reload: load };
}
