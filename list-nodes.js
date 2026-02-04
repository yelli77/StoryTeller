const https = require('https');
require('dotenv').config({ path: '.env.local' });

const POD_ID = process.env.RUNPOD_POD_ID;
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

async function listAllNodes() {
    console.log(`🔍 Fetching object_info from ${BASE_URL}...`);
    try {
        const res = await fetch(`${BASE_URL}/object_info`);
        const data = await res.json();

        const nodeNames = Object.keys(data);
        console.log(`Total Nodes Registered: ${nodeNames.length}`);

        const pulidNodes = nodeNames.filter(n => n.toLowerCase().includes('pulid'));
        console.log("\n--- Pulid Related Nodes ---");
        pulidNodes.forEach(n => console.log(`- ${n}`));

        const fluxNodes = nodeNames.filter(n => n.toLowerCase().includes('flux') && !n.toLowerCase().includes('cond'));
        console.log("\n--- Flux Related Nodes (Non-conditioning) ---");
        fluxNodes.forEach(n => console.log(`- ${n}`));

    } catch (e) {
        console.error("Failed to fetch node info:", e.message);
    }
}

listAllNodes();
