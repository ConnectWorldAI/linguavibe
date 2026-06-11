import 'dotenv/config';

const apiKey = process.env.AIRTABLE_API_KEY;
const baseId = process.env.AIRTABLE_BASE_ID;

if (!apiKey || !baseId) {
  console.error('Missing AIRTABLE_API_KEY or AIRTABLE_BASE_ID');
  process.exit(1);
}

// First search if she's already there
console.log('Searching for @spanish_with_sofis in Creators table...');
const searchRes = await fetch(
  `https://api.airtable.com/v0/${baseId}/Creators?filterByFormula=OR(SEARCH("sofis",LOWER({Name})),SEARCH("sofis",LOWER({Notes})))`,
  { headers: { 'Authorization': `Bearer ${apiKey}` } }
);
const searchData = await searchRes.json();

if (searchData.records && searchData.records.length > 0) {
  console.log('✅ Found existing record(s):');
  searchData.records.forEach(r => {
    console.log(`  - ${r.fields.Name} (${r.fields.Platform}) - ${r.fields['Country/Region'] || 'no region'}`);
    console.log(`    Notes: ${r.fields.Notes || 'none'}`);
  });
  console.log('\nShe is already in the database!');
} else {
  console.log('Not found. Adding @spanish_with_sofis to Creators table...');
  
  const addRes = await fetch(`https://api.airtable.com/v0/${baseId}/Creators`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      records: [{
        fields: {
          'Name': 'Spanish with Sofis',
          'Platform': 'Instagram',
          'Language': 'Spanish',
          'Country/Region': 'Colombian',
          'Status': 'Identified',
          'Profile URL': 'https://www.instagram.com/spanish_with_sofis',
          'Content Style': ['Educational'],
          'Notes': 'Colombian Spanish teacher on Instagram (@spanish_with_sofis). Use for content and lesson references — teaches Colombian Spanish dialect, grammar, vocabulary, and conversational phrases. Great reference for Colombian-style educational content and lesson structure.',
          'Date Added': '2026-05-31'
        }
      }]
    })
  });
  const addData = await addRes.json();
  
  if (addData.records && addData.records.length > 0) {
    console.log('\n✅ @spanish_with_sofis added to Airtable!');
    console.log('Record ID:', addData.records[0].id);
    console.log('Fields:', JSON.stringify(addData.records[0].fields, null, 2));
  } else {
    console.error('❌ Error:', JSON.stringify(addData, null, 2));
  }
}
