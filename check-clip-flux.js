const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const POD_ID = process.env.RUNPOD_POD_ID;
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

async function checkNode() {
    const res = await fetch(`${BASE_URL}/object_info`);
    const data = await res.json();
    console.log(JSON.stringify(data.CLIPTextEncodeFlux, null, 2));
}

checkNode();
