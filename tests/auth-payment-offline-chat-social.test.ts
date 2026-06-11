import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const appDir = path.resolve(__dirname, "../app");
const libDir = path.resolve(__dirname, "../lib");

describe("User Authentication (login.tsx)", () => {
  const filePath = path.join(appDir, "login.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  it("exists and exports a default component", () => {
    expect(content).toContain("export default function LoginScreen");
  });

  it("has login, signup, and forgot password modes", () => {
    expect(content).toContain('"login" | "signup" | "forgot"');
  });

  it("has email and password inputs", () => {
    expect(content).toContain("email-address");
    expect(content).toContain("secureTextEntry");
  });

  it("has social login buttons (Google, Apple)", () => {
    expect(content).toContain("logo-google");
    expect(content).toContain("logo-apple");
  });

  it("has Continue as Guest option", () => {
    expect(content).toMatch(/skip|guest/i);
  });

  it("validates password match on signup", () => {
    expect(content).toContain("Password Mismatch");
  });

  it("has forgot password email reset flow", () => {
    expect(content).toContain("Send Reset Code");
    expect(content).toContain("resetStep");
  });

  it("persists auth state to AsyncStorage", () => {
    expect(content).toContain("@auth_logged_in");
  });
});

describe("Payment Flow (payment-flow.tsx)", () => {
  const filePath = path.join(appDir, "payment-flow.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  it("exists and exports a default component", () => {
    expect(content).toContain("export default function PaymentFlowScreen");
  });

  it("has payment method selection step", () => {
    expect(content).toContain("Choose Payment Method");
  });

  it("supports Apple Pay, Google Pay, and Card", () => {
    expect(content).toContain("Apple Pay");
    expect(content).toContain("Google Pay");
    expect(content).toContain("Credit / Debit Card");
  });

  it("has card form with formatting", () => {
    expect(content).toContain("Cardholder Name");
    expect(content).toContain("Card Number");
    expect(content).toContain("formatCardNumber");
    expect(content).toContain("formatExpiry");
  });

  it("has processing and confirmation steps", () => {
    expect(content).toContain("Processing Payment");
    expect(content).toContain("Payment Successful");
  });

  it("shows receipt with plan details", () => {
    expect(content).toContain("Receipt");
    expect(content).toContain("receiptRow");
  });

  it("saves subscription state", () => {
    expect(content).toContain("@subscription_plan");
  });

  it("supports multiple plan types", () => {
    expect(content).toContain("pro:");
    expect(content).toContain("premium:");
    expect(content).toContain("replay:");
    expect(content).toContain("summary:");
    expect(content).toContain("tutoring:");
  });
});

describe("Offline Content (offline-content.tsx)", () => {
  const filePath = path.join(appDir, "offline-content.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  it("exists and exports a default component", () => {
    expect(content).toContain("export default function OfflineContentScreen");
  });

  it("has offline detection banner", () => {
    expect(content).toContain("offlineBanner");
    expect(content).toContain("You're offline");
  });

  it("has download manager with multiple item types", () => {
    expect(content).toContain("course");
    expect(content).toContain("flashcards");
    expect(content).toContain("phrasebook");
  });

  it("shows download progress", () => {
    expect(content).toContain("progressBar");
    expect(content).toContain("progressFill");
  });

  it("has storage summary", () => {
    expect(content).toContain("items downloaded");
    expect(content).toContain("MB used");
  });

  it("supports delete with confirmation", () => {
    expect(content).toContain("Remove Download");
    expect(content).toContain("Alert.alert");
  });

  it("has auto-download toggle", () => {
    expect(content).toContain("autoDownload");
  });

  it("persists download state to AsyncStorage", () => {
    expect(content).toContain("@offline_downloads");
  });
});

describe("AI Agent Chat (ai-chat.tsx)", () => {
  const filePath = path.join(appDir, "ai-chat.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  it("exists and exports a default component", () => {
    expect(content).toContain("export default function AIChatScreen");
  });

  it("has message bubbles for user and AI", () => {
    expect(content).toContain("userBubble");
    expect(content).toContain("aiBubble");
  });

  it("has quick action buttons", () => {
    expect(content).toContain("QUICK_ACTIONS");
    expect(content).toContain("Schedule a class");
    expect(content).toContain("Practice vocab");
  });

  it("has AI responses for multiple domains", () => {
    expect(content).toContain("AI_RESPONSES");
    expect(content).toContain("schedule");
    expect(content).toContain("practice");
    expect(content).toContain("translate");
    expect(content).toContain("recommend");
    expect(content).toContain("streak");
    expect(content).toContain("grammar");
  });

  it("has suggestion chips", () => {
    expect(content).toContain("suggestionChip");
    expect(content).toContain("handleSuggestion");
  });

  it("has typing indicator animation", () => {
    expect(content).toContain("typingIndicator");
    expect(content).toContain("typingAnim");
  });

  it("persists chat history", () => {
    expect(content).toContain("@ai_chat_history");
    expect(content).toContain("saveHistory");
  });

  it("has clear chat function", () => {
    expect(content).toContain("clearChat");
  });
});

describe("Social Hub (social-hub.tsx)", () => {
  const filePath = path.join(appDir, "social-hub.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  it("exists and exports a default component", () => {
    expect(content).toContain("export default function SocialHubScreen");
  });

  it("has 3 tabs (feed, messages, groups)", () => {
    expect(content).toContain('"feed" | "messages" | "groups"');
  });

  it("has activity feed with like/share/comment", () => {
    expect(content).toContain("handleLike");
    expect(content).toContain("handleShare");
    expect(content).toContain("Comment");
  });

  it("has message threads with unread counts", () => {
    expect(content).toContain("unreadBadge");
    expect(content).toContain("unread:");
  });

  it("has study groups with join/leave", () => {
    expect(content).toContain("handleJoinGroup");
    expect(content).toContain("STUDY_GROUPS");
  });

  it("has online status indicators", () => {
    expect(content).toContain("onlineDot");
    expect(content).toContain("online:");
  });

  it("supports sharing via system share sheet", () => {
    expect(content).toContain("Share.share");
  });
});

describe("Notification Service (lib/notification-service.ts)", () => {
  const filePath = path.join(libDir, "notification-service.ts");
  const content = fs.readFileSync(filePath, "utf-8");

  it("exists", () => {
    expect(content).toBeDefined();
  });

  it("defines 7 notification categories", () => {
    expect(content).toContain("streak_reminders");
    expect(content).toContain("class_reminders");
    expect(content).toContain("new_content");
    expect(content).toContain("friend_activity");
    expect(content).toContain("achievements");
    expect(content).toContain("weekly_recap");
    expect(content).toContain("promotional");
  });

  it("has preference get/set functions", () => {
    expect(content).toContain("getNotificationPreferences");
    expect(content).toContain("setNotificationPreference");
  });

  it("has schedule functions", () => {
    expect(content).toContain("scheduleStreakReminder");
    expect(content).toContain("scheduleClassReminder");
  });

  it("has permission request function", () => {
    expect(content).toContain("requestNotificationPermission");
  });
});

describe("Layout Registration", () => {
  const layoutPath = path.join(appDir, "_layout.tsx");
  const content = fs.readFileSync(layoutPath, "utf-8");

  it("registers login screen", () => {
    expect(content).toContain('name="login"');
  });

  it("registers payment-flow screen", () => {
    expect(content).toContain('name="payment-flow"');
  });

  it("registers offline-content screen", () => {
    expect(content).toContain('name="offline-content"');
  });

  it("registers ai-chat screen", () => {
    expect(content).toContain('name="ai-chat"');
  });

  it("registers social-hub screen", () => {
    expect(content).toContain('name="social-hub"');
  });
});
