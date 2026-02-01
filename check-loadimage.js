const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const POD_ID = process.env.RUNPOD_POD_ID || 'g4oysjh535la54';
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

async function getLoadImageInfo() {
    try {
        const res = await fetch(`${BASE_URL}/object_info`);
        const data = await res.json();

        fs.writeFileSync('loadimage_info.json', JSON.stringify(data.LoadImage.input, null, 2));
        console.log("LoadImage info saved");
    } catch (err) {
        console.error("Error:", err.message);
    }
}

getLoadImageInfo();
