import os
import sys

print("🔍 DEEP DEBUG: PuLID / InsightFace Initialization")

try:
    import insightface
    from insightface.app import FaceAnalysis
    import onnxruntime
    print(f"✅ Imports OK. InsightFace: {insightface.__version__}, ONNX Provider: {onnxruntime.get_available_providers()}")
except ImportError as e:
    print(f"❌ CRITICAL: Import failed: {e}")
    sys.exit(1)

# Check Paths
model_root = "/workspace/ComfyUI/models/insightface"
antelope_path = os.path.join(model_root, "models", "antelopev2")

print(f"📂 Checking Model Path: {antelope_path}")
if os.path.exists(antelope_path):
    files = os.listdir(antelope_path)
    print(f"   Contents: {files}")
    has_onnx = any(f.endswith('.onnx') for f in files)
    if has_onnx:
        print("   ✅ ONNX files found.")
    else:
        print("   ❌ NO ONNX files found! (Are they in a subfolder?)")
else:
    print("   ❌ Path does not exist!")

# Try Initialization
print("\n⚙️  Attempting to load FaceAnalysis (this mimics PuLID startup)...")
try:
    app = FaceAnalysis(name='antelopev2', root=model_root, providers=['CUDAExecutionProvider', 'CPUExecutionProvider'])
    app.prepare(ctx_id=0, det_size=(640, 640))
    print("✅ SUCCESS: InsightFace loaded AntelopeV2 models!")
except Exception as e:
    print(f"\n❌ FAILED to load FaceAnalysis!")
    print(f"   Error: {e}")
    print("\n💡 HINT: If error is 'assert', it usually means model files are missing/misplaced.")
