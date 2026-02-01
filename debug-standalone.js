
const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

async function debugRunPod() {
    const POD_ID = process.env.RUNPOD_POD_ID || 'iaw3m6iyadpmgq';
    const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

    console.log("🔍 Testing RunPod Connectivity...");
    console.log(`📡 URL: ${BASE_URL}/prompt`);

    const workflow = {
        "1": { "inputs": { "model_name": "hunyuan_video_720_cfg_distill_fp8_e4m3fn.safetensors", "weight_dtype": "default", "compute_dtype": "default", "patch_cublaslinear": false, "sage_attention": "disabled", "enable_fp16_accumulation": false }, "class_type": "DiffusionModelLoaderKJ" },
        "2": { "inputs": { "vae_name": "hunyuan_video_vae_bf16.safetensors", "device": "main_device", "weight_dtype": "bf16" }, "class_type": "VAELoaderKJ" },
        "3": { "inputs": { "text": "Debug Test", "clip": ["4", 0] }, "class_type": "CLIPTextEncode" },
        "4": { "inputs": { "clip_name1": "hunyuan_video_llm_1b.safetensors", "clip_name2": "hunyuan_video_clip_L.safetensors", "type": "hunyuan_video" }, "class_type": "DualCLIPLoader" },
        "5": { "inputs": { "width": 480, "height": 848, "length": 9, "batch_size": 1 }, "class_type": "EmptyHunyuanLatentVideo" },
        "6": { "inputs": { "seed": 42, "steps": 6, "cfg": 1.0, "sampler_name": "euler", "scheduler": "simple", "denoise": 1.0, "model": ["1", 0], "positive": ["3", 0], "negative": ["7", 0], "latent_image": ["5", 0] }, "class_type": "KSampler" },
        "7": { "inputs": { "text": "low quality", "clip": ["4", 0] }, "class_type": "CLIPTextEncode" },
        "8": { "inputs": { "samples": ["6", 0], "vae": ["2", 0] }, "class_type": "VAEDecode" },
        "9": { "inputs": { "images": ["8", 0], "fps": 24 }, "class_type": "CreateVideo" },
        "10": { "inputs": { "video": ["9", 0], "filename_prefix": "Debug", "format": "mp4", "codec": "h264" }, "class_type": "SaveVideo" }
    };

    try {
        console.log("📡 Sending POST...");
        const response = await fetch(`${BASE_URL}/prompt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: workflow })
        });

        if (response.ok) {
            const data = await response.json();
            console.log("✅ Success! Prompt ID:", data.prompt_id);
        } else {
            const err = await response.text();
            console.error("❌ HTTP Error:", response.status, err);
        }
    } catch (e) {
        console.error("💥 Network/Fetch Exception:", e.message);
    }
}

debugRunPod();
