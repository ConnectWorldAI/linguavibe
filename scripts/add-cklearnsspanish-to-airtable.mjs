import 'dotenv/config';

const apiKey = process.env.AIRTABLE_API_KEY;
const baseId = process.env.AIRTABLE_BASE_ID;

console.log('Adding @ck.learnsspanish to Airtable Creators table...');

const addRes = await fetch(`https://api.airtable.com/v0/${baseId}/Creators`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    records: [{
      fields: {
        'Name': 'CK Learns Spanish (@ck.learnsspanish)',
        'Platform': 'Instagram',
        'Language': 'Spanish',
        'Country/Region': 'USA (learning Spanish)',
        'Status': 'Identified',
        'Profile URL': 'https://www.instagram.com/ck.learnsspanish',
        'Content Style': ['Educational'],
        'Notes': 'Spanish learner sharing tips and methods. Viral reel: "This is how the CIA learns languages so quickly!!" (10.2K likes) — teaches VISUAL ASSOCIATION method (pairing images with vocabulary for stronger memory). Also posts: "this spanish method actually works", "how to memorize spanish words fast", "most language apps skip this". CURRICULUM INSPIRATION: His CIA visual association method = how we should design our vocabulary system. Image-based flashcards, scene-based learning, cultural illustrations with tappable vocabulary. His content proves visual learning content goes viral. Use for: image-based vocab cards, scene explorer features, "spot the word" game mode, photo challenge mode. His audience = our target user (English speakers learning Spanish who want fast, practical methods).'
      }
    }]
  })
});

const addData = await addRes.json();
if (addData.records && addData.records.length > 0) {
  console.log('\n✅ @ck.learnsspanish added to Airtable!');
  console.log('Record ID:', addData.records[0].id);
} else {
  console.error('❌ Error:', JSON.stringify(addData, null, 2));
}
