const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const POD_ID = process.env.RUNPOD_POD_ID || 'g4oysjh535la54';
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

async function checkFluxIP() {
    try {
        const res = await fetch(`${BASE_URL}/object_info`);
        const data = await res.json();

        if (data.IPAdapterFluxModelLoader) {
            const list = data.IPAdapterFluxModelLoader.input.required.ipadapter_file[0];
            fs.writeFileSync('pod_flux_ipadapters.txt', list.join('\n'));
            console.log("Flux IPAdapters saved to pod_flux_ipadapters.txt");
        }

    } catch (err) {
        console.error("Error:", err.message);
    }
}

checkFluxIP();
