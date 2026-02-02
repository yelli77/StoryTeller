import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'data', 'locations.json');

interface Location {
    id: string;
    name: string;
    description: string;
    image: string;
}

// Helper to read data
function getLocations(): Location[] {
    if (!fs.existsSync(dataFilePath)) {
        return [];
    }
    const fileParams = fs.readFileSync(dataFilePath, 'utf8');
    return JSON.parse(fileParams);
}

// Helper to write data
function saveLocations(locations: Location[]) {
    fs.writeFileSync(dataFilePath, JSON.stringify(locations, null, 2));
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params;
    const locations = getLocations();
    const location = locations.find((l: Location) => l.id === id);

    if (!location) {
        return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    return NextResponse.json(location);
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params;
    const body = await request.json();
    const locations = getLocations();

    const index = locations.findIndex((l: Location) => l.id === id);
    if (index === -1) {
        return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    // Update fields
    locations[index] = { ...locations[index], ...body };
    saveLocations(locations);

    return NextResponse.json(locations[index]);
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params;
    const locations = getLocations();

    const newLocations = locations.filter((l: Location) => l.id !== id);
    if (newLocations.length === locations.length) {
        return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    saveLocations(newLocations);
    return NextResponse.json({ success: true });
}
