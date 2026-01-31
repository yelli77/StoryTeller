import { db } from "./firebase";
import { collection, addDoc, doc, onSnapshot, Timestamp } from "firebase/firestore";

export interface VideoRequest {
    imageUrl: string;
    audioUrl?: string;
    prompt: string;
    duration: 5 | 10;
    status: "pending" | "processing" | "completed" | "failed";
    videoUrl?: string;
    error?: string;
    createdAt: Timestamp;
    updatedAt?: Timestamp;
    completedAt?: Timestamp;
}

/**
 * Create a new video generation request in Firestore.
 * The Cloud Function will automatically pick it up and process it via RunPod + ComfyUI.
 */
export async function createVideoRequest(params: {
    imageUrl: string;
    audioUrl?: string;
    prompt: string;
    duration?: 5 | 10;
}): Promise<string> {
    const request: Partial<VideoRequest> = {
        imageUrl: params.imageUrl,
        audioUrl: params.audioUrl,
        prompt: params.prompt,
        duration: params.duration || 5,
        status: "pending",
        createdAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, "video_requests"), request);
    return docRef.id;
}

/**
 * Subscribe to real-time updates for a video request.
 * Returns an unsubscribe function.
 */
export function subscribeToVideoRequest(
    requestId: string,
    onUpdate: (request: VideoRequest & { id: string }) => void
): () => void {
    const docRef = doc(db, "video_requests", requestId);

    return onSnapshot(docRef, (snapshot) => {
        if (snapshot.exists()) {
            onUpdate({ id: snapshot.id, ...snapshot.data() } as VideoRequest & { id: string });
        }
    });
}
