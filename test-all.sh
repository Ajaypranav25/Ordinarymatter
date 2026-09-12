#!/bin/bash
set -e
echo "Testing server..."
cd server
npm test
echo "Server tests passed."
cd ../mobile
echo "Type checking mobile app..."
npx tsc --noEmit
echo "Mobile type check passed."
