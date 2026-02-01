const fs = require('fs');
const { pollResult } = require('./likeness-utils.js');

// Comprehensive parameter grid search for EXTREME LIKENESS + SCENE ADHERENCE
const testMatrix = {
    // We keep weight high for identity
    weights: [0.8, 0.9, 1.0],

    // CFG scales - testing the range between "Likeness" (1.5) and "Scene" (3.5)
    cfgs: [1.5, 2.0, 2.5, 3.5],

    // EndAt - testing the cutoff point
    endAts: [0.6, 0.7, 0.8, 0.9],

    // The problematic scene
    prompts: [
        {
            name: "Clara_Cafe_Scene",
            text: "Clara, in a cafe, (sipping coffee:1.2), (warm cafe atmosphere:1.2), (blurred background:1.2), sunlight hitting her face"
        }
    ]
};

async function runComprehensiveTest() {
    const results = [];
    const startTime = Date.now();

    console.log("🎯 Starting Clara Auto-Tuning: LIKENESS vs SCENE");
    console.log(`📊 Testing 'Clara in a Cafe' across ${testMatrix.cfgs.length * testMatrix.endAts.length * testMatrix.weights.length} combinations`);
    console.log("=".repeat(60));

    let count = 0;
    const total = testMatrix.cfgs.length * testMatrix.endAts.length * testMatrix.weights.length;

    for (const weight of testMatrix.weights) {
        for (const cfg of testMatrix.cfgs) {
            for (const endAt of testMatrix.endAts) {
                count++;
                const prompt = testMatrix.prompts[0];

                console.log(`\n[${count}/${total}] Testing W:${weight} CFG:${cfg} EndAt:${endAt}`);

                const result = await runTest(
                    prompt.text,
                    weight,
                    cfg,
                    endAt,
                    `sweep_w${weight}_cfg${cfg}_e${endAt}`
                );

                if (result.success) {
                    results.push({
                        weight, cfg, endAt,
                        promptName: prompt.name,
                        filename: result.filename
                    });
                }
            }
        }
    }

    // Generate report
    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    console.log("\n\n" + "=".repeat(60));
    console.log("📊 AUTO-TUNING COMPLETE");
    console.log(`✅ Saved ${results.length} images to ./public/autotuned/`);
    console.log("=".repeat(60));

    // Save report
    fs.writeFileSync('./autotuning-report.json', JSON.stringify(results, null, 2));

    return results;
}

async function runTest(prompt, weight, cfg, endAt, identifier) {
    try {
        const promptId = await runSingleWithEndAt(prompt, weight, cfg, endAt);
        if (!promptId) return { success: false };

        const success = await pollResult(promptId);
        if (success) {
            const destFile = `./public/autotuned/${identifier}.png`;
            if (!fs.existsSync('./public/autotuned')) fs.mkdirSync('./public/autotuned', { recursive: true });
            fs.copyFileSync('./public/current_tuning.png', destFile);
            console.log(`   ✅ Saved: ${identifier}.png`);
            return { success: true, filename: destFile };
        }
        return { success: false };
    } catch (err) {
        console.log(`   💥 Error: ${err.message}`);
        return { success: false };
    }
}

async function runSingleWithEndAt(prompt, weight, cfg, endAt) {
    const POD_ID = process.env.RUNPOD_POD_ID || 'g4oysjh535la54';
    const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;

    // 1. Upload Ref Image
    const refPath = 'c:/AI/github/StoryTeller/StoryTeller/public/clara_ref.png';
    const imageBuffer = fs.readFileSync(refPath);
    const boundary = `----NodeJSBoundary${Math.random().toString(16).substring(2)}`;
    const header = `--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="ref.png"\r\nContent-Type: image/png\r\n\r\n`;
    const footer = `\r\n--${boundary}--\r\n`;
    const body = Buffer.concat([Buffer.from(header, 'utf8'), imageBuffer, Buffer.from(footer, 'utf8')]);

    const uploadRes = await fetch(`${BASE_URL}/upload/image`, {
        method: 'POST',
        headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
        body: body
    });

    if (!uploadRes.ok) return null;
    const { name: uploadedName } = await uploadRes.json();

    // 2. Prepare 2-Pass Workflow
    const actionPrompt = `(${prompt}:2.0)`;
    const posPrompt = `${actionPrompt}, (massive oversized head resting directly on chest:2.2), (no visible neck space:2.5), (head sunk deep into shoulders:2.2), (extremely fleshy round chubby face:2.0), (massive triple chin:2.2), (neckless:2.5), (thin rimless round frame glasses:1.6), (long naturally straight honey brown hair with center part:1.7), (pink loose-fitting tshirt:1.3), (obese body:2.0), (massive heavy breasts:2.2), (fleshy arms:1.8), (full heavy figure:1.8), creamy flawless porcelain skin, high resolution`;
    const negPrompt = "(plain background:1.8), (studio background:1.8), (solid background:1.8), gray background, neutral background, blurry, low quality, bad anatomy";

    const workflow = {
        "1": { "inputs": { "ckpt_name": "juggernautXL_v9RdPhoto2Lightning.safetensors" }, "class_type": "CheckpointLoaderSimple" },
        "2": { "inputs": { "text": posPrompt, "clip": ["1", 1] }, "class_type": "CLIPTextEncode" },
        "3": { "inputs": { "text": negPrompt, "clip": ["1", 1] }, "class_type": "CLIPTextEncode" },
        "4": { "inputs": { "width": 720, "height": 1280, "batch_size": 1 }, "class_type": "EmptyLatentImage" },
        "5": { "inputs": { "image": uploadedName }, "class_type": "LoadImage" },
        "6": { "inputs": { "instantid_file": "instantid-ip-adapter.bin" }, "class_type": "InstantIDModelLoader" },
        "7": { "inputs": { "provider": "CUDA" }, "class_type": "InstantIDFaceAnalysis" },
        "11": { "inputs": { "control_net_name": "instantid-controlnet-sdxl.safetensors" }, "class_type": "ControlNetLoader" },
        "8": {
            "inputs": {
                "weight": weight, "start_at": 0.0, "end_at": endAt,
                "instantid": ["6", 0], "insightface": ["7", 0], "control_net": ["11", 0], "image": ["5", 0], "model": ["1", 0], "positive": ["2", 0], "negative": ["3", 0]
            },
            "class_type": "ApplyInstantID"
        },
        "9": {
            "inputs": {
                "seed": 69420, "steps": 15, "cfg": cfg, "sampler_name": "euler_ancestral", "scheduler": "normal", "denoise": 1.0,
                "model": ["8", 0], "positive": ["8", 1], "negative": ["8", 2], "latent_image": ["4", 0]
            },
            "class_type": "KSampler"
        },
        "12": { "inputs": { "upscale_method": "bicubic", "scale_by": 1.5, "samples": ["9", 0] }, "class_type": "LatentUpscaleBy" },
        "13": {
            "inputs": {
                "seed": 69420, "steps": 12, "cfg": cfg, "sampler_name": "euler_ancestral", "scheduler": "normal", "denoise": 0.35,
                "model": ["8", 0], "positive": ["8", 1], "negative": ["8", 2], "latent_image": ["12", 0]
            },
            "class_type": "KSampler"
        },
        "20": { "inputs": { "samples": ["13", 0], "vae": ["1", 2] }, "class_type": "VAEDecode" },
        "21": { "inputs": { "images": ["20", 0], "filename_prefix": "TUNING" }, "class_type": "SaveImage" }
    };

    try {
        const response = await fetch(`${BASE_URL}/prompt`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: workflow }) });
        const data = await response.json();
        return data.prompt_id;
    } catch (err) { return null; }
}

runComprehensiveTest()
    .then(() => {
        console.log("Sweep complete.");
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
