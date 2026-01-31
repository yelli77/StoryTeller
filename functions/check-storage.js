
const admin = require('firebase-admin');

if (!admin.apps.length) {
    admin.initializeApp({
        projectId: 'abaufdieinsel-23a0e',
        storageBucket: 'abaufdieinsel-23a0e.firebasestorage.app'
    });
}

async function checkStorage() {
    try {
        const [files] = await admin.storage().bucket().getFiles({ prefix: 'generated-videos/' });
        console.log('STORAGE_START');
        files.forEach(f => console.log(f.name));
        console.log('STORAGE_END');
    } catch (e) {
        console.error(e);
    }
}

checkStorage();
