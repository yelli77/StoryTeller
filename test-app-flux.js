const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const POD_ID = process.env.RUNPOD_POD_ID;
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

function prepareFluxImageWorkflow(prompt) {
    const seed = Math.floor(Math.random() * 1000000);
    const qualityPrefix = "(photorealistic:1.2), (extremely detailed:1.2), masterpiece, professional photography, cinematic lighting, high quality skin texture, 8k";
    const finalPrompt = `${qualityPrefix}, ${prompt}`;

    return {
        "10": { "inputs": { "unet_name": "flux1-dev.sft", "weight_dtype": "fp8_e4m3fn" }, "class_type": "UNETLoader" },
        "11": { "inputs": { "clip_name1": "clip_l.safetensors", "clip_name2": "t5xxl_fp8_e4m3fn.safetensors", "type": "flux" }, "class_type": "DualCLIPLoader" },
        "12": { "inputs": { "vae_name": "ae.sft" }, "class_type": "VAELoader" },
        "13": { "inputs": { "width": 1024, "height": 1024, "batch_size": 1 }, "class_type": "EmptyLatentImage" },
        "14": { "inputs": { "clip_l": finalPrompt, "t5xxl": finalPrompt, "guidance": 3.5, "clip": ["11", 0] }, "class_type": "CLIPTextEncodeFlux" },
        "15": {
            "inputs": {
                "seed": seed, "steps": 20, "cfg": 1.0, "sampler_name": "euler", "scheduler": "simple", "denoise": 1.0,
                "model": ["10", 0], "positive": ["14", 0], "negative": ["14", 0], "latent_image": ["13", 0]
            },
            "class_type": "KSampler"
        },
        "16": { "inputs": { "samples": ["15", 0], "vae": ["12", 0] }, "class_type": "VAEDecode" },
        "17": { "inputs": { "images": ["16", 0], "filename_prefix": "Test_App_Flux" }, "class_type": "SaveImage" }
    };
}

async function runTest() {
    const prompt = "Clara, young woman, golden-brown hair, wearing glasses, gray tank top, soft curves, detailed face";
    console.log(`🚀 Dispatching Flux generation for: ${prompt}`);

    const workflow = prepareFluxImageWorkflow(prompt);

    try {
        const response = await fetch(`${BASE_URL}/prompt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: workflow })
        });
        const data = await response.json();

        if (data.prompt_id) {
            console.log(`✅ Job ID: ${data.prompt_id}`);
            console.log("WAITING...");

            let done = false;
            while (!done) {
                const hRes = await fetch(`${BASE_URL}/history/${data.prompt_id}`);
                const history = await hRes.json();
                if (history[data.prompt_id]) {
                    console.log("✅ FINISHED!");
                    console.log("Outputs:", JSON.stringify(history[data.prompt_id].outputs, null, 2));
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
