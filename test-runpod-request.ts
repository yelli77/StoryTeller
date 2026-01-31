// Test script to create a video request in Firestore
// This will trigger the Cloud Function to start RunPod and generate a video

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: "abaufdieinsel-23a0e",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function createTestVideoRequest() {
    try {
        console.log('Creating test video request...');

        const testRequest = {
            imageUrl: "https://storage.googleapis.com/your-bucket/test-image.jpg", // Replace with actual image URL
            prompt: "Cinematic shot of a beautiful landscape",
            duration: 5,
            status: "pending",
            createdAt: Timestamp.now(),
        };

        const docRef = await addDoc(collection(db, "video_requests"), testRequest);
        console.log('✅ Test video request created with ID:', docRef.id);
        console.log('📊 Monitor progress in Firebase Console:');
        console.log(`   https://console.firebase.google.com/project/abaufdieinsel-23a0e/firestore/data/video_requests/${docRef.id}`);
        console.log('\n🔍 Watch Cloud Function logs:');
        console.log('   https://console.firebase.google.com/project/abaufdieinsel-23a0e/functions/logs');

    } catch (error) {
        console.error('❌ Error creating test request:', error);
    }
}

createTestVideoRequest();
