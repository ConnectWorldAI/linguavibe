import 'dotenv/config';

const apiKey = process.env.AIRTABLE_API_KEY;
const baseId = process.env.AIRTABLE_BASE_ID;

console.log('Adding @speakspanishfaster (Rocky) to Airtable Creators table...');

const addRes = await fetch(`https://api.airtable.com/v0/${baseId}/Creators`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    records: [{
      fields: {
        'Name': 'Speak Spanish Faster (Rocky)',
        'Platform': 'Instagram',
        'Language': 'Spanish',
        'Country/Region': 'Puerto Rico / Neutral Spanish',
        'Status': 'Identified',
        'Profile URL': 'https://www.instagram.com/speakspanishfaster',
        'Content Style': ['Educational'],
        'Notes': 'Rocky (@speakspanishfaster) — Spanish teacher focused on everyday Spanish and Puerto Rican lessons. Has "HyperSpeed Method" for rapid comprehension. SEED FOR CONTENT + LEARNING: (1) His teaching topics = what phrases/lessons we create songs for. (2) His "understand fast native speakers" content = inspiration for our speed-listening exercises. (3) Everyday Spanish phrases he teaches = song lyrics we generate. (4) His "3 secrets to learn faster" approach = content hooks we can adapt. Teaches neutral Spanish (not dialect-specific) but includes PR flavor. Has website speakspanishfaster.com with courses. Great for: comprehension drills, everyday phrase songs, "understand natives" content series, speaking confidence lessons. His content style: direct-to-camera, relatable, practical tips, challenges viewers to test their level.'
      }
    }]
  })
});
const addData = await addRes.json();

if (addData.records && addData.records.length > 0) {
  console.log('\n✅ @speakspanishfaster added to Airtable!');
  console.log('Record ID:', addData.records[0].id);
  console.log('Fields:', JSON.stringify(addData.records[0].fields, null, 2));
} else {
  console.error('❌ Error:', JSON.stringify(addData, null, 2));
}
