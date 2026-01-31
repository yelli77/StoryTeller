
const fetch = require('node-fetch');
const apiKey = 'rpa_QBFOXWXK7H1XAG7CCKXXTSYO5BH8EDIHW3A7TLOLeaxlz8';
const podId = '8t1hif70q426k9';

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
