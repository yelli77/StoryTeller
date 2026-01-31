
const fetch = require('node-fetch');

const podId = 'iaw3m6iyadpmgq';
const baseUrl = `https://${podId}-8188.proxy.runpod.net`;

async function checkCreateVideo() {
    try {
        const response = await fetch(`${baseUrl}/object_info`, { method: 'GET' });
        const data = await response.json();
        console.log('CREATE_VIDEO_DUMP_START');
        console.log(JSON.stringify(data['CreateVideo'], null, 2));
        console.log('CREATE_VIDEO_DUMP_END');
    } catch (e) {
        console.error(e.message);
    }
}

checkCreateVideo();
