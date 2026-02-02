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

function prepareWorkflow(prompt: string, frames: number, startImageFilename?: string, config?: Record<string, any>) {
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

function prepareImageWorkflow(prompt: string, instantIDImage?: string, ipAdapterImages?: string[], config?: Record<string, any>) {
    const seed = config?.manualSeed ?? Math.floor(Math.random() * 1000000);
    const weight = config?.instantidWeight ?? 0.8;
    const ipWeight = config?.ipWeight ?? 0.75;

    const globalBodyMaster = "(chubby:1.6), (soft body:1.4), (extremely large breasts:1.8), (massive bust:1.8), (huge hanging breasts:1.5), (wide hips:1.6), (thick thighs:1.7), (hourglass figure:1.7), (voluptuous:1.6), (obese:0.3), ";
    const bodyInjection = config?.characterTraits ? `[Character Physique: (${config.characterTraits}:1.9)], ` : "";

    const isExplicit = prompt.toLowerCase().includes("naked") || prompt.toLowerCase().includes("fuck") || prompt.toLowerCase().includes("cock") || prompt.toLowerCase().includes("cum");
    const stylePrefix = isExplicit ? "(highly explicit:1.5), (uncensored:1.5), (naked:1.4), (nude:1.4), " : "";

    const actionPrompt = `${stylePrefix}((${prompt}:1.8)), ${globalBodyMaster}${bodyInjection}(photograph:1.5), (highly detailed:1.3), (authentic character likeness:1.4), (accurate facial features:1.4), masterpiece, 8k, dslr, (muted colors:1.1)`;

    const globalNeg = "(noise:1.5), (grainy:1.5), (dithering:1.5), (compression artifacts:1.2), (skinny:2.0), (thin:2.0), (slender:2.0), (slim:1.8), (flat chest:2.0), (small breasts:2.0), (petite:1.5), (anorexic:1.5), (fitness model:1.4), (fit:1.3), (trash:1.5), (cluttered:1.5), (debris:1.5), (blur:1.5), (soft focus:1.5), (faded:1.3), ";
    const styleBlock = ", raw photo, 8k uhd, cinematic lighting, masterpiece, (razor sharp:1.4), (hyper-detailed skin textures:1.4), (skin pores:1.2), (micro-detail:1.3), (ultra-realistic skin texture:1.3), (natural light:1.2), (sharp focus on eyes:1.4), subsurface scattering, highly detailed iris, f/1.8, 35mm";

    const posPrompt = config?.positivePrompt
        ? `${actionPrompt}, ${config.positivePrompt}, (detailed clothing:1.2)${styleBlock}`
        : `${actionPrompt}${styleBlock}`;

    const negPrompt = globalNeg + (config?.negativePrompt ?? "(worst quality, low quality:1.4), (bad anatomy:1.2), (deformed:1.2), blurry, artifacts, text, watermark, different person, wrong face, illustration, drawing, painting, cartoon, anime");

    const workflow: any = {
        "1": { "inputs": { "ckpt_name": "RealVisXL_V4.0_Lightning.safetensors" }, "class_type": "CheckpointLoaderSimple" },
        "2": { "inputs": { "text": posPrompt, "clip": ["1", 1] }, "class_type": "CLIPTextEncode" },
        "3": { "inputs": { "text": negPrompt, "clip": ["1", 1] }, "class_type": "CLIPTextEncode" },
        "4": { "inputs": { "width": 832, "height": 1216, "batch_size": 1 }, "class_type": "EmptyLatentImage" },
        "5": { "inputs": { "clip_name": "clip_vision_sdxl.safetensors" }, "class_type": "CLIPVisionLoader" },
        // STAGE 2 ACTION ISOLATOR: Forced Perspective & Movement
        "30": { "inputs": { "text": `((${prompt}:2.0)), (leaning forward into camera lens:1.6), (huge breasts in foreground:1.5), extreme perspective, close-up, foreshortening, depth of field`, "clip": ["1", 1] }, "class_type": "CLIPTextEncode" },
        "31": { "inputs": { "text": "(standing upright:1.8), (straight posture:1.6), (centered:1.4), skinny, slim, thin", "clip": ["1", 1] }, "class_type": "CLIPTextEncode" }
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
                "weight": weight, "start_at": 0.0, "end_at": 1.0
            },
            "class_type": "ApplyInstantID"
        };
    } else { workflow["9"] = { "inputs": {}, "class_type": "Identity" }; }

    let ipAdapterInputNode: any = null;
    if (ipAdapterImages && ipAdapterImages.length > 0) {
        let lastBatchNodeId = -1;
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
        ipAdapterInputNode = [`${lastBatchNodeId}`, 0];
    } else if (instantIDImage) { ipAdapterInputNode = ["6", 0]; }

    let locationInputNode: any = null;
    if (config?.locationImage) {
        workflow["50"] = { "inputs": { "image": config.locationImage }, "class_type": "LoadImage" };
        locationInputNode = ["50", 0];
    }

    workflow["11"] = { "inputs": { "ipadapter_file": "ip-adapter-plus-face_sdxl_vit-h.safetensors" }, "class_type": "IPAdapterModelLoader" };
    const modelInput = instantIDImage ? ["9", 0] : ["1", 0];
    let samplerModelInput = modelInput;

    if (ipAdapterInputNode) {
        workflow["12"] = {
            "inputs": {
                "model": samplerModelInput, "ipadapter": ["11", 0], "clip_vision": ["5", 0], "image": ipAdapterInputNode,
                "weight": ipWeight, "weight_type": "linear", "combine_embeds": "concat", "embeds_scaling": "V only", "start_at": 0.0, "end_at": 0.9
            },
            "class_type": "IPAdapterAdvanced"
        };
        samplerModelInput = ["12", 0];
    }

    if (locationInputNode) {
        workflow["60"] = {
            "inputs": {
                "model": samplerModelInput, "ipadapter": ["11", 0], "clip_vision": ["5", 0], "image": locationInputNode,
                "weight": config?.locationWeight ?? 0.65, "weight_type": "strong style transfer", "combine_embeds": "concat", "embeds_scaling": "V only", "start_at": 0.0, "end_at": 0.8
            },
            "class_type": "IPAdapterAdvanced"
        };
        samplerModelInput = ["60", 0];
    }

    // --- STAGE 1: ANATOMY & LIKENESS (Construction) ---
    workflow["13"] = {
        "inputs": {
            "seed": seed, "steps": 8, "cfg": 1.5, "sampler_name": "dpmpp_sde", "scheduler": "karras", "denoise": 1.0,
            "model": samplerModelInput, "positive": instantIDImage ? ["9", 1] : ["2", 0], "negative": instantIDImage ? ["9", 2] : ["3", 0], "latent_image": ["4", 0]
        },
        "class_type": "KSampler"
    };

    // --- STAGE 2: ACTION REFINEMENT (Pure Action Override) ---
    workflow["14"] = {
        "inputs": {
            "seed": seed, "steps": 15, "cfg": 5.0, "sampler_name": "euler_ancestral", "scheduler": "karras", "denoise": 0.78,
            "model": samplerModelInput, "positive": ["30", 0], "negative": ["31", 0], "latent_image": ["13", 0]
        },
        "class_type": "KSampler"
    };

    // --- STAGE 3: DETAILING (4K Upscale & Texture) ---
    workflow["16"] = { "inputs": { "upscale_method": "bicubic", "scale_by": 2.0, "samples": ["14", 0] }, "class_type": "LatentUpscaleBy" };
    workflow["15"] = {
        "inputs": {
            "seed": seed, "steps": 12, "cfg": 1.5, "sampler_name": "dpmpp_2m_sde_gpu", "scheduler": "karras", "denoise": 0.45,
            "model": samplerModelInput, "positive": instantIDImage ? ["9", 1] : ["2", 0], "negative": instantIDImage ? ["9", 2] : ["3", 0], "latent_image": ["16", 0]
        },
        "class_type": "KSampler"
    };

    // --- STAGE 4: POLISHING (Noise Removal & Finish) ---
    workflow["18"] = {
        "inputs": {
            "seed": seed, "steps": 10, "cfg": 1.2, "sampler_name": "euler_ancestral", "scheduler": "karras", "denoise": 0.18,
            "model": samplerModelInput, "positive": instantIDImage ? ["9", 1] : ["2", 0], "negative": instantIDImage ? ["9", 2] : ["3", 0], "latent_image": ["15", 0]
        },
        "class_type": "KSampler"
    };

    workflow["20"] = { "inputs": { "samples": ["18", 0], "vae": ["1", 2] }, "class_type": "VAEDecode" };
    workflow["21"] = { "inputs": { "filename_prefix": "StoryTeller_Elite", "images": ["20", 0] }, "class_type": "SaveImage" };

    return workflow;
}

async function uploadImageToPod(imageSource: string): Promise<string> {
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
        } else { throw new Error(`Local file not found: ${fullPath}`); }
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
            instantIDFilename = await uploadImageToPod(referenceImages[0]);
            for (let i = 1; i < referenceImages.length; i++) {
                const fn = await uploadImageToPod(referenceImages[i]);
                ipAdapterFilenames.push(fn);
            }
        }

        if (config?.locationImage) {
            config.locationImage = await uploadImageToPod(config.locationImage);
        }

        const workflow = prepareImageWorkflow(prompt, instantIDFilename, ipAdapterFilenames, config);

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
                const saveNode = outputs["21"] || Object.values(outputs)[0];
                if (saveNode && saveNode.images?.[0]) {
                    const img = saveNode.images[0];
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
        let startImageFilename: string | undefined;
        if (startImage) startImageFilename = await uploadImageToPod(startImage);

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
