require("dotenv").config();

const AIRTABLE_TOKEN = process.env.AIRTABLE_API_KEY || process.env.AIRTABLE_TOKEN || process.env.AIRTABLE_PAT;
const BASE_ID = process.env.AIRTABLE_BASE_ID;

const headers = {
  Authorization: `Bearer ${AIRTABLE_TOKEN}`,
  "Content-Type": "application/json",
};

async function main() {
  // Find the existing Haitian Creole Creators table
  const res = await fetch(`https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables`, { headers });
  const data = await res.json();
  const table = data.tables.find(t => t.name === "Haitian Creole Creators");
  if (!table) {
    console.log("Table not found");
    return;
  }

  const record = {
    Name: "ItsAI History (Parker Gordon)",
    Handle: "@itsaihistory",
    Platform: "Instagram",
    "IG Followers": 280000,
    "TikTok Followers": 100000,
    "YouTube Followers": 63200,
    "Total Reach": 500000,
    Language: "Multi-Language (History & Linguistics)",
    "Target Audience": "History enthusiasts, language learners, educational content consumers",
    "Teaching Style": "AI-assisted historical recreations, engineered realism, documentary-style, linguistics + history",
    Country: "USA (Fort Lauderdale, FL)",
    Niche: "History, linguistics, AI-generated educational content, cultural context, language evolution",
    URL: "https://www.instagram.com/itsaihistory",
    Email: "itsaihistory@gmail.com",
    "Outreach Status": "Not Contacted",
    Priority: "High",
    Notes: "The World's History & Language Channel. 500K+ followers across platforms. Est. Oct 2025. Massive growth (0 to 500K in 7 months). AI-assisted visual recreations for educational purposes. Combines linguistics with historical context. Valuable for cultural/historical context in language lessons.",
  };

  const createRes = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${table.id}`, {
    method: "POST",
    headers,
    body: JSON.stringify({ records: [{ fields: record }] }),
  });

  if (!createRes.ok) {
    console.error("Error:", await createRes.text());
    return;
  }

  const result = await createRes.json();
  console.log("✅ @itsaihistory uploaded to Airtable! Record ID:", result.records[0].id);
}

main().catch(console.error);
