const https = require('https');
require('dotenv').config({ path: '.env.local' });

const POD_ID = process.env.RUNPOD_POD_ID;
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;
const API_KEY = process.env.RUNPOD_API_KEY;

// Absolute path to the data we uploaded
// We know from the user's 'pwd' that we are in /workspace/runpod-slim/ComfyUI
const DATA_ROOT = "/workspace/runpod-slim/ComfyUI/input/lora_training";

function getWorkflow(charName) {
    const lowerName = charName.toLowerCase();

    // Node: "Lora Training in ComfyUI"
    // Note: This node generates the LoRA and saves it to output_dir. 
    // It doesn't have outputs to connect to other nodes, it is an "output_node".

    return {
        "1": {
            "inputs": {
                "ckpt_name": "RealVisXL_V4.0_Lightning.safetensors",
                // We hope this model is available in the dropdown options we saw in inspection
                // If not, we might need a fallback, but "RealVisXL..." was in the list!

                "data_path": `${DATA_ROOT}/${lowerName}`,
                "batch_size": 1,
                "max_train_epoches": 20, // 20 epochs for good measure given small dataset
                "save_every_n_epochs": 5, // Save checkpoints
                "output_name": `${lowerName}_v1`,
                "clip_skip": 2,
                "output_dir": "models/loras" // Relative to ComfyUI root usually
            },
            "class_type": "Lora Training in ComfyUI"
        }
    };
}

// Sequence: Clara, Emily, Mia
const CHARS = ['Clara', 'Emily', 'Mia'];

async function triggerTraining(charName) {
    console.log(`\n🚀 STARTING TRAINING FOR: ${charName}`);
    const workflow = getWorkflow(charName);

    return new Promise((resolve) => {
        const req = https.request(`${BASE_URL}/prompt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': API_KEY }
        }, (res) => {
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => {
                const j = JSON.parse(d);
                if (j.error) {
                    console.error("❌ ERROR: " + JSON.stringify(j.error));
                    resolve(false);
                } else {
                    console.log("✅ JOB QUEUED! ID: " + j.prompt_id);
                    resolve(true);
                }
            });
        });
        req.write(JSON.stringify({ prompt: workflow }));
        req.end();
    });
}

async function main() {
    console.log("🔥 BATCH TRAINING INITIATED");

    // We trigger all 3. ComfyUI has a queue, so they will run sequentially.
    for (const char of CHARS) {
        await triggerTraining(char);
        // Small delay to ensure queue ordering
        await new Promise(r => setTimeout(r, 1000));
    }

    console.log("\n---------------------------------------------------");
    console.log("All jobs queued. RunPod is now training.");
    console.log("You can monitor the terminal for 'Epoch 1/20' logs.");
    console.log("---------------------------------------------------");
}

main();
