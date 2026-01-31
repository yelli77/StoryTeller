import { NextResponse } from 'next/server';
import { generateImage } from '@/app/lib/gemini';

export async function POST(request: Request) {
    try {
        const { prompt, referenceImage } = await request.json();

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt required' }, { status: 400 });
        }

        console.log(`[API] Generating image for prompt: "${prompt.substring(0, 50)}..."`);
        const start = Date.now();

        const { image, error: imgError } = await generateImage(prompt, referenceImage);

        const duration = Date.now() - start;
        console.log(`[API] Image gen finished in ${duration}ms. Success: ${!!image && !imgError}`);

        if (imgError) {
            console.error("[API] Image Gen internal error:", imgError);
            return NextResponse.json({ image: null, error: imgError });
        }

        return NextResponse.json({ image, error: null });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 });
    }
}
