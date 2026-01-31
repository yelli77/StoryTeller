
const fetch = require('node-fetch');

const podId = 'iaw3m6iyadpmgq';
const baseUrl = `https://${podId}-8188.proxy.runpod.net`;

async function dumpSelectorInfo() {
    try {
        const response = await fetch(`${baseUrl}/object_info`, { method: 'GET' });
        const data = await response.json();

        console.log('SELECTOR_DUMP_START');

        const nodeName = 'DiffusionModelSelector';
        if (data[nodeName]) {
            console.log(`--- ${nodeName} ---`);
            console.log(JSON.stringify(data[nodeName].input, null, 2));
        } else {
            console.log(`${nodeName} not found`);
        }

        console.log('SELECTOR_DUMP_END');
    } catch (e) {
        console.error(e.message);
    }
}

dumpSelectorInfo();
