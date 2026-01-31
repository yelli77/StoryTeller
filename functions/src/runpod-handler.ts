import * as functions from "firebase-functions";

const RUNPOD_API_KEY = functions.config().runpod?.api_key || process.env.RUNPOD_API_KEY;
const RUNPOD_TEMPLATE_ID = functions.config().runpod?.template_id || process.env.RUNPOD_TEMPLATE_ID;
const RUNPOD_API_URL = "https://api.runpod.io/v2";

interface PodInfo {
    id: string;
    ip: string;
    status: string;
}

/**
 * Start a new RunPod instance with the specified template (RTX 5090 + ComfyUI).
 */
export async function startPod(): Promise<string> {
    const response = await fetch(`${RUNPOD_API_URL}/${RUNPOD_TEMPLATE_ID}/run`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${RUNPOD_API_KEY}`,
        },
        body: JSON.stringify({
            input: {},
            // Optional: specify GPU type
            gpuTypeId: "NVIDIA RTX 5090",
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`RunPod API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.id;
}

/**
 * Get the status and IP address of a RunPod instance.
 * Polls until the Pod is ready (status: RUNNING).
 */
export async function getPodStatus(podId: string): Promise<PodInfo> {
    const maxAttempts = 60; // 5 minutes max wait
    const delayMs = 5000; // Check every 5 seconds

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const response = await fetch(`${RUNPOD_API_URL}/${RUNPOD_TEMPLATE_ID}/status/${podId}`, {
            headers: {
                "Authorization": `Bearer ${RUNPOD_API_KEY}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to get Pod status: ${response.status}`);
        }

        const data = await response.json();
        const status = data.status;

        if (status === "COMPLETED" || status === "RUNNING") {
            return {
                id: podId,
                ip: data.ip || data.output?.ip,
                status,
            };
        }

        if (status === "FAILED") {
            throw new Error(`Pod ${podId} failed to start`);
        }

        // Wait before next attempt
        await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    throw new Error(`Pod ${podId} did not become ready within 5 minutes`);
}

/**
 * Stop a RunPod instance to avoid idle charges.
 */
export async function stopPod(podId: string): Promise<void> {
    const response = await fetch(`${RUNPOD_API_URL}/${RUNPOD_TEMPLATE_ID}/cancel/${podId}`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${RUNPOD_API_KEY}`,
        },
    });

    if (!response.ok) {
        functions.logger.warn(`Failed to stop Pod ${podId}: ${response.status}`);
    }
}
