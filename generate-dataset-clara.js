const fs = require('fs');
const path = require('path');
const https = require('https');

require('dotenv').config({ path: '.env.local' });
// --- CONFIG ---
const RUNPOD_API_KEY = process.env.RUNPOD_API_KEY;
const POD_ID = process.env.RUNPOD_POD_ID;
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

// Target Character: Clara
const CLARA_SOURCE = "1769946501745-image_(1).jpg"; // Filename in public/uploads
const CLARA_BASE = "clara_character, young woman, brown hair, glasses, gray tank top, athletic build";

// 30 Training Prompts (Diverse Variations)
const TRAINING_PROMPTS = [
    // Close-ups (Face consistency)
    `${CLARA_BASE}, close-up portrait, looking at camera, neutral expression, highly detailed skin`,
    `${CLARA_BASE}, close-up, smiling warmly, studio lighting, sharp focus`,
    `${CLARA_BASE}, close-up, slight smirk, natural lighting, bokeh`,

    // Angles (Structure consistency)
    `${CLARA_BASE}, profile view, looking left, dramatic lighting`,
    `${CLARA_BASE}, profile view, looking right, soft lighting`,
    `${CLARA_BASE}, three quarter view, looking away, cinematic lighting`,
    `${CLARA_BASE}, looking up, soft focus`,

    // Poses (Body consistency)
    `${CLARA_BASE}, upper body shot, arms crossed, confident pose`,
    `${CLARA_BASE}, upper body shot, hands in pockets, casual stance`,
    `${CLARA_BASE}, sitting on a chair, relaxed pose, indoor lighting`,
    `${CLARA_BASE}, walking in a park, motion blur background, natural light`,
    `${CLARA_BASE}, standing against a white wall, studio portrait`,

    // Expressions
    `${CLARA_BASE}, laughing, candid shot, joyful expression`,
    `${CLARA_BASE}, serious expression, intense gaze, cinematic portrait`,
    `${CLARA_BASE}, surprised expression, looking at camera`,

    // Lighting/Style checks
    `${CLARA_BASE}, golden hour lighting, outdoor portrait, warm tones`,
    `${CLARA_BASE}, rembrandt lighting, studio portrait, dramatic shadows`,
    `${CLARA_BASE}, high key lighting, bright and airy, studio shot`,

    // Dataset Fillers (General)
    `${CLARA_BASE}, simple portrait, grey background`,
    `${CLARA_BASE}, simple portrait, white background`,
    `${CLARA_BASE}, simple portrait, looking at camera`,
    // ... add more as needed
];

// --- UTILS ---
async function uploadImage(filePath) {
    const filename = path.basename(filePath);
    const fileData = fs.readFileSync(filePath);
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substr(2);

    const postDataStart = [
        `--${boundary}`,
        `Content-Disposition: form-data; name="image"; filename="${filename}"`,
        `Content-Type: image/${path.extname(filename).substring(1)}`,
        '',
        ''
    ].join('\r\n');

    const postDataEnd = [
        '',
        `--${boundary}`,
        `Content-Disposition: form-data; name="subfolder"`,
        '',
        'references',
        `--${boundary}`,
        `Content-Disposition: form-data; name="type"`,
        '',
        'input',
        `--${boundary}--`
    ].join('\r\n');

    const totalPayloadSize = Buffer.byteLength(postDataStart) + fileData.length + Buffer.byteLength(postDataEnd);

    return new Promise((resolve, reject) => {
        const req = https.request(`${BASE_URL}/upload/image`, {
            method: 'POST',
            headers: {
                'Authorization': RUNPOD_API_KEY,
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': totalPayloadSize
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const json = JSON.parse(data);
                resolve(json.subfolder ? `${json.subfolder}/${json.name}` : json.name);
            });
        });
        req.write(postDataStart);
        req.write(fileData);
        req.write(postDataEnd);
        req.end();
    });
}

// --- WORKFLOW CONSTRUCTION (High Fidelity) ---
function constructWorkflow(prompt, sourceImagePath) {
    const seed = Math.floor(Math.random() * 1000000);
    const posPrompt = `(photograph:1.5), (highly detailed:1.3), masterpiece, 8k, dslr, ${prompt}`;
    const negPrompt = "(worst quality, low quality:1.4), (bad anatomy:1.2), (deformed:1.2), blurry, artifacts, text, watermark, different person, wrong face, illustration, drawing, painting, cartoon, anime";

    return {
        "1": { "inputs": { "ckpt_name": "RealVisXL_V4.0_Lightning.safetensors" }, "class_type": "CheckpointLoaderSimple" },
        "2": { "inputs": { "text": posPrompt, "clip": ["1", 1] }, "class_type": "CLIPTextEncode" },
        "3": { "inputs": { "text": negPrompt, "clip": ["1", 1] }, "class_type": "CLIPTextEncode" },
        "4": { "inputs": { "width": 1024, "height": 1024, "batch_size": 1 }, "class_type": "EmptyLatentImage" }, // 1024x1024 for training
        "5": { "inputs": { "clip_name": "clip_vision_sdxl.safetensors" }, "class_type": "CLIPVisionLoader" },
        "6": { "inputs": { "image": sourceImagePath }, "class_type": "LoadImage" },

        // InstantID (Max Structure)
        "7": { "inputs": { "instantid_file": "instantid-ip-adapter.bin" }, "class_type": "InstantIDModelLoader" },
        "8": { "inputs": { "provider": "CPU" }, "class_type": "InstantIDFaceAnalysis" },
        "10": { "inputs": { "control_net_name": "instantid-controlnet-sdxl.safetensors" }, "class_type": "ControlNetLoader" },
        "9": {
            "inputs": {
                "instantid": ["7", 0], "insightface": ["8", 0], "control_net": ["10", 0],
                "image": ["6", 0], "model": ["1", 0], "positive": ["2", 0], "negative": ["3", 0],
                "weight": 0.95, "start_at": 0.0, "end_at": 0.9
            },
            "class_type": "ApplyInstantID"
        },
        // IPAdapter (Max Style)
        "11": { "inputs": { "ipadapter_file": "ip-adapter-plus-face_sdxl_vit-h.safetensors" }, "class_type": "IPAdapterModelLoader" },
        "12": {
            "inputs": {
                "model": ["9", 0], "ipadapter": ["11", 0], "clip_vision": ["5", 0], "image": ["6", 0],
                "weight": 0.90, "weight_type": "linear", "combine_embeds": "concat", "embeds_scaling": "V only",
                "start_at": 0.0, "end_at": 0.9
            },
            "class_type": "IPAdapterAdvanced"
        },
        // Sampling (Quality)
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
        "21": { "inputs": { "filename_prefix": "Clara_LoRA_DataSet", "images": ["20", 0] }, "class_type": "SaveImage" }
    };
}

// --- MAIN EXECUTION ---
async function generateDataset() {
    console.log("🚀 STARTING DATASET GENERATION FOR CLARA LORA...");
    console.log(`Source Image: ${CLARA_SOURCE}`);

    const localPath = path.join(__dirname, 'public/uploads', CLARA_SOURCE);
    if (!fs.existsSync(localPath)) { console.error("❌ Source image missing!"); return; }

    try {
        const podPath = await uploadImage(localPath);
        console.log(`✅ Uploaded source to: ${podPath}`);

        for (let i = 0; i < TRAINING_PROMPTS.length; i++) {
            const prompt = TRAINING_PROMPTS[i];
            console.log(`\n📸 Generating [${i + 1}/${TRAINING_PROMPTS.length}]: "${prompt.substring(0, 50)}..."`);

            const workflow = constructWorkflow(prompt, podPath);

            // Queue Prompt
            const req = https.request(`${BASE_URL}/prompt`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': RUNPOD_API_KEY }
            }, (res) => {
                let d = '';
                res.on('data', c => d += c);
                res.on('end', async () => {
                    const json = JSON.parse(d);
                    const pid = json.prompt_id;
                    if (!pid) { console.error("Failed to queue:", json); return; }
                    console.log(`   Job ID: ${pid}`);

                    // Wait loop
                    let done = false;
                    while (!done) {
                        await new Promise(r => setTimeout(r, 3000));
                        const hReq = https.request(`${BASE_URL}/history/${pid}`, { headers: { 'Authorization': RUNPOD_API_KEY } }, (hr) => {
                            let hd = '';
                            hr.on('data', c => hd += c);
                            hr.on('end', () => {
                                try {
                                    const h = JSON.parse(hd);
                                    if (h[pid] && h[pid].status.completed) {
                                        const fn = h[pid].outputs["21"].images[0].filename;
                                        console.log(`   ✅ DONE: ${fn}`);
                                        done = true;
                                    } else if (h[pid] && h[pid].status.status === 'failed') {
                                        console.error("   ❌ FAILED");
                                        done = true;
                                    }
                                } catch (e) { }
                            });
                        });
                        hReq.end();
                    }
                });
            });
            req.write(JSON.stringify({ prompt: workflow }));
            req.end();

            // Wait for completion before next (sequential to avoid overloading pod)
            await new Promise(r => setTimeout(r, 10000)); // 10s buffer between jobs
        }

    } catch (e) {
        console.error("CRITICAL ERROR:", e);
    }
}

generateDataset();
