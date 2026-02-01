const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const POD_ID = process.env.RUNPOD_POD_ID || 'g4oysjh535la54';
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

async function checkControlNets() {
    try {
        const res = await fetch(`${BASE_URL}/object_info`);
        const data = await res.json();

        if (data.ControlNetLoader) {
            const list = data.ControlNetLoader.input.required.control_net_name[0];
            fs.writeFileSync('pod_controlnets.txt', list.join('\n'));
            console.log("ControlNets saved to pod_controlnets.txt");
        }

    } catch (err) {
        console.error("Error:", err.message);
    }
}

checkControlNets();
