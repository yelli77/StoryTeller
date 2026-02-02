const fs = require('fs');
const path = require('path');
const https = require('https');
require('dotenv').config({ path: '.env.local' });

const POD_ID = process.env.RUNPOD_POD_ID;
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;
const API_KEY = process.env.RUNPOD_API_KEY;

// Path to LOCAL images we generated overnight
const DATA_DIR = path.join(__dirname, 'training_data');

async function uploadFile(localPath, subfolder) {
    const filename = path.basename(localPath);
    const fileData = fs.readFileSync(localPath);
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substr(2);

    // ComfyUI upload endpoint expects multipart form data
    const postDataStart = [
        `--${boundary}`,
        `Content-Disposition: form-data; name="image"; filename="${filename}"`,
        `Content-Type: image/png`, // Assuming PNG
        '',
        ''
    ].join('\r\n');

    // We upload to 'input' folder, organizing by subfolder
    const postDataEnd = [
        '',
        `--${boundary}`,
        `Content-Disposition: form-data; name="subfolder"`,
        '',
        subfolder, // e.g. "lora_training/clara"
        `--${boundary}`,
        `Content-Disposition: form-data; name="type"`,
        '',
        'input',
        `--${boundary}--`
    ].join('\r\n');

    const totalPayloadSize = Buffer.byteLength(postDataStart) + fileData.length + Buffer.byteLength(postDataEnd);

    return new Promise((resolve, reject) => {
        const req = https.request(`${BASE_URL}/upload/image`, {
            method: 'POST',
            headers: {
                'Authorization': API_KEY, // If RunPod proxy requires it in simple header
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': totalPayloadSize
            }
        }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    process.stdout.write('.');
                    resolve();
                } else {
                    console.error(`X ${filename}: ${res.statusCode}`);
                    resolve(); // skip err
                }
            });
        });
        req.on('error', (e) => { console.error(e); resolve(); });
        req.write(postDataStart);
        req.write(fileData);
        req.write(postDataEnd);
        req.end();
    });
}

async function startUpload() {
    console.log("🚀 UPLOADING DATASET TO RUNPOD FOR TRAINING...");

    const chars = ['Clara', 'Emily', 'Mia']; // Folders in training_data

    for (const char of chars) {
        // Local path: training_data/clara_lora/10_clara_character/*.png
        const lcName = char.toLowerCase();
        const searchDir = path.join(DATA_DIR, `${lcName}_lora`, `10_${lcName}_character`);

        if (!fs.existsSync(searchDir)) {
            console.log(`Skipping ${char}, dir not found: ${searchDir}`);
            continue;
        }

        const files = fs.readdirSync(searchDir).filter(f => f.endsWith('.png') || f.endsWith('.txt'));
        console.log(`\n📤 Uploading ${char} (${files.length} files)...`);

        // Upload to: lora_training/clara
        const targetFolder = `lora_training/${lcName}`;

        for (const file of files) {
            await uploadFile(path.join(searchDir, file), targetFolder);
            // Small throttle
            await new Promise(r => setTimeout(r, 200));
        }
    }

    console.log("\n✅ UPLOAD COMPLETE!");
}

startUpload();
