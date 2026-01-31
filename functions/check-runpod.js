
const fetch = require('node-fetch');
const apiKey = 'rpa_QBFOXWXK7H1XAG7CCKXXTSYO5BH8EDIHW3A7TLOLeaxlz8';
const podId = 'iaw3m6iyadpmgq';

async function checkPod() {
    try {
        const response = await fetch(`https://api.runpod.io/graphql?api_key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: `query { pod(input: {podId: "${podId}"}) { desiredStatus } }`
            })
        });
        const data = await response.json();
        console.log('POD_STATUS_START');
        console.log(JSON.stringify(data, null, 2));
        console.log('POD_STATUS_END');
    } catch (e) {
        console.error(e);
    }
}

checkPod();
