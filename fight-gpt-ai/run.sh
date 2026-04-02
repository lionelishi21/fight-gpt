#!/bin/bash

# Fight GPT AI Coach - Docker Helper Script

set -e

echo "🥋 Fight GPT AI Coach - Docker Helper"
echo "====================================="
echo ""

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo "❌ Error: Docker is not running!"
        echo "Please start Docker Desktop and try again."
        exit 1
    fi
    echo "✅ Docker is running"
}

# Function to build the Docker image
build() {
    echo ""
    echo "🔨 Building Docker image..."
    docker-compose build --no-cache
    echo "✅ Build complete!"
}

# Function to start the services
start() {
    echo ""
    echo "🚀 Starting Fight GPT AI Coach..."
    docker-compose up -d
    echo ""
    echo "✅ Service started!"
    echo "📡 API is running at: http://localhost:8000"
    echo "🔍 View logs with: ./run.sh logs"
    echo "🛑 Stop with: ./run.sh stop"
}

# Function to stop the services
stop() {
    echo ""
    echo "🛑 Stopping Fight GPT AI Coach..."
    docker-compose down
    echo "✅ Service stopped!"
}

# Function to show logs
logs() {
    echo ""
    echo "📋 Showing logs (Ctrl+C to exit)..."
    docker-compose logs -f
}

# Function to restart services
restart() {
    stop
    start
}

# Function to test the API
test() {
    echo ""
    echo "🧪 Testing API..."
    echo ""
    
    # Test health endpoint
    echo "Testing health endpoint..."
    response=$(curl -s http://localhost:8000/)
    if [[ $response == *"Fight GPT"* ]]; then
        echo "✅ Health check passed!"
        echo "Response: $response"
    else
        echo "❌ Health check failed!"
        echo "Response: $response"
        exit 1
    fi
}

# Function to show status
status() {
    echo ""
    echo "📊 Container Status:"
    docker-compose ps
}

# Function to clean up everything
clean() {
    echo ""
    echo "🧹 Cleaning up..."
    docker-compose down -v
    echo "✅ Cleanup complete!"
}

# Main menu
case "$1" in
    build)
        check_docker
        build
        ;;
    start)
        check_docker
        start
        ;;
    stop)
        check_docker
        stop
        ;;
    restart)
        check_docker
        restart
        ;;
    logs)
        check_docker
        logs
        ;;
    test)
        test
        ;;
    status)
        check_docker
        status
        ;;
    clean)
        check_docker
        clean
        ;;
    *)
        echo "Usage: $0 {build|start|stop|restart|logs|test|status|clean}"
        echo ""
        echo "Commands:"
        echo "  build    - Build the Docker image"
        echo "  start    - Start the services"
        echo "  stop     - Stop the services"
        echo "  restart  - Restart the services"
        echo "  logs     - View service logs"
        echo "  test     - Test the API"
        echo "  status   - Show container status"
        echo "  clean    - Clean up containers and volumes"
        echo ""
        exit 1
        ;;
esac

exit 0


