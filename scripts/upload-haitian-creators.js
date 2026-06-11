/**
 * Upload Haitian Creole / Cultural Content Creators to Airtable
 * Includes: @haitian.proudd, @englishwith.herold
 */
require("dotenv").config();

const AIRTABLE_TOKEN = process.env.AIRTABLE_API_KEY || process.env.AIRTABLE_TOKEN || process.env.AIRTABLE_PAT;
const BASE_ID = process.env.AIRTABLE_BASE_ID;

if (!AIRTABLE_TOKEN || !BASE_ID) {
  console.error("Missing AIRTABLE_TOKEN or AIRTABLE_BASE_ID");
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${AIRTABLE_TOKEN}`,
  "Content-Type": "application/json",
};

const creators = [
  {
    name: "Haitian Proudd",
    handle: "@haitian.proudd",
    platform: "Instagram",
    followers: 205700,
    language: "Haitian Creole",
    targetAudience: "Haitian diaspora, Haitian Americans, people interested in Haitian culture",
    style: "Cultural pride, POV storytelling, food content, nostalgic Haitian experiences, worship/faith",
    tiktokFollowers: 0,
    youtubeFollowers: 0,
    totalReach: 205700,
    country: "Haiti / USA (Florida)",
    niche: "Haitian culture, pride, food, lifestyle, traditions, diaspora experience",
    url: "https://www.instagram.com/haitian.proudd",
    email: "haitianproudd@gmail.com",
    notes: "Macro influencer. Content covers Haitian food, culture, growing up Haitian, Flag Week celebrations. Valuable for Haitian Creole cultural context, real expressions, and immersive learning scenarios. 205K+ followers.",
  },
  {
    name: "ItsAI History (Parker Gordon)",
    handle: "@itsaihistory",
    platform: "Instagram",
    followers: 280000,
    language: "Multi-Language (History & Linguistics)",
    targetAudience: "History enthusiasts, language learners, educational content consumers",
    style: "AI-assisted historical recreations, engineered realism, documentary-style, linguistics + history",
    tiktokFollowers: 100000,
    youtubeFollowers: 63200,
    totalReach: 500000,
    country: "USA (Fort Lauderdale, FL)",
    niche: "History, linguistics, AI-generated educational content, cultural context, language evolution",
    url: "https://www.instagram.com/itsaihistory",
    email: "itsaihistory@gmail.com",
    notes: "The World's History & Language Channel. 500K+ followers across platforms. Est. Oct 2025. Massive growth (0 to 500K in 7 months). AI-assisted visual recreations for educational purposes. Combines linguistics with historical context. Valuable for cultural/historical context in language lessons.",
  },
  {
    name: "English with Herold",
    handle: "@englishwith.herold",
    platform: "Instagram",
    followers: 0, // Unknown, to be updated
    language: "English / Haitian Creole",
    targetAudience: "Haitian Creole speakers learning English",
    style: "English teaching for Haitian Creole speakers",
    tiktokFollowers: 0,
    youtubeFollowers: 0,
    totalReach: 0,
    country: "Haiti / USA",
    niche: "English teaching for Haitian Creole speakers, bilingual education",
    url: "https://www.instagram.com/englishwith.herold",
    email: "",
    notes: "English teacher targeting Haitian Creole speakers. Bidirectional value: teaches English to Haitians (our user base) and provides authentic Haitian Creole content for our Creole curriculum.",
  },
];

async function findTable(name) {
  const res = await fetch(`https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables`, { headers });
  if (!res.ok) return null;
  const data = await res.json();
  const table = data.tables.find((t) => t.name === name);
  return table ? table.id : null;
}

async function createTable(name, fields) {
  const res = await fetch(`https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables`, {
    method: "POST",
    headers,
    body: JSON.stringify({ name, fields }),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`Create table error: ${text}`);
    return null;
  }
  const data = await res.json();
  return data.id;
}

async function batchCreate(tableId, records) {
  const batches = [];
  for (let i = 0; i < records.length; i += 10) {
    batches.push(records.slice(i, i + 10));
  }

  let created = 0;
  for (const batch of batches) {
    const res = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${tableId}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ records: batch.map((fields) => ({ fields })) }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error(`Batch create error: ${text}`);
      continue;
    }
    const data = await res.json();
    created += data.records.length;
    await new Promise((r) => setTimeout(r, 250));
  }
  return created;
}

async function main() {
  console.log("=== Uploading Haitian/Creole Content Creators to Airtable ===\n");

  // Use the same "English Teaching Creators" table (it's the general creators table)
  // Or create a "Haitian Creole Creators" table
  const TABLE_NAME = "Content Creator Sources";
  
  let tableId = await findTable(TABLE_NAME);
  if (!tableId) {
    console.log(`Creating '${TABLE_NAME}' table...`);
    tableId = await createTable(TABLE_NAME, [
      { name: "Name", type: "singleLineText" },
      { name: "Handle", type: "singleLineText" },
      { name: "Platform", type: "singleLineText" },
      { name: "IG Followers", type: "number", options: { precision: 0 } },
      { name: "TikTok Followers", type: "number", options: { precision: 0 } },
      { name: "YouTube Followers", type: "number", options: { precision: 0 } },
      { name: "Total Reach", type: "number", options: { precision: 0 } },
      { name: "Language", type: "singleLineText" },
      { name: "Target Audience", type: "singleLineText" },
      { name: "Teaching Style", type: "multilineText" },
      { name: "Country", type: "singleLineText" },
      { name: "Niche", type: "singleLineText" },
      { name: "URL", type: "url" },
      { name: "Email", type: "email" },
      { name: "Outreach Status", type: "singleSelect", options: { choices: [
        { name: "Not Contacted" },
        { name: "Contacted" },
        { name: "In Discussion" },
        { name: "Partnership Active" },
        { name: "Declined" },
      ]}},
      { name: "Priority", type: "singleSelect", options: { choices: [
        { name: "High" },
        { name: "Medium" },
        { name: "Low" },
      ]}},
      { name: "Notes", type: "multilineText" },
    ]);
    if (!tableId) {
      console.error("Failed to create table");
      process.exit(1);
    }
    console.log(`Created table with ID: ${tableId}`);
  } else {
    console.log(`Found existing table: ${tableId}`);
  }

  // Upload creators
  const records = creators.map((c) => ({
    Name: c.name,
    Handle: c.handle,
    Platform: c.platform,
    "IG Followers": c.followers,
    "TikTok Followers": c.tiktokFollowers,
    "YouTube Followers": c.youtubeFollowers,
    "Total Reach": c.totalReach,
    Language: c.language,
    "Target Audience": c.targetAudience,
    "Teaching Style": c.style,
    Country: c.country,
    Niche: c.niche,
    URL: c.url,
    Email: c.email || undefined,
    "Outreach Status": "Not Contacted",
    Priority: c.totalReach > 100000 ? "High" : "Medium",
    Notes: c.notes,
  }));

  // Remove undefined fields
  const cleanRecords = records.map(r => {
    const clean = {};
    for (const [k, v] of Object.entries(r)) {
      if (v !== undefined && v !== "") clean[k] = v;
    }
    return clean;
  });

  console.log(`Uploading ${cleanRecords.length} creators...`);
  const created = await batchCreate(tableId, cleanRecords);
  console.log(`✅ Successfully uploaded ${created} creators to Airtable!`);

  // Summary
  console.log("\n=== Summary ===");
  console.log(`Total creators: ${creators.length}`);
  console.log(`Total combined reach: ${creators.reduce((sum, c) => sum + c.totalReach, 0).toLocaleString()}`);
  creators.forEach((c) => {
    console.log(`  ${c.handle} — ${c.followers.toLocaleString()} IG followers — ${c.language} — ${c.country}`);
  });
}

main().catch(console.error);
