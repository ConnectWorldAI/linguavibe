/**
 * Upload Full Multilingual Slang Database to Airtable
 * Table: "Slang Database" with all 181 entries across 19 dialects
 * 
 * Retry of previously interrupted OOM upload — uses streaming batches
 * to keep memory low and respects Airtable rate limits.
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

// ─── Airtable Helpers ───────────────────────────────────────────────────────

async function findOrCreateTable(name, fields) {
  // First try to find existing table
  const listRes = await fetch(`https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables`, { headers });
  if (listRes.ok) {
    const data = await listRes.json();
    const existing = data.tables.find((t) => t.name === name);
    if (existing) {
      console.log(`  ✓ Table "${name}" already exists (${existing.id})`);
      return existing.id;
    }
  }

  // Create new table
  const createRes = await fetch(`https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables`, {
    method: "POST",
    headers,
    body: JSON.stringify({ name, fields }),
  });

  if (!createRes.ok) {
    const text = await createRes.text();
    if (text.includes("DUPLICATE_TABLE_NAME")) {
      // Race condition — just find it
      const retry = await fetch(`https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables`, { headers });
      const retryData = await retry.json();
      return retryData.tables.find((t) => t.name === name)?.id;
    }
    throw new Error(`Failed to create table "${name}": ${text}`);
  }

  const data = await createRes.json();
  console.log(`  ✓ Created table "${name}" (${data.id})`);
  return data.id;
}

async function batchCreate(tableId, records) {
  let created = 0;
  let failed = 0;

  // Airtable max 10 records per request
  for (let i = 0; i < records.length; i += 10) {
    const batch = records.slice(i, i + 10);
    
    try {
      const res = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${tableId}`, {
        method: "POST",
        headers,
        body: JSON.stringify({ records: batch.map((fields) => ({ fields })) }),
      });

      if (!res.ok) {
        const text = await res.text();
        if (text.includes("DUPLICATE_RECORD") || text.includes("INVALID_VALUE")) {
          console.warn(`  ⚠ Batch ${Math.floor(i/10)+1} partial error: ${text.slice(0, 100)}`);
          failed += batch.length;
        } else {
          console.error(`  ✗ Batch ${Math.floor(i/10)+1} failed: ${text.slice(0, 200)}`);
          failed += batch.length;
        }
      } else {
        const data = await res.json();
        created += data.records.length;
      }
    } catch (err) {
      console.error(`  ✗ Network error on batch ${Math.floor(i/10)+1}: ${err.message}`);
      failed += batch.length;
    }

    // Rate limit: 5 requests/sec → 250ms between requests
    await new Promise((r) => setTimeout(r, 250));
  }

  return { created, failed };
}

// ─── Slang Data (inline to avoid importing TS) ─────────────────────────────

// We'll read the slang data by requiring the compiled version or parsing directly
// Since the file is TypeScript, we use a simple extraction approach

const fs = require("fs");
const path = require("path");

function extractSlangData() {
  const content = fs.readFileSync(path.join(__dirname, "../lib/slang-data.ts"), "utf-8");
  
  // Extract all const arrays
  const dialectSections = [];
  const constRegex = /^const (\w+): SlangEntry\[\] = \[([\s\S]*?)\];/gm;
  let match;
  
  while ((match = constRegex.exec(content)) !== null) {
    const varName = match[1];
    const arrayContent = match[2];
    
    // Map variable name to language/dialect
    const dialectMap = {
      SPANISH_DOMINICAN: { language: "Spanish", dialect: "Dominican", region: "Dominican Republic" },
      SPANISH_MEXICAN: { language: "Spanish", dialect: "Mexican", region: "Mexico" },
      ENGLISH_AMERICAN: { language: "English", dialect: "American", region: "United States" },
      ENGLISH_BRITISH: { language: "English", dialect: "British", region: "United Kingdom" },
      FRENCH_SLANG: { language: "French", dialect: "Standard", region: "France" },
      PORTUGUESE_BRAZILIAN: { language: "Portuguese", dialect: "Brazilian", region: "Brazil" },
      JAPANESE_SLANG: { language: "Japanese", dialect: "Standard", region: "Japan" },
      MANDARIN_SLANG: { language: "Mandarin", dialect: "Standard", region: "China" },
      HINDI_SLANG: { language: "Hindi", dialect: "Standard", region: "India" },
      KOREAN_SLANG: { language: "Korean", dialect: "Standard", region: "South Korea" },
      ARABIC_SLANG: { language: "Arabic", dialect: "Standard", region: "Middle East" },
      ITALIAN_SLANG: { language: "Italian", dialect: "Standard", region: "Italy" },
      GERMAN_SLANG: { language: "German", dialect: "Standard", region: "Germany" },
      JAMAICAN_PATOIS: { language: "Jamaican Patois", dialect: "Patois", region: "Jamaica" },
      HAITIAN_CREOLE: { language: "Haitian Creole", dialect: "Standard", region: "Haiti" },
      SPANISH_COLOMBIAN: { language: "Spanish", dialect: "Colombian", region: "Colombia" },
      SPANISH_VENEZUELAN: { language: "Spanish", dialect: "Venezuelan", region: "Venezuela" },
      SPANISH_PANAMANIAN: { language: "Spanish", dialect: "Panamanian", region: "Panama" },
      EGYPTIAN_ARABIC: { language: "Arabic", dialect: "Egyptian", region: "Egypt" },
    };
    
    const meta = dialectMap[varName];
    if (!meta) continue;
    
    // Parse entries from the array content using regex
    const entryRegex = /\{\s*id:\s*"([^"]+)",\s*expression:\s*"([^"]+)",\s*literal:\s*"([^"]+)",\s*meaning:\s*"([^"]+)",\s*usage:\s*"([^"]+)",\s*example:\s*"([^"]+)",\s*exampleTranslation:\s*"([^"]+)",\s*formality:\s*"([^"]+)",\s*category:\s*"([^"]+)",\s*source:\s*"([^"]+)",\s*audioAvailable:\s*(true|false)\s*\}/g;
    
    let entryMatch;
    while ((entryMatch = entryRegex.exec(arrayContent)) !== null) {
      dialectSections.push({
        "Language": meta.language,
        "Word/Phrase": entryMatch[2],
        "Pronunciation": entryMatch[3],
        "Meaning": entryMatch[4],
        "Region": meta.region,
        "Example Sentence": entryMatch[6],
        "English Translation": entryMatch[7],
        "Formality": entryMatch[8],
        "Category": entryMatch[9],
        "Cultural Context": entryMatch[5],
        "Trending": "Yes",
        "Approved": "Yes",
      });
    }
  }
  
  return dialectSections;
}

// ─── Main Upload ────────────────────────────────────────────────────────────

async function main() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  SLANG DATABASE → AIRTABLE UPLOAD");
  console.log("  Retry of interrupted OOM upload (streaming batches)");
  console.log("═══════════════════════════════════════════════════════════\n");

  // 1. Extract slang data from TypeScript source
  console.log("1. Extracting slang data from lib/slang-data.ts...");
  const entries = extractSlangData();
  console.log(`   Found ${entries.length} entries across ${new Set(entries.map(e => e.Language + "/" + e.Dialect)).size} dialects\n`);

  if (entries.length === 0) {
    console.error("No entries extracted! Check the regex parsing.");
    process.exit(1);
  }

  // 2. Create/find the Slang Database table
  // Table already exists with fields: Language, Word/Phrase, Pronunciation, Meaning, Region, Example Sentence, English Translation, Formality, Category, Cultural Context, Trending, Approved
  console.log("2. Finding existing 'Slang Database' table...");
  const tableId = "tbljo41Zh9DfkDGa2"; // Already exists

  if (!tableId) {
    console.error("Could not create/find table!");
    process.exit(1);
  }

  // 3. Upload in dialect batches to keep memory low
  console.log(`\n3. Uploading ${entries.length} slang entries in batches...\n`);

  const dialects = [...new Set(entries.map(e => `${e.Language}/${e.Dialect}`))];
  let totalCreated = 0;
  let totalFailed = 0;

  for (const dialect of dialects) {
    const dialectEntries = entries.filter(e => `${e.Language}/${e.Dialect}` === dialect);
    process.stdout.write(`   ${dialect} (${dialectEntries.length} entries)... `);
    
    const { created, failed } = await batchCreate(tableId, dialectEntries);
    totalCreated += created;
    totalFailed += failed;
    
    console.log(failed > 0 ? `✓ ${created} created, ⚠ ${failed} failed` : `✓ ${created} created`);
  }

  // 4. Summary
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log(`  UPLOAD COMPLETE`);
  console.log(`  Total created: ${totalCreated}`);
  console.log(`  Total failed: ${totalFailed}`);
  console.log(`  Dialects covered: ${dialects.length}`);
  console.log(`  Table ID: ${tableId}`);
  console.log("═══════════════════════════════════════════════════════════\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
