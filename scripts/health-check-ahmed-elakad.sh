#!/usr/bin/env bash
# ==============================================================================
# health-check-ahmed-elakad.sh
# Validates the Ahmed-Elakad site's runtime health.
#
# Checks:
#   1. JSON files — exist and are valid JSON
#   2. Disk space  — data volume has enough free space
#   3. Directories — images/ and voices/ exist and are writable
#   4. PM2         — "ahmed-elakad" process is online
#   5. Nginx       — service is active
#   6. Backup      — D: drive accessible, last-success timestamp
#
# Exit codes: 0 = all OK, 1 = one or more warnings/errors
# ==============================================================================

DATA_DIR="/home/sherif/data/ahmed-elakad"
SOURCE_DIR="${DATA_DIR}"
LOG_DIR="/home/sherif/sites/Ahmed-Elakad/logs"
MOUNT_ROOT="/home/sherif/Desktop/D on Player (NoMachine)"
DEST_ROOT="${MOUNT_ROOT}/Development/01-Projects/ahmed-elakad/backup"
BACKUP_SUCCESS_FILE="${LOG_DIR}/last_backup_success"
DISK_WARN_PERCENT=85   # warn when data volume is above this % full
TIMEOUT_SECS=4

# ── Colour helpers (disabled if not a terminal) ───────────────────────────────
if [[ -t 1 ]]; then
  RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
  BOLD='\033[1m'; RESET='\033[0m'
else
  RED=''; GREEN=''; YELLOW=''; BOLD=''; RESET=''
fi

PASS="${GREEN}✔${RESET}"
FAIL="${RED}✘${RESET}"
WARN="${YELLOW}⚠${RESET}"

ERRORS=0
WARNINGS=0

ok()   { echo -e "  ${PASS} $*"; }
fail() { echo -e "  ${FAIL} $*"; (( ERRORS++ )) || true; }
warn() { echo -e "  ${WARN} $*"; (( WARNINGS++ )) || true; }

echo ""
echo -e "${BOLD}═══════════════════════════════════════════════════${RESET}"
echo -e "${BOLD}  Ahmed-Elakad Health Check  $(date '+%Y-%m-%d %H:%M:%S')${RESET}"
echo -e "${BOLD}═══════════════════════════════════════════════════${RESET}"

# ── 1. JSON files ─────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}[1] JSON Data Files${RESET}"

# content.json and clients.json must exist (site breaks without them)
# messages.json and config.json are created on first use — warn if absent
declare -A REQUIRED=([content.json]=fail [clients.json]=fail [messages.json]=warn [config.json]=warn)

for fname in content.json clients.json messages.json config.json; do
  fpath="${DATA_DIR}/${fname}"
  severity="${REQUIRED[$fname]}"

  if [[ ! -f "${fpath}" ]]; then
    if [[ "${severity}" == "fail" ]]; then
      fail "${fname} — FILE MISSING"
    else
      warn "${fname} — not yet created (created on first use)"
    fi
    continue
  fi

  # Validate JSON
  if python3 -c "import json,sys; json.load(open('${fpath}'))" 2>/dev/null; then
    SIZE=$(du -sh "${fpath}" | awk '{print $1}')
    ok "${fname} — valid JSON (${SIZE})"
  else
    fail "${fname} — INVALID JSON (corrupted?)"
  fi
done

# ── 2. Disk space ─────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}[2] Disk Space${RESET}"

USAGE=$(df --output=pcent "${DATA_DIR}" 2>/dev/null | tail -1 | tr -d '% ')
FREE=$(df -h "${DATA_DIR}" 2>/dev/null | awk 'NR==2{print $4}')
TOTAL=$(df -h "${DATA_DIR}" 2>/dev/null | awk 'NR==2{print $2}')

if [[ -z "${USAGE}" ]]; then
  fail "Could not read disk usage for ${DATA_DIR}"
elif [[ "${USAGE}" -ge "${DISK_WARN_PERCENT}" ]]; then
  warn "Disk ${USAGE}% full — ${FREE} free of ${TOTAL} total (threshold: ${DISK_WARN_PERCENT}%)"
else
  ok "Disk ${USAGE}% used — ${FREE} free of ${TOTAL} total"
fi

# Images dir size
if [[ -d "${DATA_DIR}/images" ]]; then
  IMG_SIZE=$(du -sh "${DATA_DIR}/images" | awk '{print $1}')
  IMG_COUNT=$(find "${DATA_DIR}/images" -maxdepth 1 -type f | wc -l)
  ok "images/ — ${IMG_COUNT} files, ${IMG_SIZE}"
fi

# Voices dir size
if [[ -d "${DATA_DIR}/voices" ]]; then
  VOI_SIZE=$(du -sh "${DATA_DIR}/voices" | awk '{print $1}')
  VOI_COUNT=$(find "${DATA_DIR}/voices" -maxdepth 1 -type f | wc -l)
  ok "voices/ — ${VOI_COUNT} files, ${VOI_SIZE}"
fi

# ── 3. Directories — writable ─────────────────────────────────────────────────
echo ""
echo -e "${BOLD}[3] Directories${RESET}"

for dir in "${DATA_DIR}" "${DATA_DIR}/images" "${DATA_DIR}/voices"; do
  label="${dir/$DATA_DIR\//}"
  label="${label:-data root}"
  if [[ ! -d "${dir}" ]]; then
    fail "${dir} — DIRECTORY MISSING"
  elif [[ ! -w "${dir}" ]]; then
    fail "${dir} — NOT WRITABLE"
  else
    ok "${dir} — exists and writable"
  fi
done

# ── 4. PM2 process ────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}[4] PM2 Process${RESET}"

if ! command -v pm2 &>/dev/null; then
  fail "pm2 not found in PATH"
else
  PM2_STATUS=$(pm2 jlist 2>/dev/null | python3 -c "
import json,sys
procs = json.load(sys.stdin)
for p in procs:
    if p.get('name') == 'ahmed-elakad':
        print(p.get('pm2_env',{}).get('status','unknown'))
        sys.exit(0)
print('not_found')
" 2>/dev/null || echo "error")

  case "${PM2_STATUS}" in
    online)  ok "PM2 process 'ahmed-elakad' is online" ;;
    stopped) fail "PM2 process 'ahmed-elakad' is STOPPED" ;;
    errored) fail "PM2 process 'ahmed-elakad' is in ERROR state" ;;
    not_found) fail "PM2 process 'ahmed-elakad' not found" ;;
    *)       fail "PM2 process 'ahmed-elakad' status: ${PM2_STATUS}" ;;
  esac

  # Show memory and uptime
  pm2 jlist 2>/dev/null | python3 -c "
import json,sys,datetime
procs = json.load(sys.stdin)
for p in procs:
    if p.get('name') == 'ahmed-elakad':
        mem = p.get('monit',{}).get('memory',0)
        cpu = p.get('monit',{}).get('cpu',0)
        restart = p.get('pm2_env',{}).get('restart_time',0)
        uptime_ms = p.get('pm2_env',{}).get('pm_uptime',0)
        uptime_s = (int(datetime.datetime.now().timestamp()*1000) - uptime_ms) // 1000
        hours = uptime_s // 3600
        mins  = (uptime_s % 3600) // 60
        print(f'     Memory: {mem//1024//1024} MB | CPU: {cpu}% | Restarts: {restart} | Uptime: {hours}h {mins}m')
" 2>/dev/null || true
fi

# ── 5. Nginx ──────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}[5] Nginx${RESET}"

if systemctl is-active --quiet nginx 2>/dev/null; then
  ok "Nginx is active"
elif sudo nginx -t &>/dev/null; then
  warn "Nginx config is valid but service may not be running via systemctl"
else
  fail "Nginx is NOT running"
fi

# ── 6. Backup status ──────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}[6] Backup Status${RESET}"

# Last success recorded locally
if [[ -f "${BACKUP_SUCCESS_FILE}" ]]; then
  LAST_SUCCESS=$(cat "${BACKUP_SUCCESS_FILE}")
  # Convert "YYYY-MM-DD_HH-MM-SS" → "YYYY-MM-DD HH:MM:SS" for date parsing
  LAST_PARSED="${LAST_SUCCESS//_/ }"
  LAST_PARSED="${LAST_PARSED:0:10} ${LAST_PARSED:11:2}:${LAST_PARSED:14:2}:${LAST_PARSED:17:2}"
  LAST_EPOCH=$(date -d "${LAST_PARSED}" '+%s' 2>/dev/null || echo 0)
  NOW_EPOCH=$(date '+%s')
  AGE_HOURS=$(( (NOW_EPOCH - LAST_EPOCH) / 3600 ))
  if [[ "${AGE_HOURS}" -le 25 ]]; then
    ok "Last successful backup: ${LAST_SUCCESS} (${AGE_HOURS}h ago)"
  elif [[ "${AGE_HOURS}" -le 72 ]]; then
    warn "Last successful backup: ${LAST_SUCCESS} (${AGE_HOURS}h ago — overdue)"
  else
    fail "Last successful backup: ${LAST_SUCCESS} (${AGE_HOURS}h ago — STALE)"
  fi
else
  warn "No successful backup recorded yet (${BACKUP_SUCCESS_FILE} missing)"
fi

# D: drive accessibility
if timeout "${TIMEOUT_SECS}" ls "${MOUNT_ROOT}/" &>/dev/null; then
  ok "D: drive (NoMachine) is currently accessible"

  SNAP_ROOT="${DEST_ROOT}/snapshots"
  IMAGES_LATEST="${DEST_ROOT}/images-latest"

  # JSON+voices snapshots
  if timeout "${TIMEOUT_SECS}" ls "${SNAP_ROOT}/" &>/dev/null 2>&1; then
    SNAP_COUNT=$(find "${SNAP_ROOT}" -maxdepth 1 -type d -name '????-??-??_*' 2>/dev/null | wc -l)
    NEWEST=$(find "${SNAP_ROOT}" -maxdepth 1 -type d -name '????-??-??_*' 2>/dev/null | sort | tail -1)
    ok "JSON+voices snapshots: ${SNAP_COUNT} total. Newest: $(basename "${NEWEST:-none}")"
  else
    warn "snapshots/ directory not found at ${SNAP_ROOT}"
  fi

  # images-latest rolling sync
  if timeout "${TIMEOUT_SECS}" ls "${IMAGES_LATEST}/" &>/dev/null 2>&1; then
    IMG_BACKUP_COUNT=$(find "${IMAGES_LATEST}" -maxdepth 1 -type f 2>/dev/null | wc -l)
    IMG_BACKUP_SIZE=$(du -sh "${IMAGES_LATEST}" 2>/dev/null | awk '{print $1}')
    IMG_SRC_COUNT=$(find "${SOURCE_DIR}/images" -maxdepth 1 -type f 2>/dev/null | wc -l)
    if [[ "${IMG_BACKUP_COUNT}" -eq "${IMG_SRC_COUNT}" ]]; then
      ok "images-latest/: ${IMG_BACKUP_COUNT}/${IMG_SRC_COUNT} files backed up (${IMG_BACKUP_SIZE}) — complete"
    else
      warn "images-latest/: ${IMG_BACKUP_COUNT}/${IMG_SRC_COUNT} files backed up (${IMG_BACKUP_SIZE}) — sync in progress or incomplete"
    fi
  else
    warn "images-latest/ directory not found — images not yet backed up"
  fi
else
  warn "D: drive not accessible right now (NoMachine offline — backup will be skipped tonight)"
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}═══════════════════════════════════════════════════${RESET}"
if [[ "${ERRORS}" -eq 0 && "${WARNINGS}" -eq 0 ]]; then
  echo -e "${GREEN}${BOLD}  All checks passed.${RESET}"
elif [[ "${ERRORS}" -eq 0 ]]; then
  echo -e "${YELLOW}${BOLD}  ${WARNINGS} warning(s), 0 errors.${RESET}"
else
  echo -e "${RED}${BOLD}  ${ERRORS} error(s), ${WARNINGS} warning(s) — action required.${RESET}"
fi
echo -e "${BOLD}═══════════════════════════════════════════════════${RESET}"
echo ""

[[ "${ERRORS}" -eq 0 ]]   # exit 0 if no errors, 1 if any
