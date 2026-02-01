const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const POD_ID = process.env.RUNPOD_POD_ID || 'g4oysjh535la54';
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

async function testFlux() {
    const prompt = "A high-tech cyberpunk street in Tokyo at night with neon lights and rain reflecting on the pavement. In the foreground, a young woman with honey brown hair and glasses, wearing a pink t-shirt, is walking towards the camera.";

    const workflow = {
        "1": {
            "inputs": {
                "unet_name": "flux1-schnell-fp8.safetensors",
                "weight_dtype": "fp8_e4m3fn"
            },
            "class_type": "UNETLoader"
        },
        "2": {
            "inputs": {
                "clip_name1": "clip_l.safetensors",
                "clip_name2": "t5xxl_fp16.safetensors",
                "type": "flux"
            },
            "class_type": "DualCLIPLoader"
        },
        "3": {
            "inputs": {
                "vae_name": "hunyuan_video_vae_bf16.safetensors"
            },
            "class_type": "VAELoader"
        },
        "4": {
            "inputs": {
                "width": 832,
                "height": 1216,
                "batch_size": 1
            },
            "class_type": "EmptyLatentImage"
        },
        "5": {
            "inputs": {
                "text": prompt,
                "clip": ["2", 0]
            },
            "class_type": "CLIPTextEncode"
        },
        "6": {
            "inputs": {
                "seed": 42,
                "steps": 4,
                "cfg": 1.0,
                "sampler_name": "euler",
                "scheduler": "simple",
                "denoise": 1.0,
                "model": ["1", 0],
                "positive": ["5", 0],
                "negative": ["5", 0],
                "latent_image": ["4", 0]
            },
            "class_type": "KSampler"
        },
        "7": {
            "inputs": {
                "samples": ["6", 0],
                "vae": ["3", 0]
            },
            "class_type": "VAEDecode"
        },
        "8": {
            "inputs": {
                "images": ["7", 0],
                "filename_prefix": "FluxTest"
            },
            "class_type": "SaveImage"
        }
    };

    console.log("🚀 Sending Flux Request...");
    const response = await fetch(`${BASE_URL}/prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: workflow })
    });

    if (!response.ok) {
        const text = await response.text();
        console.error("Error:", text);
        return;
    }

    const data = await response.json();
    console.log("Prompt ID:", data.prompt_id);
}

testFlux();
