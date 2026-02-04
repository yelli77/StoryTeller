const https = require('https');

const POD_ID = '9f4cwila6ehy9g';
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

function getHistory() {
    https.get(`${BASE_URL}/history`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            try {
                const json = JSON.parse(data);
                const keys = Object.keys(json);
                console.log(`Found ${keys.length} history entries.`);
                if (keys.length > 0) {
                    const lastKey = keys[keys.length - 1]; // items are usually keyed by prompt_id
                    const lastRun = json[lastKey];
                    console.log("Last run status:", JSON.stringify(lastRun.status, null, 2));
                    // Check if there are outputs or errors
                    if (lastRun.status.status_str === 'error') {
                        console.log("❌ ERROR FOUND IN LAST RUN:");
                        console.log(JSON.stringify(lastRun.status.messages, null, 2));
                        console.log("Error details:", JSON.stringify(lastRun.status.completed, null, 2));
                    } else {
                        console.log("Last run seems successful or unknown.");
                    }
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
