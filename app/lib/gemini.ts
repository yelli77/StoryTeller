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
        1. Formatiere als JSON Array mit Keys: "time", "speaker", "action", "line", "visual_start", "duration".
        2. "duration": MUSS ENTWEDER 5 ODER 10 sein (als Zahl).
        3. WORTSCHATZ-LIMITS für perfekte Synchronisation:
           - Wenn duration=5: max. 12 Wörter in "line".
           - Wenn duration=10: max. 25 Wörter in "line".
        4. "time": Berechne kumulative Zeitstempel (0:00, 0:05, 0:15 etc.).
        5. "visual_start": Erstelle einen MASTER-PROMPT auf Englisch:
           [CAMERA ANGLE], [CHARACTER], [ACTION], [LIGHTING], [LOCATION]. 
           Beachte: Kamera sollte dynamisch sein (Slow zoom, Pan left, Dolly shot).
        6. VARIETÄT: Füge gelegentlich Szenen ein, in denen "speaker" leer ist (oder "NARRATOR"), um reine Action-Szenen für das Pacing zu haben.
        7. NIEMALS den Kameramann im Visual beschreiben (außer POV Hände).
            
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
        { time: "0:00", duration: 5, speaker: char1.name, action: "enters energetically", visual_start: `${char1.name} entering room`, line: `You won't believe what happened!` },
        { time: "0:05", duration: 5, speaker: char2.name, action: "looks skeptical", visual_start: `${char2.name} looking skeptical`, line: `Oh no, what did you do this time?` },
        { time: "0:10", duration: 5, speaker: char1.name, action: "defensive", visual_start: `${char1.name} hands up defensive`, line: `Nothing! It was completely scientific!` },
        { time: "0:15", duration: 5, speaker: char2.name, action: "facepalm", visual_start: `POV hand facepalm`, line: `Scientific... right.` }
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

export async function generateImage(prompt: string, referenceImages?: string[]) {
    if (!API_KEY) {
        return { image: null, error: "No API Key configuration found." };
    }

    let lastError = "Unknown error";

    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            console.log(`🎨 GenerateImage: Attempt ${attempt}/3...`, prompt.substring(0, 30));
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${API_KEY}`;

            const parts: any[] = [{ text: `PHOTOGRAPH, RAW DATA, 8k, highly detailed, award winning photography. NO ANIME, NO CARTOON, NO ILLUSTRATION, NO 3D RENDER. NO OTHER PERSONS, NO BACKGROUND CROWD, ISOLATED SUBJECT. STRICTLY PHOTO-REALISTIC: ${prompt}` }];

            if (referenceImages && referenceImages.length > 0) {
                referenceImages.forEach((img, idx) => {
                    if (!img) return;
                    const base64Data = img.split(',').pop();
                    parts.push({
                        inlineData: {
                            mimeType: "image/png",
                            data: base64Data
                        }
                    });
                });
                parts.push({ text: "REFERENZBILDER: Die angehängten Bilder zeigen die Charaktere für diese Szene. Generiere das neue Bild basierend auf ihrem Aussehen. WICHTIG: Gesichtszüge, Frisur und Kleidung MÜSSEN zu 100% mit den jeweiligen Referenzbildern übereinstimmen. Alle Personen im Bild MÜSSEN wiedererkennbar sein." });
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: parts }],
                    generationConfig: {
                        responseModalities: ["image"],
                        imageConfig: { aspectRatio: "9:16" }
                    }
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                lastError = `API Error ${response.status}: ${errText}`;
                console.warn(`[Gemini] Attempt ${attempt} failed: ${lastError}`);
                // Simple backoff
                if (attempt < 3) await new Promise(r => setTimeout(r, 1000 * attempt));
                continue;
            }

            const data = await response.json();
            const part = data.candidates?.[0]?.content?.parts?.[0];
            const base64Image = part?.inlineData?.data;
            const mimeType = part?.inlineData?.mimeType || 'image/png';

            if (base64Image) {
                return { image: `data:${mimeType};base64,${base64Image}`, error: null };
            }

            lastError = "No image data in response";
            console.warn(`[Gemini] Attempt ${attempt} returned no image.`);

        } catch (error: any) {
            lastError = error.message || "Unknown error";
            console.error(`[Gemini] Attempt ${attempt} exception:`, error);
        }

        if (attempt < 3) await new Promise(r => setTimeout(r, 1000 * attempt));
    }

    return { image: null, error: `Failed after 3 attempts. Last error: ${lastError}` };
}
