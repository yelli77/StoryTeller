const https = require('https');

const POD_ID = 'g4oysjh535la54';
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

function getStatus() {
    https.get(`${BASE_URL}/queue`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            try {
                const json = JSON.parse(data);
                console.log("--- ComfyUI Status ---");
                console.log(`Pending Requests: ${json.queue_pending.length}`);
                console.log(`Running Requests: ${json.queue_running.length}`);
                if (json.queue_running.length > 0) {
                    console.log("Creating/Training is currently ACTIVE.");
                } else {
                    console.log("Idle (or loading very initially).");
                }
            } catch (e) {
                console.log("Error parsing status: " + e.message);
            }
        });
    }).on('error', (e) => {
        console.error("API Error: " + e.message);
    });
}

getStatus();
