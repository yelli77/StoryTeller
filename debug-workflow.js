const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const POD_ID = process.env.RUNPOD_POD_ID || 'g4oysjh535la54';
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net/prompt`;

const workflow = {
    "1": { "inputs": { "ckpt_name": "juggernautXL_v9RdPhoto2Lightning.safetensors" }, "class_type": "CheckpointLoaderSimple" },
    "2": { "inputs": { "text": "Clara, in einem Cafe, highly detailed", "clip": ["1", 1] }, "class_type": "CLIPTextEncode" },
    "3": { "inputs": { "text": "blur, low quality", "clip": ["1", 1] }, "class_type": "CLIPTextEncode" },
    "4": { "inputs": { "width": 832, "height": 1216, "batch_size": 1 }, "class_type": "EmptyLatentImage" },
    "5": { "inputs": { "clip_name": "clip_vision_sdxl.safetensors" }, "class_type": "CLIPVisionLoader" },
    "6": { "inputs": { "image": "clara_ref_tuning.png" }, "class_type": "LoadImage" },
    "7": { "inputs": { "instantid_file": "instantid-ip-adapter.bin" }, "class_type": "InstantIDModelLoader" },
    "8": {
        "inputs": {
            "insightface_model": "BUFFL",
            "provider": "CPU"
        },
        "class_type": "InstantIDFaceAnalysis"
    },
    "10": { "inputs": { "control_net_name": "instantid-controlnet-sdxl.safetensors" }, "class_type": "ControlNetLoader" },
    "9": {
        "inputs": {
            "instantid": ["7", 0], "insightface": ["8", 0], "control_net": ["10", 0], "image": ["6", 0],
            "model": ["1", 0], "positive": ["2", 0], "negative": ["3", 0],
            "weight": 0.7, "start_at": 0, "end_at": 0.4
        },
        "class_type": "ApplyInstantID"
    },
    "11": { "inputs": { "ipadapter_file": "ip-adapter-plus-face_sdxl_vit-h.safetensors" }, "class_type": "IPAdapterModelLoader" },
    "12": {
        "inputs": {
            "model": ["9", 0], "ipadapter": ["11", 0], "clip_vision": ["5", 0], "image": ["6", 0],
            "weight": 0.6, "weight_type": "linear", "combine_embeds": "concat", "embeds_scaling": "V only",
            "start_at": 0, "end_at": 1
        },
        "class_type": "IPAdapterAdvanced"
    },
    "13": {
        "inputs": {
            "seed": 123, "steps": 15, "cfg": 2.0, "sampler_name": "dpmpp_sde", "scheduler": "karras", "denoise": 1,
            "model": ["12", 0], "positive": ["9", 1], "negative": ["9", 2], "latent_image": ["4", 0]
        },
        "class_type": "KSampler"
    },
    "14": { "inputs": { "scale_by": 1.25, "upscale_method": "bilinear", "samples": ["13", 0] }, "class_type": "LatentUpscaleBy" },
    "15": {
        "inputs": {
            "seed": 123, "steps": 8, "cfg": 2.0, "sampler_name": "dpmpp_sde", "scheduler": "karras", "denoise": 0.45,
            "model": ["12", 0], "positive": ["9", 1], "negative": ["9", 2], "latent_image": ["14", 0]
        },
        "class_type": "KSampler"
    },
    "20": { "inputs": { "samples": ["15", 0], "vae": ["1", 2] }, "class_type": "VAEDecode" },
    "21": { "inputs": { "filename_prefix": "Test", "images": ["20", 0] }, "class_type": "SaveImage" }
};

async function testWorkflow() {
    console.log("Testing workflow on:", BASE_URL);
    try {
        const res = await fetch(BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: workflow })
        });

        const data = await res.json();
        if (!res.ok) {
            console.log("\n❌ SERVER ERROR DETAILS:");
            console.log(JSON.stringify(data, null, 2));
        } else {
            console.log("\n✅ WORKFLOW ACCEPTED! ID:", data.prompt_id);
        }
    } catch (err) {
        console.error("Fetch failed:", err.message);
    }
}

testWorkflow();
