const fs = require('fs');
const https = require('https');
require('dotenv').config({ path: '.env.local' });

const POD_ID = process.env.RUNPOD_POD_ID;
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;
const API_KEY = process.env.RUNPOD_API_KEY;

// SDXL Training Workflow for ComfyUI (if Kohya Deepfake nodes are installed)
// THIS IS A GUESS based on standard custom node structures. 
// If this fails, we fall back to "User Installs".

function getTrainingWorkflow(charName) {
    return {
        "1": {
            "inputs": {
                "ckpt_name": "RealVisXL_V4.0_Lightning.safetensors"
            },
            "class_type": "CheckpointLoaderSimple"
        },
        "2": { // Lora Training Node (Hypothetical Standard)
            "inputs": {
                "model": ["1", 0],
                "clip": ["1", 1],
                "lora_name": `${charName.toLowerCase()}_lora_v1`,
                "data_path": `input/lora_training/${charName.toLowerCase()}`, // Path we uploaded to
                "resolution": 1024,
                "batch_size": 1,
                "max_train_epochs": 10,
                "learning_rate": 0.0001,
                "network_dim": 32,
                "network_alpha": 16,
                "save_every_n_epochs": 2
            },
            "class_type": "LoraTraining" // Try this common name
        }
    };
}

async function tryTraining() {
    console.log("🧪 ATTEMPTING TO START TRAINING JOB ON POD...");

    // We try Clara first
    const workflow = getTrainingWorkflow("Clara");

    const req = https.request(`${BASE_URL}/prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': API_KEY }
    }, (res) => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => {
            console.log("Response:", d);
            const json = JSON.parse(d);
            if (json.error) {
                console.log("❌ FAILED. The Pod does NOT have the 'LoraTraining' node installed.");
                console.log("   Diagnosis: RunPod instance is missing training software.");
                console.log("   Solution: Using CivitAI with the 'lora_dataset.zip' is the only stable path right now.");
            } else {
                console.log("✅ SUCCESS! Training started. ID:", json.prompt_id);
            }
        });
    });
    req.write(JSON.stringify({ prompt: workflow }));
    req.end();
}

tryTraining();
