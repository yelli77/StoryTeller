require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

const POD_ID = process.env.RUNPOD_POD_ID || 'g4oysjh535la54';
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

// Clara's base description for consistent dataset
const CLARA_BASE = "young woman, long brown hair, gray tank top, athletic build, friendly smile";

// 30 diverse prompts for training dataset
const TRAINING_PROMPTS = [
    // Frontal views - different expressions
    `${CLARA_BASE}, looking at camera, neutral expression, professional portrait`,
    `${CLARA_BASE}, looking at camera, smiling warmly, soft lighting`,
    `${CLARA_BASE}, looking at camera, slight smile, natural daylight`,
    `${CLARA_BASE}, looking at camera, happy expression, bright studio lighting`,
    `${CLARA_BASE}, looking at camera, confident expression, professional headshot`,

    // 3/4 views
    `${CLARA_BASE}, three quarter view, looking slightly left, soft lighting`,
    `${CLARA_BASE}, three quarter view, looking slightly right, natural light`,
    `${CLARA_BASE}, three quarter view, smiling, professional portrait`,
    `${CLARA_BASE}, three quarter view, neutral expression, studio lighting`,
    `${CLARA_BASE}, three quarter view, looking at camera, soft focus`,

    // Profile views
    `${CLARA_BASE}, profile view, looking left, natural lighting, professional portrait`,
    `${CLARA_BASE}, profile view, looking right, soft lighting, clean background`,

    // Different poses - upper body
    `${CLARA_BASE}, upper body shot, arms crossed, confident pose`,
    `${CLARA_BASE}, upper body shot, hands clasped, professional portrait`,
    `${CLARA_BASE}, upper body shot, relaxed pose, natural lighting`,
    `${CLARA_BASE}, shoulders and head, looking at camera, soft lighting`,

    // Different poses - full body
    `${CLARA_BASE}, full body shot, standing straight, neutral background`,
    `${CLARA_BASE}, full body shot, standing casually, natural pose`,
    `${CLARA_BASE}, full body shot, hands on hips, confident stance`,

    // Sitting poses
    `${CLARA_BASE}, sitting on chair, hands on lap, professional portrait`,
    `${CLARA_BASE}, sitting casually, relaxed pose, natural lighting`,
    `${CLARA_BASE}, sitting on stool, looking at camera, studio lighting`,

    // Different lighting conditions
    `${CLARA_BASE}, soft diffused lighting, professional portrait`,
    `${CLARA_BASE}, natural window light, indoor setting`,
    `${CLARA_BASE}, golden hour lighting, warm tones, outdoor portrait`,
    `${CLARA_BASE}, studio lighting, clean background, professional headshot`,

    // Close-ups
    `${CLARA_BASE}, close-up portrait, looking at camera, soft focus background`,
    `${CLARA_BASE}, close-up face, neutral expression, professional lighting`,
    `${CLARA_BASE}, close-up headshot, slight smile, studio lighting`,
    `${CLARA_BASE}, medium close-up, looking at camera, natural lighting`
];

async function generateTrainingImage(prompt, index) {
    console.log(`\n[${index + 1}/${TRAINING_PROMPTS.length}] Generating: ${prompt.substring(0, 70)}...`);

    const workflow = {
        "1": {
            "inputs": { "ckpt_name": "RealVisXL_V4.0_Lightning.safetensors" },
            "class_type": "CheckpointLoaderSimple"
        },
        "2": {
            "inputs": {
                "text": `professional photograph, 8k uhd, highly detailed, sharp focus, ${prompt}`,
                "clip": ["1", 1]
            },
            "class_type": "CLIPTextEncode"
        },
        "3": {
            "inputs": {
                "text": "anime, cartoon, illustration, painting, drawing, low quality, blurry, deformed, disfigured, multiple people, text, watermark, signature",
                "clip": ["1", 1]
            },
            "class_type": "CLIPTextEncode"
        },
        "4": {
            "inputs": { "width": 1024, "height": 1024, "batch_size": 1 },
            "class_type": "EmptyLatentImage"
        },
        "9": {
            "inputs": {
                "seed": 42 + index,  // Consistent but varied seeds
                "steps": 25,
                "cfg": 3.5,  // Higher CFG for consistent character
                "sampler_name": "dpmpp_2m",
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
                "filename_prefix": `Clara_LoRA_Training_${String(index + 1).padStart(3, '0')}`,
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
            for (let i = 0; i < 60; i++) {
                await new Promise(r => setTimeout(r, 2000));

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
                        const errors = status.messages.filter(m => m[0] === 'execution_error');
                        console.log(`   ❌ Failed: ${errors[0][1].exception_message}`);
                        return { success: false, error: errors[0][1].exception_message };
                    }
                }
            }

            console.log(`   ⏱️ Timeout`);
            return { success: false, error: 'timeout' };

        } else {
            console.log(`   ❌ Validation Error:`, data.error?.message || 'Unknown');
            return { success: false, error: data.error?.message };
        }

    } catch (error) {
        console.log(`   ❌ Exception: ${error.message}`);
        return { success: false, error: error.message };
    }
}

async function generateDataset() {
    console.log('🎨 CLARA LoRA TRAINING DATASET GENERATOR');
    console.log('=========================================\n');
    console.log(`📊 Generating ${TRAINING_PROMPTS.length} training images...`);
    console.log('⏱️  Estimated time: 20-30 minutes\n');

    const results = [];

    for (let i = 0; i < TRAINING_PROMPTS.length; i++) {
        const result = await generateTrainingImage(TRAINING_PROMPTS[i], i);
        results.push(result);

        // Small delay between requests
        await new Promise(r => setTimeout(r, 1000));
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success);

    console.log('\n\n📊 DATASET GENERATION COMPLETE');
    console.log('================================');
    console.log(`✅ Successful: ${successful}/${TRAINING_PROMPTS.length}`);
    console.log(`❌ Failed: ${failed.length}/${TRAINING_PROMPTS.length}`);

    if (failed.length > 0) {
        console.log('\n❌ Failed images:');
        failed.forEach((f, i) => {
            console.log(`   ${i + 1}. ${f.error || 'Unknown error'}`);
        });
    }

    console.log('\n📁 Images saved to ComfyUI output folder');
    console.log('📥 Next: Download images from RunPod');
    console.log('🎯 Then: Start LoRA training with these images');
}

// Check if SDXL model is ready first
async function checkModel() {
    console.log('🔍 Checking if RealVisXL model is ready...\n');

    const testWorkflow = {
        "1": {
            "inputs": { "ckpt_name": "RealVisXL_V4.0_Lightning.safetensors" },
            "class_type": "CheckpointLoaderSimple"
        }
    };

    try {
        const response = await fetch(`${BASE_URL}/prompt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: testWorkflow })
        });

        const data = await response.json();

        if (data.error) {
            console.log('❌ Model not ready yet. Error:', data.error.message);
            console.log('\n⏳ Please wait for the download to complete, then run this script again.\n');
            return false;
        }

        console.log('✅ RealVisXL model is ready!\n');
        return true;

    } catch (error) {
        console.log('❌ Cannot connect to ComfyUI:', error.message);
        return false;
    }
}

async function main() {
    const isReady = await checkModel();
    if (isReady) {
        await generateDataset();
    }
}

main();
