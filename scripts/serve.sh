#!/bin/bash

PORT=${1:-8000}

echo "Starting GingerPot local server on http://localhost:${PORT}"

python3 -m http.server "$PORT"