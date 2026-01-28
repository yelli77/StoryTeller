import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const MODEL = "models/veo-3.0-fast-generate-001";
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

export async function generateVideo(prompt: string, startImage?: string, endImage?: string) {
    if (!API_KEY) {
        throw new Error("Missing GEMINI_API_KEY");
    }

    console.log(`[Veo] Requesting video for: "${prompt.substring(0, 30)}..."`);

    // Construct Payload
    // Based on standard Google Video AI parameters
    const instances: any[] = [
        {
            prompt: prompt,
        }
    ];

    // Add images if present (Note: Schema for Veo 3 might differ, checking standard Vertex format)
    // Usually: { prompt: "...", image: { bytesBase64Encoded: "..." } }
    if (startImage) {
        // Remove data:image/...;base64, prefix
        const base64 = startImage.split(',').pop();
        const mimeMatch = startImage.match(/^data:(.*);base64,/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';

        instances[0].image = {
            bytesBase64Encoded: base64,
            mimeType: mimeType
        };
    }

    // Note: End frame support might vary or require "end_image" parameter
    // For now, let's stick to start image if supported, or just prompt.

    const payload = {
        instances: instances,
        parameters: {
            aspectRatio: "16:9",
            // fps: 24 // Not supported as per test
        }
    };

    try {
        // 1. Start Operation
        const startRes = await fetch(`${BASE_URL}/${MODEL}:predictLongRunning?key=${API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!startRes.ok) {
            const err = await startRes.text();

            // Do not return a mock here, let the caller handle the failure and fallback
            throw new Error(`Veo Start Failed: ${startRes.status} ${err}`);
        }

        const startData = await startRes.json();
        const operationName = startData.name;
        console.log(`[Veo] Operation started: ${operationName}`);

        // 2. Poll indefinitely (or until timeout)
        let videoUri = null;
        let attempts = 0;

        while (!videoUri) {
            await new Promise(r => setTimeout(r, 5000)); // Poll every 5s
            attempts++;

            const checkRes = await fetch(`${BASE_URL}/${operationName}?key=${API_KEY}`);
            const checkData = await checkRes.json();

            console.log(`[Veo] Polling ${operationName}: ${checkData.done ? 'DONE' : 'Running'} (Attempt ${attempts})`);

            if (checkData.error) {
                throw new Error(`Veo Operation Error: ${JSON.stringify(checkData.error)}`);
            }

            if (checkData.done) {
                const result = checkData.response;

                // SAFETY CHECK
                // Note: Result might be wrapped in `result` key or be top level depending on client
                const responseBody = result.result || result;

                if (responseBody.generateVideoResponse && responseBody.generateVideoResponse.raiMediaFilteredCount > 0) {
                    console.warn("[Veo] BLOCKED by Safety Policy:", responseBody.generateVideoResponse.raiMediaFilteredReasons);
                    throw new Error("Veo Safety Policy Blocked");
                }

                // New extraction logic based on reality: generateVideoResponse.generatedSamples[0].video.uri
                const gvr = result.generateVideoResponse || result;
                if (gvr.generatedSamples && gvr.generatedSamples[0] && gvr.generatedSamples[0].video) {
                    videoUri = gvr.generatedSamples[0].video.uri;
                } else if (result.predictions && result.predictions[0]) {
                    const pred = result.predictions[0];
                    if (pred.videoUri) videoUri = pred.videoUri;
                    else if (pred.bytesBase64Encoded) videoUri = `data:video/mp4;base64,${pred.bytesBase64Encoded}`;
                    else if (pred.video && pred.video.uri) videoUri = pred.video.uri;
                }

                if (!videoUri) {
                    console.error("[Veo] Finished but no video URI found:", JSON.stringify(result));
                    throw new Error("No video URI in Veo response");
                }
            }
        }

        return {
            id: operationName,
            videoUrl: videoUri, // This might need proxying if it's a raw Blob/GCS link
            status: "completed"
        };

    } catch (error) {
        console.error("[Veo] Generation Error:", error);
        throw error;
    }
}
