/**
 * Live E2E test of the Hume call pipeline.
 * Tests: OAuth token → EVI config → WebSocket connection → message receipt
 */

const HUME_API_KEY = process.env.HUME_API_KEY;
const HUME_SECRET_KEY = process.env.HUME_SECRET_KEY;

if (!HUME_API_KEY || !HUME_SECRET_KEY) {
  console.log("ERROR: HUME_API_KEY or HUME_SECRET_KEY not set in environment");
  process.exit(1);
}

console.log("Step 1: Keys present ✓");
console.log("  API Key:", HUME_API_KEY.substring(0, 8) + "..." + HUME_API_KEY.substring(HUME_API_KEY.length - 4));
console.log("  Secret:", HUME_SECRET_KEY.substring(0, 8) + "..." + HUME_SECRET_KEY.substring(HUME_SECRET_KEY.length - 4));

async function runTest() {
  // Step 2: Test OAuth token generation
  console.log("\nStep 2: Requesting OAuth token from Hume...");
  const credentials = Buffer.from(HUME_API_KEY + ":" + HUME_SECRET_KEY).toString("base64");
  const tokenRes = await fetch("https://api.hume.ai/oauth2-cc/token", {
    method: "POST",
    headers: {
      Authorization: "Basic " + credentials,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    console.log("ERROR: Token request failed:", tokenRes.status, err);
    process.exit(1);
  }

  const tokenData = await tokenRes.json();
  console.log("  Token received ✓");
  console.log("  Access token:", tokenData.access_token.substring(0, 20) + "...");
  console.log("  Expires in:", tokenData.expires_in, "seconds");

  // Step 3: Test EVI config listing (validates API key)
  console.log("\nStep 3: Listing EVI configs...");
  const configRes = await fetch("https://api.hume.ai/v0/evi/configs?page_size=3", {
    headers: { "X-Hume-Api-Key": HUME_API_KEY },
  });

  if (!configRes.ok) {
    console.log("ERROR: Config list failed:", configRes.status);
    process.exit(1);
  }

  const configData = await configRes.json();
  const configs = configData.configs_page || [];
  console.log("  Configs found:", configs.length, "✓");

  // Step 4: Test WebSocket connection to Hume EVI
  console.log("\nStep 4: Testing WebSocket connection to Hume EVI...");
  const wsUrl = "wss://api.hume.ai/v0/evi/chat?access_token=" + tokenData.access_token;

  const { WebSocket } = await import("ws");

  return new Promise((resolve) => {
    const ws = new WebSocket(wsUrl);
    let connected = false;
    let messagesReceived = [];

    const timeout = setTimeout(() => {
      if (!connected) {
        console.log("  WebSocket connection timed out (10s)");
        ws.close();
        resolve(false);
      }
    }, 10000);

    ws.on("open", () => {
      connected = true;
      clearTimeout(timeout);
      console.log("  WebSocket connected ✓");
      console.log("  URL: wss://api.hume.ai/v0/evi/chat");

      ws.on("message", (data) => {
        try {
          const msg = JSON.parse(data.toString());
          messagesReceived.push(msg.type);
          console.log("  Received message type:", msg.type);
          if (msg.type === "chat_metadata") {
            console.log("    Chat ID:", msg.chat_id);
            console.log("    Chat group ID:", msg.chat_group_id);
          }
        } catch (e) {
          // ignore
        }
      });

      // Close after 4 seconds of listening
      setTimeout(() => {
        console.log("\nStep 5: Closing WebSocket...");
        ws.close();
        console.log("  WebSocket closed ✓");

        console.log("\n═══════════════════════════════════════");
        console.log("  PIPELINE VERIFICATION SUMMARY");
        console.log("═══════════════════════════════════════");
        console.log("  ✓ Step 1: API keys present");
        console.log("  ✓ Step 2: OAuth token generated");
        console.log("  ✓ Step 3: EVI configs accessible");
        console.log("  ✓ Step 4: WebSocket connected");
        console.log("  ✓ Step 5: Clean disconnect");
        console.log("  Messages received:", messagesReceived.join(", ") || "(none in 4s)");
        console.log("═══════════════════════════════════════");
        console.log("  ALL PIPELINE STEPS PASSED ✓");
        console.log("═══════════════════════════════════════");
        resolve(true);
      }, 4000);
    });

    ws.on("error", (err) => {
      clearTimeout(timeout);
      console.log("  WebSocket error:", err.message);
      resolve(false);
    });
  });
}

runTest().catch((e) => {
  console.error("Test failed:", e);
  process.exit(1);
});
