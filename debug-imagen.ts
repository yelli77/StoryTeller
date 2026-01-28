
const API_KEY = "AIzaSyA1RbyaEJPyFR7A-DeW4ELRC1OnEZapNTE";

async function generateImage(prompt) {
    if (!API_KEY) {
        console.log("No API Key");
        return null;
    }

    try {
        console.log("Attempting Imagen...");
        const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${API_KEY}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                instances: [
                    { prompt: `Cinematic shot, photorealistic, 8k, detailed: ${prompt}` }
                ],
                parameters: {
                    sampleCount: 1,
                    aspectRatio: "16:9"
                }
            })
        });

        if (!response.ok) {
            console.log(`Imagen API Error Status: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.log("Error Body:", text);
            throw new Error(`Imagen API Error: ${response.statusText}`);
        }

        const data = await response.json();
        const base64Image = data.predictions?.[0]?.bytesBase64Encoded || data.predictions?.[0]?.mimeType ? data.predictions[0] : null; // simplified check

        if (base64Image) {
            console.log("SUCCESS: Received base64 image data.");
            return `data:image/png;base64,...`;
        } else {
            console.log("FAILURE: No image data in response.", JSON.stringify(data).substring(0, 200));
        }

        return null;

    } catch (error) {
        console.warn("Imagen generation failed:", error);
        return null;
    }
}

generateImage("A futuristic city skyline at night with neon lights");
