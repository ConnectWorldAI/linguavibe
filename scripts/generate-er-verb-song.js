const fetch = require('node-fetch') || globalThis.fetch;

async function generateSong() {
  const apiKey = process.env.TTAPI_KEY;
  if (!apiKey) {
    console.error("TTAPI_KEY not set");
    process.exit(1);
  }

  const lyrics = `[Intro]
Yeah, ConnectWorld AI
Time to learn those E-R verbs baby
Let's go

[Verse 1]
Yo como arroz con pollo every day, I eat
Tú comes mango on the way, you eat
Él come, ella come, it's the same, he eats she eats
Nosotros comemos we don't play, we eat
Ustedes comen everybody say, y'all eat
Drop the E-R add the ending that's the game

[Chorus]
E-R verbs we switching it up
O, E-S, E that's enough
E-M-O-S for we, E-N for them
Say it with me say it again
Comer beber correr let's go
Aprender leer now you know

[Verse 2]
Yo bebo agua when it's hot outside, I drink
Tú bebes café morning ride, you drink
Él bebe jugo she likes wine, he drinks
Nosotros bebemos all the time, we drink
Ustedes beben that's the vibe, y'all drink
Same pattern baby keep it in your mind

[Chorus]
E-R verbs we switching it up
O, E-S, E that's enough
E-M-O-S for we, E-N for them
Say it with me say it again
Comer beber correr let's go
Aprender leer now you know

[Verse 3]
Yo corro en la mañana feel alive, I run
Tú corres por el parque that's your vibe, you run
Él corre rápido she's by his side, he runs
Nosotros corremos city stride, we run
Ustedes corren can't hide, y'all run
The endings never change just the ride

[Bridge]
Aprendo español with every song, I learn
Aprendes rápido won't take long, you learn
Aprende ella he learns along, she learns
Aprendemos juntos getting strong, we learn
Aprenden todos sing along, they learn

[Outro]
E-R verbs we switching it up
Remember drop the E-R add what fits
Yo O, Tú E-S, Él E
Nosotros E-M-O-S, Ustedes E-N
ConnectWorld AI we learn and vibe`;

  console.log("Submitting song generation to Suno v5...");
  
  const response = await fetch("https://api.ttapi.io/suno/v1/music", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "TT-API-KEY": apiKey,
    },
    body: JSON.stringify({
      custom: true,
      instrumental: false,
      mv: "chirp-v5",
      title: "ER Verbs (Spanish Learning Song)",
      tags: "funketon, baile funk, reggaeton, latin R&B, female vocal, catchy, summer, danceable, educational, 100 BPM",
      prompt: lyrics,
    }),
  });

  const data = await response.json();
  console.log("Response:", JSON.stringify(data, null, 2));
  
  if (data.status === "SUCCESS" && data.data?.jobId) {
    console.log("\n✅ Job submitted! Job ID:", data.data.jobId);
    console.log("\nPolling for results...");
    
    // Poll for results
    let attempts = 0;
    const maxAttempts = 30;
    
    while (attempts < maxAttempts) {
      await new Promise(r => setTimeout(r, 10000)); // wait 10s
      attempts++;
      console.log(`Polling attempt ${attempts}/${maxAttempts}...`);
      
      const fetchRes = await fetch(`https://api.ttapi.io/suno/v2/fetch?jobId=${data.data.jobId}`, {
        headers: { "TT-API-KEY": apiKey },
      });
      const result = await fetchRes.json();
      
      if (result.status === "SUCCESS" && result.data?.progress === "100%") {
        console.log("\n🎵 Song generated successfully!");
        console.log("Results:", JSON.stringify(result.data, null, 2));
        
        // Save the audio URLs
        if (result.data.musics && result.data.musics.length > 0) {
          for (const music of result.data.musics) {
            console.log(`\n🎶 Title: ${music.title}`);
            console.log(`   Audio: ${music.audioUrl}`);
            console.log(`   Video: ${music.videoUrl}`);
            console.log(`   Duration: ${music.duration}s`);
          }
        }
        return result;
      } else if (result.status === "FAILED") {
        console.error("❌ Generation failed:", result);
        return result;
      } else {
        console.log(`   Status: ${result.data?.progress || result.status || 'processing'}...`);
      }
    }
    console.log("⏰ Timed out waiting for results. Check job ID:", data.data.jobId);
  } else {
    console.error("❌ Failed to submit:", data);
  }
}

generateSong().catch(console.error);
