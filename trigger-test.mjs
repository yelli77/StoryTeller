// Quick test using Next.js Firebase setup
import { db } from './app/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

async function triggerTest() {
    console.log('🚀 Creating test video request via Next.js Firebase...\n');

    try {
        const docRef = await addDoc(collection(db, 'video_requests'), {
            imageUrl: "https://picsum.photos/720/1280",
            prompt: "Cinematic mountain landscape at sunset with gentle camera movement",
            duration: 5,
            status: "pending",
            createdAt: serverTimestamp()
        });

        console.log('✅ Test created! Document ID:', docRef.id);
        console.log('\n📊 Monitor:');
        console.log(`Firestore: https://console.firebase.google.com/project/abaufdieinsel-23a0e/firestore/data/~2Fvideo_requests~2F${docRef.id}`);
        console.log('Logs: https://console.firebase.google.com/project/abaufdieinsel-23a0e/functions/logs');
        console.log('\n⏳ Expected: 1-2 minutes\n');

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

triggerTest();
