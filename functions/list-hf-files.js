
const fetch = require('node-fetch');

async function listHFFiles(repo) {
    try {
        console.log(`Listing files for ${repo}...`);
        const response = await fetch(`https://huggingface.co/api/models/${repo}/tree/main`);
        if (!response.ok) throw new Error(`Status ${response.status}`);
        const files = await response.json();
        console.log(`--- ${repo} ---`);
        files.forEach(f => console.log(f.path));
    } catch (e) {
        console.error(`Error listing ${repo}: ${e.message}`);
    }
}

async function run() {
    await listHFFiles('Kijai/HunyuanVideo_comfy');
    await listHFFiles('calcuis/hunyuan-gguf');
    await listHFFiles('Comfy-Org/HunyuanVideo_rephased');
}

run();
