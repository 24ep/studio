#!/bin/bash

echo "🔧 Setting up environment configuration..."

# Check if .env file already exists
if [ -f ".env" ]; then
    echo "⚠️  .env file already exists. Backing up to .env.backup"
    cp .env .env.backup
fi

# Generate a secure API key
API_KEY=$(openssl rand -base64 32 2>/dev/null || echo "studio_processor_key_$(date +%s)_$(openssl rand -hex 8 2>/dev/null || echo $RANDOM)")

echo "🔑 Generated PROCESSOR_API_KEY: $API_KEY"

# Copy template and replace placeholder values
cp env.internal.template .env

# Replace the PROCESSOR_API_KEY placeholder
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/# PROCESSOR_API_KEY=your_processor_api_key/PROCESSOR_API_KEY=$API_KEY/" .env
else
    # Linux
    sed -i "s/# PROCESSOR_API_KEY=your_processor_api_key/PROCESSOR_API_KEY=$API_KEY/" .env
fi

echo "✅ Environment file created with PROCESSOR_API_KEY"
echo "📝 Please review .env file and update other values as needed"
echo "🚀 To start all services including queue processor, run:"
echo "   docker-compose up -d" 