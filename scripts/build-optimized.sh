#!/bin/bash

# Build optimization script for faster builds
export NEXT_TELEMETRY_DISABLED=1
export NODE_OPTIONS="--max-old-space-size=4096"
export GENERATE_SOURCEMAP=false

echo "🚀 Starting optimized build..."
echo "Memory limit: 4GB"
echo "Source maps: Disabled"
echo "Telemetry: Disabled"

# Run the build
npm run build

echo "✅ Build completed!" 