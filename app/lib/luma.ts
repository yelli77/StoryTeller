const LUMA_API_KEY = process.env.LUMA_API_KEY;
const MOCK_VIDEO_URL = "https://cdn.pixabay.com/video/2024/02/05/199342-909786638_large.mp4"; // Placeholder neon abstract video

export async function generateVideo(prompt: string, startImage: string, endImage: string) {
    console.log("[Luma Mock] Generating video for:", prompt.substring(0, 30));

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    if (!LUMA_API_KEY) {
        console.warn("Missing LUMA_API_KEY. Returning mock video.");
        return {
            id: "mock-generation-id",
            videoUrl: MOCK_VIDEO_URL,
            status: "completed"
        };
    }

    // TODO: Real Implementation would go here
    // POST https://api.lumalabs.ai/dream-machine/v1/generations

    return {
        id: "mock-generation-id-real-key-missing",
        videoUrl: MOCK_VIDEO_URL,
        status: "completed"
    };
}

export async function checkGenerationStatus(id: string) {
    return {
        id: id,
        status: "completed",
        videoUrl: MOCK_VIDEO_URL
    };
}
