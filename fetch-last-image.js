const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const POD_ID = process.env.RUNPOD_POD_ID;
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

async function fetchLastImage() {
    console.log("🔍 Fetching last generated image from Pod...");
    try {
        const historyRes = await fetch(`${BASE_URL}/history`);
        const history = await historyRes.json();
        const keys = Object.keys(history);

        if (keys.length === 0) {
            console.log("No history found.");
            return;
        }

        const lastKey = keys[keys.length - 1];
        const lastRun = history[lastKey];

        console.log(`Prompt ID: ${lastKey}`);

        // Find SaveImage output
        let filename = "";
        for (const nodeId in lastRun.outputs) {
            const output = lastRun.outputs[nodeId];
            if (output.images && output.images.length > 0) {
                filename = output.images[0].filename;
                break;
            }
        }

        if (filename) {
            console.log(`📥 Downloading ${filename}...`);
            const imgRes = await fetch(`${BASE_URL}/view?filename=${filename}&type=output`);
            const arrayBuffer = await imgRes.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            fs.writeFileSync(`./public/last_generated_error.png`, buffer);
            console.log(`✅ Saved to ./public/last_generated_error.png`);
        } else {
            console.log("No image output found in last run.");
        }
    } catch (err) {
        console.error("Error:", err.message);
    }
}

fetchLastImage();
