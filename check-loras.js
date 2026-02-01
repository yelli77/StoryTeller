const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const POD_ID = process.env.RUNPOD_POD_ID || 'g4oysjh535la54';
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

async function getLoras() {
    try {
        const res = await fetch(`${BASE_URL}/object_info`);
        const data = await res.json();

        if (data.LoraLoader) {
            const list = data.LoraLoader.input.required.lora_name[0];
            fs.writeFileSync('pod_loras.txt', list.join('\n'));
            console.log("Loras saved to pod_loras.txt");
        }
    } catch (err) {
        console.error("Error:", err.message);
    }
}

getLoras();
