const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const POD_ID = process.env.RUNPOD_POD_ID || 'g4oysjh535la54';
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

async function checkNodes() {
    try {
        const res = await fetch(`${BASE_URL}/object_info`);
        const data = await res.json();

        const fluxNodes = Object.keys(data).filter(k => k.toLowerCase().includes('flux'));
        console.log("Flux related nodes:", fluxNodes);

        if (data.UNETLoader) {
            console.log("UNETs:", data.UNETLoader.input.required.unet_name[0]);
        }

        if (data.DualCLIPLoader) {
            console.log("DualCLIP1:", data.DualCLIPLoader.input.required.clip_name1[0]);
        }

        if (data.IPAdapterLoader) {
            console.log("IPAdapter models:", data.IPAdapterLoader.input.required.ipadapter_file[0]);
        }

    } catch (err) {
        console.error("Error:", err.message);
    }
}

checkNodes();
