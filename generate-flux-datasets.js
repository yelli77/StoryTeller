const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const POD_ID = process.env.RUNPOD_POD_ID || '9f4cwila6ehy9g';
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

const CHARACTERS = [
    {
        name: 'Clara',
        filename: '1769946490115-image_(1).jpg',
        identity: "clara_character",
        traits: "(extreme hourglass figure:1.2), (huge breasts:1.7), (curvy:1.5), (very wide hips:1.3), (slim waist:1.1), (thick thighs:1.4), (soft body:1.3), (fleshy:1.1), (straight hair:1.2), (round soft face:1.2), long honey-brown hair, glasses, soft pretty facial features"
    },
    {
        name: 'Emily',
        filename: '1770048788120-image_(2).jpg',
        identity: "emily_character",
        traits: "young woman, dark hair, pink sleeveless top, (highly detailed face:1.3), very large heavy breasts, slender fit body, athletic build, round toned glutes"
    },
    {
        name: 'Mia',
        filename: '1770048915028-image_(3).jpg',
        identity: "mia_character",
        traits: "young woman, dark hair, (highly detailed face:1.3), pink v-neck top, dramatic expression, slender build"
    }
];

const POSES = [
    { name: 'Standing_Front', prompt: 'standing front view, looking at camera, full body' },
    { name: 'Standing_Side', prompt: 'standing side view, profile shot, looking over shoulder' },
    { name: 'Sitting_Chair', prompt: 'sitting on a studio chair, legs crossed' },
    { name: 'Sitting_Floor', prompt: 'sitting on the studio floor, legs spread slightly' },
    { name: 'Kneeling_Front', prompt: 'kneeling on both knees, hands on hips' },
    { name: 'Kneeling_Side', prompt: 'kneeling on one knee, profile view' },
    { name: 'Lying_Back', prompt: 'lying on her back, looking up at camera' },
    { name: 'Lying_Stomach', prompt: 'lying on her stomach, propped up on elbows' },
    { name: 'Bending_Forward', prompt: 'bending forward slightly, hands on knees, looking at camera' },
    { name: 'Hands_Behind_Head', prompt: 'standing, both hands behind head, elbows out' },
    { name: 'Squatting', prompt: 'squatting down low, looking at camera' },
    { name: 'All_Fours', prompt: 'on all fours, arching back, looking at camera' },
    { name: 'Spreading_Butt_Standing', prompt: 'standing, bending over, back to camera, spreading buttocks with hands' },
    { name: 'Spreading_Pussy_Sitting', prompt: 'sitting with legs wide apart, spreading pussy with hands, close up' },
    { name: 'Ass_Up_Face_Down', prompt: 'lying face down, ass pushed up high in the air' }
];

const MODES = [
    { name: 'Bodysuit', outfit: 'wearing a tight cyan bodysuit' },
    { name: 'Naked', outfit: 'nude, naked' }
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

function constructFluxPuLIDWorkflow(posePrompt, outfitPrompt, character, uploadedImageName) {
    const seed = Math.floor(Math.random() * 1000000);
    const photoStyle = "(photo:1.3), high-end studio photograph";
    const qualitySuffix = "highly detailed, 8k, masterpiece, soft studio lighting, sharp focus";

    // Structure: Style + Identity + Traits + Action + Quality
    const posPrompt = `${photoStyle}, ${character.identity}, ${character.traits}, ${posePrompt}, ${outfitPrompt}, ${qualitySuffix}`;

    return {
        // 1. Core Flux Models
        "10": { "inputs": { "unet_name": "flux1-dev.sft", "weight_dtype": "fp8_e4m3fn" }, "class_type": "UNETLoader" },
        "11": { "inputs": { "clip_name1": "clip_l.safetensors", "clip_name2": "t5xxl_fp8_e4m3fn.safetensors", "type": "flux" }, "class_type": "DualCLIPLoader" },
        "12": { "inputs": { "vae_name": "ae.sft" }, "class_type": "VAELoader" },

        // 2. Native PuLID Flux Loaders
        "30": { "inputs": { "pulid_file": "pulid_flux_v0.9.0.safetensors" }, "class_type": "PulidFluxModelLoader" },
        "31": { "inputs": {}, "class_type": "PulidFluxEvaClipLoader" },
        "32": { "inputs": { "provider": "CUDA" }, "class_type": "PulidFluxInsightFaceLoader" },

        // 3. Reference Image
        "20": { "inputs": { "image": uploadedImageName }, "class_type": "LoadImage" },

        // 4. Apply PuLID Flux
        "33": {
            "inputs": {
                "model": ["10", 0],
                "pulid_flux": ["30", 0],
                "eva_clip": ["31", 0],
                "face_analysis": ["32", 0],
                "image": ["20", 0],
                "weight": 1.0,
                "start_at": 0.0,
                "end_at": 1.0
            },
            "class_type": "ApplyPulidFlux"
        },

        // 5. Flux Specific Nodes
        "13": { "inputs": { "width": 1024, "height": 1024, "batch_size": 1 }, "class_type": "EmptyLatentImage" },
        "14": { "inputs": { "clip_l": posPrompt, "t5xxl": posPrompt, "guidance": 3.5, "clip": ["11", 0] }, "class_type": "CLIPTextEncodeFlux" },
        "34": { "inputs": { "guidance": 3.5, "conditioning": ["14", 0] }, "class_type": "FluxGuidance" },
        "18": { "inputs": { "clip_l": "", "t5xxl": "", "guidance": 3.5, "clip": ["11", 0] }, "class_type": "CLIPTextEncodeFlux" },
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
        "17": { "inputs": { "images": ["16", 0], "filename_prefix": `${character.name}_PuLID_Flux` }, "class_type": "SaveImage" }
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

        if (data.prompt_id) {
            // Poll for completion
            while (true) {
                const res = await fetch(`${BASE_URL}/history/${data.prompt_id}`);
                const history = await res.json();
                if (history[data.prompt_id]) {
                    console.log(`   ✅ Done.`);
                    return data.prompt_id;
                }
                await new Promise(r => setTimeout(r, 5000));
            }
        } else {
            console.error('   ❌ Prompt Error:', data);
            return null;
        }
    } catch (e) {
        console.error('   ❌ Connection Error:', e.message);
        return null;
    }
}

async function generateDatasets() {
    console.log("🚀 STARTING FLUX CHARACTER DATASET GENERATION (V18 - PuLID IDENTITY)");
    console.log("Configuration: PuLID 'Fidelity' | Weight 1.0 | Text-to-Image (New Poses)");

    for (const char of CHARACTERS) {
        // 1. Upload Reference Image
        const localPath = path.join(__dirname, 'public/uploads', char.filename);
        const uploadedImageName = await uploadImage(localPath, `REF_${char.name}.jpg`);
        if (!uploadedImageName) {
            console.error(`❌ Skipped ${char.name} due to upload failure.`);
            continue;
        }

        // 2. Iterate Poses
        for (const pose of POSES) {
            for (const outfit of MODES) { // Changed OUTFITS to MODES
                // The original code had a check for existing files, but the new instruction removes it.
                // const filenamePrefix = `${char.name}_${pose.name}_${outfit.name}_FLUX_IMG`;
                // const expectedFilename = `${filenamePrefix}_00001_.png`;
                // const outputPath = path.join(__dirname, 'output', expectedFilename);

                // if (fs.existsSync(outputPath)) {
                //     console.log(`   ⏩ Skipping: Output file already exists for ${char.name} | ${pose.name} | ${outfit.name}`);
                //     continue;
                // }

                console.log(`📸 Flux: ${char.name} | ${pose.name} | ${outfit.name}`);

                const workflow = constructFluxPuLIDWorkflow(pose.prompt, outfit.outfit, char, uploadedImageName); // Changed outfit.prompt to outfit.outfit

                // Use the helper function to dispatch and wait
                const promptId = await queuePrompt(workflow);

                if (promptId) {
                    console.log(`   Job dispatched: ${promptId}`);
                    // ⚠️ CRITICAL: Wait 10s to let GPU cool down/GC clear VRAM
                    await new Promise(r => setTimeout(r, 10000));
                } else {
                    console.log("   ❌ Job Failed to Dispatch");
                }
            }
        }
    }
}

generateDatasets();
