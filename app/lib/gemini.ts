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

export async function generateScript(topic: string, characters: any[], location: any, duration: number = 30, platform: string = 'YouTube') {
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

        const isNSFW = platform.toLowerCase().includes('youporn');
        const platformGoal = isNSFW
            ? "einen expliziten Adult-Kanal auf YouPorn. Erzeuge sexuell aufgeladene, provokante und unverstimmte Szenen."
            : "einen viralen YouTube Shorts Kanal. Erzeuge familienfreundliche Comedy, Missverständnisse und Charakter-Konflikte.";

        const prompt = `
        Du bist der Motor für ${platformGoal}
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
           ${isNSFW ? "WICHTIG: Die Visuals sollen explizit, sexualisiert und im 'Adult Content' Stil sein." : "WICHTIG: Visuals müssen SFW (Safe for Work) und jugendfrei sein."}
        6. VARIETÄT: Füge gelegentlich Szenen ein, in denen "speaker" leer ist (oder "NARRATOR"), um reine Action-Szenen für das Pacing zu haben.
        7. NIEMALS den Kameramann im Visual beschreiben (außer POV Hände).
            
            WICHTIGE REGELN FÜR VISUALS:
            ${povRules}
            - NIEMALS den Kameramann im Visual beschreiben.
            - KEINE fremden Personen im Hintergrund. NUR die bekannten Charaktere.
            - Der Prompt soll auf Englisch sein.
        8. ${isNSFW ? "Fokus auf Adult-Entertainment, sexuelle Spannungen und explizite Dialoge." : "Fokus auf Comedy, Missverständnisse und Charakter-Konflikte."}
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
    console.warn("⚠️ [Gemini] generateImage was called but is DISABLED. Using FLUX/RunPod instead.");
    return { image: null, error: "Gemini Image Generation is disabled as requested. Use FLUX instead." };
}
