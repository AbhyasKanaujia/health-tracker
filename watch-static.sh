#!/usr/bin/env bash
# Watches src/main/resources/static and mirrors changes into target/classes/static
# so spring-boot-devtools LiveReload picks them up without a full Maven rebuild.
set -euo pipefail

SRC="$(dirname "$0")/src/main/resources/static"
DEST="$(dirname "$0")/target/classes/static"

mkdir -p "$DEST"
rsync -a "$SRC"/ "$DEST"/
echo "Watching $SRC for changes... (Ctrl+C to stop)"

inotifywait -m -r -e modify,create,delete,move --format '%w%f' "$SRC" | while read -r _; do
  rsync -a --delete "$SRC"/ "$DEST"/
  echo "synced $(date +%H:%M:%S)"
done
