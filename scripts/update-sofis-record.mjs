import 'dotenv/config';

const apiKey = process.env.AIRTABLE_API_KEY;
const baseId = process.env.AIRTABLE_BASE_ID;
const recordId = 'recgXqZkhWE4HWkHN';

console.log('Updating @spanish_with_sofis record to reflect teacher + content inspiration role...');

const updateRes = await fetch(`https://api.airtable.com/v0/${baseId}/Creators/${recordId}`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    fields: {
      'Content Style': ['Educational', 'Cultural'],
      'Notes': 'Colombian Spanish teacher on Instagram (@spanish_with_sofis). DUAL PURPOSE: (1) Teacher reference — use her teaching style, explanations, and lesson structure as inspiration for our Colombian Spanish curriculum. (2) Content/song inspiration — monitor what topics she teaches and create corresponding lessons AND songs based on those topics. Example: if she teaches Colombian slang phrases, we create a Funketón or Reggaeton song teaching those same phrases. Her content informs WHAT to teach and HOW to present it for Colombian dialect learners. Great for: grammar breakdowns, conversational Colombian phrases, slang, pronunciation tips, cultural context.'
    }
  })
});
const updateData = await updateRes.json();

if (updateData.id) {
  console.log('\n✅ Record updated successfully!');
  console.log('Record ID:', updateData.id);
  console.log('Updated fields:', JSON.stringify(updateData.fields, null, 2));
} else {
  console.error('❌ Error:', JSON.stringify(updateData, null, 2));
}
