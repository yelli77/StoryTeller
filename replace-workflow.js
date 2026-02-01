const fs = require('fs');

const oldContent = fs.readFileSync('app/lib/runpod.ts', 'utf8');

// Find the function start and end
const funcStart = oldContent.indexOf('function prepareImageWorkflow');
const funcEnd = oldContent.indexOf('async function uploadImageToPod');

if (funcStart === -1 || funcEnd === -1) {
    console.log('ERROR: Could not find function boundaries');
    process.exit(1);
}

const newFunction = `function prepareImageWorkflow(prompt: string, referenceImageBase64?: string, config?: any) {
    const seed = config?.manualSeed ?? Math.floor(Math.random() * 1000000);

    // Professional Dual-Adapter Setup: InstantID (structure) + IP-Adapter (texture/soul)
    const weight = config?.instantidWeight ?? 0.8;
    const ipWeight = config?.ipWeight ?? 0.7;
    const cfg = 1.5;
    const endAt = config?.endAt ?? 0.8;

    const actionPrompt = prompt ? \`(photograph:1.5), (highly detailed:1.2), \${prompt}\` : '';

    const posPrompt = config?.positivePrompt
        ? \`\${actionPrompt}, \${config.positivePrompt}\`
        : \`\${actionPrompt}, raw photo, 8k uhd, cinematic lighting, masterpiece, ultra-realistic skin texture, centered composition\`;

    const negPrompt = config?.negativePrompt ?? "anime, cartoon, graphic, (worst quality, low quality:1.4), deformed, blurry, artifacts, text, watermark, different person, wrong face";

    const steps = 15;

    const workflow: any = {
        "1": {
            "inputs": { "ckpt_name": "juggernautXL_v9RdPhoto2Lightning.safetensors" },
            "class_type": "CheckpointLoaderSimple"
        },
        "2": {
            "inputs": { "text": posPrompt, "clip": ["1", 1] },
            "class_type": "CLIPTextEncode"
        },
        "3": {
            "inputs": { "text": negPrompt, "clip": ["1", 1] },
            "class_type": "CLIPTextEncode"
        },
        "4": {
            "inputs": { "width": 832, "height": 1216, "batch_size": 1 },
            "class_type": "EmptyLatentImage"
        },
        "5": {
            "inputs": { "clip_name": "clip_vision_sdxl.safetensors" },
            "class_type": "CLIPVisionLoader"
        }
    };

    if (referenceImageBase64) {
        workflow["6"] = {
            "inputs": { "image": referenceImageBase64 },
            "class_type": "LoadImage"
        };

        // --- INSTANTID SETUP (Facial Structure) ---
        workflow["7"] = {
            "inputs": { "instantid_file": "instantid-ip-adapter.bin" },
            "class_type": "InstantIDModelLoader"
        };
        workflow["8"] = {
            "inputs": {
                "provider": "CPU"
            },
            "class_type": "InstantIDFaceAnalysis"
        };
        workflow["9"] = {
            "inputs": {
                "instantid": ["7", 0],
                "insightface": ["8", 0],
                "control_net": ["10", 0],
                "image": ["6", 0],
                "model": ["1", 0],
                "positive": ["2", 0],
                "negative": ["3", 0],
                "weight": weight,
                "start_at": 0.0,
                "end_at": endAt
            },
            "class_type": "ApplyInstantID"
        };
        workflow["10"] = {
            "inputs": { "control_net_name": "instantid-controlnet-sdxl.safetensors" },
            "class_type": "ControlNetLoader"
        };

        // --- IPADAPTER SETUP (Texture/Soul) ---
        workflow["11"] = {
            "inputs": { "ipadapter_file": "ip-adapter-plus-face_sdxl_vit-h.safetensors" },
            "class_type": "IPAdapterModelLoader"
        };
        workflow["12"] = {
            "inputs": {
                "model": ["9", 0],
                "ipadapter": ["11", 0],
                "clip_vision": ["5", 0],
                "image": ["6", 0],
                "weight": ipWeight,
                "weight_type": "linear",
                "combine_embeds": "concat",
                "embeds_scaling": "V only",
                "start_at": 0.0,
                "end_at": 1.0
            },
            "class_type": "IPAdapterAdvanced"
        };

        // --- SAMPLING ---
        workflow["13"] = {
            "inputs": {
                "seed": seed,
                "steps": steps,
                "cfg": cfg,
                "sampler_name": "dpmpp_sde",
                "scheduler": "karras",
                "denoise": 1.0,
                "model": ["12", 0],
                "positive": ["9", 1],
                "negative": ["9", 2],
                "latent_image": ["4", 0]
            },
            "class_type": "KSampler"
        };

        // High-Res Refinement Pass
        workflow["14"] = {
            "inputs": { "scale_by": 1.25, "upscale_method": "bilinear", "samples": ["13", 0] },
            "class_type": "LatentUpscaleBy"
        };
        workflow["15"] = {
            "inputs": {
                "seed": seed,
                "steps": 8,
                "cfg": cfg,
                "sampler_name": "dpmpp_sde",
                "scheduler": "karras",
                "denoise": 0.45,
                "model": ["12", 0],
                "positive": ["9", 1],
                "negative": ["9", 2],
                "latent_image": ["14", 0]
            },
            "class_type": "KSampler"
        };

        workflow["20"] = {
            "inputs": { "samples": ["15", 0], "vae": ["1", 2] },
            "class_type": "VAEDecode"
        };
        workflow["21"] = {
            "inputs": { "filename_prefix": "StoryTeller_InstantID", "images": ["20", 0] },
            "class_type": "SaveImage"
        };
    } else {
        // Text-only mode
        workflow["9"] = {
            "inputs": {
                "seed": seed,
                "steps": steps,
                "cfg": cfg,
                "sampler_name": "dpmpp_sde",
                "scheduler": "karras",
                "denoise": 1.0,
                "model": ["1", 0],
                "positive": ["2", 0],
                "negative": ["3", 0],
                "latent_image": ["4", 0]
            },
            "class_type": "KSampler"
        };
        workflow["20"] = {
            "inputs": { "samples": ["9", 0], "vae": ["1", 2] },
            "class_type": "VAEDecode"
        };
        workflow["21"] = {
            "inputs": { "filename_prefix": "StoryTeller_TextOnly", "images": ["20", 0] },
            "class_type": "SaveImage"
        };
    }

    return workflow;
}

/**
 * Helper to upload a base64 image to the ComfyUI pod
 */
`;

const newContent = oldContent.substring(0, funcStart) + newFunction + oldContent.substring(funcEnd);

fs.writeFileSync('app/lib/runpod.ts', newContent);
console.log('✅ Successfully replaced prepareImageWorkflow with InstantID + IP-Adapter setup');
