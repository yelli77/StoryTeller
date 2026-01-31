import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const filePath = path.join(process.cwd(), 'data', 'locations.json');

        if (!fs.existsSync(filePath)) {
            // Seed if missing
            const seedData = [
                {
                    "id": "loc_living_room",
                    "name": "Ben's Living Room",
                    "description": "A messy but cozy modern living room with a grey sofa, large TV, and scattered gaming controllers. Warm lighting, evening atmosphere.",
                    "image": "/placeholder-living-room.jpg"
                }
            ];
            fs.writeFileSync(filePath, JSON.stringify(seedData, null, 2));
            return NextResponse.json(seedData);
        }

        const jsonData = fs.readFileSync(filePath, 'utf8');
        const locations = JSON.parse(jsonData);

        return NextResponse.json(locations);
    } catch (error) {
        return NextResponse.json({ error: "Failed to load locations" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const newLocation = await request.json();
        const filePath = path.join(process.cwd(), 'data', 'locations.json');

        let locations = [];
        if (fs.existsSync(filePath)) {
            locations = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }

        // Ensure ID
        newLocation.id = newLocation.id || `loc_${Date.now()}`;
        locations.push(newLocation);

        fs.writeFileSync(filePath, JSON.stringify(locations, null, 2));

        return NextResponse.json({ success: true, location: newLocation });
    } catch (error) {
        return NextResponse.json({ error: "Failed to save location" }, { status: 500 });
    }
}

export async function DELETE() {
    const filePath = path.join(process.cwd(), 'data', 'locations.json');
    fs.writeFileSync(filePath, JSON.stringify([], null, 2));
    return NextResponse.json({ success: true });
}
