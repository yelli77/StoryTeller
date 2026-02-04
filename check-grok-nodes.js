const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const POD_ID = process.env.RUNPOD_POD_ID || '9f4cwila6ehy9g';
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

async function getGrokInfo() {
    try {
        const res = await fetch(`${BASE_URL}/object_info`);
        const data = await res.json();

        const info = {};
        if (data.GrokImageNode) info.GrokImageNode = data.GrokImageNode;
        if (data.GrokImageEditNode) info.GrokImageEditNode = data.GrokImageEditNode;
        if (data.GeminiImageNode) info.GeminiImageNode = data.GeminiImageNode;

        fs.writeFileSync('grok_node_info.json', JSON.stringify(info, null, 2));
        console.log("Grok node info saved");
        console.log("GrokImageNode exists:", !!data.GrokImageNode);
    } catch (err) {
        console.error("Error:", err.message);
    }
}

getGrokInfo();
