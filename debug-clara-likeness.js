const fetch = require('node-fetch');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const POD_ID = process.env.RUNPOD_POD_ID || '9f4cwila6ehy9g';
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

async function generateVariant(name, positivePrompt, instantIdWeight, cfg, steps) {
    console.log(`🚀 Starting generation for variant: ${name}...`);

    // We need the reference image in base64. 
    // Assuming we use the one from the local path or a placeholder if not found.
    // For this debug script, I'll expect a path to be passed or use a hardcoded one if it exists.
    const refPath = 'c:/AI/github/StoryTeller/StoryTeller/public/clara_ref.png';
    let base64Image = "";
    try {
        const imageBuffer = fs.readFileSync(refPath);
        base64Image = imageBuffer.toString('base64');
    } catch (e) {
        console.error("❌ Reference image not found at " + refPath);
        return;
    }

    const workflow = {
        "1": { "inputs": { "ckpt_name": "juggernautXL_v9RdPhoto2Lightning.safetensors" }, "class_type": "CheckpointLoaderSimple" },
        "2": {
            "inputs": {
                "text": positivePrompt + ", wearing (ultra-thin rimless silver wire glasses:1.5), (long naturally straight honey brown hair:1.5), flawless porcelain skin, soft natural lighting, high resolution, 8k professional photograph",
                "clip": ["1", 1]
            },
            "class_type": "CLIPTextEncode"
        },
        "3": {
            "inputs": {
                "text": "(long neck:2.0), (visible neck:2.0), (any neck length:2.0), (slender neck:2.0), (visible collarbone:2.0), (sharp jawline:2.0), (v-shape face:2.0), (dark rimmed glasses:1.8), rainbow noise, digital artifacts, bad anatomy, blur",
                "clip": ["1", 1]
            },
            "class_type": "CLIPTextEncode"
        },
        "4": { "inputs": { "width": 720, "height": 1280, "batch_size": 1 }, "class_type": "EmptyLatentImage" },
        "5": { "inputs": { "image": base64Image }, "class_type": "LoadImage" },
        "6": { "inputs": { "instantid_file": "instantid-ip-adapter.bin" }, "class_type": "InstantIDModelLoader" },
        "7": { "inputs": { "provider": "CUDA" }, "class_type": "InstantIDFaceAnalysis" },
        "8": {
            "inputs": {
                "weight": instantIdWeight,
                "start_at": 0.0,
                "end_at": 1.0,
                "instantid": ["6", 0], "insightface": ["7", 0], "control_net": ["11", 0], "image": ["5", 0], "model": ["1", 0], "positive": ["2", 0], "negative": ["3", 0]
            },
            "class_type": "ApplyInstantID"
        },
        "11": { "inputs": { "control_net_name": "instantid-controlnet-sdxl.safetensors" }, "class_type": "ControlNetLoader" },
        "9": {
            "inputs": {
                "seed": Math.floor(Math.random() * 1000000), "steps": 10, "cfg": cfg, "sampler_name": "euler_ancestral", "scheduler": "normal", "denoise": 1.0, "model": ["8", 0], "positive": ["8", 1], "negative": ["8", 2], "latent_image": ["4", 0]
            },
            "class_type": "KSampler"
        },
        "20": { "inputs": { "samples": ["9", 0], "vae": ["1", 2] }, "class_type": "VAEDecode" },
        "21": { "inputs": { "images": ["20", 0], "filename_prefix": `Tuning_${name}` }, "class_type": "SaveImage" }
    };

    try {
        const response = await fetch(`${BASE_URL}/prompt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: workflow })
        });

        if (response.ok) {
            const data = await response.json();
            console.log(`✅ Variant ${name} submitted. Prompt ID: ${data.prompt_id}`);
        } else {
            console.error(`❌ Error submitting ${name}:`, await response.text());
        }
    } catch (e) {
        console.error(`💥 Exception in ${name}:`, e.message);
    }
}

async function runExperiments() {
    const experiments = [
        { name: "Anatomical_Nuke_0_3", prompt: "(extremely bloated wide round puffy face:2.8), (massive soft chubby cheeks:2.5), (no neck visible:2.8), (head sitting on torso:2.0), (massive fleshy double chin:2.5)", weight: 0.3, cfg: 2.0 },
        { name: "Shape_Breaker_0_4", prompt: "(short wide puffy round face:2.5), (double chin:2.2), (neckless:2.8), (very thick neck:2.5), (massive heavy breasts:1.8)", weight: 0.4, cfg: 3.0 },
        { name: "Identity_Anchor_0_5", prompt: "(extremely wide puffy face:2.5), (no visible jawline:2.8), (head buried in shoulders:2.5), (Asian-Latina mix:1.3)", weight: 0.5, cfg: 1.5 },
    ];

    for (const exp of experiments) {
        await generateVariant(exp.name, exp.prompt, exp.weight, exp.cfg);
        await new Promise(r => setTimeout(r, 3000)); // Wait a bit more between prompts
    }
}

runExperiments();
