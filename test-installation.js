const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const POD_ID = process.env.RUNPOD_POD_ID;
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

async function checkInstallation() {
    console.log(`🔍 Testing ComfyUI Nodes on Pod ${POD_ID}...`);

    try {
        const res = await fetch(`${BASE_URL}/object_info`);

        if (!res.ok) {
            console.error(`❌ API Request Failed: ${res.status} ${res.statusText}`);
            console.error("   (ComfyUI might be restarting or down)");
            return;
        }

        const nodes = await res.json();
        const nodeKeys = Object.keys(nodes);

        console.log(`✅ Connection Established. Found ${nodeKeys.length} nodes.`);

        // Critical Nodes to Check
        const checks = [
            { id: "PulidFluxModelLoader", name: "PuLID Model Loader" },
            { id: "ApplyPulidFlux", name: "Apply PuLID Flux" },
            { id: "LoraLoader", name: "LoRA Loader" },
            { id: "DiffusionModelLoaderKJ", name: "Hunyuan Video (KJNodes)" } // Check if existing nodes persisted
        ];

        let allPass = true;
        console.log("\n--- Verification Results ---");

        for (const check of checks) {
            if (nodes[check.id]) {
                console.log(`✅ [INSTALLED] ${check.name} (${check.id})`);
            } else {
                console.error(`❌ [MISSING]   ${check.name} (${check.id})`);
                allPass = false;
            }
        }

        console.log("----------------------------");
        if (allPass) {
            console.log("🚀 SYSTEM READY! All critical nodes are active.");
        } else {
            console.error("⚠️ SYSTEM INCOMPLETE. Please check the logs above.");
            console.error("   If you just ran the install script, did you RESTART ComfyUI?");
        }

    } catch (e) {
        console.error("❌ Connection Error:", e.message);
    }
}

checkInstallation();
