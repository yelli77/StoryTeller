export interface KieVideoGenerationResult {
    success: boolean;
    videoUrl?: string;
    error?: string;
    taskId?: string;
    state?: string;
}

const API_KEY = process.env.KIE_AI_API_KEY;
const BASE_URL = 'https://api.kie.ai';
const UPLOAD_URL = 'https://kieai.redpandaai.co/api/file-base64-upload';

/**
 * Uploads a base64 image to Kie.ai's temporary storage to get a public URL
 */
async function uploadImageToKie(base64Data: string): Promise<string | null> {
    if (!API_KEY) return null;

    try {
        console.log("[Kie] Uploading image for video generation...");
        const response = await fetch(UPLOAD_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                base64Data,
                uploadPath: "storyteller",
                fileName: `frame-${Date.now()}.png`
            })
        });

        const data = await response.json();
        if (data.success && data.data && data.data.downloadUrl) {
            console.log("[Kie] Image uploaded successfully:", data.data.downloadUrl);
            return data.data.downloadUrl;
        } else {
            console.warn("[Kie] Upload failed, will try text-to-video fallback:", data.msg);
            return null;
        }
    } catch (e) {
        console.error("[Kie] Image upload exception:", e);
        return null;
    }
}

/**
 * Starts a video generation task on Kie.ai using Kling 2.6
 */
export async function startKieVideoGeneration(prompt: string, startImageUrl?: string): Promise<KieVideoGenerationResult> {
    if (!API_KEY) {
        console.error("[Kie] Missing KIE_AI_API_KEY in environment");
        return { success: false, error: "KIE_AI_API_KEY not configured" };
    }

    // Attempt to upload image if provided
    let publicImageUrl = null;
    if (startImageUrl && startImageUrl.startsWith('data:')) {
        publicImageUrl = await uploadImageToKie(startImageUrl);
    } else if (startImageUrl && startImageUrl.startsWith('http')) {
        publicImageUrl = startImageUrl;
    }

    if (!publicImageUrl) {
        console.error("[Kie] Image-to-Video requires a valid public image URL.");
        return { success: false, error: "Missing or invalid start image for video generation." };
    }

    try {
        const payload = {
            model: "kling/v2-5-turbo-image-to-video-pro",
            callBackUrl: "https://example.com/webhook",
            input: {
                prompt,
                image_url: publicImageUrl,
                duration: "5",
                cfg_scale: 0.5,
                sound: true
            }
        };

        console.log(`[Kie] Starting Image-to-Video with KLING 2.5 PRO: "${prompt.substring(0, 30)}..."`);
        console.log("[Kie] Payload DEBUG:", JSON.stringify(payload, null, 2));

        const response = await fetch(`${BASE_URL}/api/v1/jobs/createTask`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.code === 200 && data.data && data.data.taskId) {
            console.log(`[Kie] Task Created: ${data.data.taskId}`);
            return { success: true, taskId: data.data.taskId };
        } else {
            console.error("[Kie] Creation Error:", data.msg);
            return { success: false, error: data.msg || "Failed to start image-to-video generation" };
        }
    } catch (error) {
        console.error("[Kie] Exception during start:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

/**
 * Polls for the result of a Kie.ai task
 */
export async function pollKieVideoStatus(taskId: string): Promise<KieVideoGenerationResult> {
    if (!API_KEY) {
        return { success: false, error: "KIE_AI_API_KEY not configured" };
    }

    try {
        const response = await fetch(`${BASE_URL}/api/v1/jobs/recordInfo?taskId=${taskId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${API_KEY}`
            }
        });

        const data = await response.json();

        if (data.code === 200 && data.data) {
            const taskData = data.data;
            if (taskData.state === 'success' && taskData.resultJson) {
                const result = JSON.parse(taskData.resultJson);
                if (result.resultUrls && result.resultUrls.length > 0) {
                    console.log(`[Kie] Task ${taskId} finished successfully!`);
                    return { success: true, videoUrl: result.resultUrls[0] };
                }
            } else if (taskData.state === 'failed' || taskData.state === 'failure' || taskData.state === 'fail') {
                console.error(`[Kie] Task ${taskId} failed:`, taskData.failMsg || data.msg);
                return { success: false, error: taskData.failMsg || data.msg || "Task failed" };
            }
            // Keep polling
            console.log(`[Kie] Task ${taskId} state: ${taskData.state}...`);
            return { success: true, taskId, state: taskData.state };
        } else {
            return { success: false, error: data.msg || "Failed to poll status" };
        }
    } catch (error) {
        console.error(`[Kie] Exception during poll (${taskId}):`, error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

/**
 * Full generation workflow: Start and Poll
 */
export async function generateKieVideo(prompt: string, startImageUrl?: string): Promise<KieVideoGenerationResult> {
    const startResult = await startKieVideoGeneration(prompt, startImageUrl);
    if (!startResult.success || !startResult.taskId) {
        return startResult;
    }

    const taskId = startResult.taskId;
    // Poll for up to 10 minutes (60 * 10 seconds)
    console.log(`[Kie] Polling for task ${taskId}...`);
    for (let i = 0; i < 60; i++) {
        await new Promise(r => setTimeout(r, 10000));
        const pollResult = await pollKieVideoStatus(taskId);

        if (pollResult.videoUrl) {
            return pollResult;
        }
        if (!pollResult.success) {
            return pollResult;
        }
    }

    console.warn(`[Kie] Task ${taskId} timed out.`);
    return { success: false, error: "Timed out waiting for video generation" };
}
