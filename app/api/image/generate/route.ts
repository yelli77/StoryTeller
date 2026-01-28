import { NextResponse } from 'next/server';
import { generateImage, generateSVG } from '@/app/lib/gemini';

export async function POST(request: Request) {
    try {
        const { prompt, referenceImage } = await request.json();

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt required' }, { status: 400 });
        }

        console.log(`[API] Generating image for prompt: "${prompt.substring(0, 50)}..."`);
        const start = Date.now();

        const image = await generateImage(prompt, referenceImage);

        const duration = Date.now() - start;
        console.log(`[API] Image gen finished in ${duration}ms. Success: ${!!image}`);

        // If image returns a data URL (Imagen), stick to "image" key.
        // If it returns SVG string (Fallback), it might need differentiation, 
        // but for now let's assume the frontend can handle data URL in an <img> tag or SVG in a div.
        // To make it robust:
        const isSvg = image?.startsWith('<svg');

        return NextResponse.json({ image, isSvg });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 });
    }
}
