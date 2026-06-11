/**
 * Script to translate an uploaded MP3 song to Spanish using the song translation pipeline.
 * Usage: npx tsx scripts/translate-song.ts
 */
import fs from "fs";
import path from "path";

const API_BASE = "http://127.0.0.1:3000/api/trpc";
const SONG_PATH = "/home/ubuntu/upload/07NobodyElse.mp3";

async function callTrpc(procedure: string, input: any, type: "mutation" | "query" = "mutation", retries = 3): Promise<any> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      if (type === "query") {
        const url = `${API_BASE}/${procedure}?input=${encodeURIComponent(JSON.stringify({ json: input }))}`;
        const res = await fetch(url);
        const data = await res.json();
        return data.result?.data?.json;
      }
      const url = `${API_BASE}/${procedure}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ json: input }),
      });
      const data = await res.json();
      if (data.error) {
        console.error("tRPC error:", JSON.stringify(data.error).slice(0, 200));
        return null;
      }
      return data.result?.data?.json;
    } catch (err: any) {
      if (attempt < retries - 1) {
        console.log(`  Retry ${attempt + 1}/${retries} after error: ${err.cause?.code || err.message}`);
        await new Promise(r => setTimeout(r, 5000));
      } else {
        throw err;
      }
    }
  }
}

async function main() {
  console.log("=== Song Translation Pipeline ===");
  console.log(`Input: ${SONG_PATH}`);
  
  // Step 1: Upload the audio
  console.log("\n[1/4] Uploading audio...");
  const audioBuffer = fs.readFileSync(SONG_PATH);
  const base64Audio = audioBuffer.toString("base64");
  
  const uploadResult = await callTrpc("songPipeline.uploadAudio", {
    base64Audio,
    mimeType: "audio/mpeg",
    filename: "07NobodyElse.mp3",
  });
  
  if (!uploadResult) {
    console.error("Upload failed!");
    process.exit(1);
  }
  console.log(`  Uploaded: ${uploadResult.key}`);
  console.log(`  URL: ${uploadResult.url}`);

  // Step 2: Start the translation pipeline
  console.log("\n[2/4] Starting translation pipeline (English → Spanish)...");
  const pipelineResult = await callTrpc("songPipeline.startPipeline", {
    uploadedAudioKey: uploadResult.key,
    title: "Nobody Else",
    artist: "Unknown",
    sourceLanguage: "en",
    targetLanguage: "es",
    targetDialect: "Dominican",
    voiceStyle: "match_original",
    preserveRhyme: true,
    preserveSyllables: true,
    preserveMelody: true,
    outputFormat: "mp3",
  });

  if (!pipelineResult) {
    console.error("Pipeline start failed!");
    process.exit(1);
  }
  console.log(`  Job ID: ${pipelineResult.jobId}`);
  console.log(`  Status: ${pipelineResult.status}`);
  console.log(`  Estimated time: ${pipelineResult.estimatedTime}s`);

  // Step 3: Poll for completion
  console.log("\n[3/4] Polling for completion...");
  const jobId = pipelineResult.jobId;
  let attempts = 0;
  const maxAttempts = 60; // 5 minutes max
  
  while (attempts < maxAttempts) {
    await new Promise((r) => setTimeout(r, 5000)); // Wait 5 seconds
    attempts++;
    
    const status = await callTrpc("songPipeline.getJobStatus", { jobId }, "query");
    
    if (!status) {
      console.log(`  [${attempts}] No response...`);
      continue;
    }
    
    console.log(`  [${attempts}] Status: ${status.status} | Progress: ${status.progress}% | Stage: ${status.stage}`);
    
    if (status.status === "completed") {
      console.log("\n[4/4] Translation complete!");
      console.log("  Result:", JSON.stringify(status.result, null, 2));
      
      // Save result info
      const outputPath = "/home/ubuntu/upload/07NobodyElse_Spanish.json";
      fs.writeFileSync(outputPath, JSON.stringify(status, null, 2));
      console.log(`\n  Full result saved to: ${outputPath}`);
      
      if (status.result?.audioUrl) {
        console.log(`\n  🎵 Translated audio URL: ${status.result.audioUrl}`);
      }
      return;
    }
    
    if (status.status === "failed") {
      console.error(`\n  Pipeline failed: ${status.error}`);
      process.exit(1);
    }
  }
  
  console.log("\n  Timed out waiting for pipeline completion.");
  console.log("  The job may still be processing. Check with jobId:", jobId);
}

main().catch(console.error);
