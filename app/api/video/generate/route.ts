import { NextResponse } from 'next/server';
import { generateKieVideo } from '@/app/lib/kie';
import { generateVideo } from '@/app/lib/veo';

export async function POST(request: Request) {
    try {
        const { prompt, startImage } = await request.json();

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt required' }, { status: 400 });
        }

        if (!startImage) {
            console.error("[Video API] Missing startImage for Image-to-Video generation.");
            return NextResponse.json({ error: 'Image-to-Video requires a startImage. Please ensure the image generation step succeeded.' }, { status: 400 });
        }

        console.log(`[Video API] Requesting video from Kie.ai. Prompt: "${prompt.substring(0, 30)}...", Image Size: ${Math.round(startImage.length / 1024)} KB`);

        const result = await generateKieVideo(prompt, startImage);

        if (result.success && result.videoUrl) {
            console.log("[Video API] Kie.ai Success!");
            return NextResponse.json({ video: result.videoUrl, id: result.taskId });
        } else {
            console.error("[Video API] Kie.ai Failed:", result.error);
            return NextResponse.json({ error: result.error || "Video generation failed" }, { status: 500 });
        }

    } catch (error: any) {
        console.error("[Video API] Final Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
