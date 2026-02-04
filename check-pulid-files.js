const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const POD_ID = process.env.RUNPOD_POD_ID;
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

async function checkModels() {
    try {
        console.log("🔍 Checking for PuLID & Clip Models...");

        const res = await fetch(`${BASE_URL}/object_info/easy pulIDApply`);
        const data = await res.json();

        if (data['easy pulIDApply']) {
            const inputs = data['easy pulIDApply'].input.required;

            // Check pulid_file
            if (inputs.pulid_file && Array.isArray(inputs.pulid_file[0])) {
                console.log("📂 Available PuLID Files:", inputs.pulid_file[0]);
            } else {
                console.log("❌ pulid_file input not found or empty.");
            }
        }

        // Eva Clip is usually loaded via CheckpointLoader or dedicated loader. 
        // But let's check ClipLoader first.
        const res2 = await fetch(`${BASE_URL}/object_info/CLIPLoader`);
        const data2 = await res2.json();
        if (data2['CLIPLoader']) {
            const clips = data2['CLIPLoader'].input.required.clip_name[0];
            console.log("📂 Available CLIP Files:", clips);
            const hasEva = clips.some(f => f.toLowerCase().includes('eva'));
            console.log("   --> Eva Clip Found?", hasEva);
        }

    } catch (err) {
        console.error("Error:", err.message);
    }
}

checkModels();
