const fs = require('fs');
const path = require('path');
const https = require('https');

require('dotenv').config({ path: '.env.local' });
// --- CONFIG ---
const RUNPOD_API_KEY = process.env.RUNPOD_API_KEY;
const POD_ID = process.env.RUNPOD_POD_ID;
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

// --- CHARACTER DATASETS ---
const CHARACTERS = [
    {
        name: "Clara",
        source: "1769946501745-image_(1).jpg",
        base: "clara_character, young woman, brown hair, glasses, gray tank top, voluptuous hourglass figure, large bust, flat stomach, wide hips, soft curves",
        ipWeight: 0.75,
        idWeight: 0.95
    },
    {
        name: "Emily",
        source: "1769595391317-grok-image-c0d5e27e-d7a9-437b-b5bd-b82fc1e3f2de.png",
        // UPDATED: "Not blonde" (assumed dark/brown from 'not blonde'), "very large breasts", "otherwise slender", "toned butt"
        base: "emily_character, young woman, dark hair, pink sleeveless top, very large heavy breasts, slender fit body, athletic build, round toned glutes",
        // Emily Config: Lower IP (0.75) to allow prompt to enforce "Slender but Large Bust" which is a specific anime-esque proportion the model might struggle with if just copying raw pixels
        ipWeight: 0.75,
        idWeight: 0.95
    },
    {
        name: "Mia",
        source: "1769595579145-grok-image-905ac7e8-6545-4078-bb9f-684263a3acb0.png",
        base: "mia_character, young woman, dark hair, pink v-neck top, dramatic expression, slender build",
        ipWeight: 0.90,
        idWeight: 0.95
    }
];

function getPrompts(baseDesc) {
    return [
        `${baseDesc}, close-up portrait, looking at camera, neutral expression`,
        `${baseDesc}, close-up, smiling warmly, studio lighting`,
        `${baseDesc}, profile view, looking left`,
        `${baseDesc}, profile view, looking right`,
        `${baseDesc}, three quarter view, looking away`,
        `${baseDesc}, upper body shot, arms crossed`,
        `${baseDesc}, upper body shot, confident pose`,
        `${baseDesc}, sitting on a chair, indoor lighting`,
        `${baseDesc}, walking in a park, natural light`,
        `${baseDesc}, standing against a white wall`,
        `${baseDesc}, laughing, candid shot`,
        `${baseDesc}, serious expression, cinematic portrait`,
        `${baseDesc}, surprised expression`,
        `${baseDesc}, golden hour lighting, outdoor portrait`,
        `${baseDesc}, rembrandt lighting, dramatic shadows`
    ];
}

async function uploadImage(filePath) {
    const filename = path.basename(filePath);
    if (!fs.existsSync(filePath)) throw new Error(`File missing: ${filePath}`);
    const fileData = fs.readFileSync(filePath);
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substr(2);
    const postDataStart = [`--${boundary}`, `Content-Disposition: form-data; name="image"; filename="${filename}"`, `Content-Type: image/${path.extname(filename).substring(1)}`, '', ''].join('\r\n');
    const postDataEnd = ['', `--${boundary}`, `Content-Disposition: form-data; name="subfolder"`, '', 'references', `--${boundary}`, `Content-Disposition: form-data; name="type"`, '', 'input', `--${boundary}--`].join('\r\n');
    const totalSize = Buffer.byteLength(postDataStart) + fileData.length + Buffer.byteLength(postDataEnd);
    return new Promise((resolve, reject) => {
        const req = https.request(`${BASE_URL}/upload/image`, { method: 'POST', headers: { 'Authorization': RUNPOD_API_KEY, 'Content-Type': `multipart/form-data; boundary=${boundary}`, 'Content-Length': totalSize } }, (res) => {
            let data = ''; res.on('data', c => data += c); res.on('end', () => { try { const j = JSON.parse(data); resolve(j.subfolder ? `${j.subfolder}/${j.name}` : j.name); } catch (e) { reject(e); } });
        });
        req.write(postDataStart); req.write(fileData); req.write(postDataEnd); req.end();
    });
}

function constructWorkflow(prompt, sourceImagePath, idWeight, ipWeight) {
    const seed = Math.floor(Math.random() * 1000000);
    const posPrompt = `(photograph:1.5), (highly detailed:1.3), masterpiece, 8k, dslr, ${prompt}`;
    const negPrompt = "(flat chest:1.5), (small breasts:1.5), (belly:1.5), (fat stomach:1.5), (overweight:1.2), (obese:1.2), (worst quality, low quality:1.4), (bad anatomy:1.2), (deformed:1.2), blurry, artifacts, text, watermark, different person, wrong face, painting, cartoon, anime";

    return {
        "1": { "inputs": { "ckpt_name": "RealVisXL_V4.0_Lightning.safetensors" }, "class_type": "CheckpointLoaderSimple" },
        "2": { "inputs": { "text": posPrompt, "clip": ["1", 1] }, "class_type": "CLIPTextEncode" },
        "3": { "inputs": { "text": negPrompt, "clip": ["1", 1] }, "class_type": "CLIPTextEncode" },
        "4": { "inputs": { "width": 1024, "height": 1024, "batch_size": 1 }, "class_type": "EmptyLatentImage" },
        "5": { "inputs": { "clip_name": "clip_vision_sdxl.safetensors" }, "class_type": "CLIPVisionLoader" },
        "6": { "inputs": { "image": sourceImagePath }, "class_type": "LoadImage" },

        "7": { "inputs": { "instantid_file": "instantid-ip-adapter.bin" }, "class_type": "InstantIDModelLoader" },
        "8": { "inputs": { "provider": "CPU" }, "class_type": "InstantIDFaceAnalysis" },
        "10": { "inputs": { "control_net_name": "instantid-controlnet-sdxl.safetensors" }, "class_type": "ControlNetLoader" },
        "9": {
            "inputs": {
                "instantid": ["7", 0], "insightface": ["8", 0], "control_net": ["10", 0],
                "image": ["6", 0], "model": ["1", 0], "positive": ["2", 0], "negative": ["3", 0],
                "weight": idWeight, "start_at": 0.0, "end_at": 0.9
            },
            "class_type": "ApplyInstantID"
        },
        "11": { "inputs": { "ipadapter_file": "ip-adapter-plus-face_sdxl_vit-h.safetensors" }, "class_type": "IPAdapterModelLoader" },
        "12": {
            "inputs": {
                "model": ["9", 0], "ipadapter": ["11", 0], "clip_vision": ["5", 0], "image": ["6", 0],
                "weight": ipWeight, "weight_type": "linear", "combine_embeds": "concat", "embeds_scaling": "V only",
                "start_at": 0.0, "end_at": 0.9
            },
            "class_type": "IPAdapterAdvanced"
        },
        "13": {
            "inputs": {
                "seed": seed, "steps": 12, "cfg": 1.5, "sampler_name": "euler", "scheduler": "karras", "denoise": 1.0,
                "model": ["12", 0], "positive": ["9", 1], "negative": ["9", 2], "latent_image": ["4", 0]
            },
            "class_type": "KSampler"
        },
        "14": { "inputs": { "scale_by": 1.5, "upscale_method": "bicubic", "samples": ["13", 0] }, "class_type": "LatentUpscaleBy" },
        "15": {
            "inputs": {
                "seed": seed, "steps": 12, "cfg": 1.5, "sampler_name": "euler", "scheduler": "karras", "denoise": 0.55,
                "model": ["12", 0], "positive": ["9", 1], "negative": ["9", 2], "latent_image": ["14", 0]
            },
            "class_type": "KSampler"
        },
        "20": { "inputs": { "samples": ["15", 0], "vae": ["1", 2] }, "class_type": "VAEDecode" },
        "21": { "inputs": { "filename_prefix": "LoRA_Train", "images": ["20", 0] }, "class_type": "SaveImage" }
    };
}

async function runBatch() {
    console.log("🚀 STARTING CORRECTED DATASET GENERATION");
    console.log("ℹ️  Strategy: Corrected Emily anatomy (Large bust, slender)");

    for (const char of CHARACTERS) {
        console.log(`\n\n=== ${char.name} (IP: ${char.ipWeight} / ID: ${char.idWeight}) ===`);
        const localPath = path.join(__dirname, 'public/uploads', char.source);
        let podPath;
        try { podPath = await uploadImage(localPath); } catch (e) { console.error(e); continue; }

        const prompts = getPrompts(char.base);
        for (let i = 0; i < prompts.length; i++) {
            const p = prompts[i];
            console.log(`📸 [${i + 1}/${prompts.length}] ${char.name}`);

            const workflow = constructWorkflow(p, podPath, char.idWeight, char.ipWeight);
            const RUN_ID = "FinalV1"; // Unique identifier for this batch to avoid file conflicts
            workflow["21"].inputs.filename_prefix = `${char.name}_${RUN_ID}`;

            await new Promise((resolve) => {
                const req = https.request(`${BASE_URL}/prompt`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': RUNPOD_API_KEY } }, (res) => {
                    let d = ''; res.on('data', c => d += c); res.on('end', () => {
                        const json = JSON.parse(d);
                        const pid = json.prompt_id;
                        console.log(`   Job: ${pid}`);
                        let t = setInterval(() => {
                            const hReq = https.request(`${BASE_URL}/history/${pid}`, { headers: { 'Authorization': RUNPOD_API_KEY } }, (hr) => {
                                let hd = ''; hr.on('data', c => hd += c); hr.on('end', () => {
                                    try {
                                        const h = JSON.parse(hd);
                                        if (h[pid] && h[pid].status.completed) {
                                            console.log(`   ✅ Saved`);
                                            clearInterval(t); resolve();
                                        }
                                    } catch (e) { }
                                });
                            });
                            hReq.end();
                        }, 3000);
                    });
                });
                req.write(JSON.stringify({ prompt: workflow })); req.end();
            });
            await new Promise(r => setTimeout(r, 1000));
        }
    }
    console.log("\n✅ DONE");
}
runBatch();
