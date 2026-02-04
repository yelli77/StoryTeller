require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

const POD_ID = process.env.RUNPOD_POD_ID || '9f4cwila6ehy9g';
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

// Clara's base description
const CLARA_BASE = "young woman, long brown hair, gray tank top, athletic build, friendly smile";

// 30 different prompts for variety
const PROMPTS = [
    // Frontal views
    `${CLARA_BASE}, looking at camera, neutral expression, studio lighting`,
    `${CLARA_BASE}, looking at camera, smiling, soft lighting`,
    `${CLARA_BASE}, looking at camera, serious expression, dramatic lighting`,
    `${CLARA_BASE}, looking at camera, slight smile, natural daylight`,
    `${CLARA_BASE}, looking at camera, happy expression, bright lighting`,

    // 3/4 views
    `${CLARA_BASE}, three quarter view, looking slightly left, soft lighting`,
    `${CLARA_BASE}, three quarter view, looking slightly right, natural light`,
    `${CLARA_BASE}, three quarter view, smiling, studio lighting`,
    `${CLARA_BASE}, three quarter view, neutral expression, dramatic lighting`,
    `${CLARA_BASE}, three quarter view, looking down slightly, soft lighting`,

    // Profile views
    `${CLARA_BASE}, profile view, looking left, natural lighting`,
    `${CLARA_BASE}, profile view, looking right, soft lighting`,
    `${CLARA_BASE}, profile view, smiling, studio lighting`,

    // Different poses - standing
    `${CLARA_BASE}, standing, arms at sides, neutral background`,
    `${CLARA_BASE}, standing, arms crossed, confident pose`,
    `${CLARA_BASE}, standing, hands on hips, natural lighting`,
    `${CLARA_BASE}, standing, relaxed pose, soft lighting`,

    // Different poses - sitting
    `${CLARA_BASE}, sitting on chair, hands on lap, neutral expression`,
    `${CLARA_BASE}, sitting on chair, leaning forward slightly, friendly smile`,
    `${CLARA_BASE}, sitting casually, relaxed pose, natural lighting`,

    // Upper body shots
    `${CLARA_BASE}, upper body shot, looking at camera, soft lighting`,
    `${CLARA_BASE}, upper body shot, slight smile, natural daylight`,
    `${CLARA_BASE}, upper body shot, neutral expression, studio lighting`,
    `${CLARA_BASE}, shoulders and head, looking at camera, soft lighting`,

    // Different lighting
    `${CLARA_BASE}, rim lighting, dramatic mood, looking at camera`,
    `${CLARA_BASE}, golden hour lighting, warm tones, slight smile`,
    `${CLARA_BASE}, overcast lighting, soft shadows, neutral expression`,
    `${CLARA_BASE}, indoor lighting, natural window light, looking at camera`,

    // Additional variety
    `${CLARA_BASE}, close-up portrait, looking at camera, soft focus background`,
    `${CLARA_BASE}, medium shot, standing, neutral background, natural pose`
];

async function generateImage(prompt, index) {
    console.log(`\n[${index + 1}/30] Generating: ${prompt.substring(0, 60)}...`);

    const workflow = {
        "1": {
            "inputs": { "ckpt_name": "RealVisXL_V4.0_Lightning.safetensors" },
            "class_type": "CheckpointLoaderSimple"
        },
        "2": {
            "inputs": {
                "text": `professional photograph, 8k, highly detailed, ${prompt}`,
                "clip": ["1", 1]
            },
            "class_type": "CLIPTextEncode"
        },
        "3": {
            "inputs": {
                "text": "anime, cartoon, low quality, blurry, deformed, multiple people, text, watermark",
                "clip": ["1", 1]
            },
            "class_type": "CLIPTextEncode"
        },
        "4": {
            "inputs": { "width": 832, "height": 1216, "batch_size": 1 },
            "class_type": "EmptyLatentImage"
        },
        "9": {
            "inputs": {
                "seed": Math.floor(Math.random() * 1000000),
                "steps": 20,
                "cfg": 2.0,
                "sampler_name": "dpmpp_sde",
                "scheduler": "karras",
                "denoise": 1.0,
                "model": ["1", 0],
                "positive": ["2", 0],
                "negative": ["3", 0],
                "latent_image": ["4", 0]
            },
            "class_type": "KSampler"
        },
        "20": {
            "inputs": { "samples": ["9", 0], "vae": ["1", 2] },
            "class_type": "VAEDecode"
        },
        "21": {
            "inputs": {
                "filename_prefix": `Clara_Dataset_${String(index + 1).padStart(3, '0')}`,
                "images": ["20", 0]
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
            for (let i = 0; i < 40; i++) {
                await new Promise(r => setTimeout(r, 3000));

                const histRes = await fetch(`${BASE_URL}/history/${data.prompt_id}`);
                const hist = await histRes.json();

                if (hist[data.prompt_id]) {
                    const status = hist[data.prompt_id].status;

                    if (status.completed) {
                        const outputs = hist[data.prompt_id].outputs;
                        if (outputs["21"] && outputs["21"].images) {
                            const filename = outputs["21"].images[0].filename;
                            console.log(`   ✅ Generated: ${filename}`);
                            return { success: true, filename };
                        }
                    }

                    if (status.messages && status.messages.some(m => m[0] === 'execution_error')) {
                        console.log(`   ❌ Failed`);
                        return { success: false };
                    }
                }
            }

            console.log(`   ⏱️ Timeout`);
            return { success: false };

        } else {
            console.log(`   ❌ Validation Error`);
            return { success: false };
        }

    } catch (error) {
        console.log(`   ❌ Exception: ${error.message}`);
        return { success: false };
    }
}

async function generateDataset() {
    console.log('🎨 Generating Clara Dataset (30 images)...\n');
    console.log('This will take approximately 15-20 minutes.\n');

    const results = [];

    for (let i = 0; i < PROMPTS.length; i++) {
        const result = await generateImage(PROMPTS[i], i);
        results.push(result);

        // Small delay between requests
        await new Promise(r => setTimeout(r, 2000));
    }

    const successful = results.filter(r => r.success).length;

    console.log('\n\n📊 DATASET GENERATION COMPLETE');
    console.log('================================');
    console.log(`✅ Successful: ${successful}/30`);
    console.log(`❌ Failed: ${30 - successful}/30`);
    console.log('\n📁 Images saved to ComfyUI output folder');
    console.log('\n🎯 Next step: Download images and start LoRA training');
}

generateDataset();
