const https = require('https');

const POD_ID = 'g4oysjh535la54';
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

async function listNodes() {
    console.log("🔍 Scanning for Training Nodes...");

    https.get(`${BASE_URL}/object_info`, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
            try {
                const json = JSON.parse(data);
                const keys = Object.keys(json);
                const trainNodes = keys.filter(k =>
                    k.toLowerCase().includes('lora') ||
                    k.toLowerCase().includes('train')
                );

                console.log("✅ Available Training Nodes:", trainNodes);

                // Inspect specific node info if found
                if (trainNodes.length > 0) {
                    // console.log(JSON.stringify(json[trainNodes[0]], null, 2));
                }
            } catch (e) { console.error(e.message); }
        });
    });
}

listNodes();
