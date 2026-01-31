
const fetch = require('node-fetch');

const podId = 'iaw3m6iyadpmgq';
const baseUrl = `https://${podId}-8188.proxy.runpod.net`;

async function checkLocalFiles() {
    try {
        console.log('CHECK_LOCAL_FILES_START');
        // We use the Manager's API or a simple system check if possible.
        // Since I don't have a direct "ls" API, I'll check the loader's available models.

        const response = await fetch(`${baseUrl}/object_info`, { method: 'GET' });
        const data = await response.json();

        const loaders = ['DiffusionModelLoaderKJ', 'VAELoaderKJ', 'CLIPLoader', 'DualCLIPLoader'];
        loaders.forEach(l => {
            if (data[l]) {
                console.log(`Node: ${l}`);
                console.log(`Choices:`, data[l].input.required.model_name || data[l].input.required.vae_name || data[l].input.required.clip_name);
            }
        });

        console.log('CHECK_LOCAL_FILES_END');
    } catch (e) {
        console.error('Error:', e.message);
    }
}

checkLocalFiles();
