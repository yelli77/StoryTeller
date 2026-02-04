const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const POD_ID = process.env.RUNPOD_POD_ID || '9f4cwila6ehy9g';
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

async function testFluxPro() {
    const seed = Math.floor(Math.random() * 1000000);
    const workflow = {
        "1": {
            "inputs": {
                "prompt": "A high-end commercial fashion portrait of a beautiful woman with glasses, light brown hair, heavy-set voluptuous body, thick fleshy arms, large heavy breasts, extra wide hips, soft fleshy stomach, thick thighs, wearing a tight cyan bodysuit, studio lighting, smooth skin, masterpiece, 8k, crystal clear, ultra professional",
                "prompt_upsampling": false,
                "seed": seed,
                "aspect_ratio": "2:3",
                "raw": true
            },
            "class_type": "FluxProUltraImageNode"
        },
        "2": {
            "inputs": {
                "images": ["1", 0],
                "filename_prefix": "Flux_Clara_V1"
            },
            "class_type": "SaveImage"
        }
    };

    console.log(`🚀 Sending Flux Pro Request (Seed: ${seed})...`);
    const response = await fetch(`${BASE_URL}/prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: workflow })
    });

    if (!response.ok) {
        const text = await response.text();
        console.error("Error:", text);
    } else {
        const data = await response.json();
        console.log("Prompt ID:", data.prompt_id);
    }
}

testFluxPro();
