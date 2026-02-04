const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const POD_ID = process.env.RUNPOD_POD_ID;
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

async function checkFluxLoras() {
    try {
        const res = await fetch(`${BASE_URL}/object_info`);
        const data = await res.json();

        if (data.FluxLoraLoader) {
            const list = data.FluxLoraLoader.input.required.lora_name[0];
            fs.writeFileSync('pod_flux_loras.txt', list.join('\n'));
            console.log("Flux Loras saved to pod_flux_loras.txt");
        } else {
            console.log("FluxLoraLoader not found");
        }

    } catch (err) {
        console.error("Error:", err.message);
    }
}

checkFluxLoras();
