const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const POD_ID = process.env.RUNPOD_POD_ID || '9f4cwila6ehy9g';
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

async function testFluxHybrid() {
    const prompt = "A portrait of a thick, voluptuous woman with glasses, masterpiece, high quality";

    const workflow = {
        "1": {
            "inputs": {
                "unet_name": "flux1-dev-fp8.safetensors",
                "weight_dtype": "fp8_e4m3fn"
            },
            "class_type": "UNETLoader"
        },
        "2": {
            "inputs": {
                "clip_name1": "hunyuan_video_clip_L.safetensors",
                "clip_name2": "hunyuan_video_llm_1b.safetensors",
                "type": "flux"
            },
            "class_type": "DualCLIPLoader"
        },
        "3": {
            "inputs": {
                "vae_name": "ae.safetensors"
            },
            "class_type": "VAELoader"
        },
        "4": {
            "inputs": {
                "width": 896,
                "height": 1152,
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
                "steps": 20,
                "cfg": 1.0,
                "sampler_name": "euler",
                "scheduler": "simple",
                "denoise": 1.0,
                "model": ["ModelSamplingFlux", 0],
                "positive": ["5", 0],
                "negative": ["5", 0],
                "latent_image": ["4", 0]
            },
            "class_type": "KSampler"
        }
    };

    // Wait, KSampler might not be right for Flux if it doesn't have the Flux sampling nodes.
    // I noticed 'ModelSamplingFlux' in the list.
}
