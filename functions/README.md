# Firebase Cloud Functions - Video Generation Pipeline

This directory contains Firebase Cloud Functions that orchestrate video generation using RunPod RTX 5090 instances and ComfyUI with the Wan 2.1 model.

## Architecture

1. **Firestore Trigger**: `onVideoRequestCreated` listens for new documents in `video_requests`
2. **RunPod Provisioning**: Starts an RTX 5090 instance with ComfyUI pre-installed
3. **ComfyUI Generation**: Connects via WebSocket and executes the Wan 2.1 workflow
4. **Auto-Stop**: Terminates the Pod immediately after video upload to minimize costs

## Setup

### 1. Install Dependencies
```bash
cd functions
npm install
```

### 2. Configure Environment Variables
```bash
cp .env.example .env
# Edit .env and add your RunPod API key and template ID
```

### 3. Set Firebase Config (Alternative to .env)
```bash
firebase functions:config:set runpod.api_key="YOUR_API_KEY"
firebase functions:config:set runpod.template_id="YOUR_TEMPLATE_ID"
```

### 4. Build TypeScript
```bash
npm run build
```

### 5. Deploy to Firebase
```bash
npm run deploy
```

## Local Testing

```bash
npm run serve
```

## Firestore Schema

### Collection: `video_requests`

```typescript
{
  id: string;
  imageUrl: string;        // Firebase Storage URL
  audioUrl?: string;       // Optional for lip-sync
  prompt: string;
  duration: 5 | 10;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;       // Populated after generation
  error?: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  completedAt?: Timestamp;
}
```

## Cost Optimization

- **Auto-Stop**: Pod is terminated within 60 seconds of completion
- **Estimated Cost**: ~$0.15 per 10s video (vs. $0.70 on Kie.ai)
- **Savings**: ~78%

## Troubleshooting

### VRAM Out of Memory
- Reduce resolution in `workflows/wan-2.1-i2v.json`
- Decrease `steps` parameter

### Pod Timeout
- Increase `maxAttempts` in `runpod-handler.ts`
- Check RunPod dashboard for Pod status

### WebSocket Connection Failed
- Verify ComfyUI is running on the Pod
- Check firewall rules on RunPod template
