const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const POD_ID = process.env.RUNPOD_POD_ID || 'g4oysjh535la54';
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

async function checkFluxPro() {
    try {
        const res = await fetch(`${BASE_URL}/object_info`);
        const data = await res.json();

        const info = {};
        if (data.FluxProUltraImageNode) info.FluxProUltraImageNode = data.FluxProUltraImageNode;
        if (data.FluxKontextProImageNode) info.FluxKontextProImageNode = data.FluxKontextProImageNode;
        if (data.FluxKontextMaxImageNode) info.FluxKontextMaxImageNode = data.FluxKontextMaxImageNode;

        fs.writeFileSync('flux_pro_node_info.json', JSON.stringify(info, null, 2));
        console.log("Flux Pro node info saved");
    } catch (err) {
        console.error("Error:", err.message);
    }
}

checkFluxPro();
