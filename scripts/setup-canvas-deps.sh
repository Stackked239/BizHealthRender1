#!/bin/bash
# ============================================================================
# BizHealth Canvas Dependencies Setup Script
# ============================================================================
#
# The 'canvas' npm package requires native system libraries to compile.
# This script installs the required dependencies for server-side chart rendering.
#
# Supported platforms:
#   - Ubuntu/Debian (apt-get)
#   - macOS (Homebrew)
#   - Alpine Linux (apk)
#
# Usage:
#   ./scripts/setup-canvas-deps.sh
#
# ============================================================================

set -e

echo "============================================"
echo "BizHealth Canvas Dependencies Setup"
echo "============================================"

# Detect OS
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Check for specific Linux distributions
    if command -v apt-get &> /dev/null; then
        echo "Detected: Debian/Ubuntu"
        echo "Installing canvas dependencies via apt-get..."

        sudo apt-get update
        sudo apt-get install -y \
            build-essential \
            libcairo2-dev \
            libpango1.0-dev \
            libjpeg-dev \
            libgif-dev \
            librsvg2-dev \
            libpixman-1-dev \
            pkg-config

        echo "✓ System dependencies installed"

    elif command -v apk &> /dev/null; then
        echo "Detected: Alpine Linux"
        echo "Installing canvas dependencies via apk..."

        apk add --no-cache \
            build-base \
            g++ \
            cairo-dev \
            pango-dev \
            jpeg-dev \
            giflib-dev \
            librsvg-dev \
            pixman-dev \
            pkgconf

        echo "✓ System dependencies installed"

    elif command -v yum &> /dev/null; then
        echo "Detected: RHEL/CentOS/Fedora"
        echo "Installing canvas dependencies via yum..."

        sudo yum groupinstall -y "Development Tools"
        sudo yum install -y \
            cairo-devel \
            pango-devel \
            libjpeg-turbo-devel \
            giflib-devel \
            librsvg2-devel \
            pixman-devel

        echo "✓ System dependencies installed"
    else
        echo "ERROR: Unknown Linux distribution"
        echo "Please install the following packages manually:"
        echo "  - cairo development libraries"
        echo "  - pango development libraries"
        echo "  - libjpeg development libraries"
        echo "  - giflib development libraries"
        echo "  - librsvg development libraries"
        exit 1
    fi

elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Detected: macOS"

    if ! command -v brew &> /dev/null; then
        echo "ERROR: Homebrew not found. Please install Homebrew first:"
        echo "  /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
        exit 1
    fi

    echo "Installing canvas dependencies via Homebrew..."

    brew install pkg-config cairo pango libpng jpeg giflib librsvg pixman

    echo "✓ System dependencies installed"

else
    echo "ERROR: Unsupported operating system: $OSTYPE"
    echo "Please install canvas dependencies manually."
    exit 1
fi

echo ""
echo "============================================"
echo "Installing Node.js dependencies..."
echo "============================================"

# Navigate to project root (assuming script is in /scripts)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# Clean existing node_modules if corrupted
if [ -d "node_modules" ] && [ ! -d "node_modules/canvas/build" ]; then
    echo "Cleaning corrupted node_modules..."
    rm -rf node_modules package-lock.json
fi

# Install with legacy peer deps to avoid conflicts
echo "Running npm install..."
npm install --legacy-peer-deps

echo ""
echo "============================================"
echo "✓ Setup Complete!"
echo "============================================"
echo ""
echo "You can now run:"
echo "  npm run build      # Compile TypeScript"
echo "  npm run pipeline   # Run full pipeline"
echo "  npm test           # Run tests"
echo ""
