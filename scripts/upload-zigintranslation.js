/**
 * Upload @zigintranslation to Airtable "Content Creator Sources" table
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
  Name: "Zig",
  Handle: "@zigintranslation",
  Platform: "TikTok",
  "IG Followers": 1,
  "TikTok Followers": 4948,
  "YouTube Followers": 0,
  "Total Reach": 4949,
  Language: "Dominican Spanish",
  "Target Audience": "English speakers learning Dominican Spanish, Dominican diaspora reconnecting with dialect",
  "Teaching Style": "Short-form TikTok videos teaching authentic Dominican Spanish phrases and slang. Casual 'Dominican girly' persona. Documents her Speak app journey while teaching real dialect (Toy fundía, Toy quilla, Dame luz, Tu ta claro?). Music-integrated content asking about favorite Dominican songs. High engagement rate (13:1 likes-to-followers ratio). Fun, relatable, and culturally authentic.",
  Country: "USA (Dominican heritage)",
  Niche: "Dominican Spanish Dialect, Language Learning, Caribbean Culture",
  URL: "https://www.instagram.com/zigintranslation",
  Email: "",
  "Outreach Status": "Not Contacted",
  Priority: "Low",
  Notes: "Early-stage creator with exceptional engagement (64.7K likes on ~5K followers = 13:1 ratio). Perfect niche alignment with ConnectWorld AI's Dominican Spanish curriculum. Currently promotes Speak app — partnership opportunity to switch. Growing fast in exact dialect space we dominate. Monitor for 10K+ milestone to upgrade priority. Strategic value is HIGH despite low follower count due to perfect content-product fit.",
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

  console.log("✅ Successfully uploaded @zigintranslation to Airtable!");
  console.log(`Record ID: ${data.records?.[0]?.id}`);
  console.log(`Name: ${creator.Name}`);
  console.log(`Handle: ${creator.Handle}`);
  console.log(`Total Reach: ${creator["Total Reach"].toLocaleString()}`);
  console.log(`Priority: ${creator.Priority}`);
}

main().catch(console.error);
