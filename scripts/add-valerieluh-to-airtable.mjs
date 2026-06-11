import 'dotenv/config';

const apiKey = process.env.AIRTABLE_API_KEY;
const baseId = process.env.AIRTABLE_BASE_ID;

console.log('Adding Valerie Luh (@valerieluh) to Airtable Creators table...');

const addRes = await fetch(`https://api.airtable.com/v0/${baseId}/Creators`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    records: [{
      fields: {
        'Name': 'Valerie Luh (@valerieluh)',
        'Platform': 'Instagram',
        'Language': 'Spanish',
        'Country/Region': 'Latin America / Flamenco (Spain roots)',
        'Status': 'Identified',
        'Profile URL': 'https://www.instagram.com/valerieluh',
        'Content Style': ['Entertainment', 'Music'],
        'Followers': 203000,
        'Notes': 'Flamenco Soul artist — fusion of Flamenco + Soul + Blues. "Voz rota" (broken voice) style. 203K IG, 86K TikTok (@valerieluhmusic). Romantic/emotional Spanish music. Hits: "Tengo Ganas de Verte" (785K views), "Me Perdoné" (525K views), "Eres Mi Vitamina", "En Paz". CONTENT/MUSIC STYLE REFERENCE: Perfect for teaching emotional vocabulary, love phrases, reflexive verbs, and feelings through acoustic music. Her clear vocal delivery makes words easy to hear for learners. Use her style for: romantic vocabulary songs, self-love/forgiveness lessons, Flamenco cultural content, acoustic guitar-based learning tracks. Different vibe from Reggaeton/Funketón — more intimate, acoustic, emotional. Great for intermediate learners who want deeper emotional expression in Spanish.'
      }
    }]
  })
});

const addData = await addRes.json();
if (addData.records && addData.records.length > 0) {
  console.log('\n✅ Valerie Luh added to Airtable!');
  console.log('Record ID:', addData.records[0].id);
  console.log('Fields:', JSON.stringify(addData.records[0].fields, null, 2));
} else {
  console.error('❌ Error:', JSON.stringify(addData, null, 2));
}
