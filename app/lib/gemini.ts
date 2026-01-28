import { GoogleGenerativeAI } from "@google/generative-ai";

// This would typically come from an environment variable or settings context
const API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

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

export async function generateScript(topic: string, characters: any[], location: any, duration: number = 30) {
    // Dynamic POV Rules
    const povCharacters = characters.filter(c => c.isCamera);
    const povRules = povCharacters.length > 0
        ? povCharacters.map(c => `- ${c.name.toUpperCase()} IST DER KAMERAMANN (POV). Er/Sie darf NIEMALS als Person zu sehen sein.\n            - Wenn ${c.name} spricht, zeigen wir die REAKTION des anderen Charakters ODER eine POV-Aufnahme (Hände).`).join("\n")
        : "";

    if (!API_KEY) {
        console.warn("No Gemini API Key. Returning mock script.");
        return getMockScript(characters);
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

        const locationContext = location
            ? `SETTING: ${location.name}\nDESCRIPTION: ${location.description}`
            : "SETTING: Generic Indoor Scene";

        const prompt = `
        Du bist der Motor für einen viralen YouTube Shorts Kanal.
        Erstelle ein exakt ${duration} Sekunden langes Skript basierend auf diesem Thema: "${topic}"
        
        Nutze diese CHARAKTERE:
        ${characterContext}

        ${locationContext}
        
        Regeln:
        1. Formatiere als JSON Array mit Keys: "time", "speaker", "action", "line", "visual_start" (Bildbeschreibung Start-Frame), "visual_end" (Bildbeschreibung End-Frame).
        2. Halte die Dialoge kurz, punchy und im Gen Z / TikTok Stil.
        3. Schreibe ALLES auf DEUTSCH (Dialoge und Regieanweisungen).
        4. "visual_start" und "visual_end": Erstelle einen präzisen Image Generation Prompt. Er MUSS beinhalten: 
            a) Den NAMEN des Charakters im Fokus.
            b) Die exakte Handlung/Pose. 
            c) Den Hintergrund: "${location ? location.description : 'Generic Indoor Scene'}".
            
            WICHTIGE REGELN FÜR VISUALS:
            ${povRules}
            - NIEMALS den Kameramann im Visual beschreiben.
            - KEINE fremden Personen im Hintergrund. NUR die bekannten Charaktere.
            - Der Prompt soll auf Englisch sein.
        5. Fokus auf Comedy, Missverständnisse und Charakter-Konflikte.
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        return JSON.parse(text);

    } catch (error) {
        console.error("Gemini Script Gen Error:", error);
        // Fallback to mock on error
        return getMockScript(characters);
    }
}

function getMockScript(characters: any[]) {
    const char1 = characters.find(c => !c.isCamera) || { name: 'Clara' };
    const char2 = characters.find(c => c.name !== char1.name) || { name: 'Ben' };

    return [
        { time: "0:00", speaker: char1.name, action: "enters energetically", visual_start: `${char1.name} entering room`, visual_end: `${char1.name} smiling`, line: `You won't believe what happened!` },
        { time: "0:05", speaker: char2.name, action: "looks skeptical", visual_start: `${char2.name} looking skeptical`, visual_end: `${char2.name} rolling eyes`, line: `Oh no, what did you do this time?` },
        { time: "0:10", speaker: char1.name, action: "defensive", visual_start: `${char1.name} hands up defensive`, visual_end: `${char1.name} pouting`, line: `Nothing! It was completely scientific!` },
        { time: "0:15", speaker: char2.name, action: "facepalm", visual_start: `POV hand facepalm`, visual_end: `POV shaking head`, line: `Scientific... right.` }
    ];
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

const FALLBACK_IMAGE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII="; // Grey Pixel

export async function generateImage(prompt: string, referenceImageBase64?: string) {
    if (!API_KEY) {
        console.error("❌ GenerateImage: No API Key found.");
        return { image: FALLBACK_IMAGE, error: "No API Key configuration found." };
    }

    try {
        console.log("🎨 GenerateImage: Sending request...", prompt.substring(0, 30));
        // Use gemini-2.5-flash-image as previously configured
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${API_KEY}`;

        const parts: any[] = [{ text: `PHOTOGRAPH, RAW DATA, 8k, highly detailed, award winning photography. NO ANIME, NO CARTOON, NO ILLUSTRATION, NO 3D RENDER. NO OTHER PERSONS, NO BACKGROUND CROWD, ISOLATED SUBJECT. STRICTLY PHOTO-REALISTIC: ${prompt}` }];

        // Add reference image if provided
        if (referenceImageBase64) {
            const base64Data = referenceImageBase64.split(',').pop();
            parts.push({
                inlineData: {
                    mimeType: "image/png",
                    data: base64Data
                }
            });
            parts.push({ text: "REFERENZBILD: Das angehängte Bild zeigt den Charakter. Generiere das neue Bild basierend auf diesem Aussehen. WICHTIG: Gesichtszüge, Frisur und Kleidung MÜSSEN zu 100% übereinstimmen. Die Person MUSS wiedererkennbar sein." });
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
            const errText = await response.text();
            console.error(`Gemini Image API Error: ${response.status} ${errText}`);
            return { image: FALLBACK_IMAGE, error: `API Error ${response.status}: ${errText}` };
        }

        const data = await response.json();

        // Extract image from standard generateContent response
        // candidates[0].content.parts[0].inlineData.data (base64)
        const part = data.candidates?.[0]?.content?.parts?.[0];
        const base64Image = part?.inlineData?.data;
        const mimeType = part?.inlineData?.mimeType || 'image/png';

        if (base64Image) {
            return { image: `data:${mimeType};base64,${base64Image}`, error: null };
        }

        console.warn("No inlineData found in response:", JSON.stringify(data).substring(0, 200));
        return { image: FALLBACK_IMAGE, error: "No image data in response" };

    } catch (error: any) {
        console.error("Gemini Image generation failed:", error);
        return { image: FALLBACK_IMAGE, error: error.message || "Unknown error" };
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
