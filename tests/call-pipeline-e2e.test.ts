/**
 * End-to-End Call Pipeline Verification Test
 * 
 * Traces the complete call flow:
 * 1. Calls tab → hume-call screen (navigation params)
 * 2. hume-call screen → server token endpoint (tRPC mutation)
 * 3. Server → Hume OAuth token generation
 * 4. Client → WebSocket connection with token
 * 5. Mic capture → audio_input messages
 * 6. Hume response → audio_output → AudioContext playback
 * 7. Disconnect → cleanup (mic, audio, WebSocket, session)
 */

import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const APP_DIR = path.join(__dirname, "..");

describe("Call Pipeline E2E Verification", () => {
  // ─── Step 1: Navigation (Calls tab → hume-call) ──────────────────────────
  describe("Step 1: Calls Tab → Hume Call Navigation", () => {
    const callsTab = fs.readFileSync(path.join(APP_DIR, "app/(tabs)/calls.tsx"), "utf-8");

    it("Calls tab routes to /hume-call screen", () => {
      expect(callsTab).toContain('pathname: "/hume-call"');
    });

    it("passes mode parameter to hume-call", () => {
      expect(callsTab).toMatch(/mode:\s*["'](?:teacher|cloudwave|surprise)/);
    });

    it("passes persona parameter to hume-call", () => {
      expect(callsTab).toMatch(/persona:\s*["']/);
    });

    it("passes language parameter to hume-call", () => {
      expect(callsTab).toMatch(/language:\s*["']/);
    });

    it("passes teacherName from contact", () => {
      expect(callsTab).toContain("teacherName:");
    });
  });

  // ─── Step 2: Hume Call Screen Setup ───────────────────────────────────────
  describe("Step 2: Hume Call Screen Initialization", () => {
    const humeCall = fs.readFileSync(path.join(APP_DIR, "app/hume-call.tsx"), "utf-8");

    it("reads mode from useLocalSearchParams", () => {
      expect(humeCall).toContain("useLocalSearchParams");
      expect(humeCall).toContain("mode: CallMode");
    });

    it("supports all call modes", () => {
      expect(humeCall).toContain('"teacher"');
      expect(humeCall).toContain('"cloudwave"');
      expect(humeCall).toContain('"surprise"');
      expect(humeCall).toContain('"pronunciation"');
      expect(humeCall).toContain('"translator"');
    });

    it("selects correct hook based on mode (teacher/cloudwave/surprise)", () => {
      expect(humeCall).toContain("useHumeTeacher");
      expect(humeCall).toContain("useHumeVoice");
      expect(humeCall).toContain("useHumeSurpriseCall");
    });

    it("auto-connects on mount", () => {
      expect(humeCall).toMatch(/useEffect\(\s*\(\)\s*=>\s*\{[\s\S]*?connect\(\)/);
    });

    it("has disconnect cleanup on unmount", () => {
      expect(humeCall).toMatch(/return\s*\(\)\s*=>\s*\{[\s\S]*?disconnect\(\)/);
    });
  });

  // ─── Step 3: Hook → Server Token Request ──────────────────────────────────
  describe("Step 3: Hook → Server Token Acquisition", () => {
    const humeHook = fs.readFileSync(path.join(APP_DIR, "hooks/use-hume-voice.ts"), "utf-8");

    it("calls tRPC hume.getAccessToken mutation", () => {
      expect(humeHook).toContain("trpc.hume.getAccessToken.useMutation");
    });

    it("calls tRPC hume.startTeacherSession for teacher mode", () => {
      expect(humeHook).toContain("trpc.hume.startTeacherSession.useMutation");
    });

    it("passes persona, language, dialect, studentLevel to token request", () => {
      expect(humeHook).toContain("persona:");
      expect(humeHook).toContain("language:");
      expect(humeHook).toContain("dialect:");
      expect(humeHook).toContain("studentLevel:");
    });

    it("extracts accessToken, configId, sessionId, websocketUrl from response", () => {
      expect(humeHook).toContain("accessToken");
      expect(humeHook).toContain("configId");
      expect(humeHook).toContain("sessionId");
      expect(humeHook).toContain("websocketUrl");
    });
  });

  // ─── Step 4: Server-side Hume OAuth Token Generation ──────────────────────
  describe("Step 4: Server → Hume OAuth Token Generation", () => {
    const humeService = fs.readFileSync(path.join(APP_DIR, "server/humeService.ts"), "utf-8");

    it("uses HUME_API_KEY and HUME_SECRET_KEY from environment", () => {
      expect(humeService).toContain("process.env.HUME_API_KEY");
      expect(humeService).toContain("process.env.HUME_SECRET_KEY");
    });

    it("calls Hume OAuth2 client credentials endpoint", () => {
      expect(humeService).toContain("https://api.hume.ai/oauth2-cc/token");
    });

    it("sends Basic auth with base64-encoded credentials", () => {
      expect(humeService).toContain("Buffer.from(`${HUME_API_KEY}:${HUME_SECRET_KEY}`).toString(\"base64\")");
    });

    it("sends grant_type=client_credentials", () => {
      expect(humeService).toContain("grant_type=client_credentials");
    });

    it("creates EVI config with persona voice and system prompt", () => {
      expect(humeService).toContain("getOrCreateEVIConfig");
      expect(humeService).toContain("voice:");
      expect(humeService).toContain("prompt:");
    });

    it("returns websocketUrl pointing to Hume EVI chat endpoint", () => {
      expect(humeService).toContain("wss://api.hume.ai/v0/evi/chat");
    });

    it("getAccessToken is a protected procedure (requires auth)", () => {
      expect(humeService).toMatch(/getAccessToken:\s*protectedProcedure/);
    });

    it("startTeacherSession is a protected procedure", () => {
      expect(humeService).toMatch(/startTeacherSession:\s*protectedProcedure/);
    });

    it("HUME_API_KEY is currently set in environment", () => {
      expect(process.env.HUME_API_KEY).toBeDefined();
      expect(process.env.HUME_API_KEY!.length).toBeGreaterThan(0);
    });

    it("HUME_SECRET_KEY is currently set in environment", () => {
      expect(process.env.HUME_SECRET_KEY).toBeDefined();
      expect(process.env.HUME_SECRET_KEY!.length).toBeGreaterThan(0);
    });
  });

  // ─── Step 5: WebSocket Connection ─────────────────────────────────────────
  describe("Step 5: Client → Hume WebSocket Connection", () => {
    const humeHook = fs.readFileSync(path.join(APP_DIR, "hooks/use-hume-voice.ts"), "utf-8");

    it("constructs WebSocket URL with access_token and config_id params", () => {
      expect(humeHook).toMatch(/\$\{websocketUrl\}\?access_token=\$\{accessToken\}/);
      expect(humeHook).toContain("config_id=");
    });

    it("creates WebSocket instance", () => {
      expect(humeHook).toContain("new WebSocket(wsUrl)");
    });

    it("handles ws.onopen to set connected state", () => {
      expect(humeHook).toContain("ws.onopen");
      expect(humeHook).toContain("setIsConnected(true)");
    });

    it("handles ws.onerror to set error state", () => {
      expect(humeHook).toContain("ws.onerror");
      expect(humeHook).toContain("setError(");
    });

    it("handles ws.onclose for cleanup", () => {
      expect(humeHook).toContain("ws.onclose");
      expect(humeHook).toContain("setIsConnected(false)");
    });
  });

  // ─── Step 6: Audio Capture (Mic → Hume) ───────────────────────────────────
  describe("Step 6: Microphone Capture → Hume Audio Input", () => {
    const humeHook = fs.readFileSync(path.join(APP_DIR, "hooks/use-hume-voice.ts"), "utf-8");

    it("uses WebMicCapture class for web platform", () => {
      expect(humeHook).toContain("class WebMicCapture");
    });

    it("requests getUserMedia with audio constraints", () => {
      expect(humeHook).toContain("navigator.mediaDevices.getUserMedia");
      expect(humeHook).toContain("echoCancellation: true");
      expect(humeHook).toContain("noiseSuppression: true");
    });

    it("uses MediaRecorder to capture audio chunks", () => {
      expect(humeHook).toContain("new MediaRecorder(");
      expect(humeHook).toContain("ondataavailable");
    });

    it("streams audio chunks every 250ms", () => {
      expect(humeHook).toContain("this.mediaRecorder.start(250)");
    });

    it("converts audio to base64 before sending", () => {
      expect(humeHook).toContain("arrayBufferToBase64");
    });

    it("sends audio_input messages over WebSocket", () => {
      expect(humeHook).toContain('"audio_input"');
      expect(humeHook).toMatch(/type:\s*["']audio_input["']/);
    });

    it("supports mute by disabling audio tracks", () => {
      expect(humeHook).toContain("track.enabled = !muted");
    });

    it("starts mic capture on WebSocket open", () => {
      // Inside ws.onopen callback, mic.start is called
      expect(humeHook).toMatch(/ws\.onopen\s*=\s*async\s*\(\)\s*=>\s*\{[\s\S]*?mic\.start/);
    });
  });

  // ─── Step 7: Audio Playback (Hume → Speaker) ─────────────────────────────
  describe("Step 7: Hume Audio Output → Speaker Playback", () => {
    const humeHook = fs.readFileSync(path.join(APP_DIR, "hooks/use-hume-voice.ts"), "utf-8");

    it("uses WebAudioPlayer class for web platform", () => {
      expect(humeHook).toContain("class WebAudioPlayer");
    });

    it("creates AudioContext at 24kHz sample rate", () => {
      expect(humeHook).toContain("new AudioContext({ sampleRate: 24000 })");
    });

    it("handles audio_output messages from Hume", () => {
      expect(humeHook).toContain('"audio_output"');
      expect(humeHook).toContain("audioPlayerRef.current.play(msg.data)");
    });

    it("decodes audio data and plays via AudioContext", () => {
      expect(humeHook).toContain("decodeAudioData");
      expect(humeHook).toContain("createBufferSource");
      expect(humeHook).toContain("source.start()");
    });

    it("has audio queue for sequential playback", () => {
      expect(humeHook).toContain("this.queue.push(buffer)");
      expect(humeHook).toContain("processQueue");
    });

    it("handles user_interruption by stopping playback", () => {
      expect(humeHook).toContain('"user_interruption"');
      expect(humeHook).toContain("audioPlayerRef.current.stop()");
    });

    it("falls back to raw PCM playback if decoding fails", () => {
      expect(humeHook).toContain("new Int16Array(buffer)");
      expect(humeHook).toContain("new Float32Array(pcmData.length)");
    });
  });

  // ─── Step 8: Message Handling ─────────────────────────────────────────────
  describe("Step 8: Transcript & Emotion Processing", () => {
    const humeHook = fs.readFileSync(path.join(APP_DIR, "hooks/use-hume-voice.ts"), "utf-8");

    it("handles user_message with transcript and emotions", () => {
      expect(humeHook).toContain('"user_message"');
      expect(humeHook).toContain("setTranscript");
    });

    it("handles assistant_message for AI responses", () => {
      expect(humeHook).toContain('"assistant_message"');
    });

    it("extracts prosody emotion scores from user messages", () => {
      expect(humeHook).toContain("models.prosody.scores");
    });

    it("reports emotions back to server", () => {
      expect(humeHook).toContain("reportEmotions.mutate");
    });
  });

  // ─── Step 9: Disconnect & Cleanup ─────────────────────────────────────────
  describe("Step 9: Disconnect & Resource Cleanup", () => {
    const humeHook = fs.readFileSync(path.join(APP_DIR, "hooks/use-hume-voice.ts"), "utf-8");

    it("stops mic capture on disconnect", () => {
      expect(humeHook).toContain("micCaptureRef.current?.stop()");
    });

    it("destroys audio player on disconnect", () => {
      expect(humeHook).toContain("audioPlayerRef.current?.destroy()");
    });

    it("closes WebSocket on disconnect", () => {
      // Both main hook and teacher hook close the WS
      expect(humeHook).toMatch(/wsRef\.current\?\.close\(\)|wsRef\.current\.close\(\)/);
    });

    it("ends session on server via tRPC", () => {
      expect(humeHook).toContain("endSession.mutate");
    });

    it("cleans up on component unmount", () => {
      // useEffect cleanup
      expect(humeHook).toMatch(/return\s*\(\)\s*=>\s*\{[\s\S]*?micCaptureRef\.current\?\.stop/);
    });
  });

  // ─── Step 10: UI Controls ─────────────────────────────────────────────────
  describe("Step 10: Call UI Controls", () => {
    const humeCall = fs.readFileSync(path.join(APP_DIR, "app/hume-call.tsx"), "utf-8");

    it("has mute button that toggles mic", () => {
      expect(humeCall).toContain("handleMute");
      expect(humeCall).toContain("hookSetMuted");
    });

    it("has speaker toggle", () => {
      expect(humeCall).toContain("handleSpeaker");
      expect(humeCall).toContain("isSpeaker");
    });

    it("has end call button that disconnects and navigates back", () => {
      expect(humeCall).toContain("handleEndCall");
      expect(humeCall).toContain("disconnect()");
      expect(humeCall).toContain("router.back()");
    });

    it("has minimize to PiP option", () => {
      expect(humeCall).toContain("handleMinimize");
      expect(humeCall).toContain("minimizeCall");
    });

    it("shows error with retry button", () => {
      expect(humeCall).toContain("Retry Connection");
      expect(humeCall).toContain("connect()");
    });

    it("has call duration timer", () => {
      expect(humeCall).toContain("callDuration");
      expect(humeCall).toContain("formatDuration");
    });

    it("shows emotion display", () => {
      expect(humeCall).toContain("getDominantEmotion");
      expect(humeCall).toContain("emotionBadge");
    });

    it("has waveform animation", () => {
      expect(humeCall).toContain("waveBar");
      expect(humeCall).toContain("withRepeat");
    });

    it("has transcript toggle and display", () => {
      expect(humeCall).toContain("showTranscript");
      expect(humeCall).toContain("Show Transcript");
    });

    it("enforces free tier time limits", () => {
      expect(humeCall).toContain("FREE_CLOUDWAVE_LIMIT");
      expect(humeCall).toContain("FREE_TEACHER_LIMIT");
      expect(humeCall).toContain("PaywallModal");
    });
  });

  // ─── Step 11: Icon Mappings ───────────────────────────────────────────────
  describe("Step 11: Required Icon Mappings", () => {
    const iconSymbol = fs.readFileSync(path.join(APP_DIR, "components/ui/icon-symbol.tsx"), "utf-8");

    it("has mic.fill icon mapped", () => {
      expect(iconSymbol).toContain('"mic.fill"');
    });

    it("has mic.slash.fill icon mapped", () => {
      expect(iconSymbol).toContain('"mic.slash.fill"');
    });

    it("has phone.down.fill icon mapped", () => {
      expect(iconSymbol).toContain('"phone.down.fill"');
    });

    it("has speaker.wave.2.fill icon mapped", () => {
      expect(iconSymbol).toContain('"speaker.wave.2.fill"');
    });
  });

  // ─── Step 12: Screen Registration ─────────────────────────────────────────
  describe("Step 12: Screen Registration in Layout", () => {
    const layout = fs.readFileSync(path.join(APP_DIR, "app/_layout.tsx"), "utf-8");

    it("hume-call screen is registered in root layout", () => {
      expect(layout).toContain('"hume-call"');
    });

    it("call-screen is registered in root layout", () => {
      expect(layout).toContain('"call-screen"');
    });
  });

  // ─── Step 13: Live Hume API Key Validation ────────────────────────────────
  describe("Step 13: Live Hume API Validation", () => {
    it("HUME_API_KEY authenticates with Hume API", async () => {
      const apiKey = process.env.HUME_API_KEY;
      if (!apiKey) {
        throw new Error("HUME_API_KEY not set");
      }
      const response = await fetch("https://api.hume.ai/v0/evi/configs?page_size=1", {
        method: "GET",
        headers: {
          "X-Hume-Api-Key": apiKey,
        },
      });
      // 200 = valid key, 401/403 = invalid key
      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(403);
    });
  });
});
