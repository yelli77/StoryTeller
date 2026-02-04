const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const POD_ID = process.env.RUNPOD_POD_ID || '9f4cwila6ehy9g';
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

async function testFullExecution() {
    const workflow = {
        "1": { "inputs": { "ckpt_name": "juggernautXL_v9RdPhoto2Lightning.safetensors" }, "class_type": "CheckpointLoaderSimple" },
        "2": { "inputs": { "text": "Clara", "clip": ["1", 1] }, "class_type": "CLIPTextEncode" },
        "3": { "inputs": { "text": "blur", "clip": ["1", 1] }, "class_type": "CLIPTextEncode" },
        "4": { "inputs": { "width": 512, "height": 512, "batch_size": 1 }, "class_type": "EmptyLatentImage" },
        "5": {
            "inputs": {
                "seed": 123, "steps": 5, "cfg": 2, "sampler_name": "euler", "scheduler": "simple", "denoise": 1,
                "model": ["1", 0], "positive": ["2", 0], "negative": ["3", 0], "latent_image": ["4", 0]
            },
            "class_type": "KSampler"
        },
        "6": { "inputs": { "samples": ["5", 0], "vae": ["1", 2] }, "class_type": "VAEDecode" },
        "7": { "inputs": { "images": ["6", 0], "filename_prefix": "Test" }, "class_type": "SaveImage" }
    };

    console.log("Submitting job...");
    const res = await fetch(`${BASE_URL}/prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: workflow })
    });

    if (!res.ok) {
        console.error("HTTP Error:", res.status, await res.text());
        return;
    }

    const data = await res.json();
    const prompt_id = data.prompt_id;
    console.log("Job ID:", prompt_id);

    // Poll for status
    for (let i = 0; i < 30; i++) {
        const histRes = await fetch(`${BASE_URL}/history/${prompt_id}`);
        const history = await histRes.json();
        if (history[prompt_id]) {
            console.log("Status Object:", JSON.stringify(history[prompt_id].status, null, 2));
            if (history[prompt_id].status.status === 'error') {
                console.log("❌ ERROR:", JSON.stringify(history[prompt_id].status.messages, null, 2));
            } else {
                console.log("✅ DONE!");
            }
            return;
        }
        await new Promise(r => setTimeout(r, 2000));
        console.log("Polling...");
    }
}

testFullExecution();
