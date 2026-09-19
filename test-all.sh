#!/bin/bash
set -e

echo "=== Running Server Tests ==="
cd server
npm test
cd ..

echo "=== Running Mobile App Type-Checking ==="
cd mobile
npx tsc --noEmit
cd ..

echo "=== All checks passed successfully! ==="
