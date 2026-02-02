const fs = require('fs');
const path = require('path');

// Configuration
const TRAINING_ROOT = path.join(__dirname, 'training_data');
const PUBLIC_ROOT = path.join(__dirname, 'public', 'characters');
const CHARACTERS_FILE = path.join(__dirname, 'data', 'characters.json');

// Character mapping: keys expected in training_data, maps to folder name in public
// Assuming training data is like: clara_lora/10_clara_character
// And we want public/characters/clara
const CHAR_MAP = {
    'clara': 'clara',
    'emily': 'emily',
    'mia': 'mia'
};

function transferImages() {
    // 1. Read characters.json
    let characters = [];
    try {
        const raw = fs.readFileSync(CHARACTERS_FILE, 'utf8');
        characters = JSON.parse(raw);
    } catch (e) {
        console.error("Could not read characters.json:", e);
        return;
    }

    // 2. Process each character
    for (const [key, name] of Object.entries(CHAR_MAP)) {
        console.log(`Processing ${name}...`);

        // Find source directory
        // Pattern: {key}_lora/10_{key}_character
        // But the directory might be slightly different depending on Kohya naming.
        // We know from previous 'ls' it looks like: clara_lora/10_clara_character

        const sourceDir = path.join(TRAINING_ROOT, `${key}_lora`, `10_${key}_character`);

        if (!fs.existsSync(sourceDir)) {
            console.warn(`Source directory not found: ${sourceDir}`);
            continue;
        }

        // Create target directory
        const targetDir = path.join(PUBLIC_ROOT, name, 'ref');
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        // Get images
        const files = fs.readdirSync(sourceDir).filter(f => f.endsWith('.png'));

        const newRefImages = [];

        files.forEach((file, index) => {
            const srcPath = path.join(sourceDir, file);
            // Rename to clean format: ref_1.png, ref_2.png
            const newName = `ref_${index + 1}.png`;
            const destPath = path.join(targetDir, newName);

            // Copy file
            fs.copyFileSync(srcPath, destPath);
            // console.log(`Copied ${file} -> ${newName}`);

            // Add relative path for web usage
            newRefImages.push(`/characters/${name}/ref/${newName}`);
        });

        console.log(`Successfully transferred ${files.length} images for ${name}.`);

        // Update characters.json object
        // Find character in array by simplistic matching (lowercase name)
        const charObj = characters.find(c => c.name.toLowerCase().includes(key));
        if (charObj) {
            charObj.referenceImages = newRefImages;
            console.log(`Updated character record for ${charObj.name}`);
        } else {
            console.warn(`Could not find character entry for ${name} in json.`);
        }
    }

    // 3. Save characters.json
    fs.writeFileSync(CHARACTERS_FILE, JSON.stringify(characters, null, 2));
    console.log("Updated data/characters.json with new reference paths.");
}

transferImages();
