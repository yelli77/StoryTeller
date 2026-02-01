const fetch = require('node-fetch');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const POD_ID = process.env.RUNPOD_POD_ID || 'g4oysjh535la54';
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

async function fetchLatest() {
    try {
        console.log("📡 Fetching History...");
        const historyRes = await fetch(`${BASE_URL}/history`);
        const history = await historyRes.json();

        const promptIds = Object.keys(history);
        console.log(`🔍 Found ${promptIds.length} history items.`);

        for (const pid of promptIds) {
            const job = history[pid];
            if (!job.outputs) continue;
            console.log(`Checking Job ${pid}, outputs:`, Object.keys(job.outputs));
            const images = job.outputs["21"] ? job.outputs["21"].images : [];

            for (const img of images) {
                const filename = img.filename;
                console.log(`📥 Downloading ${filename}...`);
                const imgRes = await fetch(`${BASE_URL}/view?filename=${filename}&type=output`);
                const buffer = await imgRes.buffer();
                fs.writeFileSync(`./public/tuning_${filename}`, buffer);
                console.log(`✅ Saved ./public/tuning_${filename}`);
            }
        }
    } catch (e) {
        console.error("❌ Error fetching images:", e.message);
    }
}

fetchLatest();
