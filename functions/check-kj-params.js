
const fetch = require('node-fetch');

const podId = 'iaw3m6iyadpmgq';
const baseUrl = `https://${podId}-8188.proxy.runpod.net`;

async function checkKJNodes() {
    try {
        const response = await fetch(`${baseUrl}/object_info`, { method: 'GET' });
        const data = await response.json();
        console.log('KJ_NODES_DUMP_START');
        console.log('--- DiffusionModelLoaderKJ ---');
        console.log(JSON.stringify(data['DiffusionModelLoaderKJ'].input.required, null, 2));
        console.log('--- VAELoaderKJ ---');
        console.log(JSON.stringify(data['VAELoaderKJ'].input.required, null, 2));
        console.log('KJ_NODES_DUMP_END');
    } catch (e) {
        console.error(e.message);
    }
}

checkKJNodes();
