require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');
const apiKey = process.env.RUNPOD_API_KEY;
const podId = process.env.RUNPOD_POD_ID;

async function stopPod() {
    try {
        const response = await fetch(`https://api.runpod.io/graphql?api_key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: `mutation { podStop(input: {podId: "${podId}"}) { id desiredStatus } }`
            })
        });
        const data = await response.json();
        console.log('STOP_RESULT:');
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
}

stopPod();
