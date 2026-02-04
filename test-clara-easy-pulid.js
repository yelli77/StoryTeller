const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const POD_ID = process.env.RUNPOD_POD_ID;
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

async function uploadImage(localPath, remoteName) {
    console.log(`📤 Uploading ${remoteName}...`);
    const fileData = fs.readFileSync(localPath);
    const boundary = '----NodeJSBoundary' + Math.random().toString(36).substr(2);
    const body = Buffer.concat([
        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="${remoteName}"\r\nContent-Type: image/jpeg\r\n\r\n`),
        fileData,
        Buffer.from(`\r\n--${boundary}--\r\n`)
    ]);

    const res = await fetch(`${BASE_URL}/upload/image`, {
        method: 'POST',
        headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
        body: body
    });
    const data = await res.json();
    return data.name;
}

function constructWorkflow(uploadedImageName) {
    const seed = Math.floor(Math.random() * 1000000);
    const posPrompt = "Clara, young woman, golden-brown hair, wearing glasses, high-end studio photograph, sharp focus, 8k, masterpiece";

    return {
        "10": { "inputs": { "unet_name": "flux1-dev.sft", "weight_dtype": "fp8_e4m3fn" }, "class_type": "UNETLoader" },
        "11": { "inputs": { "clip_name1": "clip_l.safetensors", "clip_name2": "t5xxl_fp8_e4m3fn.safetensors", "type": "flux" }, "class_type": "DualCLIPLoader" },
        "12": { "inputs": { "vae_name": "ae.sft" }, "class_type": "VAELoader" },
        "20": { "inputs": { "image": uploadedImageName }, "class_type": "LoadImage" },

        // Easy Use PuLID
        "33": {
            "inputs": {
                "model": ["10", 0],
                "pulid_file": "pulid_flux_v0.9.0.safetensors",
                "insightface": "CUDA",
                "image": ["20", 0],
                "method": "fidelity",
                "weight": 1.0,
                "start_at": 0.0,
                "end_at": 1.0
            },
            "class_type": "easy pulIDApply"
        },

        "13": { "inputs": { "width": 1024, "height": 1024, "batch_size": 1 }, "class_type": "EmptyLatentImage" },
        "14": { "inputs": { "clip_l": posPrompt, "t5xxl": posPrompt, "guidance": 3.5, "clip": ["11", 0] }, "class_type": "CLIPTextEncodeFlux" },

        "15": {
            "inputs": {
                "seed": seed, "steps": 20, "cfg": 1.0, "sampler_name": "euler", "scheduler": "simple", "denoise": 1.0,
                "model": ["33", 0],
                "positive": ["14", 0],
                "negative": ["14", 0],
                "latent_image": ["13", 0]
            },
            "class_type": "KSampler"
        },
        "16": { "inputs": { "samples": ["15", 0], "vae": ["12", 0] }, "class_type": "VAEDecode" },
        "17": { "inputs": { "images": ["16", 0], "filename_prefix": "EASY_PULID_TEST" }, "class_type": "SaveImage" }
    };
}

async function runTest() {
    const localPath = 'public/clara_ref.png'; // Using the main ref image
    const uploadedName = await uploadImage(localPath, `REF_EASY_PULID.png`);

    if (!uploadedName) return;

    const workflow = constructWorkflow(uploadedName);

    try {
        const response = await fetch(`${BASE_URL}/prompt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: workflow })
        });
        const data = await response.json();

        if (data.prompt_id) {
            console.log(`✅ Job ID: ${data.prompt_id}`);
            let done = false;
            while (!done) {
                const hRes = await fetch(`${BASE_URL}/history/${data.prompt_id}`);
                const history = await hRes.json();
                if (history[data.prompt_id]) {
                    console.log("✅ FINISHED!");
                    console.log("Output:", JSON.stringify(history[data.prompt_id].outputs, null, 2));
                    done = true;
                } else {
                    process.stdout.write(".");
                    await new Promise(r => setTimeout(r, 5000));
                }
            }
        } else {
            console.error("❌ Failed:", data);
        }
    } catch (e) {
        console.error("❌ Error:", e.message);
    }
}

runTest();
