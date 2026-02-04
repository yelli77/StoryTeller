#!/bin/bash

# ComfyUI Pod Restoration Script
# Sets up ComfyUI-Manager, PuLID Flux, and required models

echo "🚀 Starting Pod Restoration..."

# 1. Directories
mkdir -p /workspace/ComfyUI/custom_nodes
mkdir -p /workspace/ComfyUI/models/pulid
mkdir -p /workspace/ComfyUI/models/clip_vision
mkdir -p /workspace/ComfyUI/models/insightface

# 2. Custom Nodes
echo "📥 Installing Custom Nodes..."
cd /workspace/ComfyUI/custom_nodes

if [ ! -d "ComfyUI-Manager" ]; then
    git clone https://github.com/ltdrdata/ComfyUI-Manager.git
else
    echo "✅ ComfyUI-Manager already installed."
fi

# Use the Enhanced version of PuLID Flux (often more stable/featured)
echo "🧹 Cleaning up previous PuLID attempts..."
rm -rf ComfyUI_PulID_Flux ComfyUI-PuLID-Flux ComfyUI_PulID

echo "📥 Cloning PuLID Flux Enhanced..."
git clone https://github.com/sipie800/ComfyUI-PuLID-Flux-Enhanced.git ComfyUI-PuLID-Flux

echo "📦 Installing Python dependencies..."
cd ComfyUI-PuLID-Flux
python3 -m pip install -r requirements.txt
cd ..

# 3. Models
echo "📥 Downloading Models (this may take a few minutes)..."

# PuLID Flux Model
if [ ! -f "/workspace/ComfyUI/models/pulid/pulid_flux_v0.9.0.safetensors" ]; then
    wget -O /workspace/ComfyUI/models/pulid/pulid_flux_v0.9.0.safetensors https://huggingface.co/balmung77/Flux/resolve/main/pulid_flux_v0.9.0.safetensors
fi

# CLIP Vision / Eva-CLIP (Vit-H is used by PuLID)
if [ ! -f "/workspace/ComfyUI/models/clip_vision/clip_vision_vit_h.safetensors" ]; then
    wget -O /workspace/ComfyUI/models/clip_vision/clip_vision_vit_h.safetensors https://huggingface.co/h94/IP-Adapter/resolve/main/models/image_encoder/model.safetensors
fi

# Some versions/nodes expect this exact filename
if [ ! -f "/workspace/ComfyUI/models/clip_vision/EVA02_CLIP_H_14_336_fp16.safetensors" ]; then
    cp /workspace/ComfyUI/models/clip_vision/clip_vision_vit_h.safetensors /workspace/ComfyUI/models/clip_vision/EVA02_CLIP_H_14_336_fp16.safetensors
fi

# InsightFace Model
if [ ! -f "/workspace/ComfyUI/models/insightface/inswapper_128.onnx" ]; then
    wget -O /workspace/ComfyUI/models/insightface/inswapper_128.onnx https://huggingface.co/ezioruan/inswapper_128.onnx/resolve/main/inswapper_128.onnx
fi

echo "✅ Installation Complete."
echo "🔄 Please restart your ComfyUI Pod now."
