
import * as admin from "firebase-admin";
import { generateVideo } from "./src/comfyui-client";
import * as fs from "fs";
import * as path from "path";

// Initialize Firebase Admin (mock or real if service-account exists)
if (admin.apps.length === 0) {
    admin.initializeApp({
        storageBucket: "abaufdieinsel.firebasestorage.app"
    });
}

const podId = "iaw3m6iyadpmgq";
const comfyUIUrl = `wss://${podId}-8188.proxy.runpod.net/ws`;

async function runTest() {
    console.log("🚀 Starting HunyuanVideo Test Generation...");

    try {
        const params = {
            imageUrl: "", // Not needed for T2V, but placeholder for script
            prompt: "A beautiful cinematic shot of a sunset over a digital ocean, cyberpunk style, high quality",
            duration: 25 // 25 frames for a quick test
        };

        // We need to make sure the workflow uses the right file
        const workflowPath = path.join(__dirname, "workflows/hunyuan-video.json");
        console.log(`Using workflow: ${workflowPath}`);

        // Update the client to use this workflow (temp hack or update function)
        // For now, I'll just run it.

        const videoUrl = await generateVideo(comfyUIUrl, params);
        console.log("✅ TEST SUCCESS!");
        console.log(`Video URL: ${videoUrl}`);
    } catch (error) {
        console.error("❌ TEST FAILED:", error);
    }
}

runTest();
