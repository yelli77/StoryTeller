const https = require('https');
require('dotenv').config({ path: '.env.local' });

const POD_ID = process.env.RUNPOD_POD_ID || '9f4cwila6ehy9g';
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

function getHistory() {
    console.log(`Checking history on ${BASE_URL}...`);
    https.get(`${BASE_URL}/history`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            try {
                const json = JSON.parse(data);
                const keys = Object.keys(json);
                console.log(`Found ${keys.length} history entries.`);

                if (keys.length > 0) {
                    // Check the last 3 entries for errors
                    const recentKeys = keys.slice(-3);

                    recentKeys.forEach(key => {
                        const run = json[key];
                        console.log(`\n--- Run ID: ${key} ---`);
                        console.log("Status:", JSON.stringify(run.status, null, 2));

                        if (run.status.status_str === 'error') {
                            console.log("❌ ERROR DETAILS:");
                            console.log(JSON.stringify(run.status.messages, null, 2));
                        }
                    });
                }
            } catch (e) {
                console.log("Error parsing history: " + e.message);
            }
        });
    }).on('error', (e) => {
        console.error("API Error: " + e.message);
    });
}

getHistory();
