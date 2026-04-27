# Birdify: Video Pipeline Documentation

## 1. Setup Instructions

### macOS
1. Install Homebrew (if not installed): `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`
2. Install ffmpeg: `brew install ffmpeg`

### Linux (Ubuntu/Debian)
1. `sudo apt update`
2. `sudo apt install ffmpeg`

## 2. Command Explanation

The core command used in Phase 1:

```bash
ffmpeg -loop 1 -i bird.png -i voiceover.mp3 \
  -c:v libx264 -tune stillimage -pix_fmt yuv420p \
  -vf "scale=1080:1080:force_original_aspect_ratio=increase,crop=1080:1080" \
  -c:a aac -shortest \
  output.mp4
```

### Parameters Breakdown:
- `-loop 1 -i bird.png`: Takes the static image and loops it as a video stream.
- `-c:v libx264`: Encodes video using the H.264 codec (universal for social).
- `-tune stillimage`: Tells the encoder the input is a single image to save bitrate.
- `-pix_fmt yuv420p`: Essential for compatibility with iPhones and mobile browsers.
- `-vf "scale=1080:1080:force_original_aspect_ratio=increase,crop=1080:1080"`: 
  - Scales the image to fill 1080x1080.
  - Crops any overflow to maintain a perfect square for Instagram.
- `-c:a aac`: Encodes audio to AAC format (Instagram requirement).
- `-shortest`: Forces the video to stop as soon as the audio ends.

## 3. Instagram Specifications
- **Format:** MP4
- **Resolution:** 1080 x 1080 (1:1 aspect ratio)
- **Frame Rate:** 30 FPS
- **Video Codec:** H.264
- **Audio Codec:** AAC (44.1 kHz, 128kbps+)
- **File Size:** Under 100MB (This script produces <10MB for typical voiceovers).

## 4. Troubleshooting
- **Black Screen:** Ensure `-pix_fmt yuv420p` is present.
- **Audio/Video Out of Sync:** Ensure the audio file is not corrupted; try converting audio to `.wav` first.
- **Failed Upload:** Check that the resolution is exactly 1080x1080.
