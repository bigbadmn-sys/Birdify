#!/bin/bash

# Birdify Video Pipeline Script
# Converts bird illustration (image) + field guide audio (mp3/wav) to Instagram-ready MP4.

# Usage: ./birdify-video.sh <image> <audio> <output_name> [text_overlay]

IMAGE=$1
AUDIO=$2
OUTPUT="${3:-birdify_post.mp4}"
TEXT=$4

if [[ -z "$IMAGE" || -z "$AUDIO" ]]; then
    echo "Usage: ./birdify-video.sh <image_path> <audio_path> [output_path] [text]"
    exit 1
fi

# Specs for Instagram: 1080x1080, 30fps, H.264, AAC
# -loop 1: Loop the single image
# -tune stillimage: Optimization for static imagery
# -pix_fmt yuv420p: Required for mobile compatibility
# -shortest: End video when the audio ends

ffmpeg -loop 1 -i "$IMAGE" -i "$AUDIO" \
    -c:v libx264 -tune stillimage -preset medium \
    -c:a aac -b:a 192k -ar 44100 \
    -pix_fmt yuv420p \
    -vf "scale=1080:1080:force_original_aspect_ratio=increase,crop=1080:1080,fade=t=in:st=0:d=1,fade=t=out:st=9:d=1" \
    -shortest \
    -y "$OUTPUT"

echo "✅ Video generated: $OUTPUT"
echo "Specs: 1080x1080, H.264, AAC, Instagram Optimized."
