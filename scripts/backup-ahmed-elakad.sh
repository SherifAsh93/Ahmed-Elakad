#!/usr/bin/env bash
# ==============================================================================
# backup-ahmed-elakad.sh — Ahmed-Elakad daily backup
#
# DESIGN
# ------
# Two separate backup zones in the same destination root:
#
#   snapshots/YYYY-MM-DD_HH-MM-SS/   JSON files + voices/ (tiny, versioned)
#   images-latest/                    Single rolling rsync of images/ (efficient)
#
# Why split?
#   - JSON + voices change daily and are small — versioned snapshots are cheap.
#   - Images are large (~650 MB) and mostly append-only — a single rsync target
#     means only NEW files are transferred each night (seconds, not hours).
#   - Hard-links (--link-dest) are not used because sshfs doesn't support them.
#
# OFFLINE BEHAVIOUR
# -----------------
#   If the Windows machine is off or NoMachine is disconnected, the mount probe
#   times out in 5 s, the script logs a warning and exits 0 (no cron mail).
#   The site is never affected.
#
# RETENTION
# ---------
#   snapshots/  →  30 most-recent kept, older auto-deleted.
#   images-latest/  →  single directory, always current (no rotation needed).
#
# Source:  /home/sherif/data/ahmed-elakad/
# Dest:    /home/sherif/Desktop/D on Player (NoMachine)/
#            Development/01-Projects/ahmed-elakad/backup/
# ==============================================================================

set -euo pipefail

# ── Paths ──────────────────────────────────────────────────────────────────────
SOURCE_DIR="/home/sherif/data/ahmed-elakad"
MOUNT_ROOT="/home/sherif/Desktop/D on Player (NoMachine)"
DEST_ROOT="${MOUNT_ROOT}/Development/01-Projects/ahmed-elakad/backup"
SNAP_ROOT="${DEST_ROOT}/snapshots"
IMAGES_DEST="${DEST_ROOT}/images-latest"
LOCAL_LOG="/home/sherif/sites/Ahmed-Elakad/logs/backup.log"
SUCCESS_MARKER="/home/sherif/sites/Ahmed-Elakad/logs/last_backup_success"

# ── Config ─────────────────────────────────────────────────────────────────────
KEEP_SNAPS=30
TIMEOUT_SECS=5

# ── Helpers ───────────────────────────────────────────────────────────────────
TIMESTAMP=$(date '+%Y-%m-%d_%H-%M-%S')

log() {
  local level="$1"; shift
  echo "[${TIMESTAMP}] [${level}] $*" | tee -a "${LOCAL_LOG}"
}

die() { log "ERROR" "$*"; exit 1; }

mkdir -p "$(dirname "${LOCAL_LOG}")"

log "INFO" "===== Ahmed-Elakad backup starting ====="

# ── 1. Verify source ──────────────────────────────────────────────────────────
[[ -d "${SOURCE_DIR}" ]] || die "Source not found: ${SOURCE_DIR}"

# ── 2. Probe mount (timeout guards against stale sshfs hang) ─────────────────
if ! timeout "${TIMEOUT_SECS}" ls "${MOUNT_ROOT}/" &>/dev/null; then
  log "WARN" "D: drive not accessible (NoMachine offline or unmounted) — skipping backup."
  log "INFO" "===== Backup skipped ====="
  exit 0
fi

if ! timeout "${TIMEOUT_SECS}" mkdir -p "${SNAP_ROOT}" "${IMAGES_DEST}"; then
  log "WARN" "Cannot create destination directories — skipping backup."
  log "INFO" "===== Backup skipped ====="
  exit 0
fi

ERRORS=0

# ── 3. Snapshot: JSON files ───────────────────────────────────────────────────
SNAP_DIR="${SNAP_ROOT}/${TIMESTAMP}"
mkdir -p "${SNAP_DIR}"
log "INFO" "Snapshot dir: ${SNAP_DIR}"

for f in content.json clients.json messages.json config.json; do
  src="${SOURCE_DIR}/${f}"
  if [[ -f "${src}" ]]; then
    if cp "${src}" "${SNAP_DIR}/${f}"; then
      log "INFO" "  [JSON] ${f} copied ($(du -h "${src}" | awk '{print $1}'))"
    else
      log "ERROR" "  [JSON] ${f} copy FAILED"
      (( ERRORS++ )) || true
    fi
  else
    log "WARN" "  [JSON] ${f} not present yet — skipping"
  fi
done

# ── 4. Snapshot: voices/ ─────────────────────────────────────────────────────
VOICES_SRC="${SOURCE_DIR}/voices"
if [[ -d "${VOICES_SRC}" ]] && [[ -n "$(ls -A "${VOICES_SRC}")" ]]; then
  VOICES_COUNT=$(find "${VOICES_SRC}" -maxdepth 1 -type f | wc -l)
  if rsync -a --no-perms --no-owner --no-group \
       "${VOICES_SRC}/" "${SNAP_DIR}/voices/" 2>>"${LOCAL_LOG}"; then
    log "INFO" "  [VOICES] ${VOICES_COUNT} file(s) synced to snapshot"
  else
    log "ERROR" "  [VOICES] rsync failed"
    (( ERRORS++ )) || true
  fi
else
  log "INFO" "  [VOICES] directory empty or absent — skipping"
fi

# ── 5. Rolling sync: images/ → images-latest/ ────────────────────────────────
# Uses --inplace --partial to avoid mkstemp temp-file creation on sshfs.
# Retries up to 3 times because sshfs connections can drop during long transfers.
IMAGES_SRC="${SOURCE_DIR}/images"
if [[ -d "${IMAGES_SRC}" ]]; then
  IMAGES_TOTAL=$(find "${IMAGES_SRC}" -maxdepth 1 -type f | wc -l)
  log "INFO" "  [IMAGES] rsyncing ${IMAGES_TOTAL} files → images-latest/ ..."
  IMAGE_OK=false
  for attempt in 1 2 3; do
    if rsync -a --no-perms --no-owner --no-group \
         --inplace --partial --delete \
         "${IMAGES_SRC}/" "${IMAGES_DEST}/" 2>>"${LOCAL_LOG}"; then
      IMAGE_OK=true
      break
    else
      log "WARN" "  [IMAGES] rsync attempt ${attempt} failed — retrying in 30s ..."
      sleep 30
    fi
  done
  if $IMAGE_OK; then
    IMAGES_DONE=$(find "${IMAGES_DEST}" -maxdepth 1 -type f | wc -l)
    SIZE=$(du -sh "${IMAGES_DEST}" | awk '{print $1}')
    log "INFO" "  [IMAGES] done — ${IMAGES_DONE}/${IMAGES_TOTAL} files, ${SIZE}"
  else
    log "ERROR" "  [IMAGES] rsync failed after 3 attempts"
    (( ERRORS++ )) || true
  fi
else
  log "WARN" "  [IMAGES] source directory not found — skipping"
fi

# ── 6. Write status markers ───────────────────────────────────────────────────
SNAP_SIZE=$(du -sh "${SNAP_DIR}" 2>/dev/null | awk '{print $1}')
log "INFO" "Snapshot size (JSON+voices): ${SNAP_SIZE}"

if [[ "${ERRORS}" -gt 0 ]]; then
  echo "PARTIAL ${TIMESTAMP}" > "${SNAP_DIR}/.backup_status"
  log "ERROR" "Backup finished with ${ERRORS} error(s)."
else
  echo "OK ${TIMESTAMP}" > "${SNAP_DIR}/.backup_status"
  echo "${TIMESTAMP}" > "${DEST_ROOT}/.last_success"
  echo "${TIMESTAMP}" > "${SUCCESS_MARKER}"
  log "INFO" "Backup completed successfully."
fi

# ── 7. Rotate old snapshots (keep last KEEP_SNAPS) ───────────────────────────
log "INFO" "Rotating snapshots (keeping last ${KEEP_SNAPS}) ..."
OLDEST=$(find "${SNAP_ROOT}" -maxdepth 1 -type d -name '????-??-??_*' \
         | sort | head -n -"${KEEP_SNAPS}")
if [[ -n "${OLDEST}" ]]; then
  while IFS= read -r old; do
    log "INFO" "  Removing old snapshot: $(basename "${old}")"
    rm -rf "${old}"
  done <<< "${OLDEST}"
else
  log "INFO" "  No old snapshots to remove."
fi

log "INFO" "===== Ahmed-Elakad backup finished ====="
