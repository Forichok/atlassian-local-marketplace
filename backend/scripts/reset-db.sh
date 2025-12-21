#!/bin/bash

# Script to reset the database
# This will drop all data and reapply all migrations

set -e

echo "🗑️  Resetting database..."
echo ""

# Change to backend directory
cd "$(dirname "$0")/.."

# Reset database using Prisma
npx prisma migrate reset --force

echo ""
echo "✅ Database reset complete!"
echo ""
echo "The database has been:"
echo "  - Dropped and recreated"
echo "  - All migrations applied"
echo "  - Prisma Client regenerated"
echo ""
echo "You can now start Stage 1 to populate the database."
