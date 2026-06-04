#!/usr/bin/env bash
# ==============================================================================
# backup-ahmed-elakad.sh
# Daily backup of Ahmed-Elakad project data to the Windows D: drive
# mounted via NoMachine sshfs.
#
# Source:      /home/sherif/data/ahmed-elakad/
# Destination: /home/sherif/Desktop/D on Player (NoMachine)/Development/
#              01-Projects/ahmed-elakad/backup/
#
# Behavior when Windows is offline / drive is unmounted:
#   - Detects inaccessibility immediately (timeout 5s)
#   - Logs the reason and exits with code 0 (no cron mail spam)
#   - Never touches site data or process
#
# Retention: keeps last 30 dated folders, removes older ones automatically.
# ==============================================================================

set -euo pipefail

# ── Paths ──────────────────────────────────────────────────────────────────────
SOURCE_DIR="/home/sherif/data/ahmed-elakad"
MOUNT_ROOT="/home/sherif/Desktop/D on Player (NoMachine)"
DEST_ROOT="${MOUNT_ROOT}/Development/01-Projects/ahmed-elakad/backup"
LOCAL_LOG="/home/sherif/sites/Ahmed-Elakad/logs/backup.log"

# ── Config ─────────────────────────────────────────────────────────────────────
KEEP_DAYS=30          # number of dated backup folders to retain
TIMEOUT_SECS=5        # seconds to wait for mount probe before giving up

# ── Helpers ───────────────────────────────────────────────────────────────────
TIMESTAMP=$(date '+%Y-%m-%d_%H-%M-%S')
DATE_LABEL=$(date '+%Y-%m-%d')

log() {
  local level="$1"; shift
  local msg="$*"
  echo "[${TIMESTAMP}] [${level}] ${msg}" | tee -a "${LOCAL_LOG}"
}

die() {
  log "ERROR" "$*"
  exit 1
}

# ── Ensure local log dir exists ───────────────────────────────────────────────
mkdir -p "$(dirname "${LOCAL_LOG}")"

log "INFO" "===== Ahmed-Elakad backup starting ====="

# ── Step 1: Verify source ─────────────────────────────────────────────────────
if [[ ! -d "${SOURCE_DIR}" ]]; then
  die "Source directory not found: ${SOURCE_DIR}"
fi

# ── Step 2: Check that D: drive is mounted and accessible ────────────────────
# Use 'timeout' so a stale sshfs mount doesn't hang the cron job.
if ! timeout "${TIMEOUT_SECS}" ls "${MOUNT_ROOT}/" &>/dev/null; then
  log "WARN" "D: drive not accessible (NoMachine offline or drive unmounted). Skipping backup."
  log "INFO" "===== Backup skipped ====="
  exit 0
fi

# Also verify the exact destination path is reachable (creates it if missing)
if ! timeout "${TIMEOUT_SECS}" mkdir -p "${DEST_ROOT}"; then
  log "WARN" "Cannot create/access destination path: ${DEST_ROOT}. Skipping backup."
  log "INFO" "===== Backup skipped ====="
  exit 0
fi

# ── Step 3: Create a dated snapshot folder ────────────────────────────────────
SNAP_DIR="${DEST_ROOT}/${TIMESTAMP}"
log "INFO" "Creating snapshot: ${SNAP_DIR}"
mkdir -p "${SNAP_DIR}"

# ── Step 4: Back up JSON files ────────────────────────────────────────────────
JSON_FILES=("content.json" "clients.json" "messages.json" "config.json")
JSON_ERRORS=0

for f in "${JSON_FILES[@]}"; do
  src="${SOURCE_DIR}/${f}"
  if [[ -f "${src}" ]]; then
    if cp "${src}" "${SNAP_DIR}/${f}"; then
      log "INFO" "  Copied ${f}"
    else
      log "ERROR" "  Failed to copy ${f}"
      (( JSON_ERRORS++ )) || true
    fi
  else
    log "WARN" "  ${f} not found — skipping"
  fi
done

# ── Step 5: Back up images/ directory (rsync for efficiency) ──────────────────
IMAGES_SRC="${SOURCE_DIR}/images"
IMAGES_DEST="${SNAP_DIR}/images"

if [[ -d "${IMAGES_SRC}" ]]; then
  log "INFO" "  Syncing images/ directory..."
  IMAGES_COUNT=$(find "${IMAGES_SRC}" -maxdepth 1 -type f | wc -l)
  if rsync -a --no-perms --no-owner --no-group \
       "${IMAGES_SRC}/" "${IMAGES_DEST}/" 2>>"${LOCAL_LOG}"; then
    log "INFO" "  images/ synced (${IMAGES_COUNT} files)"
  else
    log "ERROR" "  rsync failed for images/"
    (( JSON_ERRORS++ )) || true
  fi
else
  log "WARN" "  images/ directory not found — skipping"
fi

# ── Step 6: Back up voices/ directory ─────────────────────────────────────────
VOICES_SRC="${SOURCE_DIR}/voices"
VOICES_DEST="${SNAP_DIR}/voices"

if [[ -d "${VOICES_SRC}" ]]; then
  log "INFO" "  Syncing voices/ directory..."
  VOICES_COUNT=$(find "${VOICES_SRC}" -maxdepth 1 -type f | wc -l)
  if rsync -a --no-perms --no-owner --no-group \
       "${VOICES_SRC}/" "${VOICES_DEST}/" 2>>"${LOCAL_LOG}"; then
    log "INFO" "  voices/ synced (${VOICES_COUNT} files)"
  else
    log "ERROR" "  rsync failed for voices/"
    (( JSON_ERRORS++ )) || true
  fi
else
    log "INFO" "  voices/ directory empty or not found — skipping"
fi

# ── Step 7: Verify snapshot completeness ──────────────────────────────────────
SNAP_SIZE=$(du -sh "${SNAP_DIR}" 2>/dev/null | awk '{print $1}')
log "INFO" "Snapshot size: ${SNAP_SIZE}"

if [[ "${JSON_ERRORS}" -gt 0 ]]; then
  log "ERROR" "Backup completed with ${JSON_ERRORS} error(s). Check log for details."
  # Write a marker file so health-check can detect partial backups
  echo "PARTIAL ${TIMESTAMP}" > "${SNAP_DIR}/.backup_status"
else
  echo "OK ${TIMESTAMP}" > "${SNAP_DIR}/.backup_status"
  # Write last-success timestamp to a fixed file for health-check
  echo "${TIMESTAMP}" > "${DEST_ROOT}/.last_success"
  echo "${TIMESTAMP}" > "$(dirname "${LOCAL_LOG}")/last_backup_success"
  log "INFO" "Backup completed successfully."
fi

# ── Step 8: Rotate old backups (keep last KEEP_DAYS dated folders) ────────────
log "INFO" "Rotating old backups (keeping last ${KEEP_DAYS})..."

# List all snapshot dirs sorted oldest-first, skip the one we just made
EXISTING=$(find "${DEST_ROOT}" -maxdepth 1 -type d -name '????-??-??_*' \
           | sort | head -n -"${KEEP_DAYS}")

if [[ -n "${EXISTING}" ]]; then
  while IFS= read -r old_dir; do
    if [[ "${old_dir}" != "${SNAP_DIR}" ]]; then
      log "INFO" "  Removing old backup: $(basename "${old_dir}")"
      rm -rf "${old_dir}"
    fi
  done <<< "${EXISTING}"
else
  log "INFO" "  No old backups to remove."
fi

log "INFO" "===== Ahmed-Elakad backup finished ====="
