import { GoogleGenerativeAI } from "@google/generative-ai";

// This would typically come from an environment variable or settings context
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

export async function analyzeCharacterImage(imageUrl: string) {
    if (!API_KEY) {
        console.warn("No Gemini API Key found. Returning mock analysis.");
        return {
            traits: "Mock: High cheekbones, expressive eyes, modern style.",
            roleSuggest: "The Protagonist"
        };
    }

    try {
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // In a real implementation, we'd fetch the image blob and convert to base64
        // For now, we'll assume we pass a prompt based on the URL or handle the file directly in the calling component
        // This is a simplified placeholder structure

        return {
            traits: "Analysis from Gemini 2.5 Flash would appear here.",
            roleSuggest: "Analyzed Role"
        };

    } catch (error) {
        console.error("Gemini Vision Error:", error);
        throw error;
    }
}

export async function generateScript(topic: string, characters: any[], duration: number = 30) {
    if (!API_KEY) {
        console.warn("No Gemini API Key. Returning mock script.");

        // Dynamic Mock: Use actual characters if available
        const char1 = characters[0] || { name: 'Clara' };
        const char2 = characters[1] || { name: 'Ben' };

        return [
            { time: "0:00", speaker: char1.name, action: "enters energetically", line: `You won't believe what happened!` },
            { time: "0:05", speaker: char2.name, action: "looks skeptical", line: `Oh no, what did you do this time?` },
            { time: "0:10", speaker: char1.name, action: "defensive", line: `Nothing! It was completely scientific!` },
            { time: "0:15", speaker: char2.name, action: "facepalm", line: `Scientific... right.` }
        ];
    }

    try {
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        const characterContext = characters.map(c =>
            `- ${c.name} (${c.role}): ${c.traits}`
        ).join("\n");

        const prompt = `
        Du bist der Motor für einen viralen YouTube Shorts Kanal.
        Erstelle ein exakt ${duration} Sekunden langes Skript basierend auf diesem Thema: "${topic}"
        
        Nutze diese CHARAKTERE:
        ${characterContext}
        
        Regeln:
        1. Formatiere als JSON Array mit Keys: "time", "speaker", "action", "line", "visual_start" (Bildbeschreibung Start-Frame), "visual_end" (Bildbeschreibung End-Frame).
        2. Halte die Dialoge kurz, punchy und im Gen Z / TikTok Stil.
        3. Schreibe ALLES auf DEUTSCH (Dialoge und Regieanweisungen).
        4. "visual_start" und "visual_end": Beschreibe detailliert den Look, die Pose und den Hintergrund für den Start- und End-Frame des Shots, um Konsistenz zu sichern.
        5. Fokus auf Comedy, Missverständnisse und Charakter-Konflikte.
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        return JSON.parse(text);

    } catch (error) {
        console.error("Gemini Script Gen Error:", error);
        return [];
    }
}

export async function generateMetadata(topic: string) {
    if (!API_KEY) {
        return {
            titles: [
                "You WON'T believe what she said! 😱 #shorts",
                "He forgot the anniversary... AGAIN 💀",
                "When logic meets emotion (Ending is WILD)"
            ],
            tags: ["#shorts", "#couplecomedy", "#relatable", "#relationshipgoals", "#fail"]
        };
    }

    try {
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `
      Generiere 3 virale YouTube Shorts Titel und 5-10 Hashtags für ein Video über: "${topic}".
      Das Video ist im Stil von "He & She's" oder ähnlichen Couple-Comedy Kanälen.
      
      Format Vorgaben:
      - Titel sollen clickbaity sein, Emojis nutzen und unter 60 Zeichen lang sein.
      - ALLES auf DEUTSCH.
      - Return JSON: { "titles": [string], "tags": [string] }
      `;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        return JSON.parse(text);

    } catch (error) {
        console.error("Gemini Metadata Gen Error:", error);
        return { titles: [], tags: [] };
    }
}

export async function generateImage(prompt: string, referenceImageBase64?: string) {
    if (!API_KEY) {
        return null; // Fallback handled by caller
    }

    try {
        // Use gemini-2.5-flash-image as per documentation
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${API_KEY}`;

        const parts: any[] = [{ text: `Cinematic shot, photorealistic, 8k, detailed: ${prompt}` }];

        // Add reference image if provided
        if (referenceImageBase64) {
            const base64Data = referenceImageBase64.split(',').pop();
            parts.push({
                inlineData: {
                    mimeType: "image/png",
                    data: base64Data
                }
            });
            parts.push({ text: "Use the attached image as the visual reference for the character. Maintain facial features, hair, and clothing style." });
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: parts
                }],
                generationConfig: {
                    responseModalities: ["image"],
                    imageConfig: {
                        aspectRatio: "16:9"
                    }
                }
            })
        });

        if (!response.ok) {
            console.error(`Gemini Image API Error: ${response.status} ${response.statusText}`);
            throw new Error(`Gemini Image API Error: ${response.statusText}`);
        }

        const data = await response.json();

        // Extract image from standard generateContent response
        // candidates[0].content.parts[0].inlineData.data (base64)
        const part = data.candidates?.[0]?.content?.parts?.[0];
        const base64Image = part?.inlineData?.data;
        const mimeType = part?.inlineData?.mimeType || 'image/png';

        if (base64Image) {
            return `data:${mimeType};base64,${base64Image}`;
        }

        console.warn("No inlineData found in response:", JSON.stringify(data).substring(0, 200));
        return null;

    } catch (error) {
        console.error("Gemini Image generation failed:", error);
        return null;
    }
}

// Keep SVG generator as fallback
export async function generateSVG(description: string) {
    if (!API_KEY) {
        return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#333"/><text x="50" y="50" font-family="monospace" font-size="10" text-anchor="middle" fill="#555">Mock SVG</text></svg>`;
    }

    try {
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
        Create a flat, modern, minimalist SVG illustration (16:9 aspect ratio) for this scene: "${description}".
        Use a dark, cinematic color palette (neon accents allowed). 
        Return ONLY the raw <svg>...</svg> code. No markdown, no "xml" declaration.
        IMPORTANT: Do not use external images. Use only vectors (rect, circle, path).
        `;

        const result = await model.generateContent(prompt);
        let text = result.response.text();

        text = text.replace(/```xml/g, '').replace(/```svg/g, '').replace(/```/g, '');
        return text.trim();
    } catch (error) {
        console.error("Gemini SVG Gen Error:", error);
        return null;
    }
}
