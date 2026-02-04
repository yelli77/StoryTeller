const fs = require('fs');
const path = require('path');
const https = require('https');

// --- LOAD ENV MANUALLY ---
function loadEnv() {
    ['.env.local', '.env'].forEach(file => {
        try {
            const envPath = path.join(__dirname, file);
            if (fs.existsSync(envPath)) {
                const content = fs.readFileSync(envPath, 'utf8');
                content.split('\n').forEach(line => {
                    const parts = line.split('=');
                    if (parts.length >= 2) {
                        const key = parts[0].trim();
                        // simplistic value parsing (remove quotes)
                        const val = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
                        if (key && val && !process.env[key]) {
                            process.env[key] = val;
                        }
                    }
                });
                console.log(`[Env] Loaded ${file}`);
            }
        } catch (e) { /* ignore */ }
    });
}
loadEnv();

// CONFIG
const POD_ID = process.env.NEXT_PUBLIC_RUNPOD_POD_ID || process.env.RUNPOD_POD_ID || '9f4cwila6ehy9g';
const API_KEY = process.env.RUNPOD_API_KEY;
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

if (!API_KEY) {
    console.error("❌ ERROR: Could not find RUNPOD_API_KEY in .env or .env.local");
    process.exit(1);
}

// --- HELPER: FETCH WRAPPER ---
function fetchUrl(url, options) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        resolve(data); // If not JSON
                    }
                } else {
                    reject(new Error(`Status ${res.statusCode}: ${data}`));
                }
            });
        });
        req.on('error', reject);
        if (options.body) {
            req.write(options.body);
        }
        req.end();
    });
}

// --- HELPER: UPLOAD IMAGE ---
async function uploadImage(localPath) {
    const fullPath = path.join(__dirname, 'public', localPath);

    if (!fs.existsSync(fullPath)) {
        throw new Error(`File not found: ${fullPath}`);
    }

    const fileData = fs.readFileSync(fullPath);
    const filename = path.basename(localPath);

    // Construct Multipart Form Data manually
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);

    const pre = `--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="${filename}"\r\nContent-Type: image/png\r\n\r\n`;
    const post = `\r\n--${boundary}\r\nContent-Disposition: form-data; name="subfolder"\r\n\r\nreferences\r\n--${boundary}\r\nContent-Disposition: form-data; name="type"\r\n\r\ninput\r\n--${boundary}--`;

    const body = Buffer.concat([Buffer.from(pre), fileData, Buffer.from(post)]);

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            'Content-Length': body.length,
            'Authorization': API_KEY
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(`${BASE_URL}/upload/image`, options, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    const json = JSON.parse(data);
                    const result = json.subfolder ? `${json.subfolder}/${json.name}` : json.name;
                    console.log(`[Upload] ✅ Uploaded: ${filename}`);
                    resolve(result);
                } else {
                    reject(new Error(data));
                }
            });
        });
        req.write(body);
        req.end();
    });
}

// --- WORKFLOW BUILDER (Simplified from runpod.ts) ---
function buildWorkflow(prompt, instantIDImage, ipAdapterImages) {
    const seed = Math.floor(Math.random() * 10000000);
    const workflow = {
        "1": { "inputs": { "ckpt_name": "RealVisXL_V4.0_Lightning.safetensors" }, "class_type": "CheckpointLoaderSimple" },
        "2": { "inputs": { "text": `(photograph:1.5), ${prompt}`, "clip": ["1", 1] }, "class_type": "CLIPTextEncode" },
        "3": { "inputs": { "text": "(naked, nude, nsfw:1.5)", "clip": ["1", 1] }, "class_type": "CLIPTextEncode" },
        "4": { "inputs": { "width": 832, "height": 1216, "batch_size": 1 }, "class_type": "EmptyLatentImage" },
        "5": { "inputs": { "clip_name": "clip_vision_sdxl.safetensors" }, "class_type": "CLIPVisionLoader" }
    };

    // InstantID
    if (instantIDImage) {
        workflow["6"] = { "inputs": { "image": instantIDImage }, "class_type": "LoadImage" };
        workflow["7"] = { "inputs": { "instantid_file": "instantid-ip-adapter.bin" }, "class_type": "InstantIDModelLoader" };
        workflow["8"] = { "inputs": { "provider": "CPU" }, "class_type": "InstantIDFaceAnalysis" };
        workflow["9"] = {
            "inputs": {
                "instantid": ["7", 0], "insightface": ["8", 0], "control_net": ["10", 0],
                "image": ["6", 0], "model": ["1", 0],
                "positive": ["2", 0], "negative": ["3", 0],
                "weight": 0.90, "start_at": 0.0, "end_at": 0.8
            }, "class_type": "ApplyInstantID"
        };
        workflow["10"] = { "inputs": { "control_net_name": "instantid-controlnet-sdxl.safetensors" }, "class_type": "ControlNetLoader" };
    } else {
        workflow["9"] = { inputs: {}, class_type: "Identity" };
    }

    // IP Adapter Batching
    let ipInput = null;
    if (ipAdapterImages && ipAdapterImages.length > 0) {
        let lastId = -1;
        ipAdapterImages.forEach((img, idx) => {
            const nodeId = 100 + idx;
            workflow[`${nodeId}`] = { "inputs": { "image": img }, "class_type": "LoadImage" };
            if (idx === 0) lastId = nodeId;
            else {
                const batchId = 200 + idx;
                workflow[`${batchId}`] = {
                    "inputs": { "image1": [`${lastId}`, 0], "image2": [`${nodeId}`, 0] },
                    "class_type": "ImageBatch"
                };
                lastId = batchId;
            }
        });
        ipInput = [`${lastId}`, 0];
    } else if (instantIDImage) {
        ipInput = ["6", 0];
    }

    // IP Adapter Application
    if (instantIDImage) {
        workflow["11"] = { "inputs": { "ipadapter_file": "ip-adapter-plus-face_sdxl_vit-h.safetensors" }, "class_type": "IPAdapterModelLoader" };
        workflow["12"] = {
            "inputs": {
                "model": ["9", 0], // From InstantID
                "ipadapter": ["11", 0], "clip_vision": ["5", 0],
                "image": ipInput,
                "weight": 0.7, "weight_type": "linear", "start_at": 0.0, "end_at": 0.7,
                "combine_embeds": "concat",
                "embeds_scaling": "V only"
            }, "class_type": "IPAdapterAdvanced"
        };

        // Sampler
        workflow["13"] = {
            "inputs": {
                "seed": seed, "steps": 12, "cfg": 1.5, "sampler_name": "euler", "scheduler": "karras", "denoise": 1.0,
                "model": ["12", 0], "positive": ["9", 1], "negative": ["9", 2], "latent_image": ["4", 0]
            }, "class_type": "KSampler"
        };

        // Decode & Save
        workflow["20"] = { "inputs": { "samples": ["13", 0], "vae": ["1", 2] }, "class_type": "VAEDecode" };
        workflow["21"] = { "inputs": { "filename_prefix": "TEST_GALLERY", "images": ["20", 0] }, "class_type": "SaveImage" };
    }

    return workflow;
}

// --- HELPER: WAIT FOR SERVER ---
async function waitForServer() {
    process.stdout.write(`Connecting to ${BASE_URL} `);
    while (true) {
        try {
            await fetchUrl(`${BASE_URL}/queue`, {});
            console.log("\n✅ ComfyUI is ONLINE!");
            break;
        } catch (e) {
            process.stdout.write("⏳");
            await new Promise(r => setTimeout(r, 2000));
        }
    }
}

// --- MAIN ---
async function main() {
    console.log("=== STARTING CLARA GALLERY TEST ===");

    await waitForServer();

    // 1. Get Clara Data
    const chars = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'characters.json'), 'utf8'));
    const clara = chars.find(c => c.name === 'Clara');
    if (!clara) throw new Error("Clara not found");

    console.log(`Found Clara: ${clara.image}`);
    console.log(`Refs: ${clara.referenceImages.length} images`);

    // 2. Upload Master Image
    const masterPath = clara.image;
    const cleanMasterPath = masterPath.startsWith('/') ? masterPath.substring(1) : masterPath;
    const uploadedMaster = await uploadImage(cleanMasterPath);

    // 3. Upload First 4 Refs (Don't spam for test)
    const galleryPaths = [];
    const testRefs = clara.referenceImages.slice(0, 4);
    for (const ref of testRefs) {
        const cleanRef = ref.startsWith('/') ? ref.substring(1) : ref;
        const uploaded = await uploadImage(cleanRef);
        galleryPaths.push(uploaded);
    }

    // 4. Build Workflow
    console.log("Building Workflow...");
    const wf = buildWorkflow("Clara standing in a futuristic office, cyberpunk vibes, highly detailed", uploadedMaster, galleryPaths);

    // 5. Send
    console.log("Sending to ComfyUI...");
    const postData = JSON.stringify({ prompt: wf });
    const promptRes = await fetchUrl(`${BASE_URL}/prompt`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': API_KEY
        },
        body: postData
    });

    const promptId = promptRes.prompt_id;
    console.log(`Job Queued: ${promptId}`);

    // 6. Poll
    console.log("Polling...");
    while (true) {
        const hist = await fetchUrl(`${BASE_URL}/history/${promptId}`, {
            headers: { 'Authorization': API_KEY }
        });
        if (hist[promptId]) {
            const outputs = hist[promptId].outputs;
            if (outputs && outputs["21"] && outputs["21"].images) {
                const img = outputs["21"].images[0];
                const url = `${BASE_URL}/view?filename=${img.filename}&type=output`;
                console.log("\n===========================");
                console.log("🎉 SUCCESS! Image Generated");
                console.log(url);
                console.log("===========================\n");
                break;
            }
        }
        process.stdout.write(".");
        await new Promise(r => setTimeout(r, 1000));
    }
}

main().catch(console.error);
