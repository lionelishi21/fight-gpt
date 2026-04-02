#!/bin/bash
# Test script for Gemini integration with Docker

echo "🧪 Testing Gemini Integration with Docker"
echo "========================================"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop."
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Check if services are up
echo "📡 Checking if API service is running..."
if curl -s http://localhost:8000/ > /dev/null 2>&1; then
    echo "✅ API service is running on port 8000"
    echo ""
    echo "Testing health endpoint..."
    curl -s http://localhost:8000/ | jq .
    echo ""
    echo "✅ To test Gemini integration, send a POST request:"
    echo ""
    echo "curl -X POST http://localhost:8000/analyze \\"
    echo "  -H 'Content-Type: application/json' \\"
    echo "  -d '{\"youtube_url\": \"https://www.youtube.com/watch?v=YOUR_VIDEO_ID\"}'"
    echo ""
    echo "The response should include 'gemini_analysis' if Gemini is working."
else
    echo "⚠️  API service is not running"
    echo ""
    echo "To start the services, run:"
    echo "  docker-compose up --build"
    echo ""
    echo "Then wait for the services to start and run this test again."
fi

