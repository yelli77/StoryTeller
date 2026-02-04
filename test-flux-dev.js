const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const POD_ID = process.env.RUNPOD_POD_ID;
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

async function testFluxDev() {
    console.log("🚀 Testing Flux.1-dev on POD:", POD_ID);

    const prompt = "A cinematic portrait of a beautiful young woman with honey brown hair and glasses, wearing a simple white t-shirt, standing in a sunlit garden. Highly detailed, 8k, photorealistic.";

    const workflow = {
        "1": {
            "inputs": {
                "unet_name": "flux1-dev.sft",
                "weight_dtype": "fp8_e4m3fn"
            },
            "class_type": "UNETLoader"
        },
        "2": {
            "inputs": {
                "clip_name1": "clip_l.safetensors",
                "clip_name2": "t5xxl_fp8_e4m3fn.safetensors",
                "type": "flux"
            },
            "class_type": "DualCLIPLoader"
        },
        "3": {
            "inputs": {
                "vae_name": "ae.sft"
            },
            "class_type": "VAELoader"
        },
        "4": {
            "inputs": {
                "width": 1024,
                "height": 1024,
                "batch_size": 1
            },
            "class_type": "EmptyLatentImage"
        },
        "5": {
            "inputs": {
                "clip_l": prompt,
                "t5xxl": prompt,
                "guidance": 3.5,
                "clip": ["2", 0]
            },
            "class_type": "CLIPTextEncodeFlux"
        },
        "6": {
            "inputs": {
                "seed": Math.floor(Math.random() * 1000000),
                "steps": 25,
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
                "filename_prefix": "FluxDevTest"
            },
            "class_type": "SaveImage"
        }
    };

    try {
        const response = await fetch(`${BASE_URL}/prompt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: workflow })
        });

        if (!response.ok) {
            const err = await response.text();
            console.error("❌ API Error:", err);
            return;
        }

        const data = await response.json();
        console.log("✅ Prompt sent! ID:", data.prompt_id);
    } catch (e) {
        console.error("❌ Connection failed. Is the pod running?", e.message);
    }
}

testFluxDev();
