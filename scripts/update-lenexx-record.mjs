import 'dotenv/config';

const apiKey = process.env.AIRTABLE_API_KEY;
const baseId = process.env.AIRTABLE_BASE_ID;
const recordId = 'recTcNFb9KpkS9Y7O';

// First check what select options exist
const tablesRes = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
  headers: { 'Authorization': `Bearer ${apiKey}` }
});
const tablesData = await tablesRes.json();
const creatorsTable = tablesData.tables.find(t => t.name === 'Creators');

// Log select field options
for (const field of creatorsTable.fields) {
  if (field.type === 'singleSelect' || field.type === 'multipleSelects') {
    console.log(`${field.name} options:`, field.options?.choices?.map(c => c.name).join(', '));
  }
}

// Build update with only valid options
const platformField = creatorsTable.fields.find(f => f.name === 'Platform');
const languageField = creatorsTable.fields.find(f => f.name === 'Language');
const statusField = creatorsTable.fields.find(f => f.name === 'Status');
const contentStyleField = creatorsTable.fields.find(f => f.name === 'Content Style');

const platformChoices = platformField?.options?.choices?.map(c => c.name) || [];
const languageChoices = languageField?.options?.choices?.map(c => c.name) || [];
const statusChoices = statusField?.options?.choices?.map(c => c.name) || [];
const contentStyleChoices = contentStyleField?.options?.choices?.map(c => c.name) || [];

console.log('\nPlatform choices:', platformChoices);
console.log('Language choices:', languageChoices);
console.log('Status choices:', statusChoices);
console.log('Content Style choices:', contentStyleChoices);

// Build fields object with valid values only
const fields = {
  'Name': 'Lenexx',
  'Followers': 160000,
  'Country/Region': 'Dominican / NYC',
  'Profile URL': 'https://www.instagram.com/lenexxmusic',
  'Notes': 'Dominican-born, NYC-raised artist (@lenexxmusic). Creates "Funketón" — a fusion of Brazilian Baile Funk + Reggaeton. Perfect music style reference for Spanish learning songs targeting Caribbean/Latin American dialects. Summer vibes, danceable, catchy hooks. 160K followers. Makes cinematic music videos connecting cultures. Use her style for: -ER verb songs, slang lessons, dance-based grammar drills.',
  'Date Added': '2026-05-31'
};

// Only add select fields if valid options exist
if (platformChoices.includes('Instagram')) fields['Platform'] = 'Instagram';
if (languageChoices.includes('Spanish')) fields['Language'] = 'Spanish';
if (statusChoices.includes('Active')) fields['Status'] = 'Active';
else if (statusChoices.length > 0) fields['Status'] = statusChoices[0]; // Use first available

// Content Style is multipleSelects - find matching options
if (contentStyleChoices.length > 0) {
  const matching = contentStyleChoices.filter(c => 
    c.toLowerCase().includes('music') || 
    c.toLowerCase().includes('dance') ||
    c.toLowerCase().includes('entertainment')
  );
  if (matching.length > 0) fields['Content Style'] = matching;
}

console.log('\nUpdating record with:', JSON.stringify(fields, null, 2));

const updateRes = await fetch(`https://api.airtable.com/v0/${baseId}/Creators/${recordId}`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ fields })
});
const updateData = await updateRes.json();

if (updateData.id) {
  console.log('\n✅ Lenexx record updated successfully!');
  console.log('Record ID:', updateData.id);
  console.log('Fields:', JSON.stringify(updateData.fields, null, 2));
} else {
  console.error('\n❌ Error:', JSON.stringify(updateData, null, 2));
}
