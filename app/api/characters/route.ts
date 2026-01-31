import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'data', 'characters.json');

// Helper to read data
function getCharacters() {
    if (!fs.existsSync(dataFilePath)) {
        return [];
    }
    const fileParams = fs.readFileSync(dataFilePath, 'utf8');
    return JSON.parse(fileParams);
}

// Helper to write data
function saveCharacters(characters: any[]) {
    fs.writeFileSync(dataFilePath, JSON.stringify(characters, null, 2));
}

export async function GET() {
    const characters = getCharacters();
    return NextResponse.json(characters);
}

export async function POST(request: Request) {
    const body = await request.json();
    const characters = getCharacters();

    const newCharacter = {
        id: Date.now().toString(),
        ...body,
    };

    characters.push(newCharacter);
    saveCharacters(characters);

    return NextResponse.json(newCharacter);
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const characters = getCharacters();

        const index = characters.findIndex((c: any) => c.id === body.id);
        if (index === -1) {
            return NextResponse.json({ error: "Character not found" }, { status: 404 });
        }

        characters[index] = { ...characters[index], ...body };
        saveCharacters(characters);

        return NextResponse.json(characters[index]);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update character" }, { status: 500 });
    }
}

export async function DELETE() {
    saveCharacters([]);
    return NextResponse.json({ success: true });
}
