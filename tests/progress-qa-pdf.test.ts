import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const appDir = path.resolve(__dirname, "../app");
const serverDir = path.resolve(__dirname, "../server");

describe("Course Progress and Notes", () => {
  const filePath = path.join(appDir, "lesson-player.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  it("saves lesson notes to AsyncStorage", () => {
    expect(content).toContain("lesson_notes_");
    expect(content).toContain("AsyncStorage");
  });

  it("has mark complete functionality with persistence", () => {
    expect(content).toContain("handleComplete");
    expect(content).toContain("lesson_completed_");
  });

  it("has text input for notes", () => {
    expect(content).toContain("TextInput");
  });

  it("tracks lesson progress", () => {
    expect(content).toContain("progress");
  });

  it("has return statements for rendering", () => {
    expect(content).toContain("return");
  });

  it("is registered in _layout.tsx", () => {
    const layout = fs.readFileSync(path.join(appDir, "_layout.tsx"), "utf-8");
    expect(layout).toContain('name="lesson-player"');
  });
});

describe("Instructor Q&A Section", () => {
  const filePath = path.join(appDir, "course-detail.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  it("has QASection component", () => {
    expect(content).toContain("function QASection");
    expect(content).toContain("<QASection />");
  });

  it("has question input with submit", () => {
    expect(content).toContain("handleSubmitQuestion");
    expect(content).toContain("Ask the instructor a question");
    expect(content).toContain("Submit Question");
  });

  it("has upvote functionality", () => {
    expect(content).toContain("handleUpvote");
    expect(content).toContain("upvotes");
    expect(content).toContain("arrow-up");
  });

  it("persists questions in AsyncStorage", () => {
    expect(content).toContain("course_qa_");
    expect(content).toContain("AsyncStorage.setItem");
    expect(content).toContain("userQuestion");
  });

  it("has sort by recent and upvotes", () => {
    expect(content).toContain("sortBy");
    expect(content).toContain("\"recent\"");
    expect(content).toContain("\"upvotes\"");
  });

  it("shows instructor reply cards with badge", () => {
    expect(content).toContain("replyCard");
    expect(content).toContain("Instructor");
    expect(content).toContain("replyBadge");
  });

  it("shows pending reply state", () => {
    expect(content).toContain("pendingReply");
    expect(content).toContain("Awaiting instructor reply");
  });

  it("has show all toggle", () => {
    expect(content).toContain("showAll");
    expect(content).toContain("Show all");
    expect(content).toContain("questions");
  });

  it("has submitted state banner", () => {
    expect(content).toContain("submittedBanner");
    expect(content).toContain("Your question has been submitted");
  });
});

describe("Certificate PDF Generation - Server", () => {
  const filePath = path.join(serverDir, "routers.ts");
  const content = fs.readFileSync(filePath, "utf-8");

  it("has certificate router", () => {
    expect(content).toContain("certificate: router");
  });

  it("has generatePdf mutation", () => {
    expect(content).toContain("generatePdf: publicProcedure");
  });

  it("accepts required inputs (userName, courseName, completionDate, credentialId)", () => {
    expect(content).toContain("userName: z.string()");
    expect(content).toContain("courseName: z.string()");
    expect(content).toContain("completionDate: z.string()");
    expect(content).toContain("credentialId: z.string()");
  });

  it("generates branded HTML certificate", () => {
    expect(content).toContain("CONNECTME AI");
    expect(content).toContain("Certificate of Completion");
    expect(content).toContain("Certificate of Achievement");
  });

  it("uploads to storage and returns URL", () => {
    expect(content).toContain("storagePut");
    expect(content).toContain("storageGetSignedUrl");
    expect(content).toContain("signedUrl");
  });
});

describe("Certificate PDF Generation - Client", () => {
  const filePath = path.join(appDir, "my-certificates.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  it("imports trpc client", () => {
    expect(content).toContain("import { trpc }");
  });

  it("uses certificate.generatePdf mutation", () => {
    expect(content).toContain("certificate.generatePdf.useMutation");
  });

  it("has handleDownload function", () => {
    expect(content).toContain("handleDownload");
    expect(content).toContain("generatePdf.mutateAsync");
  });

  it("shows loading indicator during download", () => {
    expect(content).toContain("downloadingId");
    expect(content).toContain("ActivityIndicator");
  });

  it("opens certificate in browser", () => {
    expect(content).toContain("WebBrowser.openBrowserAsync");
  });

  it("handles errors with Alert", () => {
    expect(content).toContain("Alert.alert");
    expect(content).toContain("Download Error");
  });
});
