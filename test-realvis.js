const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const POD_ID = process.env.RUNPOD_POD_ID || 'g4oysjh535la54';
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net/prompt`;

const workflow = {
    "1": { "inputs": { "ckpt_name": "RealVisXL_V4.0_Lightning.safetensors" }, "class_type": "CheckpointLoaderSimple" },
    "2": { "inputs": { "text": "Clara, in einem Cafe", "clip": ["1", 1] }, "class_type": "CLIPTextEncode" },
    "3": { "inputs": { "text": "blur, low quality", "clip": ["1", 1] }, "class_type": "CLIPTextEncode" },
    "4": { "inputs": { "width": 512, "height": 512, "batch_size": 1 }, "class_type": "EmptyLatentImage" },
};

async function testRealVis() {
    console.log("Testing specifically RealVis loader...");
    try {
        const res = await fetch(BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: workflow })
        });

        const data = await res.json();
        if (!res.ok) {
            console.log("\n❌ SERVER ERROR DETAILS:");
            console.log(JSON.stringify(data, null, 2));
        } else {
            console.log("\n✅ WORKFLOW ACCEPTED! ID:", data.prompt_id);
        }
    } catch (err) {
        console.error("Fetch failed:", err.message);
    }
}

testRealVis();
