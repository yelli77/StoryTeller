const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const POD_ID = process.env.RUNPOD_POD_ID || 'g4oysjh535la54';
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

async function checkClips() {
    try {
        const res = await fetch(`${BASE_URL}/object_info`);
        const data = await res.json();

        if (data.CLIPVisionLoader) {
            const list = data.CLIPVisionLoader.input.required.clip_name[0];
            fs.writeFileSync('pod_clipvisions.txt', list.join('\n'));
            console.log("CLIPVisions saved to pod_clipvisions.txt");
        }

    } catch (err) {
        console.error("Error:", err.message);
    }
}

checkClips();
