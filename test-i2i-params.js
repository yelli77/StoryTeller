const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const POD_ID = process.env.RUNPOD_POD_ID || 'g4oysjh535la54';
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

// Test configurations
const configs = [
    { name: "Config1_v2_denoise70", guidance: "v2 (replace)", denoise: 0.70, cfg: 1.0, steps: 30 },
    { name: "Config2_v2_denoise80", guidance: "v2 (replace)", denoise: 0.80, cfg: 1.5, steps: 30 },
    { name: "Config3_v1_denoise70", guidance: "v1 (concat)", denoise: 0.70, cfg: 2.0, steps: 30 },
    { name: "Config4_v1_denoise75", guidance: "v1 (concat)", denoise: 0.75, cfg: 2.5, steps: 30 },
];

async function testConfig(config) {
    console.log(`\n🧪 Testing: ${config.name}`);
    console.log(`   guidance: ${config.guidance}, denoise: ${config.denoise}, cfg: ${config.cfg}`);

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
                "text": "sitting on a chair, professional photograph, 8k, highly detailed",
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
                "text": "low quality, blurry, distorted, watermark, text, deformed, different person, wrong face",
                "clip": ["4", 0]
            },
            "class_type": "CLIPTextEncode"
        },
        "11": {
            "inputs": {
                "image": "clara_reference.png"  // Assuming this exists on the pod
            },
            "class_type": "LoadImage"
        },
        "12": {
            "inputs": {
                "positive": ["3", 0],
                "vae": ["2", 0],
                "width": 720,
                "height": 1280,
                "length": 1,
                "batch_size": 1,
                "guidance_type": config.guidance,
                "start_image": ["11", 0]
            },
            "class_type": "HunyuanImageToVideo"
        },
        "6": {
            "inputs": {
                "seed": Math.floor(Math.random() * 1000000),
                "steps": config.steps,
                "cfg": config.cfg,
                "sampler_name": "euler",
                "scheduler": "simple",
                "denoise": config.denoise,
                "model": ["1", 0],
                "positive": ["12", 0],
                "negative": ["7", 0],
                "latent_image": ["12", 1]
            },
            "class_type": "KSampler"
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
                "filename_prefix": `Test_${config.name}`
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

        const data = await response.json();

        if (data.prompt_id) {
            console.log(`   ✅ Queued: ${data.prompt_id}`);

            // Wait for completion
            await new Promise(r => setTimeout(r, 3000));

            for (let i = 0; i < 20; i++) {
                const histRes = await fetch(`${BASE_URL}/history/${data.prompt_id}`);
                const hist = await histRes.json();

                if (hist[data.prompt_id]) {
                    const status = hist[data.prompt_id].status;
                    if (status.completed) {
                        console.log(`   ✅ COMPLETED`);
                        const outputs = hist[data.prompt_id].outputs;
                        if (outputs["9"] && outputs["9"].images) {
                            const filename = outputs["9"].images[0].filename;
                            console.log(`   📸 Image: ${filename}`);
                        }
                        return { success: true, config };
                    }
                    if (status.messages && status.messages.some(m => m[0] === 'execution_error')) {
                        console.log(`   ❌ FAILED`);
                        return { success: false, config };
                    }
                }

                await new Promise(r => setTimeout(r, 3000));
            }

            console.log(`   ⏱️ TIMEOUT`);
            return { success: false, config };
        } else {
            console.log(`   ❌ Validation Error:`, data.error?.message || 'Unknown');
            return { success: false, config };
        }
    } catch (error) {
        console.log(`   ❌ Exception:`, error.message);
        return { success: false, config };
    }
}

async function runTests() {
    console.log("🚀 Starting automated parameter testing...\n");

    const results = [];

    for (const config of configs) {
        const result = await testConfig(config);
        results.push(result);
        await new Promise(r => setTimeout(r, 2000)); // Pause between tests
    }

    console.log("\n\n📊 RESULTS SUMMARY:");
    console.log("==================");
    results.forEach(r => {
        console.log(`${r.success ? '✅' : '❌'} ${r.config.name}`);
    });

    console.log("\n✨ Check the ComfyUI output folder for generated images.");
    console.log("   Compare them to find the best balance between identity and pose.");
}

runTests();
