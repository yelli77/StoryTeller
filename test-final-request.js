// Final test - Create Firestore document via Firebase Admin SDK
// ComfyUI is confirmed running on Pod 8t1hif70q426k9

const admin = require('firebase-admin');

// Use service account or default credentials
const serviceAccount = require('./serviceAccountKey.json'); // You'll need to download this

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'abaufdieinsel-23a0e'
});

const db = admin.firestore();

async function createFinalTest() {
    try {
        console.log('🚀 Creating FINAL test video request...\n');

        // Delete old failed requests first
        const oldDocs = await db.collection('video_requests')
            .where('status', '==', 'failed')
            .get();

        console.log(`Deleting ${oldDocs.size} old failed requests...`);
        const batch = db.batch();
        oldDocs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();

        // Create new test request
        const testRequest = {
            imageUrl: "https://picsum.photos/720/1280",
            prompt: "Cinematic shot of a beautiful mountain landscape at sunset with gentle camera movement",
            duration: 5,
            status: "pending",
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await db.collection('video_requests').add(testRequest);

        console.log('✅ FINAL test video request created!');
        console.log('📋 Document ID:', docRef.id);
        console.log('\n📊 Monitor progress:');
        console.log(`   Firestore: https://console.firebase.google.com/project/abaufdieinsel-23a0e/firestore/data/~2Fvideo_requests~2F${docRef.id}`);
        console.log('   Logs: https://console.firebase.google.com/project/abaufdieinsel-23a0e/functions/logs');
        console.log('\n⏳ Expected timeline:');
        console.log('   - Pod Resume: 5s');
        console.log('   - ComfyUI Wait: 30s');
        console.log('   - Video Gen: 30-60s');
        console.log('   - Upload: 10s');
        console.log('   - TOTAL: ~1-2 minutes');
        console.log('\n💰 Estimated cost: ~$0.05\n');

        // Monitor status
        console.log('👀 Watching for status updates...\n');
        const unsubscribe = docRef.onSnapshot((snapshot) => {
            const data = snapshot.data();
            if (data) {
                const timestamp = new Date().toLocaleTimeString();
                console.log(`[${timestamp}] Status: ${data.status}`);

                if (data.status === 'completed') {
                    console.log('\n🎉🎉🎉 VIDEO GENERATION COMPLETED! 🎉🎉🎉');
                    console.log('📹 Video URL:', data.videoUrl);
                    console.log('\n✅ Cloud GPU Pipeline is FULLY OPERATIONAL!');
                    unsubscribe();
                    process.exit(0);
                } else if (data.status === 'failed') {
                    console.log('\n❌ Video generation failed!');
                    console.log('Error:', data.error);
                    unsubscribe();
                    process.exit(1);
                }
            }
        });

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

createFinalTest();
