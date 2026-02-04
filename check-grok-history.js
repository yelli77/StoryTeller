const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const POD_ID = process.env.RUNPOD_POD_ID || '9f4cwila6ehy9g';
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;
const PROMPT_ID = '244c6268-cf29-4fce-addc-dc18cf18b2e1';

async function checkHistory() {
    try {
        const res = await fetch(`${BASE_URL}/history/${PROMPT_ID}`);
        const data = await res.json();
        fs.writeFileSync('grok_history.json', JSON.stringify(data, null, 2));
        console.log("History saved to grok_history.json");
    } catch (err) {
        console.error("Error:", err.message);
    }
}

checkHistory();
