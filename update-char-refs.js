const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'data', 'characters.json');
const charData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const CHARS = ['Clara', 'Emily', 'Mia'];
const VARIANTS = ['bodysuit', 'naked'];
const COUNT = 10;

const updatedData = charData.map(char => {
    if (!CHARS.includes(char.name)) return char;

    const newRefs = [...(char.referenceImages || [])];

    for (const variant of VARIANTS) {
        for (let i = 1; i <= COUNT; i++) {
            const relPath = `/characters/${char.name.toLowerCase()}/ref/ref_4k_${variant}_${i}.png`;
            if (!newRefs.includes(relPath)) {
                newRefs.push(relPath);
            }
        }
    }

    return { ...char, referenceImages: newRefs };
});

fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2));
console.log("✅ characters.json updated with 4K references");
