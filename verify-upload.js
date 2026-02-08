const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const POD_ID = process.env.RUNPOD_POD_ID;
const BASE_URL = `https://${POD_ID}-8188.proxy.runpod.net`;
const FILENAME = 'install-deps.sh';

async function verify() {
    console.log(`🔍 Checking if ${FILENAME} exists on Pod ${POD_ID}...`);
    const url = `${BASE_URL}/view?filename=${FILENAME}&type=input`;

    try {
        const res = await fetch(url);
        if (res.ok) {
            console.log("✅ File FOUND on server!");
            console.log("It is definitely in the 'input' folder of ComfyUI.");
        } else {
            console.error(`❌ File NOT found (Status: ${res.status})`);
        }
    } catch (e) {
        console.error("❌ Connection failed:", e.message);
    }
}

verify();
