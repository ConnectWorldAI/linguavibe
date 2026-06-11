import { describe, it, expect, beforeAll } from "vitest";
import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "..");

function readFile(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf-8");
}

describe("Quick Actions Widget", () => {
  let widgetSrc: string;

  beforeAll(() => {
    widgetSrc = readFile("components/quick-actions-widget.tsx");
  });

  it("exports a QuickActionsWidget component", () => {
    expect(widgetSrc).toContain("export");
    expect(widgetSrc).toContain("QuickActionsWidget");
  });

  it("shows contextual suggestions based on time of day", () => {
    expect(widgetSrc).toContain("getHours");
  });

  it("includes morning, afternoon, and evening time periods", () => {
    // Should have time-based logic
    expect(widgetSrc).toMatch(/morning|Morning|AM/i);
    expect(widgetSrc).toMatch(/evening|Evening|PM|night/i);
  });

  it("checks recent activity from AsyncStorage", () => {
    expect(widgetSrc).toContain("AsyncStorage");
  });

  it("navigates to features when actions are tapped", () => {
    expect(widgetSrc).toContain("router.push");
  });

  it("uses haptic feedback on action tap", () => {
    expect(widgetSrc).toContain("Haptics");
  });

  it("is rendered on the home screen for non-new users", () => {
    const homeSrc = readFile("app/(tabs)/index.tsx");
    expect(homeSrc).toContain("QuickActionsWidget");
    expect(homeSrc).toContain("!isNewUser");
  });
});

describe("Settings Screen - Notification Quick Toggles", () => {
  let settingsSrc: string;

  beforeAll(() => {
    settingsSrc = readFile("app/settings.tsx");
  });

  it("imports notification preference functions", () => {
    expect(settingsSrc).toContain("isWeeklyNotificationEnabled");
    expect(settingsSrc).toContain("getGoalNotificationPrefs");
  });

  it("has weekly report toggle state", () => {
    expect(settingsSrc).toContain("weeklyReportEnabled");
    expect(settingsSrc).toContain("setWeeklyReportEnabled");
  });

  it("has goal reminders toggle state", () => {
    expect(settingsSrc).toContain("goalRemindersEnabled");
    expect(settingsSrc).toContain("setGoalRemindersEnabled");
  });

  it("renders Switch components for notification toggles", () => {
    expect(settingsSrc).toContain("Switch");
    expect(settingsSrc).toContain("onValueChange={handleToggleWeeklyReport}");
    expect(settingsSrc).toContain("onValueChange={handleToggleGoalReminders}");
  });

  it("has a link to All Settings (notification-settings)", () => {
    expect(settingsSrc).toContain("All Settings");
    expect(settingsSrc).toContain("/notification-settings");
  });

  it("loads notification preferences on mount", () => {
    expect(settingsSrc).toContain("loadNotifPrefs");
  });

  it("calls toggleWeeklyNotification when toggled", () => {
    expect(settingsSrc).toContain("toggleWeeklyNotification");
  });

  it("calls setGoalNotificationPrefs when toggled", () => {
    expect(settingsSrc).toContain("setGoalNotificationPrefs");
  });

  it("has theme toggle (already existing)", () => {
    expect(settingsSrc).toContain("cycleTheme");
    expect(settingsSrc).toContain("themeMode");
  });

  it("has account management (already existing)", () => {
    expect(settingsSrc).toContain("Log Out");
    expect(settingsSrc).toContain("Switch Account");
  });

  it("has notification quick section styles", () => {
    expect(settingsSrc).toContain("notifQuickSection");
    expect(settingsSrc).toContain("notifQuickHeader");
    expect(settingsSrc).toContain("notifQuickRow");
  });
});

describe("Home Screen Search Bar", () => {
  let homeSrc: string;

  beforeAll(() => {
    homeSrc = readFile("app/(tabs)/index.tsx");
  });

  it("imports TextInput from react-native", () => {
    expect(homeSrc).toContain("TextInput");
  });

  it("has search query state", () => {
    expect(homeSrc).toContain("searchQuery");
    expect(homeSrc).toContain("setSearchQuery");
  });

  it("has show search results state", () => {
    expect(homeSrc).toContain("showSearchResults");
    expect(homeSrc).toContain("setShowSearchResults");
  });

  it("renders a search bar with placeholder", () => {
    expect(homeSrc).toContain("Search features...");
  });

  it("filters EXPLORE_FEATURES by search query", () => {
    expect(homeSrc).toContain("EXPLORE_FEATURES.filter");
    expect(homeSrc).toContain("searchQuery.toLowerCase()");
  });

  it("limits search results to 6 items", () => {
    expect(homeSrc).toContain(".slice(0, 6)");
  });

  it("shows no results message when nothing matches", () => {
    expect(homeSrc).toContain("No features found");
  });

  it("has a clear button that resets search", () => {
    expect(homeSrc).toContain("close-circle");
    expect(homeSrc).toContain("setSearchQuery(\"\")");
  });

  it("navigates to feature and tracks usage on result tap", () => {
    expect(homeSrc).toContain("trackFeatureUsed(item.id)");
    expect(homeSrc).toContain("router.push(item.route");
  });

  it("has search bar styles", () => {
    expect(homeSrc).toContain("searchContainer");
    expect(homeSrc).toContain("searchBar");
    expect(homeSrc).toContain("searchInput");
    expect(homeSrc).toContain("searchResults");
    expect(homeSrc).toContain("searchResultItem");
  });

  it("uses search icon from Ionicons", () => {
    // The search bar should have a search icon
    const searchSection = homeSrc.substring(
      homeSrc.indexOf("SEARCH BAR"),
      homeSrc.indexOf("QUICK ACTIONS WIDGET")
    );
    expect(searchSection).toContain("search");
  });
});
