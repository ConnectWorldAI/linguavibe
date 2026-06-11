/**
 * Upload @bilingueblogs (Rickie) to Airtable "Content Creator Sources" table
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
  Name: "Rickie (Bilingüe Blogs)",
  Handle: "@bilingueblogs",
  Platform: "Instagram",
  "IG Followers": 50000,
  "TikTok Followers": 59300,
  "YouTube Followers": 116000,
  "Total Reach": 235300,
  Language: "Spanish (Caribbean — Dominican, Puerto Rican, Cuban + Mexican)",
  "Target Audience": "English speakers learning real-world conversational Spanish with authentic accents and regional slang",
  "Teaching Style": "Dialect-focused accent coaching. Specializes in Caribbean Spanish (Dominican, Puerto Rican, Cuban) with deep knowledge of regional slang and colloquial expressions. Uses immersion challenges ('No English for 24 Hours'), audio submission feedback, daily real-life prompts, and AI conversation practice. Teaches self-study methodology with retention tips. Also covers Mexican Spanish slang. Students submit audio/video for personalized accent feedback.",
  Country: "United States (Miami Beach, FL)",
  Niche: "Spanish Fluency & Accent Coaching, Dialect-Specific Learning, Caribbean Spanish Slang",
  URL: "https://www.instagram.com/bilingueblogs",
  Email: "",
  "Outreach Status": "Not Contacted",
  Priority: "High",
  Notes: "235K+ total cross-platform reach. YouTube: 116K, TikTok: 59.3K (@toyaplatanado), Threads: 10K, Instagram: ~50K. Self-taught Black American who developed Dominican accent. 900+ active students. 7+ years of content. Extremely relevant to ConnectMe AI's dialect-aware teaching — his Caribbean Spanish slang databases and accent coaching methodology are directly applicable to our LLM's dialect training. Key differentiator: teaches HOW to develop specific regional accents, not just vocabulary. Blog has extensive slang guides by country (Dominican, Puerto Rican, Cuban, Mexican). Potential roles: dialect verification consultant, featured teacher, content licensing for slang/dialect database.",
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

  console.log("✅ Successfully uploaded @bilingueblogs to Airtable!");
  console.log(`Record ID: ${data.records?.[0]?.id}`);
  console.log(`Name: ${creator.Name}`);
  console.log(`Handle: ${creator.Handle}`);
  console.log(`Total Reach: ${creator["Total Reach"].toLocaleString()}`);
  console.log(`Priority: ${creator.Priority}`);
}

main().catch(console.error);
