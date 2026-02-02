import { NextResponse } from 'next/server';
import { generateImage, analyzeBodyProportions } from '@/app/lib/gemini';
import { generateRunpodImage } from '@/app/lib/runpod';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
    try {
        const { prompt, referenceImages, visualConfig, locationImage } = await request.json();

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt required' }, { status: 400 });
        }

        console.log(`[API] Generating image for prompt: "${prompt.substring(0, 50)}..."`);
        const start = Date.now();

        // Ensure visualConfig object exists
        const config = visualConfig || {};
        if (locationImage) config.locationImage = locationImage;

        // LIVE VISUAL ANALYSIS: Generate body description from reference images
        if (referenceImages && referenceImages.length > 0) {
            console.log("[API] Performing Live Visual Analysis of character proportions...");
            try {
                // Convert any local paths to base64 for Gemini
                const base64Refs = await Promise.all(referenceImages.map(async (url: string) => {
                    if (url.startsWith('data:')) return url;
                    try {
                        let localPath = url;
                        while (localPath.startsWith('/') || localPath.startsWith('\\')) localPath = localPath.substring(1);
                        const fullPath = path.join(process.cwd(), 'public', localPath);
                        if (fs.existsSync(fullPath)) {
                            const buffer = fs.readFileSync(fullPath);
                            return `data:image/png;base64,${buffer.toString('base64')}`;
                        }
                    } catch (e) {
                        console.warn("[API] Could not convert local ref to base64 for analysis:", url);
                    }
                    return url;
                }));

                const liveTraits = await analyzeBodyProportions(base64Refs.filter(r => r.startsWith('data:')));
                if (liveTraits) {
                    console.log(`[API] Live Analysis Success: "${liveTraits}"`);
                    config.characterTraits = liveTraits; // Inject into config
                }
            } catch (err) {
                console.warn("[API] Live Visual Analysis failed, falling back to static traits.", err);
            }
        }

        // Primary: FLUX/SDXL generation on Blackwell 5090
        const { imageUrl, error: imgError } = await generateRunpodImage(prompt, referenceImages, config);

        const duration = Date.now() - start;
        console.log(`[API] Image gen finished in ${duration}ms. Success: ${!!imageUrl}, URL: ${imageUrl}`);

        if (imgError) {
            console.error("[API] Gen internal error:", imgError);
            return NextResponse.json({ image: null, error: imgError });
        }

        return NextResponse.json({ image: imageUrl, error: null });
    } catch (error: any) {
        console.error("[API] Fatal error in image generation:", error);
        return NextResponse.json({ error: error.message || 'Generation failed' }, { status: 500 });
    }
}
