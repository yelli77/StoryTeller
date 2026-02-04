const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const POD_ID = process.env.RUNPOD_POD_ID;
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

async function checkNodes() {
    try {
        const res = await fetch(`${BASE_URL}/object_info`);
        const data = await res.json();

        const nodes = ['PulidFluxModelLoader', 'PulidFluxEvaClipLoader', 'PulidFluxInsightFaceLoader', 'ApplyPulidFlux'];
        const info = {};

        for (const node of nodes) {
            if (data[node]) {
                info[node] = data[node].input;
            } else {
                info[node] = 'MISSING';
            }
        }

        console.log(JSON.stringify(info, null, 2));
        fs.writeFileSync('pod_pulid_native_info.json', JSON.stringify(info, null, 2));

    } catch (err) {
        console.error("Error:", err.message);
    }
}

checkNodes();
