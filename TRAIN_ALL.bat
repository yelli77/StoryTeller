@echo off
echo ========================================================
echo        STORYTELLER CHARACTER LORA TRAINER
echo ========================================================
echo.
echo This script assumes you have kohya_ss / accelerate installed.
echo If not, please activate your venv first.
echo.

set "ROOT_DIR=%~dp0\training_data"
set "MODEL_PATH=RealVisXL_V4.0_Lightning.safetensors" 
:: Update MODEL_PATH to point to your actual .safetensors file if not in root

:: --- CLARA ---
echo --------------------------------------------------------
echo  TRAINING CLARA...
echo --------------------------------------------------------
accelerate launch --num_cpu_threads_per_process=2 train_network.py ^
  --pretrained_model_name_or_path="%MODEL_PATH%" ^
  --train_data_dir="%ROOT_DIR%\clara_lora" ^
  --output_dir="%~dp0\output" ^
  --output_name="clara_lora_v1" ^
  --network_module=networks.lora ^
  --network_dim=32 --network_alpha=16 --network_train_unet_only ^
  --learning_rate=1e-4 --unet_lr=1e-4 --text_encoder_lr=1e-5 ^
  --max_train_epochs=15 ^
  --resolution=1024,1024 ^
  --train_batch_size=1 ^
  --mixed_precision="fp16" --save_precision="fp16" ^
  --optimizer_type="AdamW8bit" ^
  --lr_scheduler="cosine_with_restarts" ^
  --caption_extension=".txt"

:: --- EMILY ---
echo --------------------------------------------------------
echo  TRAINING EMILY...
echo --------------------------------------------------------
accelerate launch --num_cpu_threads_per_process=2 train_network.py ^
  --pretrained_model_name_or_path="%MODEL_PATH%" ^
  --train_data_dir="%ROOT_DIR%\emily_lora" ^
  --output_dir="%~dp0\output" ^
  --output_name="emily_lora_v1" ^
  --network_module=networks.lora ^
  --network_dim=32 --network_alpha=16 --network_train_unet_only ^
  --learning_rate=1e-4 --unet_lr=1e-4 --text_encoder_lr=1e-5 ^
  --max_train_epochs=15 ^
  --resolution=1024,1024 ^
  --train_batch_size=1 ^
  --mixed_precision="fp16" --save_precision="fp16" ^
  --optimizer_type="AdamW8bit" ^
  --lr_scheduler="cosine_with_restarts" ^
  --caption_extension=".txt"

:: --- MIA ---
echo --------------------------------------------------------
echo  TRAINING MIA...
echo --------------------------------------------------------
accelerate launch --num_cpu_threads_per_process=2 train_network.py ^
  --pretrained_model_name_or_path="%MODEL_PATH%" ^
  --train_data_dir="%ROOT_DIR%\mia_lora" ^
  --output_dir="%~dp0\output" ^
  --output_name="mia_lora_v1" ^
  --network_module=networks.lora ^
  --network_dim=32 --network_alpha=16 --network_train_unet_only ^
  --learning_rate=1e-4 --unet_lr=1e-4 --text_encoder_lr=1e-5 ^
  --max_train_epochs=15 ^
  --resolution=1024,1024 ^
  --train_batch_size=1 ^
  --mixed_precision="fp16" --save_precision="fp16" ^
  --optimizer_type="AdamW8bit" ^
  --lr_scheduler="cosine_with_restarts" ^
  --caption_extension=".txt"

echo.
echo ========================================================
echo  ALL TRAINING COMPLETE!
echo  Check the /output folder for your .safetensors files.
echo ========================================================
pause
