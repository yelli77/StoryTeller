import { NextResponse } from 'next/server';
import { generateKieVideo } from '@/app/lib/kie';
import { generateVideo } from '@/app/lib/veo';

export async function POST(request: Request) {
    try {
        const { prompt, startImage, endImage } = await request.json();

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt required' }, { status: 400 });
        }

        console.log(`[Video API] Requesting video for: "${prompt.substring(0, 30)}..."`);

        // 1. Try Veo 3 Fast - Now Primary for Speed
        try {
            console.log("[Video API] Attempting Veo 3 Fast...");
            const result = await generateVideo(prompt, startImage, endImage);
            if (result.videoUrl) {
                console.log("[Video API] Veo 3 Fast Success!");
                return NextResponse.json({ video: result.videoUrl, id: result.id });
            }
        } catch (veoError) {
            console.error("[Video API] Veo Exception:", veoError);
        }

        // 2. Fallback to Kie.ai (Kling 2.6)
        console.log("[Video API] Falling back to Kie.ai (Kling 2.6)...");
        try {
            const kieResult = await generateKieVideo(prompt, startImage);
            if (kieResult.success && kieResult.videoUrl) {
                console.log("[Video API] Kie.ai Success!");
                return NextResponse.json({
                    video: kieResult.videoUrl,
                    id: kieResult.taskId || 'kie-task'
                });
            }
            console.warn("[Video API] Kie.ai failed or no video:", kieResult.error);
        } catch (kieError) {
            console.error("[Video API] Kie.ai Exception:", kieError);
        }

        throw new Error("All video generation models failed.");

    } catch (error: any) {
        console.error("[Video API] Final Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
