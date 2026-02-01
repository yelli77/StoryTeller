const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const POD_ID = process.env.RUNPOD_POD_ID || 'g4oysjh535la54';
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

async function getDetailedNodeInfo() {
    try {
        const res = await fetch(`${BASE_URL}/object_info`);
        const data = await res.json();

        const nodes = ['ApplyInstantID', 'IPAdapterAdvanced', 'KSampler'];
        const info = {};

        nodes.forEach(node => {
            if (data[node]) {
                info[node] = data[node].input;
            }
        });

        fs.writeFileSync('node_details.json', JSON.stringify(info, null, 2));
        console.log("Detailed node info saved to node_details.json");
    } catch (err) {
        console.error("Error:", err.message);
    }
}

getDetailedNodeInfo();
