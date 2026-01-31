
const fetch = require('node-fetch');

const podId = 'iaw3m6iyadpmgq';
const baseUrl = `https://${podId}-8188.proxy.runpod.net`;

async function findVideoOutputs() {
    try {
        const response = await fetch(`${baseUrl}/object_info`, { method: 'GET' });
        const data = await response.json();
        const results = [];
        for (const [name, info] of Object.entries(data)) {
            if (info.output && info.output.includes('VIDEO')) {
                results.push({ name, display: info.display_name, output: info.output });
            }
        }
        console.log('VIDEO_OUTPUTS_START');
        console.log(JSON.stringify(results, null, 2));
        console.log('VIDEO_OUTPUTS_END');
    } catch (e) {
        console.error(e.message);
    }
}

findVideoOutputs();
