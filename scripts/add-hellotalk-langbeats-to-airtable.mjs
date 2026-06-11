import 'dotenv/config';

const apiKey = process.env.AIRTABLE_API_KEY;
const baseId = process.env.AIRTABLE_BASE_ID;

console.log('Adding @hellotalk_spanish and @langbeats_spanish to Airtable...');

const addRes = await fetch(`https://api.airtable.com/v0/${baseId}/Creators`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    records: [
      {
        fields: {
          'Name': 'HelloTalk Spanish',
          'Platform': 'Instagram',
          'Language': 'Spanish',
          'Country/Region': 'Global / Multi-dialect',
          'Status': 'Identified',
          'Profile URL': 'https://www.instagram.com/hellotalk_spanish',
          'Content Style': ['Educational', 'Entertainment'],
          'Notes': 'HelloTalk language app Spanish content account (@hellotalk_spanish). VIRAL CONTENT FORMAT: AI-generated cinematic illustrations with single everyday phrase (English + Spanish) overlaid. Consistent young urban characters. Each reel = one phrase + matching scene + original song. Collab with @langbeats_spanish for music. WHAT WE TAKE: Their one-phrase-per-reel format with scene-matched AI visuals. We replicate with our own Suno songs + Kling AI video scenes. Phrases they teach: "Tomo el tren", "Voy pa\'l gym", "Esa nena me gusta", "Disculpa", "¿Qué hora es?", "Estoy afuera", "Me gustas tú". Great model for daily phrase content series.',
          'Date Added': '2026-05-31'
        }
      },
      {
        fields: {
          'Name': 'Langbeats Spanish',
          'Platform': 'Instagram',
          'Language': 'Spanish',
          'Country/Region': 'Global',
          'Status': 'Identified',
          'Profile URL': 'https://www.instagram.com/langbeats_spanish',
          'Content Style': ['Music', 'Educational'],
          'Notes': 'Music-based Spanish learning account (@langbeats_spanish). Creates original songs with Spanish phrases embedded in catchy hooks. Collabs with @hellotalk_spanish for visual reels. Their model: original artist songs (like "Inti San - To get to you") that naturally teach Spanish phrases through lyrics. DIRECT COMPETITOR to our Song Translation Studio concept. We do it better: we generate songs via Suno (no licensing needed), teach full conjugations not just phrases, and add interactive in-app lessons. Study their song structure and phrase selection for inspiration.',
          'Date Added': '2026-05-31'
        }
      }
    ]
  })
});
const addData = await addRes.json();

if (addData.records) {
  console.log('\n✅ Both accounts added to Airtable!');
  addData.records.forEach(r => {
    console.log(`  - ${r.fields.Name} (Record ID: ${r.id})`);
  });
} else {
  console.error('❌ Error:', JSON.stringify(addData, null, 2));
}
