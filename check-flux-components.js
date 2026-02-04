const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const POD_ID = process.env.RUNPOD_POD_ID || '9f4cwila6ehy9g';
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

async function checkUnet() {
    try {
        const res = await fetch(`${BASE_URL}/object_info`);
        const data = await res.json();

        if (data.UNETLoader) {
            const list = data.UNETLoader.input.required.unet_name[0];
            fs.writeFileSync('pod_unets.txt', list.join('\n'));
            console.log("UNETs saved to pod_unets.txt");
        }

        if (data.DualCLIPLoader) {
            const clip1 = data.DualCLIPLoader.input.required.clip_name1[0];
            const clip2 = data.DualCLIPLoader.input.required.clip_name2[0];
            fs.writeFileSync('pod_clips.txt', `CLIP1:\n${clip1.join('\n')}\n\nCLIP2:\n${clip2.join('\n')}`);
            console.log("CLIPS saved to pod_clips.txt");
        }

        if (data.GGUFLoaderKJ) {
            const list = data.GGUFLoaderKJ.input.required.unet_name[0];
            fs.writeFileSync('pod_ggufs.txt', list.join('\n'));
            console.log("GGUFs saved to pod_ggufs.txt");
        }

    } catch (err) {
        console.error("Error:", err.message);
    }
}

checkUnet();
