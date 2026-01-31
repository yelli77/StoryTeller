
const fetch = require('node-fetch');

const podId = 'iaw3m6iyadpmgq';
const baseUrl = `https://${podId}-8188.proxy.runpod.net`;

async function searchKeywords() {
    try {
        const response = await fetch(`${baseUrl}/object_info`, { method: 'GET' });
        const data = await response.json();

        console.log('KEYWORD_SEARCH_START');

        const nodes = Object.keys(data);
        const keywords = ['blackwell', '5090', 'b200', 'wan', 'hunyuan', 'diffusion'];

        const matches = nodes.filter(n => keywords.some(k => n.toLowerCase().includes(k)));
        console.log('Matched Nodes:', matches);

        console.log('KEYWORD_SEARCH_END');
    } catch (e) {
        console.error(e.message);
    }
}

searchKeywords();
