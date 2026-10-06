#!/bin/bash
# NexScope — Provenance contract E2E test (P0 critical)
# Run: ./scripts/test_provenance.sh [PORT]
#
# Verifies that the 4 AI endpoints (/api/keywords, /api/trends,
# /api/content-gaps, /api/monetization) emit a provenance marker in their
# response. The agent is currently modifying these endpoints, so this check
# is intentionally FLEXIBLE: any of the following markers makes the response
# pass:
#   - top-level `_provenance` (object)
#   - top-level `truthLevel` (any value)
#   - top-level `truth_level` (any value)
#   - top-level `source` whose value is 'ai' or 'AI_MODEL'
#
# If NONE of these markers exist in the response → FAIL with a clear message.
set -e

PORT="${1:-3100}"
BASE="http://localhost:$PORT"
PASS=0
FAIL=0
TS=$(date +%s)
EMAIL="prov-${TS}@test.com"
PASSWORD="TestPass123!"
COOKIE="/tmp/nexscope_prov_${TS}.txt"
NICHE="Fitness para principiantes"

cleanup() {
  rm -f "$COOKIE" \
        /tmp/prov_reg /tmp/prov_keywords /tmp/prov_trends \
        /tmp/prov_gaps /tmp/prov_mon
}
trap cleanup EXIT

pass() { echo "[PASS] $1"; PASS=$((PASS+1)); }
fail() { echo "[FAIL] $1 — $2"; FAIL=$((FAIL+1)); }

# Returns 0 (true) if the JSON file at $1 contains ANY provenance marker,
# 1 (false) otherwise. Distinguishes "no provenance" from "request failed".
check_provenance() {
  local FILE="$1"
  python3 - "$FILE" <<'PY'
import json, sys
path = sys.argv[1]
try:
    with open(path) as f:
        data = json.load(f)
except Exception as e:
    print(f"NO_PROVENANCE: JSON inválido ({e})")
    sys.exit(1)

# If the response is an error payload, it has no provenance by definition.
if isinstance(data, dict) and ('error' in data and 'keywords' not in data and 'trends' not in data and 'gaps' not in data):
    print(f"NO_PROVENANCE: respuesta de error: {data.get('error','')[:80]}")
    sys.exit(1)

# Search for any acceptable provenance marker at the top level.
has_provenance = False
reason = "ningún campo de provenance encontrado"

if isinstance(data, dict):
    if '_provenance' in data:
        has_provenance = True
        reason = f"_provenance presente: {str(data['_provenance'])[:60]}"
    elif 'truthLevel' in data:
        has_provenance = True
        reason = f"truthLevel={data['truthLevel']}"
    elif 'truth_level' in data:
        has_provenance = True
        reason = f"truth_level={data['truth_level']}"
    elif data.get('source') in ('ai', 'AI_MODEL', 'AI'):
        has_provenance = True
        reason = f"source={data.get('source')}"

if has_provenance:
    print(f"OK: {reason}")
    sys.exit(0)
else:
    print(f"NO_PROVENANCE: {reason}")
    sys.exit(1)
PY
}

echo "═══════════════════════════════════════════════"
echo " NexScope PROVENANCE CONTRACT — PORT $PORT"
echo " email: $EMAIL  niche: $NICHE"
echo "═══════════════════════════════════════════════"

# ── Register + login ──
HTTP=$(curl -s -o /tmp/prov_reg -w "%{http_code}" -c "$COOKIE" -X POST "$BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Prov Test\",\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
if [ "$HTTP" = "200" ]; then
  pass "register + login (cookie seteada)"
else
  fail "register" "esperaba 200, obtuve $HTTP"
  exit 1
fi

echo ""
echo "── 1) POST /api/keywords ──"
HTTP=$(curl -s -o /tmp/prov_keywords -w "%{http_code}" --max-time 90 \
  -b "$COOKIE" -X POST "$BASE/api/keywords" \
  -H "Content-Type: application/json" \
  -d "{\"niche\":\"$NICHE\"}")
if [ "$HTTP" = "200" ]; then
  MSG=$(check_provenance /tmp/prov_keywords)
  echo "    $MSG"
  if echo "$MSG" | grep -q "^OK"; then pass "/api/keywords contiene provenance"; else fail "/api/keywords provenance" "$MSG"; fi
else
  fail "/api/keywords HTTP" "esperaba 200, obtuve $HTTP"
fi

echo "── 2) POST /api/trends ──"
HTTP=$(curl -s -o /tmp/prov_trends -w "%{http_code}" --max-time 90 \
  -b "$COOKIE" -X POST "$BASE/api/trends" \
  -H "Content-Type: application/json" \
  -d "{\"niche\":\"$NICHE\",\"region\":\"ES\"}")
if [ "$HTTP" = "200" ]; then
  MSG=$(check_provenance /tmp/prov_trends)
  echo "    $MSG"
  if echo "$MSG" | grep -q "^OK"; then pass "/api/trends contiene provenance"; else fail "/api/trends provenance" "$MSG"; fi
else
  fail "/api/trends HTTP" "esperaba 200, obtuve $HTTP"
fi

echo "── 3) POST /api/content-gaps ──"
HTTP=$(curl -s -o /tmp/prov_gaps -w "%{http_code}" --max-time 90 \
  -b "$COOKIE" -X POST "$BASE/api/content-gaps" \
  -H "Content-Type: application/json" \
  -d "{\"niche\":\"$NICHE\"}")
if [ "$HTTP" = "200" ]; then
  MSG=$(check_provenance /tmp/prov_gaps)
  echo "    $MSG"
  if echo "$MSG" | grep -q "^OK"; then pass "/api/content-gaps contiene provenance"; else fail "/api/content-gaps provenance" "$MSG"; fi
else
  fail "/api/content-gaps HTTP" "esperaba 200, obtuve $HTTP"
fi

echo "── 4) POST /api/monetization ──"
HTTP=$(curl -s -o /tmp/prov_mon -w "%{http_code}" --max-time 90 \
  -b "$COOKIE" -X POST "$BASE/api/monetization" \
  -H "Content-Type: application/json" \
  -d "{\"niche\":\"$NICHE\",\"subscribers\":50000,\"viewsPerMonth\":200000}")
if [ "$HTTP" = "200" ]; then
  MSG=$(check_provenance /tmp/prov_mon)
  echo "    $MSG"
  if echo "$MSG" | grep -q "^OK"; then pass "/api/monetization contiene provenance"; else fail "/api/monetization provenance" "$MSG"; fi
else
  fail "/api/monetization HTTP" "esperaba 200, obtuve $HTTP"
fi

# ── Cleanup: logout ──
curl -s -o /dev/null -b "$COOKIE" -c "$COOKIE" -X POST "$BASE/api/auth/logout"

echo ""
echo "═══════════════════════════════════════════════"
echo " Resultado: $PASS pass / $FAIL fail"
echo "═══════════════════════════════════════════════"

if [ "$FAIL" -gt 0 ]; then exit 1; fi
exit 0
