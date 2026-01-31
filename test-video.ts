import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function test() {
    console.log("Starting test...");
    const { generateKieVideo } = await import('./app/lib/kie');
    const prompt = "A beautiful sunset over the mountains.";
    const dummyImage = "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Altja_j%C3%B5gi_Lahemaal.jpg/1200px-Altja_j%C3%B5gi_Lahemaal.jpg";

    // Test with image
    console.log("Testing with prompt and dummy image...");
    const result = await generateKieVideo(prompt, dummyImage);
    console.log("Result:", JSON.stringify(result, null, 2));
}

test();
