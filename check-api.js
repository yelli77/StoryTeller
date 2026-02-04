const https = require('https');
require('dotenv').config({ path: '.env.local' });
const POD_ID = process.env.RUNPOD_POD_ID;
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

console.log("Checking API at: " + BASE_URL);

https.get(`${BASE_URL}/object_info`, (res) => {
    console.log("Status:", res.statusCode);
    res.on('data', d => process.stdout.write(d));
}).on('error', console.error);
