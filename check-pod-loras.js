const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const POD_ID = process.env.RUNPOD_POD_ID;
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

async function findFiles() {
    const workflow = {
        "1": {
            "inputs": {
                "command": "find /workspace -name \"*.safetensors\" -o -name \"*.onnx\" -o -name \"*.pth\" | grep -E \"pulid|ipadapter|clip|face\""
            },
            "class_type": "ExecuteShell"
        }
    };
    // Wait, I need to know if there is an ExecuteShell node. I'll check my find-nodes-complex.js output.
    // I didn't see one. I'll check the full JSON.
}

// Alternative: check XlabsSampler input to see if it lists something? No.
// I'll check if there are any LoRAs that might be Clara.
// I already checked and found Xlabs-AI_flux-RealismLora.safetensors.

async function checkLoras() {
    try {
        const res = await fetch(`${BASE_URL}/object_info`);
        const data = await res.json();
        if (data.LoraLoader) {
            console.log("Standard Loras:", data.LoraLoader.input.required.lora_name[0]);
        }
        if (data.FluxLoraLoader) {
            console.log("Flux Loras:", data.FluxLoraLoader.input.required.lora_name[0]);
        }
    } catch (e) {
        console.error(e.message);
    }
}

checkLoras();
