const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const POD_ID = process.env.RUNPOD_POD_ID || 'v1ijkn7xjxt1up';
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

// Configuration
// Configuration
const SOURCE_IMAGE_FRONT = '1769946490115-image_(1).jpg';
const SOURCE_IMAGE_SIDE = 'clara_ref_side.png';
const SOURCE_IMAGE_BACK = 'clara_ref_back.jpg';
const OUTPUT_DIR = path.join(__dirname, 'output', 'clara_refs');

// Ensure output dir exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const CLARA_TRAITS = "(extreme hourglass figure:1.2), (huge breasts:1.7), (curvy:1.5), (very wide hips:1.3), (slim waist:1.1), (thick thighs:1.4), (extremely flat stomach:1.4), (athletic core:1.2), (toned midriff:1.2), (straight hair:1.2), (round soft face:1.2), long honey-brown hair, glasses, soft pretty facial features";
const CLARA_IDENTITY = "clara_character";

// 20 Diverse Reference Prompts
const PROMPTS = [
    { name: "01_Front_Full", text: "standing front view, looking directly at camera, full body shot, arms at sides, neutral expression" },
    { name: "02_Front_Close", text: "extreme close up of face, front view, looking at camera, detailed eyes, glasses, neutral expression" },
    { name: "03_Side_Left_Full", text: "standing profile view from left side, full body, looking straight ahead" },
    { name: "04_Side_Right_Full", text: "standing profile view from right side, full body, looking straight ahead" },
    { name: "05_Back_Full", text: "standing back view, full body, looking away from camera, showing hair and figure from behind" },
    { name: "06_ThreeQ_Left", text: "standing 3/4 view from left, looking at camera, one hand on hip" },
    { name: "07_ThreeQ_Right", text: "standing 3/4 view from right, looking at camera, relaxed pose" },
    { name: "08_Looking_Over_Shoulder", text: "view from behind, turning head to look over shoulder at camera, waist up" },
    { name: "09_Sitting_Chair_Front", text: "sitting on a simple chair, front view, hands in lap, legs together" },
    { name: "10_Sitting_Floor_Side", text: "sitting on floor, side profile view, hugging knees" },
    { name: "11_Walking_Towards", text: "walking directly towards camera, full body, dynamic motion" },
    { name: "12_Walking_Away", text: "walking away from camera, back view, full body" },
    { name: "13_High_Angle", text: "high angle shot looking down, standing, looking up at camera" },
    { name: "14_Low_Angle", text: "low angle shot looking up, heroic pose, standing tall" },
    { name: "15_Dutch_Angle", text: "dutch angle, dynamic pose, turning quickly, hair flowing" },
    { name: "16_Close_Side_Profile", text: "extreme close up of face, side profile, detailed skin texture" },
    { name: "17_Leaning_Wall", text: "leaning back against a white wall, relaxed, hands behind back, full body" },
    { name: "18_Arms_Crossed", text: "standing front view, arms crossed under chest, confident expression" },
    { name: "19_Silhouette", text: "strong silhouette lighting, standing front view, outlining hourglass figure and curves" },
    { name: "20_Passport", text: "passport style photo, dead center front, neck up, neutral lighting, flat background" },

    // --- NEW: HEAD & FACE SPECIFIC ANGLES ---
    { name: "21_Head_Front_Macro", text: "macro shot of face, front view, focus on eyes and skin texture, neutral expression" },
    { name: "22_Head_Profile_Left", text: "headshot, strict side profile view looking left, neutral expression, focus on nose and jawline" },
    { name: "23_Head_Profile_Right", text: "headshot, strict side profile view looking right, neutral expression, focus on nose and jawline" },
    { name: "24_Head_3Q_Left", text: "head and shoulders portrait, 3/4 view looking left, soft lighting" },
    { name: "25_Head_3Q_Right", text: "head and shoulders portrait, 3/4 view looking right, soft lighting" },
    { name: "26_Head_Back", text: "close up of back of head, showing hair texture and style, no face visible" },
    { name: "27_Head_Chin_Up", text: "close up face, tilting head back looking up, showing neck, confident" },
    { name: "28_Head_Chin_Down", text: "close up face, tilting head down, looking up through eyebrows, shy or intense" },
    { name: "29_Head_Top_Down", text: "extreme high angle close up looking down at face, focus on eyelashes and nose bridge" },
    { name: "30_Head_Bottom_Up", text: "extreme low angle close up looking up at chin and jawline, dominance" },
    { name: "31_Expression_Laugh", text: "close up face, laughing naturally, eyes closed slightly, showing teeth" },
    { name: "32_Expression_Serious", text: "close up face, very serious intensity, direct eye contact" },
    { name: "33_Hair_Movement", text: "close up headshot, wind blowing hair across face, dynamic hair motion" },
    { name: "34_Glasses_Reflection", text: "close up face with glasses, reflections in lenses, studio lighting" },
    { name: "35_Beauty_Portrait", text: "beauty portrait, perfect soft lighting, rembrandt lighting, detailed makeup and skin" }
];

// Helper to upload image
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

function constructWorkflow(posePrompt, uploadedFront, uploadedSide, uploadedBack, seed) {
    const photoStyle = "(photo:1.3), high-end studio photograph, plain white background"; // Plain background for refs
    const qualitySuffix = "highly detailed, 8k, masterpiece, soft studio lighting, sharp focus";
    const outfit = "wearing a tight simple grey bodysuit"; // Neutral outfit for anatomical refs

    // Smart Reference Switching & High Fidelity
    // Since we have specific angles, we can keep PuLID weight HIGH (0.95) for maximum likeness!
    let targetImage = uploadedFront;
    let pulidStrength = 0.95;
    let pulidEndAt = 0.9;

    const pText = posePrompt.toLowerCase();
    if (pText.includes("back view") || pText.includes("from behind") || pText.includes("back of head") || pText.includes("walking away")) {
        targetImage = uploadedBack;
    } else if (pText.includes("profile") || pText.includes("side view") || pText.includes("look over shoulder") || pText.includes("3/4")) {
        targetImage = uploadedSide;
        // INJECT EXTRA FLATTENING FOR SIDE VIEWS
        posePrompt += ", (concave abdomen:1.3), (perfectly flat tummy:1.4), (no belly:1.4)";
    }

    // Structure: Style + Identity + Traits + Action + Quality
    const posPrompt = `${photoStyle}, ${CLARA_IDENTITY}, ${CLARA_TRAITS}, ${posePrompt}, ${outfit}, ${qualitySuffix}`;

    return {
        // 1. Core Flux Models
        "10": { "inputs": { "unet_name": "flux1-dev.sft", "weight_dtype": "fp8_e4m3fn" }, "class_type": "UNETLoader" },
        "11": { "inputs": { "clip_name1": "clip_l.safetensors", "clip_name2": "t5xxl_fp8_e4m3fn.safetensors", "type": "flux" }, "class_type": "DualCLIPLoader" },
        "12": { "inputs": { "vae_name": "ae.sft" }, "class_type": "VAELoader" },

        // 2. Native PuLID Flux Loaders
        "30": { "inputs": { "pulid_file": "pulid_flux_v0.9.0.safetensors" }, "class_type": "PulidFluxModelLoader" },
        "31": { "inputs": {}, "class_type": "PulidFluxEvaClipLoader" },
        "32": { "inputs": { "provider": "CUDA" }, "class_type": "PulidFluxInsightFaceLoader" },

        // 3. Reference Image (Dynamic)
        "20": { "inputs": { "image": targetImage }, "class_type": "LoadImage" },

        // 4. Apply PuLID Flux
        "33": {
            "inputs": {
                "model": ["10", 0],
                "pulid_flux": ["30", 0],
                "eva_clip": ["31", 0],
                "face_analysis": ["32", 0],
                "image": ["20", 0],
                "weight": pulidStrength,
                "start_at": 0.0,
                "end_at": pulidEndAt,
                "fusion": "mean",
                "fusion_weight_max": 1.0,
                "fusion_weight_min": 0.0,
                "train_step": 1000,
                "use_gray": true
            },
            "class_type": "ApplyPulidFlux"
        },

        // 5. Flux Specific Nodes
        "13": { "inputs": { "width": 1024, "height": 1024, "batch_size": 1 }, "class_type": "EmptyLatentImage" },
        "14": { "inputs": { "clip_l": posPrompt, "t5xxl": posPrompt, "guidance": 3.5, "clip": ["11", 0] }, "class_type": "CLIPTextEncodeFlux" },
        "34": { "inputs": { "guidance": 3.5, "conditioning": ["14", 0] }, "class_type": "FluxGuidance" }, // Verified Guidance
        "18": { "inputs": { "clip_l": "(pregnant:2.0), (belly extension:1.5), (distended stomach:1.5), (bloated:1.5), (protruding abdomen:1.5), fat stomach, hanging belly", "t5xxl": "(pregnant:2.0), (belly extension:1.5), (distended stomach:1.5), (bloated:1.5), (protruding abdomen:1.5), fat stomach, hanging belly", "guidance": 3.5, "clip": ["11", 0] }, "class_type": "CLIPTextEncodeFlux" },
        "15": {
            "inputs": {
                "seed": seed, "steps": 25, "cfg": 1.0, "sampler_name": "euler", "scheduler": "simple", "denoise": 1.0,
                "model": ["33", 0],
                "positive": ["34", 0],
                "negative": ["18", 0],
                "latent_image": ["13", 0]
            },
            "class_type": "KSampler"
        },

        // 6. Output
        "16": { "inputs": { "samples": ["15", 0], "vae": ["12", 0] }, "class_type": "VAEDecode" },
        "17": { "inputs": { "images": ["16", 0], "filename_prefix": `REF_CLARA_NEW` }, "class_type": "SaveImage" }
    };
}

async function queuePrompt(workflow) {
    try {
        const response = await fetch(`${BASE_URL}/prompt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: workflow })
        });
        const data = await response.json();
        return data.prompt_id;
    } catch (e) {
        console.error('   ❌ Connection Error:', e.message);
        return null;
    }
}

async function generateReferences() {
    console.log("🚀 STARTING CLARA REFERENCE DATASET GENERATION");
    const localPathFront = path.join(__dirname, 'public/uploads', SOURCE_IMAGE_FRONT);
    const localPathSide = path.join(__dirname, 'public/uploads', SOURCE_IMAGE_SIDE);
    const localPathBack = path.join(__dirname, 'public/uploads', SOURCE_IMAGE_BACK);

    console.log("📤 Uploading Multi-View References...");
    const upFront = await uploadImage(localPathFront, `REF_CLARA_FRONT.jpg`);
    const upSide = await uploadImage(localPathSide, `REF_CLARA_SIDE.png`);
    const upBack = await uploadImage(localPathBack, `REF_CLARA_BACK.jpg`);

    if (!upFront || !upSide || !upBack) {
        console.error("❌ Critical: One or more reference images failed to upload.");
        return;
    }

    for (const p of PROMPTS) {
        console.log(`📸 Generating: ${p.name}`);
        const seed = Math.floor(Math.random() * 10000000);
        const workflow = constructWorkflow(p.text, upFront, upSide, upBack, seed);

        const promptId = await queuePrompt(workflow);

        if (promptId) {
            console.log(`   Job dispatched: ${promptId}`);
            // Wait to ensure processing
            await new Promise(r => setTimeout(r, 6000));
        } else {
            console.log("   ❌ Job Failed to Dispatch");
        }
    }

    console.log("✅ All jobs dispatched. Check RunPod History or Output folder.");
}

generateReferences();
