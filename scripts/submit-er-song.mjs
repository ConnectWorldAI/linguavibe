import 'dotenv/config';

const apiKey = process.env.TTAPI_KEY;
console.log('TTAPI_KEY present:', !!apiKey);
if (!apiKey) {
  console.error('TTAPI_KEY not set - cannot generate song');
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

console.log('Submitting song generation to Suno via TTAPI...');
console.log('Style: Funketón (Baile Funk + Reggaeton), female vocal, educational');

const response = await fetch('https://api.ttapi.io/suno/v1/music', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'TT-API-KEY': apiKey,
  },
  body: JSON.stringify({
    custom: true,
    instrumental: false,
    mv: 'chirp-v4',
    title: 'ER Verbs - Spanish Learning Song (Funketón)',
    tags: 'funketon, baile funk, reggaeton, latin R&B, female vocal, catchy, summer, danceable, educational, bilingual, 100 BPM',
    prompt: lyrics,
  }),
});

const data = await response.json();
console.log('Response status:', response.status);
console.log('Response:', JSON.stringify(data, null, 2));

if (data.data && data.data.jobId) {
  console.log('\n✅ Job submitted! Job ID:', data.data.jobId);
  
  // Write job ID to file for polling
  const fs = await import('fs');
  fs.writeFileSync('/home/ubuntu/linguavibe/content/er-verb-song-job.json', JSON.stringify({
    jobId: data.data.jobId,
    submittedAt: new Date().toISOString(),
    title: 'ER Verbs - Spanish Learning Song (Funketón)',
    style: 'Funketón (Baile Funk + Reggaeton)',
  }, null, 2));
  console.log('Job ID saved to content/er-verb-song-job.json');
} else {
  console.error('❌ Submission may have failed. Full response above.');
}
