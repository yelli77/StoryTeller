const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const BASE_URL = "https://api.elevenlabs.io/v1";

export async function generateSpeech(text: string, voiceId: string) {
    if (!ELEVENLABS_API_KEY) {
        console.error("CRITICAL: ELEVENLABS_API_KEY is missing in your .env.local file. Voice generation will not work.");
        return null;
    }

    try {
        const response = await fetch(`${BASE_URL}/text-to-speech/${voiceId}`, {
            method: "POST",
            headers: {
                "Accept": "audio/mpeg",
                "Content-Type": "application/json",
                "xi-api-key": ELEVENLABS_API_KEY,
            },
            body: JSON.stringify({
                text: text,
                model_id: "eleven_multilingual_v2", // Multilingual for German support
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75,
                },
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail?.message || "Failed to generate speech");
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        return buffer.toString("base64");
    } catch (error) {
        console.error("ElevenLabs API Error:", error);
        throw error;
    }
}

export async function getVoices() {
    if (!ELEVENLABS_API_KEY) return [];

    try {
        const response = await fetch(`${BASE_URL}/voices`, {
            headers: { "xi-api-key": ELEVENLABS_API_KEY }
        });
        const data = await response.json();
        return data.voices;
    } catch (error) {
        console.error("Failed to fetch voices:", error);
        return [];
    }
}
