const https = require('https');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const POD_ID = process.env.RUNPOD_POD_ID || '9f4cwila6ehy9g';
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

const CHARACTERS = [
    { name: 'Clara', image: 'clara_ref.png', idWeight: 0.45, ipWeight: 0.45 },
    { name: 'Emily', image: 'emily_ref.png', idWeight: 0.45, ipWeight: 0.45 },
    { name: 'Mia', image: 'mia_ref.png', idWeight: 0.45, ipWeight: 0.45 }
];

const POSES = [
    // BASIC POSES
    { name: 'Standing_Front', prompt: 'standing front view, looking at camera, full body' },
    { name: 'Standing_Side', prompt: 'standing side view, profile shot, looking over shoulder' },
    { name: 'Sitting_Chair', prompt: 'sitting on a studio chair, legs crossed' },
    { name: 'Sitting_Floor', prompt: 'sitting on the studio floor, legs spread slightly' },
    { name: 'Kneeling_Front', prompt: 'kneeling on both knees, hands on hips' },
    { name: 'Kneeling_Side', prompt: 'kneeling on one knee, profile view' },
    { name: 'Lying_Back', prompt: 'lying on her back, looking up at camera' },
    { name: 'Lying_Stomach', prompt: 'lying on her stomach, propped up on elbows' },
    // DYNAMIC / FASHION
    { name: 'Bending_Forward', prompt: 'bending forward slightly, hands on knees, looking at camera' },
    { name: 'Hands_Behind_Head', prompt: 'standing, both hands behind head, elbows out' },
    { name: 'One_Leg_Up', prompt: 'standing, one leg propped up on a studio block' },
    { name: 'Squatting', prompt: 'squatting down low, looking at camera' },
    // EXPLICIT / SENSITIVE
    { name: 'All_Fours', prompt: 'on all fours, arching back, looking at camera' },
    { name: 'All_Fours_Back', prompt: 'on all fours, back to camera, looking over shoulder' },
    { name: 'Spreading_Butt_Standing', prompt: 'standing, bending over, back to camera, spreading buttocks with hands' },
    { name: 'Spreading_Butt_Kneeling', prompt: 'kneeling on all fours, spreading buttocks with hands' },
    { name: 'Spreading_Pussy_Sitting', prompt: 'sitting with legs wide apart, spreading pussy with hands, close up' },
    { name: 'Spreading_Pussy_Lying', prompt: 'lying on back, legs pulled back, spreading pussy with hands' },
    { name: 'Spreading_Pussy_Squatting', prompt: 'squatting, legs wide apart, spreading pussy with hands' },
    { name: 'Ass_Up_Face_Down', prompt: 'lying face down, ass pushed up high in the air' },
    // ADDITIONAL POSES (Total 27)
    { name: 'Crouching_Side', prompt: 'crouching on the floor, side view, looking at camera' },
    { name: 'Lying_Side', prompt: 'lying on her side, curvy silhouette, looking at camera' },
    { name: 'Standing_Arms_Up', prompt: 'standing, arms reached high above head' },
    { name: 'Sitting_Edge', prompt: 'sitting on the edge of a table, legs dangling' },
    { name: 'Kneeling_Spread', prompt: 'kneeling, legs spread wide, hands on floor' },
    { name: 'Bending_Over_Side', prompt: 'bending over from the side, looking at camera' },
    { name: 'Climbing_Pose', prompt: 'one hand on wall, one leg up, dynamic fashion pose' }
];

const MODES = [
    { name: 'Bodysuit', outfit: 'wearing a tight cyan bodysuit', neg: 'nude, naked' },
    { name: 'Naked', outfit: 'nude, naked, (natural anatomy:1.2)', neg: 'clothing, bodysuit, underwear, fabric, tan lines, marks' }
];

function constructWorkflow(posePrompt, outfitPrompt, sourceImg, idWeight, ipWeight, variantNeg) {
    const seed = Math.floor(Math.random() * 1000000);
    const posPrompt = `(photorealistic:1.3), (raw photo:1.2), high-end studio photography, (natural skin texture:1.1), (subtle film grain:1.1), soft professional studio lighting, (curvy voluptuous woman:1.25), fleshy body, soft curves, wide hips, thick thighs, (natural anatomy:1.2), masterpiece, 8k, professional dslr, soft grey background, rich natural colors, ${posePrompt}, ${outfitPrompt}`;
    const baseNeg = "(extra nipples:2.0), (multi-nipple:2.0), (extra breasts:2.0), (distorted anatomy:2.0), (hallucinations:2.0), (plastic skin:1.5), (tan lines:1.5), (clothes marks:1.5), (digital noise:1.8), (slender:2.0), (thin:2.0), (skinny:2.0), text, watermark, (worst quality, low quality:1.4)";
    const negPrompt = `${baseNeg}, ${variantNeg}`;

    return {
        "1": { "inputs": { "ckpt_name": "juggernautXL_v9RdPhoto2Lightning.safetensors" }, "class_type": "CheckpointLoaderSimple" },
        "2": { "inputs": { "text": posPrompt, "clip": ["1", 1] }, "class_type": "CLIPTextEncode" },
        "3": { "inputs": { "text": negPrompt, "clip": ["1", 1] }, "class_type": "CLIPTextEncode" },
        "4": { "inputs": { "width": 896, "height": 1152, "batch_size": 1 }, "class_type": "EmptyLatentImage" },
        "5": { "inputs": { "clip_name": "clip_vision_sdxl.safetensors" }, "class_type": "CLIPVisionLoader" },
        "6": { "inputs": { "image": sourceImg }, "class_type": "LoadImage" },
        "7": { "inputs": { "instantid_file": "instantid-ip-adapter.bin" }, "class_type": "InstantIDModelLoader" },
        "8": { "inputs": { "provider": "CPU" }, "class_type": "InstantIDFaceAnalysis" },
        "10": { "inputs": { "control_net_name": "instantid-controlnet-sdxl.safetensors" }, "class_type": "ControlNetLoader" },
        "9": {
            "inputs": {
                "instantid": ["7", 0], "insightface": ["8", 0], "control_net": ["10", 0],
                "image": ["6", 0], "model": ["1", 0], "positive": ["2", 0], "negative": ["3", 0],
                "weight": idWeight, "start_at": 0.0, "end_at": 1.0
            },
            "class_type": "ApplyInstantID"
        },
        "11": { "inputs": { "ipadapter_file": "ip-adapter-plus-face_sdxl_vit-h.safetensors" }, "class_type": "IPAdapterModelLoader" },
        "12": {
            "inputs": {
                "model": ["9", 0], "ipadapter": ["11", 0], "clip_vision": ["5", 0], "image": ["6", 0],
                "weight": ipWeight, "weight_type": "linear", "combine_embeds": "concat", "embeds_scaling": "V only",
                "start_at": 0.0, "end_at": 1.0
            },
            "class_type": "IPAdapterAdvanced"
        },
        "13": {
            "inputs": {
                "seed": seed, "steps": 50, "cfg": 4.0, "sampler_name": "dpmpp_2m_sde_gpu", "scheduler": "karras", "denoise": 1.0,
                "model": ["12", 0], "positive": ["2", 0], "negative": ["3", 0], "latent_image": ["4", 0]
            },
            "class_type": "KSampler"
        },
        "20": { "inputs": { "samples": ["13", 0], "vae": ["1", 2] }, "class_type": "VAEDecode" },
        "21": { "inputs": { "filename_prefix": "Dataset_Final", "images": ["20", 0] }, "class_type": "SaveImage" }
    };
}

async function generateAll() {
    console.log("� STARTING MASSIVE CHARACTER DATASET GENERATION (V16 STANDARD)");
    console.log(`📊 Matrix: ${CHARACTERS.length} Actors x ${POSES.length} Poses x ${MODES.length} Outfits = ${CHARACTERS.length * POSES.length * MODES.length} Images.`);

    for (const char of CHARACTERS) {
        console.log(`\n\n### [ACTOR: ${char.name}] ###`);

        for (const pose of POSES) {
            for (const mode of MODES) {
                console.log(`📸 Processing: ${char.name} | ${pose.name} | ${mode.name}`);

                const workflow = constructWorkflow(pose.prompt, mode.outfit, char.image, char.idWeight, char.ipWeight, mode.neg);
                workflow["21"].inputs.filename_prefix = `${char.name}_${pose.name}_${mode.name}_V16`;

                try {
                    const response = await fetch(`${BASE_URL}/prompt`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ prompt: workflow })
                    });
                    const data = await response.json();

                    if (data.prompt_id) {
                        console.log(`   Job dispatched: ${data.prompt_id}`);
                        // Poll for completion
                        while (true) {
                            const res = await fetch(`${BASE_URL}/history/${data.prompt_id}`);
                            const history = await res.json();
                            if (history[data.prompt_id]) {
                                console.log(`   ✅ Done.`);
                                break;
                            }
                            await new Promise(r => setTimeout(r, 10000)); // 10s polling for massive run
                        }
                    } else {
                        console.error('   ❌ Prompt Error:', data);
                    }
                } catch (e) {
                    console.error('   ❌ Connection Error:', e.message);
                    await new Promise(r => setTimeout(r, 10000));
                }
            }
        }
    }
    console.log("\n\n🏆 ALL DATASETS COMPLETED! Good night.");
}

generateAll();
