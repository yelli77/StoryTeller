const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const POD_ID = process.env.RUNPOD_POD_ID;
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

async function listModels() {
    try {
        const res = await fetch(`${BASE_URL}/object_info`);
        const data = await res.json();

        const info = {};

        if (data.LoadFluxIPAdapter) {
            info.ip_adapters = data.LoadFluxIPAdapter.input.required.ipadatper[0];
            info.clip_visions = data.LoadFluxIPAdapter.input.required.clip_vision[0];
        } else {
            console.log("LoadFluxIPAdapter not found");
        }

        console.log("IP Adapters:", info.ip_adapters);
        console.log("CLIP Visions:", info.clip_visions);

        fs.writeFileSync('pod_flux_ip_models.json', JSON.stringify(info, null, 2));

    } catch (err) {
        console.error("Error:", err.message);
    }
}

listModels();
