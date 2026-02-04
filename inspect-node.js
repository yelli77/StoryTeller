const https = require('https');

const POD_ID = '9f4cwila6ehy9g';
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

https.get(`${BASE_URL}/object_info/Lora Training in ComfyUI`, (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
        console.log(data);
    });
});
