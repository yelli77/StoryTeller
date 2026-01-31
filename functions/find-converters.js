
const fetch = require('node-fetch');

const podId = 'iaw3m6iyadpmgq';
const baseUrl = `https://${podId}-8188.proxy.runpod.net`;

async function findConverter() {
    try {
        const response = await fetch(`${baseUrl}/object_info`, { method: 'GET' });
        const data = await response.json();
        const results = [];
        for (const [name, info] of Object.entries(data)) {
            const hasImageInput = info.input && (info.input.required.images || info.input.required.image || (info.input.optional && (info.input.optional.images || info.input.optional.image)));
            const hasVideoOutput = info.output && info.output.includes('VIDEO');
            if (hasImageInput && hasVideoOutput) {
                results.push({ name, display: info.display_name, input: Object.keys(info.input.required) });
            }
        }
        console.log('CONVERTERS_START');
        console.log(JSON.stringify(results, null, 2));
        console.log('CONVERTERS_END');
    } catch (e) {
        console.error(e.message);
    }
}

findConverter();
