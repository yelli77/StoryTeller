import { NextResponse } from 'next/server';
import { generateKieLipSync } from '@/app/lib/kie';
import { generateRunpodVideo } from '@/app/lib/runpod';
import fs from 'fs';
import path from 'path';

function logToFile(msg: string) {
    const logPath = 'c:/AI/github/StoryTeller/StoryTeller/api-debug.log';
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logPath, `[${timestamp}] ${msg}\n`);
}

export async function POST(request: Request) {
    logToFile("!!! API POST REQUEST RECEIVED !!!");
    try {
        const payload = await request.json();
        let { prompt, startImage, duration, type, audioUrl } = payload;
        logToFile(`Payload Received: prompt=${prompt?.substring(0, 30)}... type=${type} hasImage=${!!startImage} hasAudio=${!!audioUrl}`);

        // FORCED BLACKWELL MODE: Everything goes to RunPod for now
        if (type === 'lipsync') {
            logToFile("FORCING BLACKWELL MODE: Diverting Lip-Sync request to HunyuanVideo (RunPod)");
            type = 'standard';
        }

        if (!prompt) {
            logToFile("ERROR: Prompt missing");
            return NextResponse.json({ error: 'Prompt required' }, { status: 400 });
        }

        logToFile(`[Video API] Starting HunyuanVideo (RunPod). Prompt: "${prompt.substring(0, 30)}..."`);

        const durationInSeconds = typeof duration === 'number' ? duration : parseInt(duration) || 2;
        const frames = durationInSeconds * 24;
        logToFile(`[Video API] Frames: ${frames}`);

        const result = await generateRunpodVideo(prompt, frames, startImage);

        if (result.success && result.videoUrl) {
            logToFile(`[Video API] RunPod Success! URL: ${result.videoUrl}`);
            return NextResponse.json({ video: result.videoUrl, id: "runpod-" + Date.now() });
        } else {
            logToFile(`[Video API] RunPod Failed: ${result.error}`);
            return NextResponse.json({ error: result.error || "RunPod Video generation failed" }, { status: 500 });
        }

    } catch (error: any) {
        logToFile(`CRITICAL ERROR in API: ${error.message}`);
        console.error("[Video API] CRITICAL ERROR:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
