const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const POD_ID = process.env.RUNPOD_POD_ID || 'g4oysjh535la54';
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

async function getClipVision() {
    try {
        const res = await fetch(`${BASE_URL}/object_info`);
        const data = await res.json();

        const loader = data['CLIPVisionLoader'];
        if (loader && loader.input && loader.input.required && loader.input.required.clip_name) {
            const list = loader.input.required.clip_name[0];
            fs.writeFileSync('pod_clipvision.txt', list.join('\n'));
            console.log("CLIPVision models saved to pod_clipvision.txt");
        }

    } catch (err) {
        console.error("Error:", err.message);
    }
}

getClipVision();
