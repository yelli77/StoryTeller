const https = require('https');

const POD_ID = 'g4oysjh535la54';
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

console.log("Checking API at: " + BASE_URL);

https.get(`${BASE_URL}/object_info`, (res) => {
    console.log("Status:", res.statusCode);
    res.on('data', d => process.stdout.write(d));
}).on('error', console.error);
