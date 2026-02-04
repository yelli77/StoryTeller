const https = require('https');
require('dotenv').config({ path: '.env.local' });

const POD_ID = process.env.RUNPOD_POD_ID;
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

async function nodeDetails() {
    try {
        const res = await fetch(`${BASE_URL}/object_info`);
        const data = await res.json();

        console.log("--- PulidFluxInsightFaceLoader ---");
        console.log(JSON.stringify(data["PulidFluxInsightFaceLoader"], null, 2));

    } catch (e) {
        console.error(e.message);
    }
}

nodeDetails();
