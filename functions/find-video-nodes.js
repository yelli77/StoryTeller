
const fetch = require('node-fetch');

const podId = 'iaw3m6iyadpmgq';
const baseUrl = `https://${podId}-8188.proxy.runpod.net`;

async function findVideoNodes() {
    try {
        const response = await fetch(`${baseUrl}/object_info`, { method: 'GET' });
        const data = await response.json();
        const results = [];
        for (const [name, info] of Object.entries(data)) {
            if (name.toLowerCase().includes('save') || name.toLowerCase().includes('combine') || name.toLowerCase().includes('video')) {
                results.push({ name, display: info.display_name });
            }
        }
        console.log('VIDEO_NODES_START');
        console.log(JSON.stringify(results, null, 2));
        console.log('VIDEO_NODES_END');
    } catch (e) {
        console.error(e.message);
    }
}

findVideoNodes();
