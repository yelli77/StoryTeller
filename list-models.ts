const API_KEY = "AIzaSyA1RbyaEJPyFR7A-DeW4ELRC1OnEZapNTE";

async function listModels() {
    if (!API_KEY) {
        console.log("No API Key");
        return;
    }

    try {
        console.log("Listing Models...");
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.models) {
            console.log("Available Models:");
            data.models.forEach((m: any) => console.log(`- ${m.name} (${m.supportedGenerationMethods})`));
        } else {
            console.log("No models found or error structure:", data);
        }

    } catch (error) {
        console.error("List Models failed:", error);
    }
}

listModels();

export { };
