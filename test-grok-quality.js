const https = require('https');
require('dotenv').config({ path: '.env.local' });

const POD_ID = process.env.RUNPOD_POD_ID || '9f4cwila6ehy9g';
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

async function testGrokQuality() {
    const seed = Math.floor(Math.random() * 1000000);

    // THE GROK QUALITY FORMULA:
    // 1. High Steps (No more "Fast" hacks)
    // 2. Controlled CFG
    // 3. Balanced Adapters (prevents anatomy breakdown)

    const posPrompt = "(photorealistic:1.3), high-end studio photography, beautiful woman with glasses and light brown hair, (perfect smooth creamy skin:1.3), soft professional studio lighting, (heavy-set voluptuous body:1.4), (soft fleshy stomach:1.3), (thick arms and shoulders:1.3), (extra wide fleshy hips:1.5), (extra thick thighs:1.5), masterpiece, 8k, professional dslr, clean studio background, natural skin texture, rich colors";
    const negPrompt = "(multi-nipple:2.0), (extra breasts:2.0), (distorted:2.0), (hallucination:2.0), (grainy:2.0), (digital noise:2.0), (artifacts:2.0), (slender:2.0), (thin:2.0), (fit:2.0), (athletic:2.0), bad anatomy, worst quality, low quality";

    const workflow = {
        "1": { "inputs": { "ckpt_name": "juggernautXL_v9RdPhoto2Lightning.safetensors" }, "class_type": "CheckpointLoaderSimple" },
        "2": { "inputs": { "text": posPrompt, "clip": ["1", 1] }, "class_type": "CLIPTextEncode" },
        "3": { "inputs": { "text": negPrompt, "clip": ["1", 1] }, "class_type": "CLIPTextEncode" },
        "4": { "inputs": { "width": 896, "height": 1152, "batch_size": 1 }, "class_type": "EmptyLatentImage" },
        "5": { "inputs": { "clip_name": "clip_vision_sdxl.safetensors" }, "class_type": "CLIPVisionLoader" },
        "6": { "inputs": { "image": "clara.png" }, "class_type": "LoadImage" },
        "7": { "inputs": { "instantid_file": "instantid-ip-adapter.bin" }, "class_type": "InstantIDModelLoader" },
        "8": { "inputs": { "provider": "CPU" }, "class_type": "InstantIDFaceAnalysis" },
        "10": { "inputs": { "control_net_name": "instantid-controlnet-sdxl.safetensors" }, "class_type": "ControlNetLoader" },

        // Lower weights (0.45) to prevent the "extra nipple" hallucinations seen in V12
        "9": {
            "inputs": {
                "instantid": ["7", 0], "insightface": ["8", 0], "control_net": ["10", 0],
                "image": ["6", 0], "model": ["1", 0], "positive": ["2", 0], "negative": ["3", 0],
                "weight": 0.45, "start_at": 0.0, "end_at": 1.0
            },
            "class_type": "ApplyInstantID"
        },
        "11": { "inputs": { "ipadapter_file": "ip-adapter-plus-face_sdxl_vit-h.safetensors" }, "class_type": "IPAdapterModelLoader" },
        "12": {
            "inputs": {
                "model": ["9", 0], "ipadapter": ["11", 0], "clip_vision": ["5", 0], "image": ["6", 0],
                "weight": 0.45, "weight_type": "linear", "combine_embeds": "concat", "embeds_scaling": "V only",
                "start_at": 0.0, "end_at": 1.0
            },
            "class_type": "IPAdapterAdvanced"
        },

        // --- THE "PROCEDURAL" SAMPLER (Grok-Style) ---
        "13": {
            "inputs": {
                "seed": seed, "steps": 40, "cfg": 4.0, "sampler_name": "dpmpp_2m_sde", "scheduler": "karras", "denoise": 1.0,
                "model": ["12", 0], "positive": ["2", 0], "negative": ["3", 0], "latent_image": ["4", 0]
            },
            "class_type": "KSampler"
        },

        "20": { "inputs": { "samples": ["13", 0], "vae": ["1", 2] }, "class_type": "VAEDecode" },
        "21": { "inputs": { "filename_prefix": "Grok_Quality_Test", "images": ["20", 0] }, "class_type": "SaveImage" }
    };

    console.log(`🚀 Dispatching Grok-Quality Test (Seed: ${seed})...`);

    return new Promise((resolve) => {
        const req = https.request(`${BASE_URL}/prompt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, (res) => {
            let body = '';
            res.on('data', d => body += d);
            res.on('end', () => {
                const data = JSON.parse(body);
                console.log(`   Job ID: ${data.prompt_id}`);
                resolve(data.prompt_id);
            });
        });
        req.write(JSON.stringify({ prompt: workflow }));
        req.end();
    });
}

testGrokQuality();
