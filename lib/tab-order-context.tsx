import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TAB_ORDER_KEY = "@linguavibe_tab_order";

// Default visible tab order (tab file names)
export const DEFAULT_TAB_ORDER = [
  "index",
  "explore",
  "tv",
  "calendar",
  "translate",
  "teacher",
  "profile",
];

// Tab metadata for display in reorder UI
export const TAB_META: Record<string, { label: string; icon: string; iconFocused: string }> = {
  index: { label: "Home", icon: "globe-outline", iconFocused: "globe" },
  explore: { label: "Explore", icon: "search-outline", iconFocused: "search" },
  tv: { label: "TV", icon: "tv-outline", iconFocused: "tv" },
  calendar: { label: "Schedule", icon: "calendar-outline", iconFocused: "calendar" },
  translate: { label: "Translate", icon: "language-outline", iconFocused: "language" },
  teacher: { label: "Learn", icon: "book-outline", iconFocused: "book" },
  profile: { label: "Profile", icon: "person-outline", iconFocused: "person" },
};

interface TabOrderContextType {
  tabOrder: string[];
  setTabOrder: (order: string[]) => Promise<void>;
  resetTabOrder: () => Promise<void>;
  isLoaded: boolean;
}

const TabOrderContext = createContext<TabOrderContextType>({
  tabOrder: DEFAULT_TAB_ORDER,
  setTabOrder: async () => {},
  resetTabOrder: async () => {},
  isLoaded: false,
});

export function TabOrderProvider({ children }: { children: React.ReactNode }) {
  const [tabOrder, setTabOrderState] = useState<string[]>(DEFAULT_TAB_ORDER);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(TAB_ORDER_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Validate that all default tabs are present
          const valid = DEFAULT_TAB_ORDER.every((t) => parsed.includes(t));
          if (valid && parsed.length === DEFAULT_TAB_ORDER.length) {
            setTabOrderState(parsed);
          }
        }
      } catch (e) {
        // ignore
      }
      setIsLoaded(true);
    })();
  }, []);

  const setTabOrder = useCallback(async (order: string[]) => {
    setTabOrderState(order);
    await AsyncStorage.setItem(TAB_ORDER_KEY, JSON.stringify(order));
  }, []);

  const resetTabOrder = useCallback(async () => {
    setTabOrderState(DEFAULT_TAB_ORDER);
    await AsyncStorage.removeItem(TAB_ORDER_KEY);
  }, []);

  return (
    <TabOrderContext.Provider value={{ tabOrder, setTabOrder, resetTabOrder, isLoaded }}>
      {children}
    </TabOrderContext.Provider>
  );
}

export function useTabOrder() {
  return useContext(TabOrderContext);
}
