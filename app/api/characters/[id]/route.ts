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

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params;
    const characters = getCharacters();
    const character = characters.find((c: any) => c.id === id);

    if (!character) {
        return NextResponse.json({ error: 'Character not found' }, { status: 404 });
    }

    return NextResponse.json(character);
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params;
    const body = await request.json();
    let characters = getCharacters();

    const index = characters.findIndex((c: any) => c.id === id);
    if (index === -1) {
        return NextResponse.json({ error: 'Character not found' }, { status: 404 });
    }

    // Update fields
    characters[index] = { ...characters[index], ...body };
    saveCharacters(characters);

    return NextResponse.json(characters[index]);
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params;
    let characters = getCharacters();

    const newCharacters = characters.filter((c: any) => c.id !== id);
    if (newCharacters.length === characters.length) {
        return NextResponse.json({ error: 'Character not found' }, { status: 404 });
    }

    saveCharacters(newCharacters);
    return NextResponse.json({ success: true });
}
