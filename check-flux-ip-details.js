const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const POD_ID = process.env.RUNPOD_POD_ID;
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

async function checkFluxIPDetails() {
    try {
        const res = await fetch(`${BASE_URL}/object_info/LoadFluxIPAdapter`);
        const data = await res.json();

        console.log("LoadFluxIPAdapter Info:", JSON.stringify(data, null, 2));

        const res2 = await fetch(`${BASE_URL}/object_info/ApplyFluxIPAdapter`);
        const data2 = await res2.json();
        console.log("ApplyFluxIPAdapter Info:", JSON.stringify(data2, null, 2));

        // Check file list for ipadapter_file
        if (data.LoadFluxIPAdapter && data.LoadFluxIPAdapter.input.required.ipadapter_file) {
            const files = data.LoadFluxIPAdapter.input.required.ipadapter_file[0];
            console.log("Available Flux IPAdapter Files:", files);
        }

    } catch (err) {
        console.error("Error:", err.message);
    }
}

checkFluxIPDetails();
