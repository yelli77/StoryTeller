require('dotenv').config({ path: '.env.local' });

const POD_ID = process.env.RUNPOD_POD_ID || 'g4oysjh535la54';
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

async function testInstantID() {
    console.log('🧪 Testing full InstantID + IP-Adapter workflow...\n');

    // Simple test image (1x1 red pixel as base64)
    const testImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';

    const workflow = {
        "1": {
            "inputs": { "ckpt_name": "RealVisXL_V4.0_Lightning.safetensors" },
            "class_type": "CheckpointLoaderSimple"
        },
        "2": {
            "inputs": { "text": "woman, professional photograph", "clip": ["1", 1] },
            "class_type": "CLIPTextEncode"
        },
        "3": {
            "inputs": { "text": "low quality", "clip": ["1", 1] },
            "class_type": "CLIPTextEncode"
        },
        "4": {
            "inputs": { "width": 832, "height": 1216, "batch_size": 1 },
            "class_type": "EmptyLatentImage"
        },
        "5": {
            "inputs": { "clip_name": "clip_vision_sdxl.safetensors" },
            "class_type": "CLIPVisionLoader"
        },
        "6": {
            "inputs": { "image": testImage },
            "class_type": "LoadImage"
        },
        "7": {
            "inputs": { "instantid_file": "instantid-xl-v1.0.bin" },
            "class_type": "InstantIDModelLoader"
        },
        "8": {
            "inputs": { "provider": "CPU" },
            "class_type": "InstantIDFaceAnalysis"
        },
        "10": {
            "inputs": { "control_net_name": "instantid-controlnet-sdxl.safetensors" },
            "class_type": "ControlNetLoader"
        },
        "9": {
            "inputs": {
                "instantid": ["7", 0],
                "insightface": ["8", 0],
                "control_net": ["10", 0],
                "image": ["6", 0],
                "model": ["1", 0],
                "positive": ["2", 0],
                "negative": ["3", 0],
                "weight": 0.8,
                "start_at": 0.0,
                "end_at": 0.8
            },
            "class_type": "ApplyInstantID"
        },
        "13": {
            "inputs": {
                "seed": 42,
                "steps": 15,
                "cfg": 1.5,
                "sampler_name": "dpmpp_sde",
                "scheduler": "karras",
                "denoise": 1.0,
                "model": ["9", 0],
                "positive": ["9", 1],
                "negative": ["9", 2],
                "latent_image": ["4", 0]
            },
            "class_type": "KSampler"
        },
        "20": {
            "inputs": { "samples": ["13", 0], "vae": ["1", 2] },
            "class_type": "VAEDecode"
        },
        "21": {
            "inputs": { "filename_prefix": "TEST_InstantID", "images": ["20", 0] },
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
            console.log(`✅ InstantID workflow queued: ${data.prompt_id}`);
            console.log('\n⏳ Waiting for completion...');

            // Wait and check
            await new Promise(r => setTimeout(r, 5000));

            for (let i = 0; i < 20; i++) {
                const histRes = await fetch(`${BASE_URL}/history/${data.prompt_id}`);
                const hist = await histRes.json();

                if (hist[data.prompt_id]) {
                    const status = hist[data.prompt_id].status;

                    if (status.completed) {
                        console.log('\n✅ SUCCESS! InstantID is working!');
                        console.log('\n🎉 You can now use the Manual Studio with Emily!');
                        return;
                    }

                    if (status.messages && status.messages.some(m => m[0] === 'execution_error')) {
                        console.log('\n❌ FAILED during execution');
                        const errors = status.messages.filter(m => m[0] === 'execution_error');
                        console.log('Error:', JSON.stringify(errors[0][1], null, 2));
                        return;
                    }
                }

                process.stdout.write('.');
                await new Promise(r => setTimeout(r, 3000));
            }

            console.log('\n⏱️ Timeout');

        } else {
            console.log('❌ Validation Error:');
            console.log(JSON.stringify(data, null, 2));
        }

    } catch (error) {
        console.log('❌ Exception:', error.message);
    }
}

testInstantID();
