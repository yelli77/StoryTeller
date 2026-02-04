const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const POD_ID = process.env.RUNPOD_POD_ID;
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

async function checkDownloader() {
    try {
        console.log("🔍 Checking 'Diffusers Hub Model Down-Loader'...");

        const nodeName = 'Diffusers Hub Model Down-Loader';
        // Note: The name in pod_nodes.txt might be Display Name or ID. 
        // We need the internal ID. Usually it's similar.
        // Let's check object_info key for it.

        const res = await fetch(`${BASE_URL}/object_info`);
        const data = await res.json();

        const key = Object.keys(data).find(k => k.includes('Down-Loader') || k.includes('DownLoader'));

        if (key) {
            console.log(`✅ Found Node Key: ${key}`);
            console.log(JSON.stringify(data[key], null, 2));
        } else {
            console.log("❌ Node not found in object_info keys.");
        }

    } catch (err) {
        console.error("Error:", err.message);
    }
}

checkDownloader();
