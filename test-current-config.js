require('dotenv').config({ path: '.env.local' });

const POD_ID = process.env.RUNPOD_POD_ID || '9f4cwila6ehy9g';
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

async function testCurrentConfig() {
    console.log("🧪 Testing current I2I configuration...\n");

    const prompt = "sitting on a chair";
    const enhancedPrompt = `The same person from the reference image, ${prompt}. IMPORTANT: Keep the exact same face, same person, same identity. Professional photograph, 8k, highly detailed.`;
    const negativePrompt = "different person, different face, wrong identity, face change, multiple people, low quality, blurry, distorted, watermark, text, deformed";

    console.log("📝 Enhanced Prompt:", enhancedPrompt);
    console.log("🚫 Negative Prompt:", negativePrompt);
    console.log("\n⚙️  Parameters: guidance=v2(replace), denoise=0.75, cfg=1.5, steps=35\n");

    // Note: This test uses T2I mode since we can't easily upload a reference image via script
    // But we're testing the workflow structure
    const workflow = {
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
        "5": {
            "inputs": {
                "width": 720,
                "height": 1280,
                "length": 1,
                "batch_size": 1
            },
            "class_type": "EmptyHunyuanLatentVideo"
        },
        "6": {
            "inputs": {
                "seed": 42069,
                "steps": 35,
                "cfg": 1.5,
                "sampler_name": "euler",
                "scheduler": "simple",
                "denoise": 1.0,
                "model": ["1", 0],
                "positive": ["3", 0],
                "negative": ["7", 0],
                "latent_image": ["5", 0]
            },
            "class_type": "KSampler"
        },
        "7": {
            "inputs": {
                "text": negativePrompt,
                "clip": ["4", 0]
            },
            "class_type": "CLIPTextEncode"
        },
        "8": {
            "inputs": {
                "samples": ["6", 0],
                "vae": ["2", 0]
            },
            "class_type": "VAEDecode"
        },
        "9": {
            "inputs": {
                "images": ["8", 0],
                "filename_prefix": "TEST_CurrentConfig"
            },
            "class_type": "SaveImage"
        }
    };

    try {
        console.log("📤 Sending workflow to ComfyUI...");
        const response = await fetch(`${BASE_URL}/prompt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: workflow })
        });

        const data = await response.json();

        if (data.prompt_id) {
            console.log(`✅ Queued successfully! ID: ${data.prompt_id}`);
            console.log("\n⏳ Waiting for completion...");

            // Poll for completion
            for (let i = 0; i < 30; i++) {
                await new Promise(r => setTimeout(r, 3000));

                const histRes = await fetch(`${BASE_URL}/history/${data.prompt_id}`);
                const hist = await histRes.json();

                if (hist[data.prompt_id]) {
                    const status = hist[data.prompt_id].status;

                    if (status.completed) {
                        console.log("\n✅ GENERATION COMPLETED!");
                        const outputs = hist[data.prompt_id].outputs;
                        if (outputs["9"] && outputs["9"].images) {
                            const filename = outputs["9"].images[0].filename;
                            const imageUrl = `${BASE_URL}/view?filename=${filename}&type=output`;
                            console.log(`\n📸 Image URL: ${imageUrl}`);
                            console.log("\n✨ Open this URL in your browser to see the result.");
                        }
                        return;
                    }

                    if (status.messages && status.messages.some(m => m[0] === 'execution_error')) {
                        console.log("\n❌ GENERATION FAILED");
                        const errors = status.messages.filter(m => m[0] === 'execution_error');
                        console.log("Error:", JSON.stringify(errors[0][1], null, 2));
                        return;
                    }
                }

                process.stdout.write(".");
            }

            console.log("\n⏱️  Timeout - generation is taking longer than expected");

        } else {
            console.log("❌ Validation Error:");
            console.log(JSON.stringify(data, null, 2));
        }

    } catch (error) {
        console.log("❌ Exception:", error.message);
    }
}

testCurrentConfig();
