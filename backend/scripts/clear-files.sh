#!/bin/bash

# Script to clear downloaded JAR files
# This will delete all downloaded plugin files but keep database metadata

set -e

echo "🗑️  Clearing downloaded files..."
echo ""

# Change to backend directory
cd "$(dirname "$0")/.."

# Get storage path from config or use default
STORAGE_PATH="${JAR_STORAGE_PATH:-./storage}"

if [ -d "$STORAGE_PATH" ]; then
    echo "Removing files from: $STORAGE_PATH"
    rm -rf "$STORAGE_PATH"/*
    echo "✅ Files cleared!"
else
    echo "⚠️  Storage directory not found: $STORAGE_PATH"
    echo "Creating directory..."
    mkdir -p "$STORAGE_PATH"
    echo "✅ Directory created!"
fi

echo ""
echo "All downloaded JAR files have been removed."
echo "Database metadata is preserved."
echo "You can run Stage 2 or Stage 3 to re-download files."
