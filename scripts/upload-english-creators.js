/**
 * Upload 18 English Teaching Creators to Airtable
 * Tables: Creators, Outreach, Teaching Patterns
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

// All 18 English teaching creators
const creators = [
  {
    name: "English Teacher Claire",
    handle: "@englishteacherclaire",
    platform: "Instagram",
    followers: 853000,
    language: "English",
    targetAudience: "Global English learners",
    style: "Fun, practical English with relatable mishaps",
    tiktokFollowers: 2500000,
    youtubeFollowers: 0,
    totalReach: 3353000,
    country: "USA",
    niche: "Practical English, everyday expressions",
    url: "https://instagram.com/englishteacherclaire",
  },
  {
    name: "Speak English with Tiffani (Daily Fluency)",
    handle: "@speakenglishwithtiffani",
    platform: "Instagram",
    followers: 448000,
    language: "English",
    targetAudience: "Intermediate/Advanced learners",
    style: "365-day structured fluency system, podcast format",
    tiktokFollowers: 0,
    youtubeFollowers: 200000,
    totalReach: 648000,
    country: "USA",
    niche: "Structured fluency path, daily practice",
    url: "https://instagram.com/speakenglishwithtiffani",
  },
  {
    name: "Inglés con Vero",
    handle: "@inglesconvero_",
    platform: "Instagram",
    followers: 164000,
    language: "English",
    targetAudience: "Spanish speakers learning English (Colombia/Mexico)",
    style: "Songs, trends, stop-translating method",
    tiktokFollowers: 100000,
    youtubeFollowers: 0,
    totalReach: 264000,
    country: "Colombia",
    niche: "English for Spanish speakers, song-based learning",
    url: "https://instagram.com/inglesconvero_",
  },
  {
    name: "Clémence Arbib (Learn English with Clemence)",
    handle: "@learnenglishwithclemence",
    platform: "Instagram",
    followers: 6000000,
    language: "English + French",
    targetAudience: "French speakers learning English, global audience",
    style: "Bilingual content, relatable scenarios, also runs @learnfrenchwithclemence (1.3M)",
    tiktokFollowers: 2000000,
    youtubeFollowers: 500000,
    totalReach: 9800000,
    country: "France/USA (Florida)",
    niche: "Bilingual English/French, mega-influencer",
    url: "https://instagram.com/learnenglishwithclemence",
  },
  {
    name: "Fluently Eve",
    handle: "@fluently.eve",
    platform: "Instagram",
    followers: 227000,
    language: "English",
    targetAudience: "Italian/European English learners",
    style: "Ambassador for Fluently App, AI-assisted speaking practice",
    tiktokFollowers: 100000,
    youtubeFollowers: 0,
    totalReach: 327000,
    country: "Italy/USA",
    niche: "Fluently App ambassador, AI-powered learning",
    url: "https://instagram.com/fluently.eve",
  },
  {
    name: "Rodica English Teacher",
    handle: "@rodica_english_teacher",
    platform: "Instagram",
    followers: 387000,
    language: "English",
    targetAudience: "Global English learners",
    style: "Full production team (manager, videographer), professional content",
    tiktokFollowers: 1500000,
    youtubeFollowers: 200000,
    totalReach: 2087000,
    country: "Romania/International",
    niche: "Professional production, vocabulary challenges",
    url: "https://instagram.com/rodica_english_teacher",
  },
  {
    name: "Jack Alexander",
    handle: "@jackalexanderenglish",
    platform: "Instagram",
    followers: 1000000,
    language: "English",
    targetAudience: "Global learners wanting British English",
    style: "British English, humor, cultural content",
    tiktokFollowers: 500000,
    youtubeFollowers: 1260000,
    totalReach: 2760000,
    country: "UK",
    niche: "British English, YouTube star, humor-based teaching",
    url: "https://instagram.com/jackalexanderenglish",
  },
  {
    name: "Collins Agyapong (English with Collins)",
    handle: "@englishwithcollins",
    platform: "Instagram",
    followers: 1000000,
    language: "English",
    targetAudience: "Global learners wanting American English",
    style: "American English, clear pronunciation, vocabulary building",
    tiktokFollowers: 1000000,
    youtubeFollowers: 200000,
    totalReach: 2200000,
    country: "USA/Ghana",
    niche: "American English pronunciation, vocabulary",
    url: "https://instagram.com/englishwithcollins",
  },
  {
    name: "Let's Talk Academy",
    handle: "@letstalkpodcast",
    platform: "Instagram",
    followers: 299000,
    language: "English",
    targetAudience: "Indian/South Asian English learners",
    style: "Academy model with multiple trainers (Anjali, Michelle, Ananya, Nysha)",
    tiktokFollowers: 100000,
    youtubeFollowers: 8000000,
    totalReach: 8399000,
    country: "India",
    niche: "YouTube academy, multiple trainers, structured courses",
    url: "https://instagram.com/letstalkpodcast",
  },
  {
    name: "Khalid Adlani (Study with Zaki)",
    handle: "@studywithzaki",
    platform: "Instagram",
    followers: 1000000,
    language: "English + Business",
    targetAudience: "Professionals, business English learners",
    style: "English + business skills, entrepreneurship content",
    tiktokFollowers: 500000,
    youtubeFollowers: 200000,
    totalReach: 1700000,
    country: "Morocco/International",
    niche: "Business English, professional development",
    url: "https://instagram.com/studywithzaki",
  },
  {
    name: "Veronika Mark",
    handle: "@iam.veronikamark",
    platform: "Instagram",
    followers: 200000,
    language: "English",
    targetAudience: "Science-minded language learners",
    style: "Science-backed language learning, Speaking Club community",
    tiktokFollowers: 1100000,
    youtubeFollowers: 100000,
    totalReach: 1400000,
    country: "International",
    niche: "Science-backed methods, community Speaking Club",
    url: "https://instagram.com/iam.veronikamark",
  },
  {
    name: "Jay Fujiwara",
    handle: "@jayfujiwara",
    platform: "Instagram",
    followers: 6300000,
    language: "English + Japanese",
    targetAudience: "Global language learners, Japanese speakers",
    style: "#1 language learning influencer, built BigBean app, London/Tokyo based",
    tiktokFollowers: 5800000,
    youtubeFollowers: 1000000,
    totalReach: 13100000,
    country: "UK/Japan",
    niche: "Mega-influencer, app builder (BigBean), visual vocabulary",
    url: "https://instagram.com/jayfujiwara",
  },
  {
    name: "English with Regan",
    handle: "@englishwithregan",
    platform: "Instagram",
    followers: 481000,
    language: "English",
    targetAudience: "Learners wanting British English confidence",
    style: "British English, confidence building, pronunciation",
    tiktokFollowers: 200000,
    youtubeFollowers: 100000,
    totalReach: 781000,
    country: "UK",
    niche: "British English confidence, pronunciation coaching",
    url: "https://instagram.com/englishwithregan",
  },
  {
    name: "Fluently Anna (Anna Garcia)",
    handle: "@fluently.anna",
    platform: "Instagram",
    followers: 150000,
    language: "English",
    targetAudience: "Spanish speakers learning English",
    style: "Fluently App ambassador, AI-assisted practice",
    tiktokFollowers: 100000,
    youtubeFollowers: 0,
    totalReach: 250000,
    country: "Spain/International",
    niche: "Fluently App ambassador, competitor intel",
    url: "https://instagram.com/fluently.anna",
  },
  {
    name: "Donnie Jackson",
    handle: "@donnie.jackson.english",
    platform: "Instagram",
    followers: 655000,
    language: "English",
    targetAudience: "French speakers learning English",
    style: "Vocabulary challenges, pronunciation tips, based in Northern France",
    tiktokFollowers: 467000,
    youtubeFollowers: 200000,
    totalReach: 1322000,
    country: "France",
    niche: "English for French speakers, pronunciation challenges",
    url: "https://instagram.com/donnie.jackson.english",
  },
  {
    name: "Inglês com Leo",
    handle: "@ingles_comleo",
    platform: "Instagram",
    followers: 450000,
    language: "English",
    targetAudience: "Brazilian/Portuguese speakers learning English",
    style: "Slang, pronunciation, 'real English' not textbook, has Everyday English course",
    tiktokFollowers: 200000,
    youtubeFollowers: 100000,
    totalReach: 750000,
    country: "Brazil",
    niche: "English for Portuguese speakers, street English",
    url: "https://instagram.com/ingles_comleo",
  },
  {
    name: "PRES English",
    handle: "@pres_english",
    platform: "Instagram",
    followers: 378000,
    language: "English",
    targetAudience: "Global English learners",
    style: "Common mistakes, real life vs school English, E-book, YouTube 155K",
    tiktokFollowers: 200000,
    youtubeFollowers: 155000,
    totalReach: 733000,
    country: "International",
    niche: "Common mistakes, real vs textbook English",
    url: "https://instagram.com/pres_english",
  },
  {
    name: "Silvio Paulo English",
    handle: "@silviopauloenglish",
    platform: "Instagram",
    followers: 300000,
    language: "English",
    targetAudience: "Portuguese/Brazilian speakers learning English",
    style: "Engaging short-form content, pronunciation tips",
    tiktokFollowers: 200000,
    youtubeFollowers: 50000,
    totalReach: 550000,
    country: "Brazil/Portugal",
    niche: "English for Portuguese speakers",
    url: "https://instagram.com/silviopauloenglish",
  },
];

async function createTable(name, fields) {
  const res = await fetch(`https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables`, {
    method: "POST",
    headers,
    body: JSON.stringify({ name, fields }),
  });
  if (!res.ok) {
    const text = await res.text();
    if (text.includes("DUPLICATE_TABLE_NAME")) {
      console.log(`Table "${name}" already exists, finding it...`);
      const tablesRes = await fetch(`https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables`, { headers });
      const tables = await tablesRes.json();
      const existing = tables.tables.find((t) => t.name === name);
      return existing?.id;
    }
    throw new Error(`Failed to create table ${name}: ${text}`);
  }
  const data = await res.json();
  return data.id;
}

async function findTable(name) {
  const res = await fetch(`https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables`, { headers });
  const data = await res.json();
  const table = data.tables.find((t) => t.name === name);
  return table?.id;
}

async function batchCreate(tableId, records) {
  // Airtable allows max 10 records per request
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
    // Rate limit: 5 requests per second
    await new Promise((r) => setTimeout(r, 250));
  }
  return created;
}

async function main() {
  console.log("=== Uploading 18 English Teaching Creators to Airtable ===\n");

  // Find or create the English Creators table
  let tableId = await findTable("English Teaching Creators");
  if (!tableId) {
    console.log("Creating 'English Teaching Creators' table...");
    tableId = await createTable("English Teaching Creators", [
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
    "Outreach Status": "Not Contacted",
    Priority: c.totalReach > 5000000 ? "High" : c.totalReach > 1000000 ? "Medium" : "Low",
    Notes: `Competitor: ${c.handle.includes("fluently") ? "Yes (Fluently App)" : "No"}`,
  }));

  console.log(`Uploading ${records.length} creators...`);
  const created = await batchCreate(tableId, records);
  console.log(`✅ Successfully uploaded ${created} creators to Airtable!`);

  // Summary
  console.log("\n=== Summary ===");
  console.log(`Total creators: ${creators.length}`);
  console.log(`Total combined reach: ${creators.reduce((sum, c) => sum + c.totalReach, 0).toLocaleString()}`);
  console.log(`High priority (5M+): ${creators.filter((c) => c.totalReach > 5000000).length}`);
  console.log(`Medium priority (1M-5M): ${creators.filter((c) => c.totalReach > 1000000 && c.totalReach <= 5000000).length}`);
  console.log(`Low priority (<1M): ${creators.filter((c) => c.totalReach <= 1000000).length}`);
  console.log(`Competitors (Fluently): ${creators.filter((c) => c.handle.includes("fluently")).length}`);
}

main().catch(console.error);
