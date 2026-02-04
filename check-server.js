const https = require('https');
require('dotenv').config({ path: '.env.local' });

const POD_ID = process.env.RUNPOD_POD_ID || '9f4cwila6ehy9g';
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

async function checkServer() {
    console.log(`Pinging ${BASE_URL}...`);
    try {
        const res = await fetch(`${BASE_URL}/system_stats`);
        console.log(`Status Code: ${res.status}`);
        const text = await res.text();
        try {
            const json = JSON.parse(text);
            console.log("✅ Server is UP and returning JSON.");
            console.log("System Stats:", JSON.stringify(json, null, 2));
        } catch (e) {
            console.log("⚠️ Server responded, but not with JSON (likely getting ready).");
            console.log("Response Preview:", text.substring(0, 100)); // Print first 100 chars
        }
    } catch (e) {
        console.error("❌ Connection failed:", e.message);
    }
}

checkServer();
