const fs = require('fs');
const data = JSON.parse(fs.readFileSync('pod_object_info_clean.json', 'utf8'));

const nodesToCheck = ['easy pulIDApply', 'ReActorFaceSwap', 'easy ipadapterApplyFaceIDKolors'];
const info = {};

for (const node of nodesToCheck) {
    if (data[node]) {
        info[node] = data[node].input;
    } else {
        info[node] = 'MISSING';
    }
}

console.log(JSON.stringify(info, null, 2));
fs.writeFileSync('pod_special_nodes_info.json', JSON.stringify(info, null, 2));
