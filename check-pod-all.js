const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const POD_ID = process.env.RUNPOD_POD_ID;
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

async function deepCheck() {
    try {
        const res = await fetch(`${BASE_URL}/object_info`);
        const data = await res.json();

        const report = {};

        const checkNode = (nodeName, paramName, fileName) => {
            if (data[nodeName]) {
                const list = data[nodeName].input.required[paramName][0];
                fs.writeFileSync(fileName, list.join('\n'));
                report[nodeName] = list.length;
            } else {
                report[nodeName] = 'MISSING';
            }
        };

        checkNode('CheckpointLoaderSimple', 'ckpt_name', 'pod_checkpoints.txt');
        checkNode('UNETLoader', 'unet_name', 'pod_unets.txt');
        checkNode('VAELoader', 'vae_name', 'pod_vaes.txt');
        checkNode('LoraLoader', 'lora_name', 'pod_loras.txt');
        checkNode('CLIPVisionLoader', 'clip_name', 'pod_clipvisions.txt');
        checkNode('ControlNetLoader', 'control_net_name', 'pod_controlnets.txt');
        checkNode('IPAdapterModelLoader', 'ipadapter_file', 'pod_ipadapters.txt');

        // Hunyuan specific
        checkNode('DiffusionModelLoaderKJ', 'model_name', 'pod_hunyuan_unets.txt');
        checkNode('VAELoaderKJ', 'vae_name', 'pod_hunyuan_vaes.txt');

        console.log("Report:", report);
        fs.writeFileSync('pod_report.json', JSON.stringify(report, null, 2));

    } catch (err) {
        console.error("Error:", err.message);
    }
}

deepCheck();
