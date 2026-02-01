import { NextResponse } from 'next/server';
import { generateImage } from '@/app/lib/gemini';
import { generateRunpodImage } from '@/app/lib/runpod';

export async function POST(request: Request) {
    try {
        const { prompt, referenceImages, visualConfig } = await request.json();

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt required' }, { status: 400 });
        }

        console.log(`[API] Generating image for prompt: "${prompt.substring(0, 50)}..."`);
        const start = Date.now();

        // Primary: FLUX generation on Blackwell 5090
        const referenceImage = referenceImages && referenceImages.length > 0 ? referenceImages[0] : undefined;
        const { imageUrl, error: imgError } = await generateRunpodImage(prompt, referenceImage, visualConfig);

        const duration = Date.now() - start;
        console.log(`[API] FLUX Image gen finished in ${duration}ms. Success: ${!!imageUrl}`);

        if (imgError) {
            console.error("[API] FLUX Gen internal error:", imgError);
            return NextResponse.json({ image: null, error: imgError });
        }

        return NextResponse.json({ image: imageUrl, error: null });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 });
    }
}
