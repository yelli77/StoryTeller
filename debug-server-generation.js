
const { generateRunpodVideo } = require('./app/lib/runpod');
require('dotenv').config({ path: '.env.local' });

async function debugGeneration() {
    console.log("🔍 Debugging HunyuanVideo Generation from Server...");
    console.log("ENV POD_ID:", process.env.RUNPOD_POD_ID || process.env.NEXT_PUBLIC_RUNPOD_POD_ID);

    const prompt = "A beautiful cinematic shot of a sunset, cyberpunk style, high quality";
    const duration = 2; // seconds
    const frames = duration * 24;

    try {
        console.log("📡 Sending test request to RunPod...");
        const result = await generateRunpodVideo(prompt, frames);

        if (result.success) {
            console.log("✅ Success! Video URL:", result.videoUrl);
        } else {
            console.error("❌ Failed:", result.error);
        }
    } catch (e) {
        console.error("💥 Critical Exception:", e);
    }
}

debugGeneration();
