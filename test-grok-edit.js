const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const POD_ID = process.env.RUNPOD_POD_ID || 'g4oysjh535la54';
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

async function uploadRef() {
    const filePath = path.join('c:', 'AI', 'github', 'StoryTeller', 'StoryTeller', 'public', 'clara_ref.png'); // Assuming this exists based on common patterns
    if (!fs.existsSync(filePath)) {
        console.error("Reference image not found at", filePath);
        return null;
    }

    const blob = new Blob([fs.readFileSync(filePath)], { type: 'image/png' });
    const formData = new FormData();
    formData.append('image', blob, 'clara_ref.png');
    formData.append('overwrite', 'true');

    const res = await fetch(`${BASE_URL}/upload/image`, {
        method: 'POST',
        body: formData
    });
    const data = await res.json();
    return data.name;
}

async function testGrokEdit() {
    const filename = await uploadRef();
    if (!filename) return;

    const workflow = {
        "1": {
            "inputs": { "image": filename },
            "class_type": "LoadImage"
        },
        "2": {
            "inputs": {
                "model": "grok-imagine-image-beta",
                "image": ["1", 0],
                "prompt": "The woman in the image is now sitting in a cozy sunlit cafe, holding a steaming cup of latte. Beautiful bokeh background, cinematic photography, high detail, masterpiece.",
                "resolution": "1K",
                "number_of_images": 1,
                "seed": 42
            },
            "class_type": "GrokImageEditNode"
        },
        "3": {
            "inputs": { "images": ["2", 0], "filename_prefix": "GrokTest" },
            "class_type": "SaveImage"
        }
    };

    console.log("Submitting Grok Edit job...");
    try {
        const res = await fetch(`${BASE_URL}/prompt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: workflow })
        });

        const data = await res.json();
        if (!res.ok) {
            console.error("❌ ERROR:", JSON.stringify(data, null, 2));
            return;
        }
        console.log("Job ID:", data.prompt_id);

        for (let i = 0; i < 30; i++) {
            const histRes = await fetch(`${BASE_URL}/history/${data.prompt_id}`);
            const history = await histRes.json();
            if (history[data.prompt_id]) {
                const status = history[data.prompt_id].status;
                if (status.status === 'error') {
                    console.log("❌ EXECUTION ERROR:", JSON.stringify(status.messages, null, 2));
                } else {
                    console.log("✅ GROK SUCCESS!");
                    const filename = history[data.prompt_id].outputs["3"].images[0].filename;
                    console.log("Result URL:", `${BASE_URL}/view?filename=${filename}&type=output`);
                }
                return;
            }
            await new Promise(r => setTimeout(r, 2000));
            console.log("Polling...");
        }
    } catch (err) {
        console.error("Fetch failed:", err.message);
    }
}

testGrokEdit();
