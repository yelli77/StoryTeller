// Simplified test using Firebase REST API (no auth needed for Firestore REST API with proper rules)
// Alternative: Use Firebase CLI

const https = require('https');

const projectId = 'abaufdieinsel-23a0e';
const collection = 'video_requests';

// Generate a unique document ID
const docId = `test-${Date.now()}`;

const testRequest = {
    fields: {
        imageUrl: { stringValue: "https://picsum.photos/720/1280" },
        prompt: { stringValue: "Cinematic shot of a beautiful mountain landscape at sunset" },
        duration: { integerValue: "5" },
        status: { stringValue: "pending" },
        createdAt: { timestampValue: new Date().toISOString() }
    }
};

const options = {
    hostname: 'firestore.googleapis.com',
    port: 443,
    path: `/v1/projects/${projectId}/databases/(default)/documents/${collection}?documentId=${docId}`,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    }
};

console.log('🚀 Creating test video request via REST API...\n');
console.log(`📋 Document ID: ${docId}\n`);

const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
            console.log('✅ Test video request created successfully!\n');
            console.log('📊 Monitor progress:');
            console.log(`   Firestore: https://console.firebase.google.com/project/${projectId}/firestore/data/~2F${collection}~2F${docId}`);
            console.log(`   Logs: https://console.firebase.google.com/project/${projectId}/functions/logs`);
            console.log('\n⏳ Expected completion: 2-4 minutes');
            console.log('💰 Estimated cost: ~$0.12\n');
            console.log('👉 Open the Firestore link above to watch status change from "pending" → "processing" → "completed"');
        } else {
            console.log(`❌ Error: HTTP ${res.statusCode}`);
            console.log('Response:', data);
            console.log('\n💡 Alternative: Create the document manually in Firebase Console:');
            console.log(`   https://console.firebase.google.com/project/${projectId}/firestore`);
        }
    });
});

req.on('error', (error) => {
    console.error('❌ Request failed:', error.message);
    console.log('\n💡 Please create the document manually in Firebase Console:');
    console.log(`   https://console.firebase.google.com/project/${projectId}/firestore`);
    console.log('\nDocument data:');
    console.log(JSON.stringify({
        imageUrl: "https://picsum.photos/720/1280",
        prompt: "Cinematic shot of a beautiful mountain landscape at sunset",
        duration: 5,
        status: "pending",
        createdAt: new Date()
    }, null, 2));
});

req.write(JSON.stringify(testRequest));
req.end();
