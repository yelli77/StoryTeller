
const fetch = require('node-fetch');

const podId = 'iaw3m6iyadpmgq';
const baseUrl = `https://${podId}-8188.proxy.runpod.net`;

async function dumpDualClip() {
    try {
        const response = await fetch(`${baseUrl}/object_info`, { method: 'GET' });
        const data = await response.json();
        console.log('DUAL_CLIP_DUMP_START');
        console.log(JSON.stringify(data['DualCLIPLoader'], null, 2));
        console.log('DUAL_CLIP_DUMP_END');
    } catch (e) {
        console.error(e.message);
    }
}

dumpDualClip();
