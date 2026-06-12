#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"

# ── 1. Discover free ports ───────────────────────────────────────────────────
node "$ROOT/scripts/find-ports.js"

# shellcheck source=/dev/null
source "$ROOT/.ports.env"

# ── 2. Helper: colour output ─────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
log() { echo -e "${GREEN}[start-dev]${NC} $*"; }

# ── 3. Trap: stop all services on Ctrl+C ────────────────────────────────────
PIDS=()
cleanup() {
  echo ""
  log "Stopping all services…"
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null
  log "All services stopped."
}
trap cleanup EXIT INT TERM

# ── 4. Start each service ────────────────────────────────────────────────────
log "Starting Backend           → http://localhost:${BACKEND_PORT}"
(cd "$ROOT/backend" && uv run uvicorn app.main:app --reload --host 0.0.0.0 --port "$BACKEND_PORT") &
PIDS+=($!)

log "Starting Notification Svc  → http://localhost:${NOTIFICATION_PORT}"
(cd "$ROOT/notification-service" && PORT="$NOTIFICATION_PORT" node src/index.js) &
PIDS+=($!)

log "Starting Frontend          → http://localhost:${FRONTEND_PORT}"
(cd "$ROOT/frontend" && npm run dev) &
PIDS+=($!)

log "Starting Admin Panel       → http://localhost:${ADMIN_PORT}"
(cd "$ROOT/admin-panel" && node_modules/.bin/ng serve --host 0.0.0.0 --port "$ADMIN_PORT") &
PIDS+=($!)

echo ""
echo -e "${YELLOW}  All services started. Press Ctrl+C to stop everything.${NC}"
echo ""

wait
