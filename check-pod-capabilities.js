const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const POD_ID = process.env.RUNPOD_POD_ID || 'g4oysjh535la54';
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

async function getAvailableNodes() {
    console.log(`Checking nodes on ${BASE_URL}...`);
    try {
        const res = await fetch(`${BASE_URL}/object_info`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const nodeNames = Object.keys(data).sort();

        fs.writeFileSync('pod_nodes.txt', nodeNames.join('\n'));
        console.log(`Found ${nodeNames.length} nodes. Saved to pod_nodes.txt`);

        // Specifically look for IPAdapter and FaceDetailer
        const interesting = nodeNames.filter(n =>
            n.toLowerCase().includes('ipadapter') ||
            n.toLowerCase().includes('facedetailer') ||
            n.toLowerCase().includes('adetailer') ||
            n.toLowerCase().includes('flux')
        );
        console.log("Interesting nodes:", interesting);
    } catch (err) {
        console.error("Failed to fetch nodes:", err.message);
    }
}

getAvailableNodes();
