const fs = require('fs');
const data = JSON.parse(fs.readFileSync('pod_object_info_clean.json', 'utf8'));

const xlabsNodes = Object.keys(data).filter(k => k.toLowerCase().includes('xlabs') || data[k].category?.toLowerCase().includes('xlabs'));
const faceNodes = Object.keys(data).filter(k => k.toLowerCase().includes('face') || k.toLowerCase().includes('pulid') || k.toLowerCase().includes('insight'));

console.log("XLabs Nodes:", xlabsNodes);
console.log("Face/PuLID/Insight Nodes:", faceNodes);
