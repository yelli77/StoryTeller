const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

function log(msg) {
    process.stdout.write(msg + '\n');
    fs.appendFileSync('debug-likeness.log', msg + '\n');
}

const POD_ID = process.env.RUNPOD_POD_ID || '9f4cwila6ehy9g';
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

async function pollResult(promptId) {
    log(`⏳ Polling for result of ${promptId}...`);
    while (true) {
        const response = await fetch(`${BASE_URL}/history/${promptId}`);
        const history = await response.json();

        if (history[promptId]) {
            log("✅ Job Finished!");
            const outputs = history[promptId].outputs;
            const images = outputs["21"] ? outputs["21"].images : [];
            for (const img of images) {
                const filename = img.filename;
                log(`📥 Downloading ${filename}...`);
                const imgRes = await fetch(`${BASE_URL}/view?filename=${filename}&type=output`);
                const arrayBuffer = await imgRes.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                fs.writeFileSync(`./public/current_tuning.png`, buffer);
                log(`✅ Saved ./public/current_tuning.png`);
            }
            return true;
        }

        // Also check if it's still in queue
        const queueRes = await fetch(`${BASE_URL}/queue`);
        const queue = await queueRes.json();
        const isPending = queue.queue_pending.some(p => p[1] === promptId);
        const isRunning = queue.queue_running.some(r => r[1] === promptId);

        if (!isPending && !isRunning) {
            // Not in queue and not in history? Might be lost or history is disabled.
            // Let's wait one more time then give up.
            log("❓ Job not in queue or history. Waiting 10s more...");
            await new Promise(r => setTimeout(r, 10000));
            const secondHistory = await fetch(`${BASE_URL}/history/${promptId}`).then(r => r.json());
            if (secondHistory[promptId]) continue;
            log("❌ Job lost or history disabled.");
            return false;
        }

        log(`📊 Still in queue/running...`);
        await new Promise(r => setTimeout(r, 5000));
    }
}

async function uploadImage(imageBuffer, filename) {
    log(`📤 Uploading image ${filename}...`);

    // Create form data for upload
    // Since we don't have 'form-data' package, we'll use the native fetch way or a simpler multipart constructor
    // ComfyUI /upload/image expects a multipart/form-data with "image" field

    const boundary = `----NodeJSBoundary${Math.random().toString(16).substring(2)}`;
    const header = `--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="${filename}"\r\nContent-Type: image/png\r\n\r\n`;
    const footer = `\r\n--${boundary}--\r\n`;

    const body = Buffer.concat([
        Buffer.from(header, 'utf8'),
        imageBuffer,
        Buffer.from(footer, 'utf8')
    ]);

    const response = await fetch(`${BASE_URL}/upload/image`, {
        method: 'POST',
        headers: {
            'Content-Type': `multipart/form-data; boundary=${boundary}`
        },
        body: body
    });

    if (!response.ok) {
        const text = await response.text();
        log(`❌ Upload Error: ${response.status} - ${text}`);
        return null;
    }

    const data = await response.json();
    log(`✅ Upload Success: ${data.name}`);
    return data.name;
}

async function runSingle(prompt, weight, cfg) {
    log("🛠️ Starting runSingle...");
    const refPath = 'c:/AI/github/StoryTeller/StoryTeller/public/clara_ref.png';
    log(`📖 Reading image from ${refPath}...`);
    const imageBuffer = fs.readFileSync(refPath);

    // Upload image first
    const uploadedName = await uploadImage(imageBuffer, 'clara_ref_tuning.png');
    if (!uploadedName) {
        log("❌ Failed to upload reference image.");
        return null;
    }

    log(`📬 Preparing workflow with image ${uploadedName}...`);

    const workflow = {
        "1": { "inputs": { "ckpt_name": "juggernautXL_v9RdPhoto2Lightning.safetensors" }, "class_type": "CheckpointLoaderSimple" },
        "2": {
            "inputs": {
                "text": prompt + ", wearing (ultra-thin rimless reading glasses:1.6), (long naturally straight honey brown hair:1.7), creamy flawless porcelain skin, flat shadowless lighting, high resolution, 8k professional photograph",
                "clip": ["1", 1]
            },
            "class_type": "CLIPTextEncode"
        },
        "3": {
            "inputs": {
                "text": "(long neck:2.5), (visible neck:2.5), (slender neck:2.5), (any neck space:2.5), (swan neck:2.5), (visible collarbone:2.5), (sharp jawline:2.0), (v-shape face:2.0), (thin face:2.0), (thick glasses:1.6), (black frames:1.6)",
                "clip": ["1", 1]
            },
            "class_type": "CLIPTextEncode"
        },
        "4": { "inputs": { "width": 720, "height": 1280, "batch_size": 1 }, "class_type": "EmptyLatentImage" },
        "5": { "inputs": { "image": uploadedName }, "class_type": "LoadImage" },
        "6": { "inputs": { "instantid_file": "instantid-ip-adapter.bin" }, "class_type": "InstantIDModelLoader" },
        "7": { "inputs": { "provider": "CUDA" }, "class_type": "InstantIDFaceAnalysis" },
        "8": {
            "inputs": {
                "weight": weight,
                "start_at": 0.0,
                "end_at": 0.6,
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
        "21": { "inputs": { "images": ["20", 0], "filename_prefix": "LATEST_TUNING" }, "class_type": "SaveImage" }
    };

    try {
        const response = await fetch(`${BASE_URL}/prompt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: workflow })
        });

        if (!response.ok) {
            const text = await response.text();
            log(`❌ API Error: ${response.status} - ${text}`);
            return null;
        }

        const data = await response.json();
        log(`✅ Job submitted: ${data.prompt_id}`);
        return data.prompt_id;
    } catch (err) {
        log(`💥 Fetch Error: ${err.message}`);
        return null;
    }
}

module.exports = { runSingle, pollResult };
