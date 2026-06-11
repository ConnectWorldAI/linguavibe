import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "..");

describe("Feature 1: Persistent Mini-Player", () => {
  it("music-player-context.tsx exists with MusicPlayerProvider and useMusicPlayer exports", () => {
    const file = fs.readFileSync(path.join(ROOT, "lib/music-player-context.tsx"), "utf-8");
    expect(file).toContain("export function MusicPlayerProvider");
    expect(file).toContain("export function useMusicPlayer");
    expect(file).toContain("currentTrack");
    expect(file).toContain("isPlaying");
    expect(file).toContain("progress");
    expect(file).toContain("play");
    expect(file).toContain("pause");
    expect(file).toContain("resume");
    expect(file).toContain("dismiss");
  });

  it("mini-player.tsx component exists with play/pause and dismiss controls", () => {
    const file = fs.readFileSync(path.join(ROOT, "components/mini-player.tsx"), "utf-8");
    expect(file).toContain("export function MiniPlayer");
    expect(file).toContain("useMusicPlayer");
    expect(file).toContain("handlePlayPause");
    expect(file).toContain("handleDismiss");
    expect(file).toContain("progressFill");
  });

  it("MusicPlayerProvider is wired in _layout.tsx", () => {
    const layout = fs.readFileSync(path.join(ROOT, "app/_layout.tsx"), "utf-8");
    expect(layout).toContain("MusicPlayerProvider");
    expect(layout).toContain("<MiniPlayer");
    // Verify proper nesting: open before close
    const openIdx = layout.indexOf("<MusicPlayerProvider>");
    const closeIdx = layout.indexOf("</MusicPlayerProvider>");
    expect(openIdx).toBeGreaterThan(-1);
    expect(closeIdx).toBeGreaterThan(openIdx);
  });
});

describe("Feature 2: Video Call Direct Routing", () => {
  it("explore-app.tsx passes tab=video param for Video Call option", () => {
    const file = fs.readFileSync(path.join(ROOT, "app/explore-app.tsx"), "utf-8");
    expect(file).toContain('params: { tab: "video" }');
    expect(file).toContain("option.params");
  });

  it("calls.tsx reads tab param from useLocalSearchParams", () => {
    const file = fs.readFileSync(path.join(ROOT, "app/(tabs)/calls.tsx"), "utf-8");
    expect(file).toContain("useLocalSearchParams");
    expect(file).toContain("params.tab");
  });
});

describe("Feature 3: Saved Shortcut on Profile", () => {
  it("profile.tsx has Saved Items link to /saved-collections", () => {
    const file = fs.readFileSync(path.join(ROOT, "app/(tabs)/profile.tsx"), "utf-8");
    expect(file).toContain('"/saved-collections"');
    expect(file).toContain("Saved Items");
  });

  it("profile.tsx has Music Library link to /playlists", () => {
    const file = fs.readFileSync(path.join(ROOT, "app/(tabs)/profile.tsx"), "utf-8");
    expect(file).toContain('"/playlists"');
    expect(file).toContain("Music Library");
  });

  it("saved-collections screen exists and is registered in Stack", () => {
    const layout = fs.readFileSync(path.join(ROOT, "app/_layout.tsx"), "utf-8");
    expect(layout).toContain('name="saved-collections"');
    const screenExists = fs.existsSync(path.join(ROOT, "app/saved-collections.tsx"));
    expect(screenExists).toBe(true);
  });
});
