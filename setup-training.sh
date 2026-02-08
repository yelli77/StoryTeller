#!/bin/bash
echo "🚀 Setting up Ostris AI-Toolkit for Flux Training..."

cd /workspace

# 1. Clone Repo
if [ ! -d "ai-toolkit" ]; then
    echo "📦 Cloning ai-toolkit..."
    git clone https://github.com/ostris/ai-toolkit.git
else
    echo "✅ ai-toolkit already cloned."
fi

# 2. Install Dependencies
cd ai-toolkit
echo "🔧 Installing requirements..."
pip install -r requirements.txt

# 2.5 Fix Mediapipe/Protobuf/Numpy Conflict (The "Nuclear" Option)
echo "🚑 Applying Robust Dependency Fix..."
pip uninstall -y mediapipe protobuf numpy
pip install "numpy<2" "protobuf==3.20.3" "mediapipe>=0.10.0"

# 3. Create Config Directory (if needed)
mkdir -p config

echo "✅ AI-Toolkit Ready!"
echo "➡️  Next: Upload the 'clara_v1.yaml' config file."
