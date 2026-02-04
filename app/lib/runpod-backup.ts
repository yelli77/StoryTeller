
const POD_ID = process.env.NEXT_PUBLIC_RUNPOD_POD_ID || process.env.RUNPOD_POD_ID || '9f4cwila6ehy9g';
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
 * Helper to prepare an Image generation workflow (using SDXL + IPAdapter for character consistency)
 */
function prepareImageWorkflow(prompt: string, referenceImageBase64?: string, config?: any) {
    const seed = config?.manualSeed ?? Math.floor(Math.random() * 1000000);

    // Intelligent prompt enhancement for I2I
    let enhancedPrompt = prompt;
    let negativePrompt = "low quality, blurry, distorted, watermark, text, deformed";

    if (referenceImageBase64) {
        // For I2I: Emphasize the action/pose while maintaining identity
        enhancedPrompt = `The same person from the reference image, ${prompt}. IMPORTANT: Keep the exact same face, same person, same identity. Professional photograph, 8k, highly detailed.`;
        negativePrompt = "different person, different face, wrong identity, face change, multiple people, low quality, blurry, distorted, watermark, text, deformed";
    } else {
        // For T2I: Standard enhancement
        enhancedPrompt = `${prompt}. Professional photograph, 8k, highly detailed, cinematic lighting.`;
    }

    // Using HunyuanVideo in single-frame mode for image generation
    // This gives us I2I capability via the HunyuanImageToVideo node
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
                "text": enhancedPrompt,
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
        "7": {
            "inputs": {
                "text": negativePrompt,
                "clip": ["4", 0]
            },
            "class_type": "CLIPTextEncode"
        }
    };

    // If we have a reference image, use Image-to-Video with 1 frame for I2I
    if (referenceImageBase64) {
        workflow["11"] = {
            "inputs": {
                "image": referenceImageBase64
            },
            "class_type": "LoadImage"
        };
        workflow["12"] = {
            "inputs": {
                "positive": ["3", 0],
                "vae": ["2", 0],
                "width": 720,
                "height": 1280,
                "length": 1,  // Single frame for image generation
                "batch_size": 1,
                "guidance_type": "v2 (replace)",  // v2 for better identity preservation
                "start_image": ["11", 0]
            },
            "class_type": "HunyuanImageToVideo"
        };
        workflow["6"] = {
            "inputs": {
                "seed": seed,
                "steps": 35,  // More steps for better quality
                "cfg": 1.5,  // Moderate CFG for balanced prompt adherence
                "sampler_name": "euler",
                "scheduler": "simple",
                "denoise": 0.75,  // Sweet spot: preserves identity while allowing pose changes
                "model": ["1", 0],
                "positive": ["12", 0],
                "negative": ["7", 0],
                "latent_image": ["12", 1]
            },
            "class_type": "KSampler"
        };
    } else {
        // Text-to-Image mode
        workflow["5"] = {
            "inputs": {
                "width": 720,
                "height": 1280,
                "length": 1,
                "batch_size": 1
            },
            "class_type": "EmptyHunyuanLatentVideo"
        };
        workflow["6"] = {
            "inputs": {
                "seed": seed,
                "steps": 20,
                "cfg": 1.0,
                "sampler_name": "euler",
                "scheduler": "simple",
                "denoise": 1.0,
                "model": ["1", 0],
                "positive": ["3", 0],
                "negative": ["7", 0],
                "latent_image": ["5", 0]
            },
            "class_type": "KSampler"
        };
    }

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
            "filename_prefix": "StoryTeller_Hunyuan"
        },
        "class_type": "SaveImage"
    };

    return workflow;
}

/**
 * Helper to upload a Base64 image to the Pod
 */
async function uploadImageToPod(base64Image: string): Promise<string> {
    // Convert base64 to blob
    const base64Data = base64Image.split(',')[1];
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });

    // Upload to ComfyUI
    const formData = new FormData();
    const filename = `reference_${Date.now()}.png`;
    formData.append('image', blob, filename);
    formData.append('subfolder', 'references');
    formData.append('type', 'input');

    const response = await fetch(`${BASE_URL}/upload/image`, {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        throw new Error(`Failed to upload image: ${response.status}`);
    }

    const data = await response.json();
    console.log('[RunPod] Image uploaded:', data);
    // Return the path in the format LoadImage expects: "subfolder/filename"
    return data.subfolder ? `${data.subfolder}/${data.name}` : data.name;
}

/**
 * Compatibility Function for Frontend (page.tsx)
 * Starts a request and returns a requestId (ComfyUI Prompt ID)
 */
/**
 * Compatibility Function for Frontend (page.tsx)
 * Starts a request and returns a requestId (ComfyUI Prompt ID)
 */
export async function createVideoRequest(params: { prompt: string, duration: number, startImage?: string }) {
    const promptText = params.prompt || "Cinematic video";
    console.log(`[RunPod] Attempting to connect to: ${BASE_URL}`);
    console.log(`[RunPod] Creating async request for: "${promptText.substring(0, 30)}..."`);

    let uploadedFilename: string | undefined;
    if (params.startImage) {
        try {
            uploadedFilename = await uploadImageToPod(params.startImage);
            console.log(`[RunPod] Start image uploaded as: ${uploadedFilename}`);
        } catch (e) {
            console.error("[RunPod] Failed to upload start image, falling back to T2V:", e);
        }
    }

    const requestedDuration = params.duration || 2;
    const duration = Math.min(requestedDuration, 3); // Cap at 3s for speed parity
    const frames = duration * 24;
    console.log(`[RunPod] Duration: ${duration}s (${frames} frames)`);
    const workflow = prepareWorkflow(promptText, frames, uploadedFilename);

    try {
        const response = await fetch(`${BASE_URL}/prompt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: workflow })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error(`[RunPod] ComfyUI Error Response: ${response.status}`, errText);
            throw new Error(`ComfyUI Error: ${response.status}`);
        }

        const data = await response.json();
        console.log(`[RunPod] Success! Prompt ID: ${data.prompt_id}`);
        return data.prompt_id;
    } catch (e) {
        console.error(`[RunPod] Connection Failed to ${BASE_URL}:`, e);
        throw e;
    }
}

/**
 * Compatibility Function for Frontend (page.tsx)
 * Polls for status and calls callback
 */
export function subscribeToVideoRequest(requestId: string, onUpdate: (req: RunpodVideoResult) => void) {
    let active = true;

    const poll = async () => {
        if (!active) return;
        try {
            const res = await fetch(`${BASE_URL}/history/${requestId}`);
            if (res.ok) {
                const history = await res.json();
                if (history[requestId]) {
                    const outputs = history[requestId].outputs;
                    if (outputs && outputs["10"] && outputs["10"].images) {
                        const filename = outputs["10"].images[0].filename;
                        const videoUrl = `${BASE_URL}/view?filename=${filename}&type=output`;
                        onUpdate({ success: true, status: 'completed', videoUrl });
                        active = false;
                        return;
                    }
                }
            }
            // Keep polling
            onUpdate({ success: true, status: 'processing' });
            setTimeout(poll, 5000);
        } catch (e) {
            console.error("[RunPod] Poll Error:", e);
            onUpdate({ success: false, status: 'failed', error: (e as Error).message });
            active = false;
        }
    };

    poll();
    return () => { active = false; };
}

/**
 * Synchronous version for API routes
 */
export async function generateRunpodVideo(prompt: string, durationInFrames: number = 49, startImage?: string): Promise<RunpodVideoResult> {
    try {
        const promptId = await createVideoRequest({
            prompt,
            duration: Math.floor(durationInFrames / 24),
            startImage
        });

        return new Promise((resolve) => {
            const unsubscribe = subscribeToVideoRequest(promptId, (res) => {
                if (res.status === 'completed' || res.status === 'failed') {
                    unsubscribe();
                    resolve(res);
                }
            });
        });
    } catch (e) {
        return { success: false, error: (e as Error).message };
    }
}

/**
 * Starts an image request and returns a requestId
 */
export async function createImageRequest(prompt: string, referenceImageBase64?: string, config?: any) {
    let uploadedFilename: string | undefined;

    // Upload reference image if provided
    if (referenceImageBase64) {
        try {
            uploadedFilename = await uploadImageToPod(referenceImageBase64);
        } catch (e) {
            console.error("[RunPod] Failed to upload reference image:", e);
            // Continue without reference image
        }
    }

    const workflow = prepareImageWorkflow(prompt, uploadedFilename, config);
    try {
        const response = await fetch(`${BASE_URL}/prompt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: workflow })
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[RunPod] ComfyUI Image Error ${response.status}:`, errorText);
            throw new Error(`ComfyUI Image Error: ${response.status}`);
        }
        const data = await response.json();
        return data.prompt_id;
    } catch (e) {
        console.error("[RunPod] Image Request Failed:", e);
        throw e;
    }
}

/**
 * Polls for image completion
 */
export function subscribeToImageRequest(requestId: string, onUpdate: (res: { success: boolean, imageUrl?: string, status: string, error?: string }) => void) {
    let active = true;
    const poll = async () => {
        if (!active) return;
        try {
            const res = await fetch(`${BASE_URL}/history/${requestId}`);
            if (res.ok) {
                const history = await res.json();
                if (history[requestId]) {
                    const outputs = history[requestId].outputs;
                    if (outputs && outputs["21"] && outputs["21"].images) {
                        const filename = outputs["21"].images[0].filename;
                        const imageUrl = `${BASE_URL}/view?filename=${filename}&type=output`;
                        onUpdate({ success: true, status: 'completed', imageUrl });
                        active = false;
                        return;
                    }
                }
            }
            onUpdate({ success: true, status: 'processing' });
            setTimeout(poll, 3000);
        } catch (e) {
            onUpdate({ success: false, status: 'failed', error: (e as Error).message });
            active = false;
        }
    };
    poll();
    return () => { active = false; };
}

/**
 * Synchronous version for Image API routes
 */
export async function generateRunpodImage(prompt: string, referenceImageUrl?: string, config?: any): Promise<{ success: boolean, imageUrl?: string, error?: string }> {
    try {
        console.log(`[RunPod] Generating Image with Config:`, JSON.stringify(config || {}, null, 2));
        const promptId = await createImageRequest(prompt, referenceImageUrl, config);
        return new Promise((resolve) => {
            const unsubscribe = subscribeToImageRequest(promptId, (res) => {
                if (res.status === 'completed' || res.status === 'failed') {
                    unsubscribe();
                    resolve({ success: res.success, imageUrl: res.imageUrl, error: res.error });
                }
            });
        });
    } catch (e) {
        return { success: false, error: (e as Error).message };
    }
}
