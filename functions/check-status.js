
const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json'); // Use existing service account if available, or initialize default

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: 'abaufdieinsel-23a0e'
    });
}

const db = admin.firestore();

async function checkStatus() {
    try {
        const doc = await db.collection('video_requests').doc('test-request-2').get();
        if (!doc.exists) {
            console.log('Document not found');
            return;
        }
        console.log('STATUS_START');
        console.log(JSON.stringify(doc.data(), null, 2));
        console.log('STATUS_END');
    } catch (error) {
        console.error('Error:', error);
    }
}

checkStatus();
