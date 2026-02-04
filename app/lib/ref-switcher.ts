import fs from 'fs';
import path from 'path';

// Mapping prompts keywords to filename patterns
const TOKEN_MAP = [
    { keys: ["back", "behind", "away", "walking away", "dorsal", "rear"], pattern: /back|walking_away/i },
    { keys: ["side", "profile", "lateral", "looking left", "looking right"], pattern: /side|profile/i },
    { keys: ["close", "face", "macro", "portrait", "headshot"], pattern: /close|head|macro|portrait/i },
    { keys: ["sitting", "seated", "floor", "chair"], pattern: /sitting/i },
    { keys: ["walking", "running", "motion", "moving"], pattern: /walking|motion/i },
    { keys: ["low angle", "looking up"], pattern: /low_angle/i },
    { keys: ["high angle", "looking down"], pattern: /high_angle/i },
];

export function getBestReferenceForPrompt(prompt: string, characterName: string): string | null {
    if (!prompt || !characterName) return null;

    const lowerPrompt = prompt.toLowerCase();
    const dirPath = path.join(process.cwd(), 'public', 'characters', characterName.toLowerCase(), 'references');

    if (!fs.existsSync(dirPath)) return null;

    // 1. Identify Target Pattern
    let targetPattern: RegExp | null = null;

    // Check specific keywords
    for (const entry of TOKEN_MAP) {
        if (entry.keys.some(k => lowerPrompt.includes(k))) {
            targetPattern = entry.pattern;
            break; // Priority order defined by array order
        }
    }

    if (!targetPattern) return null; // No special angle detected, use default master

    try {
        const files = fs.readdirSync(dirPath);

        // 2. Find matching file
        const match = files.find(f => targetPattern!.test(f));

        if (match) {
            // Return public URL path
            console.log(`[SmartRef] Switching to ${match} for prompt: "${prompt.substring(0, 20)}..."`);
            return `/characters/${characterName.toLowerCase()}/references/${match}`;
        }
    } catch (e) {
        console.error("[SmartRef] Error scanning references:", e);
    }

    return null;
}
