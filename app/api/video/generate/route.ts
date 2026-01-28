import { NextResponse } from 'next/server';
import { generateVideo } from '@/app/lib/luma';

export async function POST(request: Request) {
    try {
        const { prompt, startImage, endImage } = await request.json();

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt required' }, { status: 400 });
        }

        console.log(`[Video API] Requesting video for: "${prompt.substring(0, 20)}..."`);

        // In real Luma API, this is async and takes minutes. 
        // For now, we return our mock result immediately.
        const result = await generateVideo(prompt, startImage, endImage);

        return NextResponse.json({ video: result.videoUrl, id: result.id });

    } catch (error: any) {
        console.error("[Video API] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
