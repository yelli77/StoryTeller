
const fetch = require('node-fetch');

const podId = 'iaw3m6iyadpmgq';
const baseUrl = `https://${podId}-8188.proxy.runpod.net`;

async function findLoaders() {
    try {
        const response = await fetch(`${baseUrl}/object_info`, { method: 'GET' });
        const data = await response.json();

        console.log('LOADER_SEARCH_START');

        const loaderNodes = Object.keys(data).filter(n => n.toLowerCase().includes('loader'));
        console.log('Loader Nodes:', loaderNodes);

        loaderNodes.forEach(nodeName => {
            const inputs = data[nodeName].input;
            if (inputs && inputs.required) {
                const modelInput = Object.keys(inputs.required).find(k => k.toLowerCase().includes('name') || k.toLowerCase().includes('model') || k.toLowerCase().includes('ckpt'));
                if (modelInput && Array.isArray(inputs.required[modelInput][0])) {
                    console.log(`--- ${nodeName} [${modelInput}] ---`);
                    console.log(JSON.stringify(inputs.required[modelInput][0], null, 2));
                }
            }
        });

        console.log('LOADER_SEARCH_END');
    } catch (e) {
        console.error(e.message);
    }
}

findLoaders();
