const fs = require('fs');
const path = require('path');
const https = require('https');

require('dotenv').config({ path: '.env.local' });

const POD_ID = process.env.RUNPOD_POD_ID;
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

const CHARACTERS = ['Clara', 'Emily', 'Mia'];
const VARIANTS = ['Bodysuit', 'Naked'];
const PREFIX = '4K_PRO';

async function fileExists(filename) {
    return new Promise((resolve) => {
        const url = `${BASE_URL}/view?filename=${filename}&type=output`;
        https.get(url, (res) => {
            resolve(res.statusCode === 200);
        }).on('error', () => resolve(false));
    });
}

async function downloadFile(filename, localPath) {
    const url = `${BASE_URL}/view?filename=${filename}&type=output`;
    const dir = path.dirname(localPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(localPath);
        https.get(url, (res) => {
            if (res.statusCode !== 200) {
                reject(new Error(`Status ${res.statusCode}`));
                return;
            }
            res.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(localPath, () => { });
            reject(err);
        });
    });
}

async function run() {
    console.log("🚀 STARTING SMART DATASET DOWNLOAD");

    for (const char of CHARACTERS) {
        console.log(`\n--- Searching for ${char} images ---`);
        let foundForChar = 0;

        for (const variant of VARIANTS) {
            let foundInVariant = 0;
            // Scan indices from 1 to 100 to find the actual files
            for (let i = 1; i <= 100 && foundInVariant < 10; i++) {
                const filename = `${char}_${variant}_${PREFIX}_${i.toString().padStart(5, '0')}_.png`;
                const exists = await fileExists(filename);

                if (exists) {
                    foundInVariant++;
                    foundForChar++;
                    const localName = `ref_4k_${variant.toLowerCase()}_${foundInVariant}.png`;
                    const localPath = path.join(__dirname, 'public', 'characters', char.toLowerCase(), 'ref', localName);

                    try {
                        console.log(`   Found ${filename} -> Downloading as ${localName}...`);
                        await downloadFile(filename, localPath);
                    } catch (e) {
                        console.log(`   ❌ Error downloading ${filename}: ${e.message}`);
                    }
                }
            }
            console.log(`   Found ${foundInVariant} images for ${char} (${variant})`);
        }
    }
    console.log("\n✅ ALL DOWNLOADS FINISHED");
}

run();
