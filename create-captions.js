const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, 'public', 'characters', 'clara', 'references');
const TRIGGER_WORD = "clara_character";

// 20 Diverse Reference Prompts (COPIED from generate-clara-refs.js)
const PROMPTS = [
    { name: "01_Front_Full", text: "standing front view, looking directly at camera, full body shot, arms at sides, neutral expression" },
    { name: "02_Front_Close", text: "extreme close up of face, front view, looking at camera, detailed eyes, glasses, neutral expression" },
    { name: "03_Side_Left_Full", text: "standing profile view from left side, full body, looking straight ahead" },
    { name: "04_Side_Right_Full", text: "standing profile view from right side, full body, looking straight ahead" },
    { name: "05_Back_Full", text: "standing back view, full body, looking away from camera, showing hair and figure from behind" },
    { name: "06_ThreeQ_Left", text: "standing 3/4 view from left, looking at camera, one hand on hip" },
    { name: "07_ThreeQ_Right", text: "standing 3/4 view from right, looking at camera, relaxed pose" },
    { name: "08_Looking_Over_Shoulder", text: "view from behind, turning head to look over shoulder at camera, waist up" },
    { name: "09_Sitting_Chair_Front", text: "sitting on a simple chair, front view, hands in lap, legs together" },
    { name: "10_Sitting_Floor_Side", text: "sitting on floor, side profile view, hugging knees" },
    { name: "11_Walking_Towards", text: "walking directly towards camera, full body, dynamic motion" },
    { name: "12_Walking_Away", text: "walking away from camera, back view, full body" },
    { name: "13_High_Angle", text: "high angle shot looking down, standing, looking up at camera" },
    { name: "14_Low_Angle", text: "low angle shot looking up, heroic pose, standing tall" },
    { name: "15_Dutch_Angle", text: "dutch angle, dynamic pose, turning quickly, hair flowing" },
    { name: "16_Close_Side_Profile", text: "extreme close up of face, side profile, detailed skin texture" },
    { name: "17_Leaning_Wall", text: "leaning back against a white wall, relaxed, hands behind back, full body" },
    { name: "18_Arms_Crossed", text: "standing front view, arms crossed under chest, confident expression" },
    { name: "19_Silhouette", text: "strong silhouette lighting, standing front view, outlining hourglass figure and curves" },
    { name: "20_Passport", text: "passport style photo, dead center front, neck up, neutral lighting, flat background" },

    // --- NEW: HEAD & FACE SPECIFIC ANGLES ---
    { name: "21_Head_Front_Macro", text: "macro shot of face, front view, focus on eyes and skin texture, neutral expression" },
    { name: "22_Head_Profile_Left", text: "headshot, strict side profile view looking left, neutral expression, focus on nose and jawline" },
    { name: "23_Head_Profile_Right", text: "headshot, strict side profile view looking right, neutral expression, focus on nose and jawline" },
    { name: "24_Head_3Q_Left", text: "head and shoulders portrait, 3/4 view looking left, soft lighting" },
    { name: "25_Head_3Q_Right", text: "head and shoulders portrait, 3/4 view looking right, soft lighting" },
    { name: "26_Head_Back", text: "close up of back of head, showing hair texture and style, no face visible" },
    { name: "27_Head_Chin_Up", text: "close up face, tilting head back looking up, showing neck, confident" },
    { name: "28_Head_Chin_Down", text: "close up face, tilting head down, looking up through eyebrows, shy or intense" },
    { name: "29_Head_Top_Down", text: "extreme high angle close up looking down at face, focus on eyelashes and nose bridge" },
    { name: "30_Head_Bottom_Up", text: "extreme low angle close up looking up at chin and jawline, dominance" },
    { name: "31_Expression_Laugh", text: "close up face, laughing naturally, eyes closed slightly, showing teeth" },
    { name: "32_Expression_Serious", text: "close up face, very serious intensity, direct eye contact" },
    { name: "33_Hair_Movement", text: "close up headshot, wind blowing hair across face, dynamic hair motion" },
    { name: "34_Glasses_Reflection", text: "close up face with glasses, reflections in lenses, studio lighting" },
    { name: "35_Beauty_Portrait", text: "beauty portrait, perfect soft lighting, rembrandt lighting, detailed makeup and skin" }
];

console.log(`📝 Generating captions in ${OUTPUT_DIR}...`);

if (!fs.existsSync(OUTPUT_DIR)) {
    console.error(`❌ Output dir not found: ${OUTPUT_DIR}`);
    process.exit(1);
}

let count = 0;
for (const p of PROMPTS) {
    const filename = `${p.name}.txt`;
    // The "Gold Standard" Caption: Trigger Word + Description
    const caption = `${TRIGGER_WORD}, ${p.text}`;

    fs.writeFileSync(path.join(OUTPUT_DIR, filename), caption);
    console.log(`   ✅ Wrote ${filename}`);
    count++;
}

console.log(`🎉 Finished! Created ${count} caption files.`);
