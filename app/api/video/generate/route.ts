import { NextResponse } from 'next/server';
import { generateRunpodVideo } from '@/app/lib/runpod';

export async function POST(request: Request) {
    try {
        console.log("!!! API POST REQUEST RECEIVED !!!");
        const payload = await request.json();
        let { prompt, type } = payload;
        const { startImage, duration, audioUrl } = payload;

        console.log(`Payload Received: prompt=${prompt?.substring(0, 30)}... type=${type} hasImage=${!!startImage} hasAudio=${!!audioUrl}`);

        // FORCED BLACKWELL MODE: Everything goes to RunPod for now
        if (type === 'lipsync') {
            console.log("FORCING BLACKWELL MODE: Diverting Lip-Sync request to HunyuanVideo (RunPod)");
            type = 'standard';
        }

        if (!prompt) {
            console.error("ERROR: Prompt missing");
            return NextResponse.json({ error: 'Prompt required' }, { status: 400 });
        }

        console.log(`[Video API] Starting Video (RunPod). Prompt: "${prompt.substring(0, 30)}..."`);

        const durationInSeconds = typeof duration === 'number' ? duration : parseInt(duration) || 2;
        const frames = durationInSeconds * 24;
        console.log(`[Video API] Frames: ${frames}`);

        const result = await generateRunpodVideo(prompt, frames, startImage, payload.visualConfig);

        if (result.success && result.videoUrl) {
            console.log(`[Video API] RunPod Success! URL: ${result.videoUrl}`);
            return NextResponse.json({ video: result.videoUrl, id: "runpod-" + Date.now() });
        } else {
            console.error(`[Video API] RunPod Failed: ${result.error}`);
            return NextResponse.json({ error: result.error || "RunPod Video generation failed" }, { status: 500 });
        }

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error("CRITICAL ERROR in API:", errorMessage);
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
