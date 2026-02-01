require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');
const apiKey = process.env.RUNPOD_API_KEY;
const podId = process.env.RUNPOD_POD_ID;

async function getLogs() {
    try {
        const response = await fetch(`https://api.runpod.io/graphql?api_key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: `query { pod(input: {podId: "${podId}"}) { logs } }`
            })
        });
        const data = await response.json();
        console.log('LOG_DEBUG:');
        if (data.data && data.data.pod) {
            console.log(data.data.pod.logs || 'No logs available');
        } else {
            console.log('Error or missing data:', JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error(e);
    }
}

getLogs();
