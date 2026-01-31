
const fetch = require('node-fetch');

const podId = 'iaw3m6iyadpmgq';
const baseUrl = `https://${podId}-8188.proxy.runpod.net`;

async function checkModelSelection() {
    try {
        console.log(`Checking Model Selection at ${baseUrl}...`);

        const response = await fetch(`${baseUrl}/object_info`, {
            method: 'GET'
        });

        if (!response.ok) {
            throw new Error(`ComfyUI not reachable: ${response.status}`);
        }

        const data = await response.json();

        console.log('MODEL_SELECTION_START');

        // Check Wan ImageToVideo loader
        const wanI2V = data['WanImageToVideo'];
        if (wanI2V && wanI2V.input.required.model) {
            console.log('Wan I2V Models:', JSON.stringify(wanI2V.input.required.model[0], null, 2));
        } else {
            console.log('WanImageToVideo node or model input not found.');
        }

        // Check Hunyuan ImageToVideo loader
        const hunyuanI2V = data['HunyuanImageToVideo'];
        if (hunyuanI2V && hunyuanI2V.input.required.model) {
            console.log('Hunyuan I2V Models:', JSON.stringify(hunyuanI2V.input.required.model[0], null, 2));
        } else {
            console.log('HunyuanImageToVideo node or model input not found.');
        }

        // Also check if there's a specific 'model' loader they use
        const diffusionLoader = data['UnetLoader'] || data['DiffusionModelLoader'];
        if (diffusionLoader) {
            console.log('Diffusion Models:', JSON.stringify(diffusionLoader.input.required.unet_name[0] || diffusionLoader.input.required.model_name[0], null, 2));
        }

        console.log('MODEL_SELECTION_END');
    } catch (e) {
        console.error('Error connecting to ComfyUI:', e.message);
    }
}

checkModelSelection();
