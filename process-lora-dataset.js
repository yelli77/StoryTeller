const fs = require('fs');
const path = require('path');
const https = require('https');

const POD_ID = 'g4oysjh535la54';
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;
const OUTPUT_DIR = path.join(__dirname, 'training_data');

const CHARACTERS = [
    {
        name: "Clara",
        trigger: "clara_character",
        base_desc: "young woman, brown hair, glasses, gray tank top, voluptuous hourglass figure, large bust, flat stomach, wide hips, soft curves"
    },
    {
        name: "Emily",
        trigger: "emily_character",
        base_desc: "young woman, dark hair, pink sleeveless top, very large heavy breasts, slender fit body, athletic build, round toned glutes"
    },
    {
        name: "Mia",
        trigger: "mia_character",
        base_desc: "young woman, dark hair, pink v-neck top, dramatic expression, slender build"
    }
];

// Number of images per character we expect (matching generate-all-datasets.js)
// script has 15 prompts
const IMAGE_COUNT = 15;

async function downloadFile(url, destPath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(destPath);
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                fs.unlink(destPath, () => { }); // Delete empty file
                reject(new Error(`Status ${response.statusCode}`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close(() => resolve(destPath));
            });
        }).on('error', (err) => {
            fs.unlink(destPath, () => { });
            reject(err);
        });
    });
}

async function processCharacter(char) {
    console.log(`\n📦 Processing Dataset for: ${char.name}`);

    // Create Dirs
    const charDir = path.join(OUTPUT_DIR, char.name.toLowerCase() + "_lora");
    const imgDir = path.join(charDir, "images"); // Kohya style: log/images/etc or just flat images + captions
    // Simple structure: [num]_[trigger] foldername or just flat 
    // We will use: training_data/clara_lora/10_clara_character/*.png (Kohya folder structure)

    const kohyaDir = path.join(charDir, `10_${char.trigger}`);

    if (!fs.existsSync(kohyaDir)) fs.mkdirSync(kohyaDir, { recursive: true });

    let downloadCount = 0;

    for (let i = 1; i <= IMAGE_COUNT; i++) {
        // Filename format from ComfyUI SaveImage usually: Prefix_00001_.png
        // Our prefix was `${char.name}_LoRA_Train`
        // Standard ComfyUI formatted numbering is 5 digits usually: 00001

        const fileNum = String(i).padStart(5, '0');
        const filename = `${char.name}_LoRA_Train_${fileNum}_.png`;
        const url = `${BASE_URL}/view?filename=${filename}&type=output`;
        const localFilename = `${char.name}_${i}.png`;
        const localPath = path.join(kohyaDir, localFilename);
        const captionPath = path.join(kohyaDir, `${char.name}_${i}.txt`);

        try {
            // console.log(`   Downloading: ${filename}...`);
            await downloadFile(url, localPath);

            // Create Caption
            // We use the base description + generic tags. 
            //Ideally we'd match the prompt used for generation, but base is fine for identity training.
            fs.writeFileSync(captionPath, `${char.trigger}, ${char.base_desc}`);

            downloadCount++;
            process.stdout.write(".");
        } catch (e) {
            console.error(`\n   ❌ Failed to download ${filename}: ${e.message}`);
            // If 404, maybe generation isn't done or naming mismatch
        }
    }
    console.log(`\n   ✅ Downloaded ${downloadCount}/${IMAGE_COUNT} images to ${kohyaDir}`);
}

async function main() {
    console.log("📥 STARTING DATASET DOWNLOADER (WATCHER MODE)");
    console.log("   Waiting for images to appear on RunPod...");
    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

    for (const char of CHARACTERS) {
        console.log(`\n📦 Monitoring for: ${char.name} (${IMAGE_COUNT} images)`);
        const charDir = path.join(OUTPUT_DIR, char.name.toLowerCase() + "_lora");
        const kohyaDir = path.join(charDir, `10_${char.trigger}`); // Kohya folder structure
        if (!fs.existsSync(kohyaDir)) fs.mkdirSync(kohyaDir, { recursive: true });

        for (let i = 1; i <= IMAGE_COUNT; i++) {
            const fileNum = String(i).padStart(5, '0'); // ComfyUI standard 5-digit padding? Or simply number?
            // Note: The generator workflow might output prefix_00001 (5 digits)
            // Let's assume standard Comfy behavior.

            // Filename format: {Char}_{RunID}_{00001}.png
            const RUN_ID = "FinalV1";
            const filename = `${char.name}_${RUN_ID}_${String(i).padStart(5, '0')}_.png`;
            const url = `${BASE_URL}/view?filename=${filename}&type=output`;
            const localPath = path.join(kohyaDir, `${char.name}_${i}.png`);
            const captionPath = path.join(kohyaDir, `${char.name}_${i}.txt`);

            let downloaded = false;
            while (!downloaded) {
                if (fs.existsSync(localPath)) {
                    downloaded = true; // Skip if exists
                    continue;
                }

                try {
                    await downloadFile(url, localPath);
                    // Generate Caption
                    fs.writeFileSync(captionPath, `${char.trigger}, ${char.base_desc}`);
                    process.stdout.write(` [${char.name} ${i}]`);
                    downloaded = true;
                } catch (e) {
                    // Not ready yet, wait and retry
                    await new Promise(r => setTimeout(r, 10000)); // Check every 10s
                }
            }
        }
    }

    console.log("\n\n✅ ALL DATASETS DOWNLOADED & PROCESSED!");
    console.log(`📍 Ready for training in: ${OUTPUT_DIR}`);
}

// Check args to see if we should wait
const delay = process.argv.includes('--wait') ? 20000 : 1000;
setTimeout(main, delay);
