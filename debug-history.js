const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const POD_ID = process.env.RUNPOD_POD_ID;
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;
const PROMPT_ID = process.argv[2];

if (!PROMPT_ID) {
    console.log("Usage: node debug-history.js <prompt_id>");
    process.exit(1);
}

async function debug() {
    try {
        const res = await fetch(`${BASE_URL}/history/${PROMPT_ID}`);
        const data = await res.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Error:", e.message);
    }
}

debug();
