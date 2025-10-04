#!/bin/bash

# Build script for 50 State License Plate Game
# This script helps with common development tasks

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to clean the project
clean_project() {
    print_status "Cleaning project..."
    
    # Clean React Native
    npx react-native clean
    
    # Clean iOS
    if [ -d "ios" ]; then
        cd ios
        xcodebuild clean -workspace StateGameApp.xcworkspace -scheme StateGameApp
        cd ..
    fi
    
    # Clean Android
    if [ -d "android" ]; then
        cd android
        ./gradlew clean
        cd ..
    fi
    
    print_status "Project cleaned successfully!"
}

# Function to install dependencies
install_deps() {
    print_status "Installing dependencies..."
    npm install
    
    if [ -d "ios" ]; then
        print_status "Installing iOS pods..."
        cd ios && pod install && cd ..
    fi
    
    print_status "Dependencies installed successfully!"
}

# Function to run tests
run_tests() {
    print_status "Running tests..."
    npm test
}

# Function to lint code
lint_code() {
    print_status "Linting code..."
    npm run lint
}

# Main script logic
case "$1" in
    "clean")
        clean_project
        ;;
    "install")
        install_deps
        ;;
    "test")
        run_tests
        ;;
    "lint")
        lint_code
        ;;
    "setup")
        print_status "Setting up development environment..."
        install_deps
        clean_project
        print_status "Development environment ready!"
        ;;
    *)
        echo "Usage: $0 {clean|install|test|lint|setup}"
        echo ""
        echo "Commands:"
        echo "  clean   - Clean all build artifacts"
        echo "  install - Install all dependencies"
        echo "  test    - Run tests"
        echo "  lint    - Run linter"
        echo "  setup   - Complete development setup"
        exit 1
        ;;
esac
