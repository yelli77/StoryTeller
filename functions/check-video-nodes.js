
const fetch = require('node-fetch');

const podId = 'iaw3m6iyadpmgq';
const baseUrl = `https://${podId}-8188.proxy.runpod.net`;

async function checkNodes() {
    try {
        const response = await fetch(`${baseUrl}/object_info`, { method: 'GET' });
        const data = await response.json();
        const nodesToCheck = ['SaveVideo', 'VideoCombine', 'VHS_VideoCombine'];
        nodesToCheck.forEach(n => {
            console.log(`Node ${n}: ${data[n] ? 'FOUND' : 'NOT FOUND'}`);
            if (data[n]) {
                console.log(JSON.stringify(data[n].input, null, 2));
            }
        });
    } catch (e) {
        console.error(e.message);
    }
}

checkNodes();
