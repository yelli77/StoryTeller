const { runSingle, pollResult } = require('./likeness-utils');

async function main() {
    try {
        const prompt = process.argv[2] || "(extremely wide round puffy face:2.8), (no neck visible:2.8)";
        const weight = parseFloat(process.argv[3]) || 0.4;
        const cfg = parseFloat(process.argv[4]) || 1.5;

        console.log(`🚀 Running Loop Step with:`);
        console.log(`   Prompt: ${prompt}`);
        console.log(`   Weight: ${weight}`);
        console.log(`   CFG:    ${cfg}`);

        const pid = await runSingle(prompt, weight, cfg);
        if (!pid) {
            console.error("❌ Failed to submit job.");
            return;
        }
        const success = await pollResult(pid);

        if (success) {
            console.log("🏁 Iteration Complete. Check public/current_tuning.png");
        } else {
            console.log("❌ Iteration Failed (No data).");
        }
    } catch (e) {
        console.error("💥 Loop Error:", e);
    }
}

main();
