import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const characterName = searchParams.get('character');

    if (!characterName) {
        return NextResponse.json({ error: 'Character name required' }, { status: 400 });
    }

    // Sanitize character name to prevent traversal
    const safeName = characterName.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase();
    const dirPath = path.join(process.cwd(), 'public', 'characters', safeName, 'references');

    if (!fs.existsSync(dirPath)) {
        return NextResponse.json({ images: [] });
    }

    try {
        const files = fs.readdirSync(dirPath).filter(file =>
            /\.(jpg|jpeg|png|webp)$/i.test(file)
        );

        // Map to public URLs
        const images = files.map(file => `/characters/${safeName}/references/${file}`);
        return NextResponse.json({ images });
    } catch (error) {
        console.error("Error reading references:", error);
        return NextResponse.json({ error: 'Failed to list references' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json();
        const { character, filename } = body;

        if (!character || !filename) {
            return NextResponse.json({ error: 'Character and filename required' }, { status: 400 });
        }

        const safeName = character.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase();
        const safeFile = path.basename(filename); // Ensure no traversal

        // Handle both full URL and raw filename
        const actualFilename = safeFile.split('/').pop() || safeFile;

        const filePath = path.join(process.cwd(), 'public', 'characters', safeName, 'references', actualFilename);

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
    }
}
