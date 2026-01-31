
const fetch = require('node-fetch');

const podId = 'iaw3m6iyadpmgq';
const baseUrl = `https://${podId}-8188.proxy.runpod.net`;

async function dumpNodeInfo() {
    try {
        const response = await fetch(`${baseUrl}/object_info`, { method: 'GET' });
        const data = await response.json();

        console.log('NODE_DUMP_START');

        ['WanImageToVideo', 'HunyuanVideo15ImageToVideo', 'WanImageToVideoApi'].forEach(nodeName => {
            if (data[nodeName]) {
                console.log(`--- ${nodeName} ---`);
                console.log(JSON.stringify(data[nodeName].input, null, 2));
            } else {
                console.log(`${nodeName} not found`);
            }
        });

        console.log('NODE_DUMP_END');
    } catch (e) {
        console.error(e.message);
    }
}

dumpNodeInfo();
