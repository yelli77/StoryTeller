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

if [ ! -d "ComfyUI_PulID_Flux" ]; then
    git clone https://github.com/balmung-git/ComfyUI_PulID_Flux.git
else
    echo "✅ ComfyUI_PulID_Flux already installed."
fi

# 3. Models
echo "📥 Downloading Models (this may take a few minutes)..."

# PuLID Flux Model
if [ ! -f "/workspace/ComfyUI/models/pulid/pulid_flux_v0.9.0.safetensors" ]; then
    wget -O /workspace/ComfyUI/models/pulid/pulid_flux_v0.9.0.safetensors https://huggingface.co/balmung77/Flux/resolve/main/pulid_flux_v0.9.0.safetensors
fi

# CLIP Vision Model (Vit-H)
if [ ! -f "/workspace/ComfyUI/models/clip_vision/clip_vision_vit_h.safetensors" ]; then
    wget -O /workspace/ComfyUI/models/clip_vision/clip_vision_vit_h.safetensors https://huggingface.co/h94/IP-Adapter/resolve/main/models/image_encoder/model.safetensors
fi

# InsightFace Model
if [ ! -f "/workspace/ComfyUI/models/insightface/inswapper_128.onnx" ]; then
    wget -O /workspace/ComfyUI/models/insightface/inswapper_128.onnx https://huggingface.co/ezioruan/inswapper_128.onnx/resolve/main/inswapper_128.onnx
fi

echo "✅ Installation Complete."
echo "🔄 Please restart your ComfyUI Pod now."
