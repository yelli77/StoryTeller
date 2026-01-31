import WebSocket from "ws";
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import * as fs from "fs";
import * as path from "path";

interface VideoGenerationParams {
    imageUrl: string;
    audioUrl?: string;
    prompt: string;
    duration: number;
}

/**
 * Connect to ComfyUI WebSocket API and generate a video using the Wan 2.1 workflow.
 */
export async function generateVideo(
    comfyUIUrl: string,
    params: VideoGenerationParams
): Promise<string> {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(comfyUIUrl);
        let clientId: string | null = null;

        ws.on("open", async () => {
            functions.logger.info("Connected to ComfyUI WebSocket");

            try {
                // Load workflow template
                const workflowPath = path.join(__dirname, "../workflows/wan-2.1-i2v.json");
                const workflowTemplate = JSON.parse(fs.readFileSync(workflowPath, "utf-8"));

                // Inject parameters into workflow
                const workflow = injectParameters(workflowTemplate, params);

                // Generate a unique client ID
                clientId = `firebase-${Date.now()}`;

                // Send workflow to ComfyUI
                ws.send(JSON.stringify({
                    type: "execute",
                    data: {
                        prompt: workflow,
                        client_id: clientId,
                    },
                }));

                functions.logger.info("Workflow sent to ComfyUI");
            } catch (error) {
                reject(error);
            }
        });

        ws.on("message", async (data: WebSocket.Data) => {
            try {
                const message = JSON.parse(data.toString());

                // Check for completion
                if (message.type === "executed" && message.data.node === "SaveVideo") {
                    const videoPath = message.data.output.videos[0].filename;
                    functions.logger.info(`Video generated: ${videoPath}`);

                    // Download video from ComfyUI and upload to Firebase Storage
                    const videoUrl = await uploadVideoToStorage(comfyUIUrl, videoPath);
                    ws.close();
                    resolve(videoUrl);
                }

                // Check for errors
                if (message.type === "execution_error") {
                    ws.close();
                    reject(new Error(`ComfyUI execution error: ${JSON.stringify(message.data)}`));
                }
            } catch (error) {
                functions.logger.error("Error parsing WebSocket message:", error);
            }
        });

        ws.on("error", (error) => {
            functions.logger.error("WebSocket error:", error);
            reject(error);
        });

        ws.on("close", () => {
            functions.logger.info("WebSocket connection closed");
        });

        // Timeout after 10 minutes
        setTimeout(() => {
            ws.close();
            reject(new Error("Video generation timed out after 10 minutes"));
        }, 10 * 60 * 1000);
    });
}

/**
 * Inject dynamic parameters into the ComfyUI workflow template.
 */
function injectParameters(workflow: any, params: VideoGenerationParams): any {
    const workflowCopy = JSON.parse(JSON.stringify(workflow));

    // Replace placeholders in the workflow
    const workflowString = JSON.stringify(workflowCopy)
        .replace(/\{\{IMAGE_URL\}\}/g, params.imageUrl)
        .replace(/\{\{AUDIO_URL\}\}/g, params.audioUrl || "")
        .replace(/\{\{PROMPT\}\}/g, params.prompt)
        .replace(/\{\{DURATION\}\}/g, params.duration.toString());

    return JSON.parse(workflowString);
}

/**
 * Download the generated video from ComfyUI and upload it to Firebase Storage.
 */
async function uploadVideoToStorage(comfyUIUrl: string, videoPath: string): Promise<string> {
    const baseUrl = comfyUIUrl.replace("ws://", "http://").replace("/ws", "");
    const videoUrl = `${baseUrl}/view?filename=${encodeURIComponent(videoPath)}`;

    // Download video
    const response = await fetch(videoUrl);
    if (!response.ok) {
        throw new Error(`Failed to download video: ${response.status}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    // Upload to Firebase Storage
    const bucket = admin.storage().bucket();
    const fileName = `generated-videos/${Date.now()}-${path.basename(videoPath)}`;
    const file = bucket.file(fileName);

    await file.save(buffer, {
        metadata: {
            contentType: "video/mp4",
        },
    });

    // Make file publicly accessible
    await file.makePublic();

    return `https://storage.googleapis.com/${bucket.name}/${fileName}`;
}

/**
 * Placeholder function to connect to ComfyUI (for future use).
 */
export async function connectToComfyUI(url: string): Promise<void> {
    // This function can be used for initial connection testing if needed
    functions.logger.info(`Connecting to ComfyUI at ${url}`);
}
