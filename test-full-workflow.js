const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const POD_ID = process.env.RUNPOD_POD_ID || 'g4oysjh535la54';
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

async function testFullDualAdapter() {
    const workflow = {
        "1": { "inputs": { "ckpt_name": "juggernautXL_v9RdPhoto2Lightning.safetensors" }, "class_type": "CheckpointLoaderSimple" },
        "2": { "inputs": { "text": "Clara, portrait, photorealistic", "clip": ["1", 1] }, "class_type": "CLIPTextEncode" },
        "3": { "inputs": { "text": "low quality, blur", "clip": ["1", 1] }, "class_type": "CLIPTextEncode" },
        "4": { "inputs": { "width": 512, "height": 512, "batch_size": 1 }, "class_type": "EmptyLatentImage" },
        "5": { "inputs": { "clip_name": "clip_vision_sdxl.safetensors" }, "class_type": "CLIPVisionLoader" },
        "6": { "inputs": { "image": "clara_ref_tuning.png" }, "class_type": "LoadImage" },
        "7": { "inputs": { "instantid_file": "instantid-ip-adapter.bin" }, "class_type": "InstantIDModelLoader" },
        "8": { "inputs": { "insightface_model": "BUFFL", "provider": "CPU" }, "class_type": "InstantIDFaceAnalysis" },
        "10": { "inputs": { "control_net_name": "instantid-controlnet-sdxl.safetensors" }, "class_type": "ControlNetLoader" },
        "9": {
            "inputs": {
                "instantid": ["7", 0], "insightface": ["8", 0], "control_net": ["10", 0], "image": ["6", 0],
                "model": ["1", 0], "positive": ["2", 0], "negative": ["3", 0],
                "weight": 0.5, "start_at": 0, "end_at": 0.4
            },
            "class_type": "ApplyInstantID"
        },
        "11": { "inputs": { "ipadapter_file": "ip-adapter-plus-face_sdxl_vit-h.safetensors" }, "class_type": "IPAdapterModelLoader" },
        "12": {
            "inputs": {
                "model": ["9", 0], "ipadapter": ["11", 0], "clip_vision": ["5", 0], "image": ["6", 0],
                "weight": 0.5, "weight_type": "linear", "combine_embeds": "concat", "embeds_scaling": "V only",
                "start_at": 0, "end_at": 1
            },
            "class_type": "IPAdapterAdvanced"
        },
        "13": {
            "inputs": {
                "seed": 456, "steps": 5, "cfg": 2, "sampler_name": "euler", "scheduler": "simple", "denoise": 1,
                "model": ["12", 0], "positive": ["9", 1], "negative": ["9", 2], "latent_image": ["4", 0]
            },
            "class_type": "KSampler"
        },
        "20": { "inputs": { "samples": ["13", 0], "vae": ["1", 2] }, "class_type": "VAEDecode" },
        "21": { "inputs": { "images": ["20", 0], "filename_prefix": "DualTest" }, "class_type": "SaveImage" }
    };

    console.log("Submitting Dual-Adapter job...");
    const res = await fetch(`${BASE_URL}/prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: workflow })
    });
    const data = await res.json();
    if (!res.ok) { console.error("Error:", data); return; }
    console.log("Job ID:", data.prompt_id);

    // Poll
    for (let i = 0; i < 30; i++) {
        const histRes = await fetch(`${BASE_URL}/history/${data.prompt_id}`);
        const history = await histRes.json();
        if (history[data.prompt_id]) {
            if (history[data.prompt_id].status.status === 'error' || history[data.prompt_id].status.completed === false) {
                console.log("❌ ERROR:", JSON.stringify(history[data.prompt_id].status, null, 2));
            } else {
                console.log("✅ DUAL-ADAPTER SUCCESS!");
            }
            return;
        }
        await new Promise(r => setTimeout(r, 2000));
        console.log("Polling...");
    }
}

testFullDualAdapter();
