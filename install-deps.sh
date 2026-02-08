#!/bin/bash
echo "🚀 Starting StoryTeller Environment Setup..."

# Navigate to ComfyUI
cd /workspace/ComfyUI/custom_nodes

# 1. Install ComfyUI-Manager (Essential)
if [ ! -d "ComfyUI-Manager" ]; then
    echo "📦 Installing ComfyUI-Manager..."
    git clone https://github.com/ltdrdata/ComfyUI-Manager.git
else
    echo "✅ ComfyUI-Manager already installed."
fi

# 1.5. Install Prerequisites (InsightFace & ONNX)
echo "🔧 Installing InsightFace & ONNX Runtime (Critical for PuLID)..."
pip install insightface onnxruntime-gpu

# 2. Install PuLID Flux (Native Identity)
if [ ! -d "ComfyUI-PuLID-Flux" ]; then
    echo "📦 Installing ComfyUI-PuLID-Flux..."
    git clone https://github.com/balazik/ComfyUI-PuLID-Flux.git
    cd ComfyUI-PuLID-Flux
    pip install -r requirements.txt
    cd ..
else
    echo "✅ PuLID Flux already installed."
fi

# 3. Apply Patch for Flux Guidance (If needed, typically managed by ComfyUI updates now)

# 4. Download Weights
echo "⬇️  Downloading Models..."
cd /workspace/ComfyUI/models

# PuLID
mkdir -p pulid
cd pulid
if [ ! -f "pulid_flux_v0.9.0.safetensors" ]; then
    wget -O pulid_flux_v0.9.0.safetensors https://huggingface.co/guozinan/PuLID/resolve/main/pulid_flux_v0.9.0.safetensors
fi
cd ..

# InsightFace
mkdir -p insightface/models
cd insightface/models
if [ ! -f "antelopev2.zip" ]; then
    wget https://github.com/deepinsight/insightface/releases/download/v0.7/antelopev2.zip
    unzip antelopev2.zip
fi
cd ../..

echo "✅ Setup Complete! Please restart ComfyUI."
