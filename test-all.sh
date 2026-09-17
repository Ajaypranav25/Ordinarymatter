#!/bin/bash
set -e
echo "Running Server tests..."
cd server
npm test
echo "Running Mobile app type-checks..."
cd ../mobile
npx tsc --noEmit
echo "All checks passed!"
