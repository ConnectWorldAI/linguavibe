import 'dotenv/config';

const apiKey = process.env.AIRTABLE_API_KEY;
const baseId = process.env.AIRTABLE_BASE_ID;

if (!apiKey || !baseId) {
  console.error('Missing AIRTABLE_API_KEY or AIRTABLE_BASE_ID');
  process.exit(1);
}

async function main() {
  // Get all tables
  const tablesRes = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });
  const tablesData = await tablesRes.json();
  const tableNames = tablesData.tables.map(t => t.name);
  console.log('Available tables:', tableNames.join(', '));

  // Find creator/content table
  const creatorTable = tablesData.tables.find(t =>
    t.name.toLowerCase().includes('creator') ||
    t.name.toLowerCase().includes('influencer') ||
    t.name.toLowerCase().includes('content')
  );

  if (creatorTable) {
    console.log('Found table:', creatorTable.name);
    console.log('Fields:', creatorTable.fields.map(f => `${f.name} (${f.type})`).join(', '));

    // Add Lenexx to this table
    const fields = {};
    const fieldNames = creatorTable.fields.map(f => f.name.toLowerCase());

    // Map fields based on what's available
    for (const field of creatorTable.fields) {
      const name = field.name.toLowerCase();
      if (name.includes('name') && !name.includes('user')) fields[field.name] = 'Lenexx';
      else if (name === 'username' || name === 'handle') fields[field.name] = '@lenexxmusic';
      else if (name.includes('platform')) fields[field.name] = 'Instagram';
      else if (name.includes('url') || name.includes('link') || name.includes('profile')) fields[field.name] = 'https://www.instagram.com/lenexxmusic';
      else if (name.includes('genre') || name.includes('style')) fields[field.name] = 'Funketón (Baile Funk + Reggaeton), Latin R&B, Dance-Pop';
      else if (name.includes('language')) fields[field.name] = 'Spanish';
      else if (name.includes('dialect') || name.includes('region')) fields[field.name] = 'Dominican / NYC';
      else if (name.includes('follower')) fields[field.name] = '160000';
      else if (name.includes('note') || name.includes('description') || name.includes('bio')) fields[field.name] = 'Dominican-born, NYC-raised artist. Creates "Funketón" — a fusion of Brazilian Baile Funk + Reggaeton. Perfect music style reference for Spanish learning songs targeting Caribbean/Latin American dialects. Summer vibes, danceable, catchy hooks.';
      else if (name.includes('use') || name.includes('purpose') || name.includes('category')) fields[field.name] = 'Music Style Reference - Spanish Learning Songs';
      else if (name.includes('status')) fields[field.name] = 'Active';
    }

    console.log('\nAdding Lenexx with fields:', JSON.stringify(fields, null, 2));

    const createRes = await fetch(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(creatorTable.name)}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ records: [{ fields }] })
    });
    const createData = await createRes.json();
    
    if (createData.records) {
      console.log('\n✅ Lenexx added to', creatorTable.name, '- Record ID:', createData.records[0].id);
    } else {
      console.error('❌ Error:', JSON.stringify(createData, null, 2));
      
      // If fields don't match, try with just basic fields
      console.log('\nRetrying with minimal fields...');
      const minFields = {};
      const nameField = creatorTable.fields.find(f => f.name.toLowerCase().includes('name'));
      if (nameField) minFields[nameField.name] = 'Lenexx (@lenexxmusic)';
      
      const retryRes = await fetch(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(creatorTable.name)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ records: [{ fields: minFields }] })
      });
      const retryData = await retryRes.json();
      console.log('Retry result:', JSON.stringify(retryData, null, 2));
    }
  } else {
    // No creator table exists — create one or add to a general table
    console.log('No creator table found. Creating "Content Creators" table...');
    
    const createTableRes = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Content Creators',
        fields: [
          { name: 'Name', type: 'singleLineText' },
          { name: 'Handle', type: 'singleLineText' },
          { name: 'Platform', type: 'singleLineText' },
          { name: 'Profile URL', type: 'url' },
          { name: 'Genre/Style', type: 'singleLineText' },
          { name: 'Language', type: 'singleLineText' },
          { name: 'Dialect/Region', type: 'singleLineText' },
          { name: 'Followers', type: 'number', options: { precision: 0 } },
          { name: 'Use Case', type: 'singleLineText' },
          { name: 'Notes', type: 'multilineText' },
          { name: 'Status', type: 'singleSelect', options: { choices: [{ name: 'Active' }, { name: 'Archived' }, { name: 'Pending Review' }] } }
        ]
      })
    });
    const newTable = await createTableRes.json();
    
    if (newTable.id) {
      console.log('✅ Created "Content Creators" table');
      
      // Now add Lenexx
      const addRes = await fetch(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent('Content Creators')}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          records: [{
            fields: {
              'Name': 'Lenexx',
              'Handle': '@lenexxmusic',
              'Platform': 'Instagram',
              'Profile URL': 'https://www.instagram.com/lenexxmusic',
              'Genre/Style': 'Funketón (Baile Funk + Reggaeton), Latin R&B, Dance-Pop',
              'Language': 'Spanish',
              'Dialect/Region': 'Dominican / NYC',
              'Followers': 160000,
              'Use Case': 'Music Style Reference - Spanish Learning Songs',
              'Notes': 'Dominican-born, NYC-raised artist. Creates "Funketón" — a fusion of Brazilian Baile Funk + Reggaeton. Perfect music style reference for Spanish learning songs targeting Caribbean/Latin American dialects. Summer vibes, danceable, catchy hooks. 160K followers. Makes cinematic music videos connecting cultures.',
              'Status': 'Active'
            }
          }]
        })
      });
      const addData = await addRes.json();
      if (addData.records) {
        console.log('✅ Lenexx added! Record ID:', addData.records[0].id);
      } else {
        console.error('❌ Error adding record:', JSON.stringify(addData, null, 2));
      }
    } else {
      console.error('❌ Error creating table:', JSON.stringify(newTable, null, 2));
    }
  }
}

main().catch(console.error);
