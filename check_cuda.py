import insightface
import onnxruntime as ort
import torch

print(f"Torch GPU available: {torch.cuda.is_available()}")
if torch.cuda.is_available():
    print(f"Current Device: {torch.cuda.get_device_name(0)}")

print(f"ONNXRuntime Providers: {ort.get_available_providers()}")

try:
    # Test InsightFace initialization with GPU
    model = insightface.app.FaceAnalysis(providers=['CUDAExecutionProvider'])
    print("✅ InsightFace successfully requested CUDA.")
except Exception as e:
    print(f"❌ InsightFace CUDA Request Failed: {e}")
