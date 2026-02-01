
const POD_ID = process.env.NEXT_PUBLIC_RUNPOD_POD_ID || process.env.RUNPOD_POD_ID || 'g4oysjh535la54';
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

export interface RunpodVideoResult {
    success: boolean;
    videoUrl?: string;
    error?: string;
    status?: 'pending' | 'processing' | 'completed' | 'failed';
}

/**
 * Helper to prepare the HunyuanVideo workflow
 */
function prepareWorkflow(prompt: string, frames: number, startImageFilename?: string) {
    const workflow: any = {
        "1": {
            "inputs": {
                "model_name": "hunyuan_video_720_cfg_distill_fp8_e4m3fn.safetensors",
                "weight_dtype": "fp8_e4m3fn",
                "compute_dtype": "default",
                "patch_cublaslinear": true,
                "sage_attention": "disabled",
                "enable_fp16_accumulation": true
            },
            "class_type": "DiffusionModelLoaderKJ"
        },
        "2": {
            "inputs": {
                "vae_name": "hunyuan_video_vae_bf16.safetensors",
                "device": "main_device",
                "weight_dtype": "bf16"
            },
            "class_type": "VAELoaderKJ"
        },
        "3": {
            "inputs": {
                "text": prompt,
                "clip": ["4", 0]
            },
            "class_type": "CLIPTextEncode"
        },
        "4": {
            "inputs": {
                "clip_name1": "hunyuan_video_llm_1b.safetensors",
                "clip_name2": "hunyuan_video_clip_L.safetensors",
                "type": "hunyuan_video"
            },
            "class_type": "DualCLIPLoader"
        },
        "5": {
            "inputs": {
                "width": 720,
                "height": 1280,
                "length": frames,
                "batch_size": 1
            },
            "class_type": "EmptyHunyuanLatentVideo"
        }
    };

    // If we have a start image, use Image-to-Video conditioning
    if (startImageFilename) {
        workflow["11"] = {
            "inputs": {
                "image": startImageFilename
            },
            "class_type": "LoadImage"
        };
        workflow["12"] = {
            "inputs": {
                "positive": ["3", 0],
                "vae": ["2", 0],
                "width": 720,
                "height": 1280,
                "length": frames,
                "batch_size": 1,
                "guidance_type": "v2 (replace)",
                "start_image": ["11", 0]
            },
            "class_type": "HunyuanImageToVideo"
        };
    }

    workflow["6"] = {
        "inputs": {
            "seed": Math.floor(Math.random() * 1000000),
            "steps": 15,
            "cfg": 1.0,
            "sampler_name": "euler",
            "scheduler": "simple",
            "denoise": 1.0,
            "model": ["1", 0],
            "positive": startImageFilename ? ["12", 0] : ["3", 0],
            "negative": ["7", 0],
            "latent_image": startImageFilename ? ["12", 1] : ["5", 0]
        },
        "class_type": "KSampler"
    };

    workflow["7"] = {
        "inputs": {
            "text": "low quality, blurry, distorted, watermark, text",
            "clip": ["4", 0]
        },
        "class_type": "CLIPTextEncode"
    };

    workflow["8"] = {
        "inputs": {
            "samples": ["6", 0],
            "vae": ["2", 0]
        },
        "class_type": "VAEDecode"
    };

    workflow["9"] = {
        "inputs": {
            "images": ["8", 0],
            "fps": 24
        },
        "class_type": "CreateVideo"
    };

    workflow["10"] = {
        "inputs": {
            "video": ["9", 0],
            "filename_prefix": "HunyuanVideo",
            "format": "mp4",
            "codec": "h264"
        },
        "class_type": "SaveVideo"
    };

    return workflow;
}

/**
 * Helper to prepare an Image generation workflow (using SDXL + InstantID + IP-Adapter)
 */
function prepareImageWorkflow(prompt: string, referenceImageBase64?: string, config?: any) {
    const seed = config?.manualSeed ?? Math.floor(Math.random() * 1000000);

    // Professional Dual-Adapter Setup: InstantID (structure) + IP-Adapter (texture/soul)
    const weight = config?.instantidWeight ?? 0.8;
    const ipWeight = config?.ipWeight ?? 0.7;
    const cfg = 1.5;
    const endAt = config?.endAt ?? 0.8;

    const actionPrompt = prompt ? `(photograph:1.5), (highly detailed:1.2), ${prompt}` : '';

    const posPrompt = config?.positivePrompt
        ? `${actionPrompt}, ${config.positivePrompt}`
        : `${actionPrompt}, raw photo, 8k uhd, cinematic lighting, masterpiece, ultra-realistic skin texture, centered composition`;

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
