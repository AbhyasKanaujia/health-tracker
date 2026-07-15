#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
git pull
./mvnw clean package -DskipTests -q
docker compose up -d --build
