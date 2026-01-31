import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { startPod, stopPod, getPodStatus } from "./runpod-handler";
import { generateVideo } from "./comfyui-client";

admin.initializeApp();

/**
 * Cloud Function triggered when a video request is updated in Firestore.
 * Provisions a RunPod RTX 5090 instance, generates video via ComfyUI, and auto-stops the Pod.
 */
export const onVideoRequestCreated = functions
    .runWith({
        timeoutSeconds: 540, // 9 minutes (video generation can take 1-3 minutes)
        memory: "1GB",
    })
    .firestore
    .document("video_requests/{requestId}")
    .onUpdate(async (change, context) => {
        const requestId = context.params.requestId;
        const data = change.after.data();

        // If data is undefined (e.g., document somehow became empty, though unlikely for onUpdate),
        // or if the status is not 'pending', then skip processing.
        if (!data || data.status !== 'pending') {
            functions.logger.info(`[${requestId}] Skipping - status is ${data?.status || 'unknown'}`);
            return;
        }

        // Ensure required fields exist before destructuring
        if (!('imageUrl' in data) || !('prompt' in data)) {
            functions.logger.error(`[${requestId}] Missing required fields (imageUrl or prompt) in document data.`);
            await change.after.ref.update({
                status: "failed",
                error: "Missing required input fields (imageUrl, prompt).",
                failedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            return;
        }

        const { imageUrl, audioUrl, prompt, duration = 5 } = data;

        try {
            // Update status to processing
            await change.after.ref.update({ status: "processing", updatedAt: admin.firestore.FieldValue.serverTimestamp() });

            // Step 1: Start RunPod instance
            functions.logger.info(`[${requestId}] Starting RunPod instance...`);
            const podId = await startPod();
            functions.logger.info(`[${requestId}] Pod started: ${podId}`);

            // Step 2: Wait for Pod to be ready
            const podInfo = await getPodStatus(podId);

            // Step 2.5: Wait for ComfyUI to start (it needs time to boot)
            functions.logger.info(`[${requestId}] Pod is ready. Waiting 30s for ComfyUI to start...`);
            await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds

            // Use RunPod proxy URL for external connections
            const comfyUIUrl = podInfo.proxyUrl;

            // Step 3: Connect to ComfyUI and generate video
            functions.logger.info(`[${requestId}] Connecting to ComfyUI at ${comfyUIUrl}`);
            const videoUrl = await generateVideo(comfyUIUrl, {
                imageUrl,
                audioUrl,
                prompt,
                duration,
            });

            // Step 4: Update Firestore with result
            await change.after.ref.update({
                status: "completed",
                videoUrl,
                completedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            functions.logger.info(`[${requestId}] Video generated successfully: ${videoUrl}`);

            // Step 5: Stop the Pod immediately to save costs
            await stopPod(podId);
            functions.logger.info(`[${requestId}] Pod ${podId} stopped`);
        } catch (error: any) {
            functions.logger.error(`[${requestId}] Error:`, error);
            await change.after.ref.update({
                status: "failed",
                error: error.message,
                failedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
    });
