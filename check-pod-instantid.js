const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const POD_ID = process.env.RUNPOD_POD_ID || '9f4cwila6ehy9g';
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

async function getInstantIDModels() {
    try {
        const res = await fetch(`${BASE_URL}/object_info`);
        const data = await res.json();

        const loader = data['InstantIDModelLoader'];
        if (loader && loader.input && loader.input.required && loader.input.required.instantid_file) {
            const list = loader.input.required.instantid_file[0];
            fs.writeFileSync('pod_instantid.txt', list.join('\n'));
            console.log("InstantID models saved to pod_instantid.txt");
        }

        const cnLoader = data['ControlNetLoader'];
        if (cnLoader && cnLoader.input && cnLoader.input.required && cnLoader.input.required.control_net_name) {
            const list = cnLoader.input.required.control_net_name[0];
            fs.writeFileSync('pod_controlnet.txt', list.join('\n'));
            console.log("ControlNet models saved to pod_controlnet.txt");
        }

    } catch (err) {
        console.error("Error:", err.message);
    }
}

getInstantIDModels();
