import { NextResponse } from 'next/server';
import { generateScript } from '@/app/lib/gemini';
import fs from 'fs';
import path from 'path';

interface Character {
    id: string;
    name: string;
    role?: string;
    traits?: string;
    voiceId?: string;
    image?: string;
    isCamera?: boolean;
}

// Read characters (duplicate logic, should refactor in real app)
function getCharacters(): Character[] {
    const dataFilePath = path.join(process.cwd(), 'data', 'characters.json');
    if (!fs.existsSync(dataFilePath)) return [];
    return JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
}

export async function POST(request: Request) {
    try {
        const { topic, duration, location, platform } = await request.json();
        const characters = getCharacters();

        // Call Gemini
        const script = await generateScript(topic, characters, location, duration, platform);

        return NextResponse.json({ script });
    } catch (_error: unknown) {
        return NextResponse.json({ error: 'Failed to generate script' }, { status: 500 });
    }
}
