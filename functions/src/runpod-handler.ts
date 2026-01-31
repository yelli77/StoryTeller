import * as functions from "firebase-functions";

const RUNPOD_API_KEY = functions.config().runpod?.api_key || process.env.RUNPOD_API_KEY;
const RUNPOD_POD_ID = functions.config().runpod?.pod_id || process.env.RUNPOD_POD_ID;
const RUNPOD_GRAPHQL_URL = "https://api.runpod.io/graphql";

interface PodInfo {
    id: string;
    ip: string;
    status: string;
}

/**
 * Start (resume) an existing RunPod instance.
 * Since we have a Pod ID, we use the Pods API, not Serverless.
 */
export async function startPod(): Promise<string> {
    // GraphQL mutation to resume the pod
    const mutation = `
    mutation {
      podResume(input: {podId: "${RUNPOD_POD_ID}"}) {
        id
        desiredStatus
      }
    }
  `;

    const response = await fetch(RUNPOD_GRAPHQL_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${RUNPOD_API_KEY}`,
        },
        body: JSON.stringify({ query: mutation }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`RunPod API error: ${response.status} - ${error}`);
    }

    const data = await response.json();

    if (data.errors) {
        throw new Error(`RunPod GraphQL error: ${JSON.stringify(data.errors)}`);
    }

    return RUNPOD_POD_ID;
}

/**
 * Get the status and IP address of a RunPod instance.
 * Polls until the Pod is ready (status: RUNNING).
 */
export async function getPodStatus(podId: string): Promise<PodInfo> {
    const maxAttempts = 60; // 5 minutes max wait
    const delayMs = 5000; // Check every 5 seconds

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const query = `
      query {
        pod(input: {podId: "${podId}"}) {
          id
          runtime {
            uptimeInSeconds
            ports {
              ip
              isIpPublic
              privatePort
              publicPort
              type
            }
          }
          desiredStatus
        }
      }
    `;

        const response = await fetch(RUNPOD_GRAPHQL_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${RUNPOD_API_KEY}`,
            },
            body: JSON.stringify({ query }),
        });

        if (!response.ok) {
            throw new Error(`Failed to get Pod status: ${response.status}`);
        }

        const data = await response.json();

        if (data.errors) {
            throw new Error(`RunPod GraphQL error: ${JSON.stringify(data.errors)}`);
        }

        const pod = data.data?.pod;
        const status = pod?.desiredStatus;

        if (status === "RUNNING" && pod?.runtime) {
            // Find the public IP from ports
            const publicPort = pod.runtime.ports?.find((p: any) => p.isIpPublic);
            const ip = publicPort?.ip || pod.runtime.ports?.[0]?.ip;

            return {
                id: podId,
                ip: ip,
                status,
            };
        }

        if (status === "EXITED" || status === "FAILED") {
            throw new Error(`Pod ${podId} is in ${status} state`);
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
    const mutation = `
    mutation {
      podStop(input: {podId: "${podId}"}) {
        id
        desiredStatus
      }
    }
  `;

    const response = await fetch(RUNPOD_GRAPHQL_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${RUNPOD_API_KEY}`,
        },
        body: JSON.stringify({ query: mutation }),
    });

    if (!response.ok) {
        functions.logger.warn(`Failed to stop Pod ${podId}: ${response.status}`);
    }
}
