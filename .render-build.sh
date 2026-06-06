#!/bin/bash
set -o errexit

npm install
npm run build
npm run prisma:generate

if [ "$ENVIRONMENT" = "production" ]; then
  npm run prisma:migrate -- --skip-generate
fi
