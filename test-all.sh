#!/bin/bash
set -e

echo "Running server tests..."
cd server
npm test
cd ..

echo "Running mobile type checks..."
cd mobile
npx tsc --noEmit
cd ..

echo "All checks passed!"
