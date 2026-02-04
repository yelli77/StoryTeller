const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const POD_ID = process.env.RUNPOD_POD_ID;
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

async function download() {
    try {
        const res = await fetch(`${BASE_URL}/object_info`);
        const data = await res.json();
        fs.writeFileSync('pod_object_info_clean.json', JSON.stringify(data, null, 2));
        console.log("Clean JSON saved");

        if (data['LoadFluxIPAdapter']) {
            console.log("LoadFluxIPAdapter FOUND:");
            console.log(JSON.stringify(data['LoadFluxIPAdapter'], null, 2));
        } else {
            console.log("LoadFluxIPAdapter NOT FOUND");
        }
    } catch (e) {
        console.error("Error:", e.message);
    }
}

download();
