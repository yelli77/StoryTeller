import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { startPod, stopPod, getPodStatus } from "./runpod-handler";
import { generateVideo } from "./comfyui-client";

admin.initializeApp();

/**
 * Cloud Function triggered when a new video request is created in Firestore.
 * Provisions a RunPod RTX 5090 instance, generates video via ComfyUI, and auto-stops the Pod.
 */
export const onVideoRequestCreated = functions.firestore
    .document("video_requests/{requestId}")
    .onCreate(async (snapshot, context) => {
        const requestId = context.params.requestId;
        const data = snapshot.data();

        const { imageUrl, audioUrl, prompt, duration = 5 } = data;

        try {
            // Update status to processing
            await snapshot.ref.update({ status: "processing", updatedAt: admin.firestore.FieldValue.serverTimestamp() });

            // Step 1: Start RunPod instance
            functions.logger.info(`[${requestId}] Starting RunPod instance...`);
            const podId = await startPod();
            functions.logger.info(`[${requestId}] Pod started: ${podId}`);

            // Step 2: Wait for Pod to be ready
            const podInfo = await getPodStatus(podId);
            const comfyUIUrl = `ws://${podInfo.ip}:8188/ws`;

            // Step 3: Connect to ComfyUI and generate video
            functions.logger.info(`[${requestId}] Connecting to ComfyUI at ${comfyUIUrl}`);
            const videoUrl = await generateVideo(comfyUIUrl, {
                imageUrl,
                audioUrl,
                prompt,
                duration,
            });

            // Step 4: Update Firestore with result
            await snapshot.ref.update({
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
            await snapshot.ref.update({
                status: "failed",
                error: error.message,
                failedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
    });
