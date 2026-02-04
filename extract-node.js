const fs = require('fs');
const data = JSON.parse(fs.readFileSync('pod_object_info_full.json', 'utf8'));

const nodeName = 'LoadFluxIPAdapter';
if (data[nodeName]) {
    console.log(JSON.stringify(data[nodeName], null, 2));
} else {
    console.log(`${nodeName} not found in JSON`);
}
