# Clara LoRA Training Configuration
# For use with Kohya_ss or similar LoRA training tools

## Dataset Information
- **Character**: Clara
- **Training Images**: 30 images
- **Resolution**: 1024x1024
- **Format**: PNG

## Training Parameters (Recommended)

### Basic Settings
```
model_name: RealVisXL_V4.0_Lightning
base_model: SDXL 1.0
resolution: 1024
batch_size: 1
epochs: 10-15
```

### LoRA Settings
```
network_dim: 32
network_alpha: 16
learning_rate: 1e-4
lr_scheduler: cosine_with_restarts
optimizer: AdamW8bit
```

### Advanced Settings
```
gradient_accumulation_steps: 1
mixed_precision: fp16
save_precision: fp16
clip_skip: 2
noise_offset: 0.05
```

## Trigger Word
**Activation**: `clara_character`

**Usage in prompts**:
- `clara_character, sitting on a chair`
- `clara_character, standing in a park`
- `clara_character, professional photograph`

## Training Steps

### 1. Prepare Dataset
- Run `generate-clara-lora-dataset.js`
- Download all 30 images from ComfyUI output folder
- Create folder structure:
  ```
  clara_lora/
    ├── images/
    │   ├── Clara_LoRA_Training_001.png
    │   ├── Clara_LoRA_Training_002.png
    │   └── ... (30 images total)
    └── captions/
        ├── Clara_LoRA_Training_001.txt
        ├── Clara_LoRA_Training_002.txt
        └── ... (30 captions)
  ```

### 2. Create Captions
Each .txt file should contain:
```
clara_character, young woman, long brown hair, gray tank top, athletic build
```

### 3. Start Training
Using Kohya_ss GUI or command line:
```bash
accelerate launch --num_cpu_threads_per_process=2 train_network.py \
  --pretrained_model_name_or_path="RealVisXL_V4.0_Lightning.safetensors" \
  --train_data_dir="./clara_lora/images" \
  --output_dir="./output" \
  --output_name="clara_lora" \
  --network_module=networks.lora \
  --network_dim=32 \
  --network_alpha=16 \
  --learning_rate=1e-4 \
  --max_train_epochs=15 \
  --resolution=1024 \
  --train_batch_size=1 \
  --mixed_precision="fp16" \
  --save_precision="fp16" \
  --optimizer_type="AdamW8bit" \
  --lr_scheduler="cosine_with_restarts"
```

### 4. Testing
After training, test with:
```
clara_character, sitting on a chair, professional photograph
```

Expected: Perfect Clara face consistency!

## Estimated Costs (RunPod)
- Dataset Generation: ~$0.50 (30 minutes on RTX 4090)
- LoRA Training: ~$2-3 (2-3 hours on RTX 4090)
- **Total**: ~$3-4

## Integration into StoryTeller
Once trained, the LoRA will be loaded automatically when generating images with Clara as the character reference.

## Notes
- Training time: 2-3 hours on RTX 4090
- Final LoRA size: ~50-100 MB
- Can be used with any SDXL-based model
- Trigger word `clara_character` must be in prompt
