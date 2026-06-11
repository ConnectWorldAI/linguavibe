import 'dotenv/config';

const apiKey = process.env.AIRTABLE_API_KEY;
const baseId = process.env.AIRTABLE_BASE_ID;

console.log('Adding @masakakidsafricana to Airtable Creators table...');

const addRes = await fetch(`https://api.airtable.com/v0/${baseId}/Creators`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    records: [{
      fields: {
        'Name': 'Masaka Kids Africana',
        'Platform': 'Multi-Platform',
        'Language': 'Multi-Language',
        'Country/Region': 'Uganda / Africa',
        'Status': 'Identified',
        'Profile URL': 'https://www.instagram.com/masakakidsafricana',
        'Content Style': ['Entertainment', 'Music', 'Cultural'],
        'Notes': 'Ugandan kids dance group (@masakakidsafricana). MASSIVE viral reach — 109M+ views on Jerusalema video, 43M+ on Together We Can. Netflix documentary. VIRAL CONTENT REFERENCE: Their format = joyful African kids dancing to catchy songs in colorful outdoor settings. EXTREMELY shareable and heartwarming. HOW WE USE THIS: Create similar viral content for ConnectWorld AI — kids (or animated characters) dancing/singing to our language learning songs. Same energy: bright colors, infectious joy, dance challenges, outdoor African/Latin/Caribbean settings. They even made a Spanish song ("Baila Baila") showing cross-cultural appeal. Perfect model for: dance challenge content, multilingual kids songs, cultural celebration videos, TikTok/Reels viral format. Their formula: catchy music + kids dancing + African culture + positive energy = viral every time.'
      }
    }]
  })
});
const addData = await addRes.json();

if (addData.records && addData.records.length > 0) {
  console.log('\n✅ Masaka Kids Africana added to Airtable!');
  console.log('Record ID:', addData.records[0].id);
  console.log('Fields:', JSON.stringify(addData.records[0].fields, null, 2));
} else {
  console.error('❌ Error:', JSON.stringify(addData, null, 2));
}
