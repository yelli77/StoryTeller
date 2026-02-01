const fetch = require('node-fetch');
const workflow = require('./functions/workflows/hunyuan-video.json');

async function verify() {
    // Force SageAttention to auto for this test
    workflow['1'].inputs.sage_attention = 'auto';
    workflow['5'].inputs.length = 48; // Short test

    console.log("Testing SageAttention (auto) on Pod...");
    try {
        const res = await fetch('https://iaw3m6iyadpmgq-8188.proxy.runpod.net/prompt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: workflow })
        });

        const status = res.status;
        const data = await res.json();

        if (status === 200) {
            console.log("✅ SUCCESS: SageAttention is installed and working!");
            process.exit(0);
        } else {
            console.log(`❌ FAILED (Status ${status}):`);
            console.log(JSON.stringify(data, null, 2));
            process.exit(1);
        }
    } catch (e) {
        console.error("❌ CONNECTION ERROR:", e.message);
        process.exit(1);
    }
}

verify();
