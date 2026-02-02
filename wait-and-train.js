const https = require('https');
require('dotenv').config({ path: '.env.local' });

const POD_ID = process.env.RUNPOD_POD_ID;
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;
const API_KEY = process.env.RUNPOD_API_KEY;

// Data paths
const DATA_ROOT = "/workspace/runpod-slim/ComfyUI/input/lora_training";
const CHARS = ['Clara', 'Emily', 'Mia'];

function getWorkflow(charName) {
    const lowerName = charName.toLowerCase();
    return {
        "1": {
            "inputs": {
                "ckpt_name": "RealVisXL_V4.0_Lightning.safetensors",
                "data_path": `${DATA_ROOT}/${lowerName}`,
                "batch_size": 1,
                "max_train_epoches": 20,
                "save_every_n_epochs": 5,
                "output_name": `${lowerName}_v1`,
                "clip_skip": 2,
                "output_dir": "models/loras",
                "seed": Math.floor(Math.random() * 1000000000)
            },
            "class_type": "Lora Training in ComfyUI"
        }
    };
}

function triggerTraining(charName) {
    console.log(`🚀 STARTING TRAINING FOR: ${charName}`);
    const workflow = getWorkflow(charName);

    return new Promise((resolve) => {
        const req = https.request(`${BASE_URL}/prompt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': API_KEY }
        }, (res) => {
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => {
                try {
                    const j = JSON.parse(d);
                    if (j.error) console.error("❌ ERROR: " + JSON.stringify(j.error));
                    else console.log("✅ JOB QUEUED! ID: " + j.prompt_id);
                } catch (e) { console.error(e); }
                resolve();
            });
        });
        req.write(JSON.stringify({ prompt: workflow }));
        req.end();
    });
}

async function checkAndTrain() {
    process.stdout.write("⏳ Waiting for ComfyUI to start...");

    const check = () => new Promise(resolve => {
        https.get(`${BASE_URL}/object_info`, (res) => {
            if (res.statusCode === 200) resolve(true);
            else resolve(false);
        }).on('error', () => resolve(false));
    });

    while (true) {
        const isUp = await check();
        if (isUp) {
            console.log("\n✅ ComfyUI is ONLINE! Starting training sequence...");
            break;
        }
        process.stdout.write(".");
        await new Promise(r => setTimeout(r, 2000));
    }

    // Trigger all
    for (const char of CHARS) {
        await triggerTraining(char);
        await new Promise(r => setTimeout(r, 1000));
    }
    console.log("\n🎉 ALL JOBS SUBMITTED. Watch your terminal!");
}

checkAndTrain();
