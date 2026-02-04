const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const POD_ID = process.env.RUNPOD_POD_ID;
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

async function findNodes() {
    try {
        const res = await fetch(`${BASE_URL}/object_info`);
        const data = await res.json();
        const nodes = Object.keys(data);

        const search = ['PulidFlux', 'ApplyPulid', 'FluxIPAdapter', 'Clara', 'InsightFace', 'EvaClip'];
        const found = nodes.filter(n => search.some(s => n.toLowerCase().includes(s.toLowerCase())));

        console.log("Found Nodes:", found);

        // Also check for specific nodes used in test-single-image.js
        console.log("ApplyPulidFlux:", nodes.includes("ApplyPulidFlux"));
        console.log("PulidFluxModelLoader:", nodes.includes("PulidFluxModelLoader"));
        console.log("PulidFluxEvaClipLoader:", nodes.includes("PulidFluxEvaClipLoader"));
        console.log("PulidFluxInsightFaceLoader:", nodes.includes("PulidFluxInsightFaceLoader"));

    } catch (err) {
        console.error("Error:", err.message);
    }
}

findNodes();
