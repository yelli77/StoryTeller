const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const POD_ID = process.env.RUNPOD_POD_ID || '9f4cwila6ehy9g';
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

async function getOutputInfo() {
    try {
        const res = await fetch(`${BASE_URL}/object_info`);
        const data = await res.json();

        fs.writeFileSync('node_outputs_v2.json', JSON.stringify({
            IPAdapterModelLoader: data.IPAdapterModelLoader.output,
            CLIPVisionLoader: data.CLIPVisionLoader.output,
            InstantIDModelLoader: data.InstantIDModelLoader.output,
            ControlNetLoader: data.ControlNetLoader.output,
            LoadImage: data.LoadImage.output
        }, null, 2));
        console.log("Output info saved");
    } catch (err) {
        console.error("Error:", err.message);
    }
}

getOutputInfo();
