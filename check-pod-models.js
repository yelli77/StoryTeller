const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const POD_ID = process.env.RUNPOD_POD_ID || 'g4oysjh535la54';
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

async function getCheckpoints() {
    try {
        const res = await fetch(`${BASE_URL}/object_info`);
        const data = await res.json();

        // Find CheckpointLoaderSimple input options
        const loader = data['CheckpointLoaderSimple'];
        if (loader && loader.input && loader.input.required && loader.input.required.ckpt_name) {
            const list = loader.input.required.ckpt_name[0];
            fs.writeFileSync('pod_checkpoints.txt', list.join('\n'));
            console.log("Checkpoints saved to pod_checkpoints.txt");
        }

        // Also check for IPAdapter models if available
        const ipLoader = data['IPAdapterModelLoader'];
        if (ipLoader && ipLoader.input && ipLoader.input.required && ipLoader.input.required.ipadapter_file) {
            const list = ipLoader.input.required.ipadapter_file[0];
            fs.writeFileSync('pod_ipadapters.txt', list.join('\n'));
            console.log("IPAdapters saved to pod_ipadapters.txt");
        }

    } catch (err) {
        console.error("Error:", err.message);
    }
}

getCheckpoints();
