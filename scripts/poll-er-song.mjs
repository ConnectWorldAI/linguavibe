import 'dotenv/config';

const apiKey = process.env.TTAPI_KEY;
const jobId = 'd15e910b-cab8-40a0-b2ce-b5aecfde443a';

console.log('Polling job:', jobId);

let attempts = 0;
const maxAttempts = 20;

while (attempts < maxAttempts) {
  attempts++;
  
  const res = await fetch(`https://api.ttapi.io/suno/v1/fetch?jobId=${jobId}`, {
    headers: { 'TT-API-KEY': apiKey }
  });
  const result = await res.json();
  
  if (result.status === 'SUCCESS' && result.data && result.data.length > 0) {
    const firstTrack = result.data[0];
    if (firstTrack.audioUrl || firstTrack.audio_url) {
      console.log('\n🎵 Song generated successfully!');
      console.log(JSON.stringify(result.data, null, 2));
      
      for (const track of result.data) {
        console.log(`\n🎶 Title: ${track.title || track.name}`);
        console.log(`   Audio: ${track.audioUrl || track.audio_url}`);
        console.log(`   Video: ${track.videoUrl || track.video_url || 'N/A'}`);
        console.log(`   Duration: ${track.duration}s`);
        console.log(`   Image: ${track.imageUrl || track.image_url || 'N/A'}`);
      }
      process.exit(0);
    }
  }
  
  if (result.status === 'FAILED') {
    console.error('❌ Generation failed:', JSON.stringify(result, null, 2));
    process.exit(1);
  }
  
  const progress = result.data?.[0]?.progress || result.data?.progress || result.status || 'processing';
  console.log(`[${attempts}/${maxAttempts}] Status: ${progress}`);
  
  // Wait 10 seconds between polls
  await new Promise(r => setTimeout(r, 10000));
}

console.log('⏰ Timed out. Try again later with job ID:', jobId);
