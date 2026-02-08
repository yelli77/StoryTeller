const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const POD_ID = process.env.RUNPOD_POD_ID;
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;
const FILE_TO_UPLOAD = 'check-results.sh';

async function deployScript() {
    if (!POD_ID) {
        console.error("❌ POD_ID missing in .env.local");
        return;
    }

    const localPath = path.join(__dirname, FILE_TO_UPLOAD);
    if (!fs.existsSync(localPath)) {
        console.error(`❌ File not found: ${localPath}`);
        return;
    }

    console.log(`📤 Deploying ${FILE_TO_UPLOAD} to Pod ${POD_ID}...`);

    // Read file
    const fileData = fs.readFileSync(localPath);
    const boundary = '----NodeJSBoundary' + Math.random().toString(36).substr(2);

    // Construct Multipart Body
    const pre = Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="${FILE_TO_UPLOAD}"\r\nContent-Type: text/x-shellscript\r\n\r\n`);
    const post = Buffer.from(`\r\n--${boundary}--\r\n`);
    const body = Buffer.concat([pre, fileData, post]);

    try {
        const res = await fetch(`${BASE_URL}/upload/image`, {
            method: 'POST',
            headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
            body: body
        });

        const data = await res.json();

        if (res.ok) {
            console.log("✅ Deployment Successful!");
            console.log("---------------------------------------------------");
            console.log(`File location: /workspace/ComfyUI/input/${data.name}`);
            console.log("To run it, type this in your RunPod terminal:");
            console.log(`cp input/${data.name} . && bash ${data.name}`);
            console.log("---------------------------------------------------");
        } else {
            console.error("❌ Upload failed:", data);
        }
    } catch (e) {
        console.error("❌ Connection Error:", e.message);
    }
}

deployScript();
