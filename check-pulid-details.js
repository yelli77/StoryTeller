const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const POD_ID = process.env.RUNPOD_POD_ID;
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

async function checkPuLID() {
    try {
        console.log("🔍 Checking PuLID Nodes & Models...");

        // 1. Get Node Info for 'easy pulIDApply' and 'PulidFluxModelLoader' (if exists)
        const nodesToCheck = ['easy pulIDApply', 'PulidFluxModelLoader', 'PulidFlux', 'PulidFluxEvaClipLoader'];

        for (const node of nodesToCheck) {
            const res = await fetch(`${BASE_URL}/object_info/${node}`);
            const data = await res.json();
            if (data[node]) {
                console.log(`\n✅ Node '${node}' Info:`, JSON.stringify(data[node], null, 2));

                // If it has inputs asking for a model file, print the list
                if (data[node].input && data[node].input.required) {
                    for (const key in data[node].input.required) {
                        const val = data[node].input.required[key];
                        if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object' && Array.isArray(val[0])) {
                            console.log(`   📂 Input Options for '${key}':`, val[0]);
                        }
                    }
                }
            } else {
                console.log(`\n❌ Node '${node}' NOT found.`);
            }
        }

    } catch (err) {
        console.error("Error:", err.message);
    }
}

checkPuLID();
