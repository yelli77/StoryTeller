import { NextResponse } from 'next/server';
import { generateMetadata } from '@/app/lib/gemini';

export async function POST(request: Request) {
    try {
        const { topic } = await request.json();
        const metadata = await generateMetadata(topic);
        return NextResponse.json(metadata);
    } catch {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
