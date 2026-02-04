import os
import sys

print("🔍 Debugging PuLID Environment...")

# 1. Check Directory
node_path = "/workspace/ComfyUI/custom_nodes/ComfyUI_PulID"
if os.path.exists(node_path):
    print(f"✅ PuLID folder exists: {node_path}")
    print(f"Contents: {os.listdir(node_path)}")
else:
    print(f"❌ PuLID folder MISSING: {node_path}")

# 2. Check Models
model_path = "/workspace/ComfyUI/models/insightface/models/antelopev2"
if os.path.exists(model_path):
    print(f"✅ Model folder exists: {model_path}")
    files = os.listdir(model_path)
    print(f"Contents: {files}")
    if any(f.endswith('.onnx') for f in files):
        print("✅ ONNX models found.")
    else:
        print("❌ NO ONNX models found!")
else:
    print(f"❌ Model folder MISSING: {model_path}")

# 3. Check Imports
try:
    import insightface
    print(f"✅ insightface imported successfully (Version: {insightface.__version__})")
except ImportError as e:
    print(f"❌ Failed to import insightface: {e}")
except Exception as e:
    print(f"❌ Error importing insightface: {e}")

try:
    import onnxruntime
    print(f"✅ onnxruntime imported (Device: {onnxruntime.get_device()})")
except ImportError:
    print("❌ onnxruntime-gpu NOT installed")
except Exception as e:
    print(f"❌ Error checking onnxruntime: {e}")
