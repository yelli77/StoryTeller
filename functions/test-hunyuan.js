
const WebSocket = require("ws");
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");

async function runTest() {
    const podId = "iaw3m6iyadpmgq";
    const baseUrl = `https://${podId}-8188.proxy.runpod.net`;
    const wsUrl = `wss://${podId}-8188.proxy.runpod.net/ws`;
    const clientId = `test-${Date.now()}`;

    console.log("🚀 Starting HunyuanVideo Corrected Test...");

    try {
        // 1. Load and Prepare Workflow
        const workflowPath = path.join(__dirname, "workflows/hunyuan-video.json");
        const workflowTemplate = JSON.parse(fs.readFileSync(workflowPath, "utf-8"));

        const params = {
            prompt: "A beautiful cinematic shot of a sunset over a digital ocean, cyberpunk style, high quality",
            duration: 49 // 49 frames = approx 2 seconds at 24fps
        };

        let workflowString = JSON.stringify(workflowTemplate)
            .replace(/\{\{PROMPT\}\}/g, params.prompt)
            .replace(/\{\{DURATION\}\}/g, params.duration.toString());

        const workflow = JSON.parse(workflowString);

        // 2. Start WebSocket for monitoring
        const ws = new WebSocket(wsUrl);
        let solved = false;

        ws.on("open", () => {
            console.log("✅ WebSocket Connected");
        });

        ws.on("message", (data) => {
            const message = JSON.parse(data.toString());
            if (message.type === "progress") {
                console.log(`📊 Progress: ${message.data.value}/${message.data.max}`);
            }
            if (message.type === "executed" && message.data.node === "10") {
                console.log("🎬 Video generated! Node 10 finished.");
                solved = true;
                ws.close();
            }
        });

        // 3. POST Prompt to API (this actually triggers the work)
        console.log("📡 Sending POST request to trigger generation...");
        const response = await fetch(`${baseUrl}/prompt`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: workflow, client_id: clientId })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${await response.text()}`);
        }

        const resData = await response.json();
        console.log(`✅ Prompt accepted! ID: ${resData.prompt_id}`);
        console.log("⏳ Waiting for generation (check your GPU Telemetry now, it should jump up soon!)");

        // Wait for completion or timeout
        let timeout = 600; // 10 minutes
        while (!solved && timeout > 0) {
            await new Promise(r => setTimeout(r, 1000));
            timeout--;
        }

        if (solved) {
            console.log("🏁 TEST FINISHED SUCCESSFULLY!");
        } else {
            console.error("❌ Timeout reached without completion signal.");
        }

    } catch (error) {
        console.error("❌ ERROR:", error.message);
    }
}

runTest();
