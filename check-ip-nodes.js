const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const POD_ID = process.env.RUNPOD_POD_ID;
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

async function checkNodes() {
    try {
        const res = await fetch(`${BASE_URL}/object_info`);
        const data = await res.json();

        const fluxIPNodes = ['ApplyFluxIPAdapter', 'LoadFluxIPAdapter', 'ApplyAdvancedFluxIPAdapter'];
        const info = {};

        for (const node of fluxIPNodes) {
            if (data[node]) {
                info[node] = data[node].input;
            } else {
                info[node] = 'MISSING';
            }
        }

        fs.writeFileSync('pod_ip_nodes_info.json', JSON.stringify(info, null, 2));
        console.log("Node info saved to pod_ip_nodes_info.json");

    } catch (err) {
        console.error("Error:", err.message);
    }
}

checkNodes();
