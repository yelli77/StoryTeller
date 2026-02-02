const fs = require('fs');
const https = require('https');
const path = require('path');

const POD_ID = 'g4oysjh535la54';
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`; // ComfyUI port usually
// But for executing shell commands, we technically need the SSH or Jupyter port usually.
// However, allow me to try a trick: Using ComfyUI's "SaveImage" node to write a shell script and "LoadImage" (with a custom node if available) to execute? No, too hacky.

// Let's check what nodes are available. If "ComfyUI-Manager" is there, we can install "ComfyUI-Kohya-SS".
// THIS IS THE BEST WAY: Install the Kohya-SS Custom Node for ComfyUI.

async function checkNodes() {
    console.log("🔍 Checking for Kohya nodes on RunPod...");

    return new Promise((resolve, reject) => {
        https.get(`${BASE_URL}/object_info`, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    const keys = Object.keys(json);

                    const hasKohya = keys.some(k => k.toLowerCase().includes('kohya') || k.toLowerCase().includes('train'));

                    if (hasKohya) {
                        console.log("✅ Kohya/Training nodes FOUND!");
                        console.log("   Available: " + keys.filter(k => k.toLowerCase().includes('kohya')));
                        resolve(true);
                    } else {
                        console.log("❌ No Training nodes found.");
                        console.log("   We need to install 'ComfyUI-Advanced-LoRA-Training' or similar.");
                        resolve(false);
                    }
                } catch (e) { reject(e); }
            });
        }).on('error', reject);
    });
}

checkNodes();
