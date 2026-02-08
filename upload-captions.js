const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const POD_ID = process.env.RUNPOD_POD_ID;
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;
const SOURCE_DIR = path.join(__dirname, 'public', 'characters', 'clara', 'references');

async function uploadFile(filepath) {
    const filename = path.basename(filepath);
    const fileData = fs.readFileSync(filepath);
    const boundary = '----NodeJSBoundary' + Math.random().toString(36).substr(2);

    const pre = Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="${filename}"\r\nContent-Type: text/plain\r\n\r\n`);
    const post = Buffer.from(`\r\n--${boundary}--\r\n`);
    const body = Buffer.concat([pre, fileData, post]);

    try {
        const res = await fetch(`${BASE_URL}/upload/image`, {
            method: 'POST',
            headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
            body: body
        });

        if (res.ok) {
            console.log(`✅ Uploaded: ${filename}`);
            return true;
        } else {
            console.error(`❌ Failed: ${filename} (${res.status})`);
            return false;
        }
    } catch (e) {
        console.error(`❌ Error ${filename}: ${e.message}`);
        return false;
    }
}

async function startTransfer() {
    if (!POD_ID) {
        console.error("❌ POD_ID missing in .env.local");
        return;
    }

    // FILTER FOR .TXT FILES
    const files = fs.readdirSync(SOURCE_DIR).filter(f => f.match(/\.txt$/i));
    console.log(`🚀 Starting Transfer of ${files.length} CAPTIONS to Pod ${POD_ID}...`);

    let successCount = 0;
    for (const file of files) {
        const success = await uploadFile(path.join(SOURCE_DIR, file));
        if (success) successCount++;
        await new Promise(r => setTimeout(r, 100)); // Fast interval 
    }

    console.log("---------------------------------------------------");
    console.log(`🎉 Transfer Complete! ${successCount}/${files.length} captions uploaded.`);
}

startTransfer();
