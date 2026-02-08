#!/bin/bash
OUTPUT_DIR="/workspace/training/output/clara_v1"
COMFY_LORA_DIR="/workspace/ComfyUI/models/loras"

echo "🕵️‍♀️  Inspecting Training Output..."

if [ -d "$OUTPUT_DIR" ]; then
    # Look for the final LoRA file (or the latest step)
    LORA_FILE=$(find "$OUTPUT_DIR" -name "*.safetensors" | sort | tail -n 1)

    if [ -n "$LORA_FILE" ]; then
        echo "✅ SUCCESS! Found LoRA: $LORA_FILE"
        echo "📦 File size:"
        ls -lh "$LORA_FILE" | awk '{print $5}'
        
        echo "🚚 Moving to ComfyUI..."
        mkdir -p "$COMFY_LORA_DIR"
        cp "$LORA_FILE" "$COMFY_LORA_DIR/clara_v1.safetensors"
        
        if [ -f "$COMFY_LORA_DIR/clara_v1.safetensors" ]; then
             echo "🎉 INSTALLED! Ready to use in ComfyUI as 'clara_v1.safetensors'"
        else
             echo "❌ Copy failed."
        fi
    else
        echo "⚠️  No .safetensors file found yet."
        echo "📸 Latest Samples:"
        ls -lh "$OUTPUT_DIR/samples" | tail -n 5
    fi
else
    echo "❌ Output directory '$OUTPUT_DIR' does not exist."
fi
