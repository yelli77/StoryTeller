import fs from 'fs';
import path from 'path';

const RUNPOD_API_KEY = process.env.RUNPOD_API_KEY;
const POD_ID = process.env.RUNPOD_POD_ID || process.env.NEXT_PUBLIC_RUNPOD_POD_ID;

interface RunpodResult {
    success: boolean;
    videoUrl?: string;
    imageUrl?: string;
    error?: string;
}

// Helper to get pod proxy URL
const getPodUrl = (port: number = 8188) => `https://${POD_ID}-${port}.proxy.runpod.net`;

function prepareWorkflow(prompt: string, frames: number, startImageFilename?: string | null, config?: Record<string, any>) {
    // ELITE BODY ENFORCEMENT ENGINE (Same as Image)
    const globalBodyMaster = "(chubby:1.6), (soft body:1.4), (extremely large breasts:1.8), (massive bust:1.8), (huge hanging breasts:1.5), (wide hips:1.6), (thick thighs:1.7), (hourglass figure:1.7), (voluptuous:1.6), (obese:0.3), ";
    const bodyInjection = config?.characterTraits ? `[Character Physique: (${config.characterTraits}:1.9)], ` : "";

    // NAKED / EXPLICIT Handling
    const isExplicit = prompt.toLowerCase().includes("naked") || prompt.toLowerCase().includes("fuck") || prompt.toLowerCase().includes("cock") || prompt.toLowerCase().includes("cum");
    const stylePrefix = isExplicit ? "(highly explicit:1.5), (uncensored:1.5), (naked:1.4), (nude:1.4), " : "";

    const finalPosPrompt = `${stylePrefix}${globalBodyMaster}${bodyInjection}${prompt}, high quality, highly detailed, masterpiece, 8k`;
    const finalNegPrompt = "(noise:1.5), (grainy:1.5), (skinny:2.0), (thin:2.0), (slender:2.0), (slim:1.8), (flat chest:2.0), low quality, blurry, distorted, watermark, text";

    const workflow: Record<string, any> = {
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
            "inputs": { "text": finalPosPrompt, "clip": ["4", 0] },
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
            "inputs": { "width": 720, "height": 1280, "length": frames, "batch_size": 1 },
            "class_type": "EmptyHunyuanLatentVideo"
        },
        "7": {
            "inputs": { "text": finalNegPrompt, "clip": ["4", 0] },
            "class_type": "CLIPTextEncode"
        }
    };

    if (startImageFilename) {
        workflow["11"] = { "inputs": { "image": startImageFilename }, "class_type": "LoadImage" };
        workflow["12"] = {
            "inputs": {
                "positive": ["3", 0], "vae": ["2", 0], "width": 720, "height": 1280, "length": frames, "batch_size": 1,
                "guidance_type": "v2 (replace)", "start_image": ["11", 0]
            },
            "class_type": "HunyuanImageToVideo"
        };
    }

    workflow["6"] = {
        "inputs": {
            "seed": Math.floor(Math.random() * 1000000), "steps": 15, "cfg": 1.0, "sampler_name": "euler", "scheduler": "simple",
            "denoise": 1.0, "model": ["1", 0], "positive": startImageFilename ? ["12", 0] : ["3", 0], "negative": ["7", 0],
            "latent_image": startImageFilename ? ["12", 1] : ["5", 0]
        },
        "class_type": "KSampler"
    };

    workflow["8"] = { "inputs": { "samples": ["6", 0], "vae": ["2", 0] }, "class_type": "VAEDecode" };

    workflow["40"] = { "inputs": { "images": ["8", 0], "fps": 24 }, "class_type": "CreateVideo" };
    workflow["50"] = { "inputs": { "video": ["40", 0], "filename_prefix": "StoryTeller_Elite", "format": "mp4", "codec": "h264" }, "class_type": "SaveVideo" };

    return workflow;
}

function prepareFluxImageWorkflow(prompt: string, referenceImageFilename?: string, config?: Record<string, any>) {
    const params = config?.parameters || {};
    const seed = config?.manualSeed ?? Math.floor(Math.random() * 1000000);
    const steps = config?.steps ?? params.steps ?? 25;
    const guidance = config?.guidance ?? params.guidance ?? 3.5;
    const width = config?.width ?? 1024;
    const height = config?.height ?? 1024;

    // EXACT MATCH with successful test script logic
    const photoStyle = "(photo:1.3), high-end studio photograph";
    const qualitySuffix = "highly detailed, 8k, masterpiece, soft studio lighting, sharp focus";

    const charPrompt = config?.positivePrompt ? `${config.positivePrompt}, ` : "";
    const bodyInjection = config?.characterTraits ? `${config.characterTraits}, ` : "";

    // Structure: Style + Character Prompts + User Input + Physique + Suffix
    const finalPrompt = `${photoStyle}, ${charPrompt}${prompt}, ${bodyInjection}${qualitySuffix}`;

    const workflow: any = {
        "10": {
            "inputs": {
                "unet_name": "flux1-dev.sft",
                "weight_dtype": "fp8_e4m3fn"
            },
            "class_type": "UNETLoader"
        },
        "11": {
            "inputs": {
                "clip_name1": "clip_l.safetensors",
                "clip_name2": "t5xxl_fp8_e4m3fn.safetensors",
                "type": "flux"
            },
            "class_type": "DualCLIPLoader"
        },
        "12": {
            "inputs": {
                "vae_name": "ae.sft"
            },
            "class_type": "VAELoader"
        },
        "13": {
            "inputs": {
                "width": width,
                "height": height,
                "batch_size": 1
            },
            "class_type": "EmptyLatentImage"
        },
        "14": {
            "inputs": {
                "clip_l": finalPrompt,
                "t5xxl": finalPrompt,
                "guidance": guidance,
                "clip": ["11", 0]
            },
            "class_type": "CLIPTextEncodeFlux"
        },
        "18": {
            "inputs": {
                "clip_l": config?.negativePrompt || "",
                "t5xxl": config?.negativePrompt || "",
                "guidance": guidance,
                "clip": ["11", 0]
            },
            "class_type": "CLIPTextEncodeFlux"
        },
        "16": {
            "inputs": {
                "samples": ["15", 0],
                "vae": ["12", 0]
            },
            "class_type": "VAEDecode"
        }
    };

    // Model to be used in KSampler
    let finalModel: any = ["10", 0];

    // Apply Native PuLID Flux if reference image exists
    if (referenceImageFilename) {
        workflow["20"] = {
            "inputs": { "image": referenceImageFilename },
            "class_type": "LoadImage"
        };

        // Native PuLID Loaders
        workflow["30"] = {
            "inputs": { "pulid_file": "pulid_flux_v0.9.0.safetensors" },
            "class_type": "PulidFluxModelLoader"
        };
        workflow["31"] = {
            "inputs": {},
            "class_type": "PulidFluxEvaClipLoader"
        };
        workflow["32"] = {
            "inputs": { "provider": "CUDA" },
            "class_type": "PulidFluxInsightFaceLoader"
        };

        // Apply PuLID Node
        workflow["33"] = {
            "inputs": {
                "model": ["10", 0],
                "pulid_flux": ["30", 0],
                "eva_clip": ["31", 0],
                "face_analysis": ["32", 0],
                "image": ["20", 0],
                "weight": config?.pulidWeight ?? params.pulidWeight ?? 1.0,
                "start_at": 0.0,
                "end_at": 1.0,
                "fusion": config?.fusion ?? params.fusion ?? "mean",
                "fusion_weight_max": 1.0,
                "fusion_weight_min": 0.0,
                "train_step": 1000,
                "use_gray": true
            },
            "class_type": "ApplyPulidFlux"
        };

        finalModel = ["33", 0];

        workflow["17"] = {
            "inputs": {
                "images": ["16", 0],
                "filename_prefix": "StoryTeller_Flux_Native"
            },
            "class_type": "SaveImage"
        };
    } else {
        workflow["17"] = {
            "inputs": {
                "images": ["16", 0],
                "filename_prefix": "StoryTeller_Flux"
            },
            "class_type": "SaveImage"
        };
    }

    // KSampler (always at the end to catch model changes)
    workflow["15"] = {
        "inputs": {
            "seed": seed,
            "steps": steps,
            "cfg": 1.0,
            "sampler_name": "euler",
            "scheduler": "simple",
            "denoise": 1.0,
            "model": finalModel,
            "positive": ["14", 0],
            "negative": ["18", 0],
            "latent_image": ["13", 0]
        },
        "class_type": "KSampler"
    };

    return workflow;
}


function prepareImageWorkflow(prompt: string, instantIDImage?: string, ipAdapterImages?: string[], config?: Record<string, any>) {
    const seed = config?.manualSeed ?? Math.floor(Math.random() * 1000000);
    const weight = config?.instantidWeight ?? 0.95;
    const ipWeight = config?.ipWeight ?? 0.75;
    const cfg = 1.5;
    const steps = 12;

    // Quality Prefix matching the standalone scripts
    const qualityPrefix = "full body shot, standing, centered, (photograph:1.3), (highly detailed:1.2), masterpiece, 8k, dslr";
    const bodyInjection = config?.characterTraits ? `[Character Physique: (${config.characterTraits}:1.9)], ` : "";

    const posPrompt = config?.positivePrompt
        ? `${qualityPrefix}, ${prompt}, ${bodyInjection}${config.positivePrompt}`
        : `${qualityPrefix}, ${prompt}, ${bodyInjection}ultra-realistic skin texture, cinematic lighting`;

    const baseNeg = "out of frame, cropped face, cropped feet, cut off, (worst quality, low quality:1.4), (bad anatomy:1.2), (deformed:1.2), blurry, artifacts, text, watermark, different person, wrong face, painting, cartoon, anime";
    const negPrompt = config?.negativePrompt
        ? `${baseNeg}, ${config.negativePrompt}`
        : baseNeg;

    const workflow: any = {
        "1": { "inputs": { "ckpt_name": "RealVisXL_V4.0_Lightning.safetensors" }, "class_type": "CheckpointLoaderSimple" },
        "2": { "inputs": { "text": posPrompt, "clip": ["1", 1] }, "class_type": "CLIPTextEncode" },
        "3": { "inputs": { "text": negPrompt, "clip": ["1", 1] }, "class_type": "CLIPTextEncode" },
        "4": { "inputs": { "width": 896, "height": 1152, "batch_size": 1 }, "class_type": "EmptyLatentImage" },
        "5": { "inputs": { "clip_name": "clip_vision_sdxl.safetensors" }, "class_type": "CLIPVisionLoader" }
    };

    if (instantIDImage) {
        workflow["6"] = { "inputs": { "image": instantIDImage }, "class_type": "LoadImage" };
        workflow["7"] = { "inputs": { "instantid_file": "instantid-ip-adapter.bin" }, "class_type": "InstantIDModelLoader" };
        workflow["8"] = { "inputs": { "provider": "CPU" }, "class_type": "InstantIDFaceAnalysis" };
        workflow["10"] = { "inputs": { "control_net_name": "instantid-controlnet-sdxl.safetensors" }, "class_type": "ControlNetLoader" };
        workflow["9"] = {
            "inputs": {
                "instantid": ["7", 0], "insightface": ["8", 0], "control_net": ["10", 0],
                "image": ["6", 0], "model": ["1", 0], "positive": ["2", 0], "negative": ["3", 0],
                "weight": weight, "start_at": 0.0, "end_at": 0.9
            },
            "class_type": "ApplyInstantID"
        };
    }

    workflow["11"] = { "inputs": { "ipadapter_file": "ip-adapter-plus-face_sdxl_vit-h.safetensors" }, "class_type": "IPAdapterModelLoader" };
    const modelInput = instantIDImage ? ["9", 0] : ["1", 0];
    let samplerModelInput = modelInput;

    // Handle IP-Adapter Images (for Character Soul)
    if (ipAdapterImages && ipAdapterImages.length > 0) {
        let lastBatchNodeId: any = null;
        ipAdapterImages.forEach((img, idx) => {
            const nodeId = 100 + idx;
            workflow[`${nodeId}`] = { "inputs": { "image": img }, "class_type": "LoadImage" };
            if (idx === 0) { lastBatchNodeId = nodeId; }
            else {
                const batchId = 200 + idx;
                workflow[`${batchId}`] = { "inputs": { "image1": [`${lastBatchNodeId}`, 0], "image2": [`${nodeId}`, 0] }, "class_type": "ImageBatch" };
                lastBatchNodeId = batchId;
            }
        });

        workflow["12"] = {
            "inputs": {
                "model": samplerModelInput, "ipadapter": ["11", 0], "clip_vision": ["5", 0], "image": [`${lastBatchNodeId}`, 0],
                "weight": ipWeight, "weight_type": "linear", "combine_embeds": "concat", "embeds_scaling": "V only", "start_at": 0.0, "end_at": 0.9
            },
            "class_type": "IPAdapterAdvanced"
        };
        samplerModelInput = ["12", 0];
    } else if (instantIDImage) {
        // Fallback: Use the InstantID image also for IP-Adapter to boost likeness
        workflow["12"] = {
            "inputs": {
                "model": samplerModelInput, "ipadapter": ["11", 0], "clip_vision": ["5", 0], "image": ["6", 0],
                "weight": ipWeight, "weight_type": "linear", "combine_embeds": "concat", "embeds_scaling": "V only", "start_at": 0.0, "end_at": 0.9
            },
            "class_type": "IPAdapterAdvanced"
        };
        samplerModelInput = ["12", 0];
    }

    // Handle Location / Set Background
    if (config?.locationImage) {
        workflow["60"] = { "inputs": { "image": config.locationImage }, "class_type": "LoadImage" };
        workflow["61"] = {
            "inputs": {
                "model": samplerModelInput, "ipadapter": ["11", 0], "clip_vision": ["5", 0], "image": ["60", 0],
                "weight": config?.locationWeight ?? 0.65, "weight_type": "strong style transfer", "combine_embeds": "concat", "embeds_scaling": "V only", "start_at": 0.0, "end_at": 0.8
            },
            "class_type": "IPAdapterAdvanced"
        };
        samplerModelInput = ["61", 0];
    }

    // --- SAMPLING (Base) ---
    workflow["14"] = {
        "inputs": {
            "seed": seed, "steps": 15, "cfg": cfg, "sampler_name": "euler", "scheduler": "karras", "denoise": 1.0,
            "model": samplerModelInput, "positive": instantIDImage ? ["9", 1] : ["2", 0], "negative": instantIDImage ? ["9", 2] : ["3", 0], "latent_image": ["4", 0]
        },
        "class_type": "KSampler"
    };

    // --- HI-RES REFINEMENT ---
    workflow["15"] = { "inputs": { "upscale_method": "bicubic", "scale_by": 1.5, "samples": ["14", 0] }, "class_type": "LatentUpscaleBy" };
    workflow["16"] = {
        "inputs": {
            "seed": seed, "steps": 12, "cfg": cfg, "sampler_name": "euler", "scheduler": "karras", "denoise": 0.55,
            "model": samplerModelInput, "positive": instantIDImage ? ["9", 1] : ["2", 0], "negative": instantIDImage ? ["9", 2] : ["3", 0], "latent_image": ["15", 0]
        },
        "class_type": "KSampler"
    };

    workflow["20"] = { "inputs": { "samples": ["16", 0], "vae": ["1", 2] }, "class_type": "VAEDecode" };
    workflow["21"] = { "inputs": { "filename_prefix": "StoryTeller_Manual_Premium", "images": ["20", 0] }, "class_type": "SaveImage" };

    return workflow;
}

async function uploadImageToPod(imageSource: string): Promise<string | null> {
    let blob: Blob;
    let filename = `reference_${Date.now()}_${Math.random().toString(36).substring(7)}.png`;
    if (imageSource.startsWith('data:image')) {
        const base64Data = imageSource.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) { byteNumbers[i] = byteCharacters.charCodeAt(i); }
        const byteArray = new Uint8Array(byteNumbers);
        blob = new Blob([byteArray], { type: 'image/png' });
    } else {
        let localPath = imageSource;
        while (localPath.startsWith('/') || localPath.startsWith('\\')) { localPath = localPath.substring(1); }
        const fullPath = path.join(process.cwd(), 'public', localPath);
        if (fs.existsSync(fullPath)) {
            const buffer = fs.readFileSync(fullPath);
            blob = new Blob([buffer], { type: 'image/png' });
        } else {
            console.warn(`[RunPod] Local file not found: ${fullPath}`);
            return null;
        }
    }

    const formData = new FormData();
    formData.append('image', blob, filename);

    const uploadUrl = `${getPodUrl()}/upload/image`;
    const response = await fetch(uploadUrl, { method: 'POST', body: formData });
    if (!response.ok) throw new Error(`Upload failed: ${response.statusText}`);
    return filename;
}

export async function generateRunpodImage(prompt: string, referenceImages?: string[], config?: Record<string, any>): Promise<{ imageUrl?: string, error?: string }> {
    if (!POD_ID) return { error: "Missing RunPod POD_ID" };

    try {
        let instantIDFilename: string | undefined;
        let ipAdapterFilenames: string[] = [];

        if (referenceImages && referenceImages.length > 0) {
            const firstValid = await uploadImageToPod(referenceImages[0]);
            if (firstValid) {
                instantIDFilename = firstValid;
                for (let i = 1; i < referenceImages.length; i++) {
                    const fn = await uploadImageToPod(referenceImages[i]);
                    if (fn) ipAdapterFilenames.push(fn);
                }
            } else {
                console.warn("[RunPod] primary reference image not found, continuing without Likeness");
            }
        }

        if (config?.locationImage) {
            config.locationImage = await uploadImageToPod(config.locationImage);
        }

        // We ARE CHANGING THE PLAN TO FLUX
        const useFlux = true; // Always use Flux now
        const workflow = useFlux
            ? prepareFluxImageWorkflow(prompt, instantIDFilename, config)
            : prepareImageWorkflow(prompt, instantIDFilename, ipAdapterFilenames, config);

        const response = await fetch(`${getPodUrl()}/prompt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: workflow })
        });

        if (!response.ok) return { error: `ComfyUI Error: ${response.status}` };
        const { prompt_id } = await response.json();

        let attempts = 0;
        while (attempts < 60) {
            await new Promise(r => setTimeout(r, 2000));
            const histRes = await fetch(`${getPodUrl()}/history/${prompt_id}`);
            const history = await histRes.json();

            if (history[prompt_id]) {
                const outputs = history[prompt_id].outputs;
                const saveNode = outputs["17"] || outputs["8"] || outputs["21"] || Object.values(outputs)[0];
                if (saveNode && (saveNode as any).images?.[0]) {
                    const img = (saveNode as any).images[0];
                    return { imageUrl: `${getPodUrl()}/view?filename=${img.filename}&type=${img.type}` };
                }
                return { error: "No image in ComfyUI output" };
            }
            attempts++;
        }

        return { error: "Generation timed out on Pod" };
    } catch (e: any) {
        console.error("[RunPod] Image Error:", e);
        return { error: e.message };
    }
}

export async function generateRunpodVideo(prompt: string, frames: number, startImage?: string, config?: Record<string, any>): Promise<RunpodResult> {
    if (!POD_ID) return { success: false, error: "Missing RunPod POD_ID" };

    try {
        let startImageFilename: string | null | undefined;
        if (startImage) startImageFilename = await uploadImageToPod(startImage);

        if (startImage && !startImageFilename) {
            console.warn("[RunPod] Video start image not found, continuing without it");
        }

        const workflow = prepareWorkflow(prompt, frames, startImageFilename, config);

        const response = await fetch(`${getPodUrl()}/prompt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: workflow })
        });

        if (!response.ok) return { success: false, error: `ComfyUI Error: ${response.status}` };
        const { prompt_id } = await response.json();
        return { success: true, videoUrl: prompt_id };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export function subscribeToVideoRequest(jobId: string, onUpdate: (result: RunpodResult & { status: string, progress?: number }) => void) {
    const poll = async () => {
        try {
            const response = await fetch(`${getPodUrl()}/history/${jobId}`);
            if (!response.ok) throw new Error("History fetch failed");
            const history = await response.json();

            if (history[jobId]) {
                const outputs = history[jobId].outputs;
                const saveNode = outputs["50"] || Object.values(outputs).find((n: any) => n.gifs || n.images);
                let videoFilename = "";

                if (saveNode?.gifs?.[0]?.filename) videoFilename = saveNode.gifs[0].filename;
                else if (saveNode?.images?.[0]?.filename) videoFilename = saveNode.images[0].filename;

                if (videoFilename) {
                    onUpdate({ success: true, status: 'completed', videoUrl: `${getPodUrl()}/view?filename=${videoFilename}&type=output` });
                    return;
                }
            }

            onUpdate({ success: true, status: 'processing' });
            setTimeout(poll, 5000);
        } catch (e) {
            onUpdate({ success: false, status: 'failed', error: (e as Error).message });
        }
    };
    poll();
}
