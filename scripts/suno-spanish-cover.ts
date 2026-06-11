import fs from "fs";

const TTAPI_KEY = process.env.TTAPI_KEY!;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;

async function transcribeWithWhisper(): Promise<string> {
  console.log("Step 1: Transcribing original song with OpenAI Whisper...");
  
  const formData = new FormData();
  const audioFile = fs.readFileSync("/home/ubuntu/upload/07NobodyElse.mp3");
  const blob = new Blob([audioFile], { type: "audio/mpeg" });
  formData.append("file", blob, "07NobodyElse.mp3");
  formData.append("model", "whisper-1");
  formData.append("response_format", "text");
  
  const resp = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
    },
    body: formData,
  });
  
  if (!resp.ok) {
    throw new Error(`Whisper failed: ${resp.status} ${await resp.text()}`);
  }
  
  const lyrics = await resp.text();
  console.log("Original lyrics:\n", lyrics.slice(0, 500));
  return lyrics;
}

async function translateToSpanish(lyrics: string): Promise<string> {
  console.log("\nStep 2: Translating lyrics to Spanish (preserving rhythm/syllable count)...");
  
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a professional music translator specializing in English to Spanish song translations. 
Your goal is to translate song lyrics while:
1. Preserving the EXACT syllable count per line (critical for singing)
2. Maintaining the rhyme scheme where possible
3. Keeping the emotional tone and meaning
4. Using natural, singable Spanish (not overly formal)
5. Matching the rhythm and stress patterns of the original

Format the output as lyrics with [Verse], [Chorus], [Bridge] markers if you can identify the structure.
Do NOT add any explanation - just output the translated lyrics ready to be sung.`
        },
        {
          role: "user",
          content: `Translate these song lyrics to Spanish, preserving syllable count and singability:\n\n${lyrics}`
        }
      ],
      temperature: 0.7,
    }),
  });
  
  if (!resp.ok) {
    throw new Error(`GPT-4o failed: ${resp.status} ${await resp.text()}`);
  }
  
  const data = await resp.json();
  const translated = data.choices[0].message.content;
  console.log("Spanish lyrics:\n", translated.slice(0, 500));
  return translated;
}

async function generateWithSuno(spanishLyrics: string): Promise<string> {
  console.log("\nStep 3: Generating sung Spanish version with Suno v5...");
  
  const resp = await fetch("https://api.ttapi.io/suno/v1/music", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "TT-API-KEY": TTAPI_KEY,
    },
    body: JSON.stringify({
      custom: true,
      instrumental: false,
      mv: "chirp-v5",
      title: "Nobody Else (Spanish Version)",
      tags: "R&B, soul, smooth vocals, romantic, slow tempo, female vocal, intimate",
      prompt: spanishLyrics.slice(0, 5000),
      vocal_gender: "Female",
      negative_tags: "heavy metal, rock, fast tempo, aggressive",
      style_weight: 0.8,
      audio_weight: 0.7,
    }),
  });
  
  if (!resp.ok) {
    throw new Error(`Suno generate failed: ${resp.status} ${await resp.text()}`);
  }
  
  const data = await resp.json();
  console.log("Suno response:", JSON.stringify(data, null, 2));
  
  if (data.status !== "SUCCESS") {
    throw new Error(`Suno generation failed: ${data.message}`);
  }
  
  return data.data.jobId;
}

async function pollForResult(jobId: string): Promise<any> {
  console.log(`\nStep 4: Polling for result (jobId: ${jobId})...`);
  
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 15000)); // Wait 15s between polls
    
    const resp = await fetch(`https://api.ttapi.io/suno/v2/fetch?jobId=${jobId}`, {
      headers: { "TT-API-KEY": TTAPI_KEY },
    });
    
    const data = await resp.json();
    console.log(`  Poll ${i + 1}: status=${data.status}, progress=${data.data?.progress}`);
    
    if (data.status === "SUCCESS" && data.data?.musics?.length > 0) {
      return data;
    }
    
    if (data.status === "FAILED") {
      throw new Error(`Suno generation failed: ${data.message}`);
    }
  }
  
  throw new Error("Timeout waiting for Suno generation");
}

async function downloadResult(audioUrl: string): Promise<void> {
  console.log(`\nStep 5: Downloading result from ${audioUrl}...`);
  
  const resp = await fetch(audioUrl);
  if (!resp.ok) throw new Error(`Download failed: ${resp.status}`);
  
  const buffer = Buffer.from(await resp.arrayBuffer());
  fs.writeFileSync("/home/ubuntu/upload/07NobodyElse_Spanish_Sung.mp3", buffer);
  console.log(`Saved to /home/ubuntu/upload/07NobodyElse_Spanish_Sung.mp3 (${buffer.length} bytes)`);
}

async function main() {
  try {
    // Step 1: Transcribe
    const lyrics = await transcribeWithWhisper();
    fs.writeFileSync("/tmp/original_lyrics.txt", lyrics);
    
    // Step 2: Translate
    const spanishLyrics = await translateToSpanish(lyrics);
    fs.writeFileSync("/tmp/spanish_lyrics.txt", spanishLyrics);
    
    // Step 3: Generate
    const jobId = await generateWithSuno(spanishLyrics);
    
    // Step 4: Poll
    const result = await pollForResult(jobId);
    
    // Step 5: Download
    const audioUrl = result.data.musics[0].audioUrl;
    await downloadResult(audioUrl);
    
    console.log("\n✅ Done! Spanish sung version saved.");
    console.log("Result metadata:", JSON.stringify(result.data.musics[0], null, 2));
  } catch (err: any) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

main();
