/**
 * Upload @yourspanishwithjavier to Airtable "Content Creator Sources" table
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

const creator = {
  Name: "Javier Benavides",
  Handle: "@yourspanishwithjavier",
  Platform: "Instagram",
  "IG Followers": 348000,
  "TikTok Followers": 49800,
  "YouTube Followers": 1170,
  "Total Reach": 1152070,
  Language: "Spanish (Latin American / Colombian)",
  "Target Audience": "English speakers learning Spanish, beginners to intermediate",
  "Teaching Style": "Short-form video (Reels/TikTok) teaching real conversational Spanish. Focus on practical phrases, slang, and everyday expressions. Uses music-based learning (promotes @LyricFluentApp). Engaging, casual teaching style with humor. Teaches alternatives to textbook phrases. Offers Italki classes for 1-on-1 tutoring.",
  Country: "Colombia",
  Niche: "Spanish Language Education, Conversational Spanish, Slang",
  URL: "https://www.instagram.com/yourspanishwithjavier",
  Email: "learnspanishwith.me@outlook.com",
  "Outreach Status": "Not Contacted",
  Priority: "High",
  Notes: "1.15M+ total cross-platform reach. Active on Instagram (348K), TikTok (49.8K), Facebook (709K), Threads (44.1K), YouTube (1.17K). Teaches 'real Spanish' vs textbook Spanish. Uses music for learning. Extremely relevant to LinguaVibe's slang/dialect focus. Also has @LyricFluentApp which aligns with our music translation features.",
};

async function findTable(name) {
  const res = await fetch(`https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables`, { headers });
  const data = await res.json();
  const table = data.tables?.find((t) => t.name === name);
  return table?.id;
}

async function createTable(name, fields) {
  const res = await fetch(`https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables`, {
    method: "POST",
    headers,
    body: JSON.stringify({ name, fields }),
  });
  const text = await res.text();
  if (text.includes("DUPLICATE_TABLE_NAME")) {
    console.log(`Table "${name}" already exists, finding it...`);
    return findTable(name);
  }
  const data = JSON.parse(text);
  if (!res.ok) {
    console.error("Create table error:", text);
    return null;
  }
  return data.id;
}

async function main() {
  console.log("Looking for 'Content Creator Sources' table...");
  let tableId = await findTable("Content Creator Sources");

  if (!tableId) {
    console.log("Table not found, creating it...");
    tableId = await createTable("Content Creator Sources", [
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
        { name: "Not Contacted" }, { name: "Contacted" }, { name: "In Discussion" },
        { name: "Partnership Active" }, { name: "Declined" }
      ]}},
      { name: "Priority", type: "singleSelect", options: { choices: [
        { name: "High" }, { name: "Medium" }, { name: "Low" }
      ]}},
      { name: "Notes", type: "multilineText" },
    ]);
  }

  if (!tableId) {
    console.error("Could not find or create table");
    process.exit(1);
  }

  console.log(`Table ID: ${tableId}`);
  console.log("Uploading creator record...");

  const res = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${tableId}`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      records: [{ fields: creator }],
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("Upload error:", JSON.stringify(data, null, 2));
    process.exit(1);
  }

  console.log("✅ Successfully uploaded @yourspanishwithjavier to Airtable!");
  console.log(`Record ID: ${data.records?.[0]?.id}`);
  console.log(`Name: ${creator.Name}`);
  console.log(`Handle: ${creator.Handle}`);
  console.log(`Total Reach: ${creator["Total Reach"].toLocaleString()}`);
  console.log(`Priority: ${creator.Priority}`);
  console.log(`Email: ${creator.Email}`);
}

main().catch(console.error);
