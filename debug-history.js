const https = require('https');
require('dotenv').config({ path: '.env.local' });

const POD_ID = process.env.RUNPOD_POD_ID;
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;
const PROMPT_ID = '89d2fe90-f11f-4210-892c-ee02de5533a3';

async function check() {
    try {
        const r = await fetch(`${BASE_URL}/history/${PROMPT_ID}`);
        const h = await r.json();
        const prompt = h[PROMPT_ID];

        console.log("PROMPT_ID:", PROMPT_ID);
        console.log("STATUS STR:", prompt.status.status_str);
        console.log("COMPLETED:", prompt.status.completed);

        if (prompt.status.messages) {
            const err = prompt.status.messages.find(m => m[0] === 'execution_error');
            if (err) console.log("ERROR:", JSON.stringify(err, null, 2));
        }

        if (prompt.outputs) {
            console.log("OUTPUTS:", JSON.stringify(prompt.outputs, null, 2));
        } else {
            console.log("NO OUTPUTS FOUND");
        }

    } catch (e) {
        console.error(e.message);
    }
}
check();
