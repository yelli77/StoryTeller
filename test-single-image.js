const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const POD_ID = process.env.RUNPOD_POD_ID;
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

// Clara
const character = {
    name: 'Clara',
    filename: '1769946490115-image_(1).jpg',
    desc: "(extreme hourglass figure:1.2), (huge breasts:1.7), (curvy:1.5), (very wide hips:1.3), (slim waist:1.1), (thick thighs:1.4), (soft body:1.3), (fleshy:1.1), (straight hair:1.2), (round soft face:1.2), long honey-brown hair, glasses, soft pretty facial features"
};

const pose = { name: 'Standing_Front', prompt: 'standing front view, looking at camera, full body' };
const outfit = { name: 'Bodysuit', prompt: 'wearing a tight cyan bodysuit' };

async function uploadImage(localPath, remoteName) {
    if (!fs.existsSync(localPath)) {
        console.error(`❌ File not found: ${localPath}`);
        return null;
    }
    console.log(`📤 Uploading ${remoteName}...`);
    const fileData = fs.readFileSync(localPath);
    const boundary = '----NodeJSBoundary' + Math.random().toString(36).substr(2);
    const body = Buffer.concat([
        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="${remoteName}"\r\nContent-Type: image/jpeg\r\n\r\n`),
        fileData,
        Buffer.from(`\r\n--${boundary}--\r\n`)
    ]);

    try {
        const res = await fetch(`${BASE_URL}/upload/image`, {
            method: 'POST',
            headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
            body: body
        });
        const data = await res.json();
        return data.name;
    } catch (e) {
        console.error("Upload failed:", e.message);
        return null;
    }
}

function constructWorkflow(uploadedImageName) {
    // Flux + Native PuLID Flux Nodes
    const seed = Math.floor(Math.random() * 1000000);
    const posPrompt = `(photo:1.3), high-end studio photograph, ${character.desc}, ${pose.prompt}, ${outfit.prompt}, highly detailed, 8k, masterpiece, soft studio lighting, sharp focus`;

    return {
        // Core Flux Models
        "10": { "inputs": { "unet_name": "flux1-dev.sft", "weight_dtype": "fp8_e4m3fn" }, "class_type": "UNETLoader" },
        "11": { "inputs": { "clip_name1": "clip_l.safetensors", "clip_name2": "t5xxl_fp8_e4m3fn.safetensors", "type": "flux" }, "class_type": "DualCLIPLoader" },
        "12": { "inputs": { "vae_name": "ae.sft" }, "class_type": "VAELoader" },

        // Native PuLID Flux Loaders
        "30": { "inputs": { "pulid_file": "pulid_flux_v0.9.0.safetensors" }, "class_type": "PulidFluxModelLoader" },
        "31": { "inputs": {}, "class_type": "PulidFluxEvaClipLoader" },
        "32": { "inputs": { "provider": "CUDA" }, "class_type": "PulidFluxInsightFaceLoader" },

        // Reference Image
        "20": { "inputs": { "image": uploadedImageName }, "class_type": "LoadImage" },

        // Apply PuLID (The Core Shift)
        "33": {
            "inputs": {
                "model": ["10", 0],
                "pulid_flux": ["30", 0],
                "eva_clip": ["31", 0],
                "face_analysis": ["32", 0],
                "image": ["20", 0],
                "weight": 1.0,
                "start_at": 0.0,
                "end_at": 1.0,
                "fusion": "mean",
                "fusion_weight_max": 1.0,
                "fusion_weight_min": 0.0,
                "train_step": 1000,
                "use_gray": true
            },
            "class_type": "ApplyPulidFlux"
        },

        // Latent & Conditioning
        "13": { "inputs": { "width": 1024, "height": 1024, "batch_size": 1 }, "class_type": "EmptyLatentImage" },
        "14": { "inputs": { "clip_l": posPrompt, "t5xxl": posPrompt, "guidance": 3.5, "clip": ["11", 0] }, "class_type": "CLIPTextEncodeFlux" },
        "34": { "inputs": { "guidance": 3.5, "conditioning": ["14", 0] }, "class_type": "FluxGuidance" },
        "18": { "inputs": { "clip_l": "", "t5xxl": "", "guidance": 3.5, "clip": ["11", 0] }, "class_type": "CLIPTextEncodeFlux" },

        // KSampler (connecting to PuLID model)
        "15": {
            "inputs": {
                "seed": seed, "steps": 25, "cfg": 1.0, "sampler_name": "euler", "scheduler": "simple", "denoise": 1.0,
                "model": ["33", 0], // Pointing to PuLID Apply node
                "positive": ["34", 0],
                "negative": ["18", 0],
                "latent_image": ["13", 0]
            },
            "class_type": "KSampler"
        },

        // Output
        "16": { "inputs": { "samples": ["15", 0], "vae": ["12", 0] }, "class_type": "VAEDecode" },
        "17": { "inputs": { "images": ["16", 0], "filename_prefix": `TEST_CLARA_NATIVE` }, "class_type": "SaveImage" }
    };
}

async function runTest() {
    console.log("🚀 TESTING SINGLE IMAGE GENERATION (Clara)");
    const localPath = path.join(__dirname, 'public/uploads', character.filename);
    const uploadedName = await uploadImage(localPath, `REF_TEST_CLARA.jpg`);

    if (!uploadedName) {
        console.error("❌ Failed to upload reference image.");
        return;
    }

    const workflow = constructWorkflow(uploadedName);

    try {
        const response = await fetch(`${BASE_URL}/prompt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: workflow })
        });
        const data = await response.json();

        if (data.prompt_id) {
            console.log(`✅ Job Dispatched: ${data.prompt_id}`);
            console.log("⏳ Waiting for generation (typically 30-60s)...");

            let attempts = 0;
            while (attempts < 60) { // Wait up to 5 minutes
                const res = await fetch(`${BASE_URL}/history/${data.prompt_id}`);
                const history = await res.json();

                if (history[data.prompt_id]) {
                    const status = history[data.prompt_id].status;
                    if (status.status_str === 'success') {
                        console.log("✅ SUCCESS! Image generated.");
                        const outputs = history[data.prompt_id].outputs;
                        console.log("Output:", JSON.stringify(outputs, null, 2));
                    } else {
                        console.log("❌ FAILED!");
                        console.log("Error:", JSON.stringify(status, null, 2));
                    }
                    return;
                }

                // Also check for global errors in history to catch crashes
                // ... (simplified for now)

                process.stdout.write(".");
                await new Promise(r => setTimeout(r, 5000));
                attempts++;
            }
            console.log("\n❌ Timeout waiting for job completion.");
        } else {
            console.error('❌ Failed to dispatch:', data);
        }
    } catch (e) {
        console.error('❌ Connection Error:', e.message);
    }
}

runTest();
