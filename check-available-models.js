const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const POD_ID = process.env.RUNPOD_POD_ID || '9f4cwila6ehy9g';
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

async function checkModelFiles() {
    try {
        // We can't use fs directly on the pod, but we can try to "load" them or check logs.
        // Actually, let's use a trick: ComfyUI has a /view endpoint, but it's for outputs.
        // Let's try to query the "models" folder if possible via a custom node info?
        // No, let's just use the 'object_info' to see if they are actually available as options.

        const res = await fetch(`${BASE_URL}/object_info`);
        const data = await res.json();

        const ckpts = data.CheckpointLoaderSimple.input.required.ckpt_name[0];
        console.log("Checkpoints:", ckpts);

        const clips = data.CLIPVisionLoader.input.required.clip_name[0];
        console.log("CLIP Vision Models:", clips);

        const ipas = data.IPAdapterModelLoader.input.required.ipadapter_file[0];
        console.log("IPAdapter Models:", ipas);

    } catch (err) {
        console.error("Error:", err.message);
    }
}

checkModelFiles();
