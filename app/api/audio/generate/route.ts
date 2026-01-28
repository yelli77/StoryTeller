import { NextResponse } from 'next/server';
import { generateSpeech } from '@/app/lib/elevenlabs';

export async function POST(request: Request) {
    try {
        const { text, voiceId } = await request.json();

        if (!text || !voiceId) {
            return NextResponse.json({ error: 'Text and VoiceID are required' }, { status: 400 });
        }

        console.log(`[Audio API] Generating speech for: "${text.substring(0, 20)}..." with voice ${voiceId}`);
        const audioBase64 = await generateSpeech(text, voiceId);

        if (!audioBase64) {
            return NextResponse.json({ error: 'Failed to generate audio' }, { status: 500 });
        }

        return NextResponse.json({ audio: `data:audio/mpeg;base64,${audioBase64}` });

    } catch (error: any) {
        console.error("[Audio API] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
