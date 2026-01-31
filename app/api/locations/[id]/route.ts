import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'data', 'locations.json');

// Helper to read data
function getLocations() {
    if (!fs.existsSync(dataFilePath)) {
        return [];
    }
    const fileParams = fs.readFileSync(dataFilePath, 'utf8');
    return JSON.parse(fileParams);
}

// Helper to write data
function saveLocations(locations: any[]) {
    fs.writeFileSync(dataFilePath, JSON.stringify(locations, null, 2));
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params;
    const locations = getLocations();
    const location = locations.find((l: any) => l.id === id);

    if (!location) {
        return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    return NextResponse.json(location);
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params;
    const body = await request.json();
    let locations = getLocations();

    const index = locations.findIndex((l: any) => l.id === id);
    if (index === -1) {
        return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    // Update fields
    locations[index] = { ...locations[index], ...body };
    saveLocations(locations);

    return NextResponse.json(locations[index]);
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params;
    let locations = getLocations();

    const newLocations = locations.filter((l: any) => l.id !== id);
    if (newLocations.length === locations.length) {
        return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    saveLocations(newLocations);
    return NextResponse.json({ success: true });
}
