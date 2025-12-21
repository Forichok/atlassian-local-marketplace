#!/bin/bash

# Script to completely reset everything
# This will reset database AND delete all downloaded files

set -e

echo "🗑️  Complete reset - Database and Files..."
echo ""

# Change to backend directory
SCRIPT_DIR="$(dirname "$0")"
cd "$SCRIPT_DIR/.."

# Reset database
echo "1️⃣  Resetting database..."
npx prisma migrate reset --force

echo ""

# Clear downloaded files
echo "2️⃣  Clearing downloaded files..."
STORAGE_PATH="${JAR_STORAGE_PATH:-./storage}"

if [ -d "$STORAGE_PATH" ]; then
    rm -rf "$STORAGE_PATH"/*
    echo "   Files cleared from: $STORAGE_PATH"
else
    mkdir -p "$STORAGE_PATH"
    echo "   Created storage directory: $STORAGE_PATH"
fi

echo ""
echo "✅ Complete reset finished!"
echo ""
echo "Everything has been cleared:"
echo "  ✓ Database reset and migrations applied"
echo "  ✓ All downloaded JAR files removed"
echo "  ✓ Prisma Client regenerated"
echo ""
echo "You can now start fresh with Stage 1."
