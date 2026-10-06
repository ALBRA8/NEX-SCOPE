#!/bin/bash
# NexScope — Multi-user isolation E2E test
# Run: ./scripts/test_multiuser_isolation.sh [PORT]
# Verifies that user A cannot see niches saved by user B (multi-tenant isolation).
set -e

PORT="${1:-3100}"
BASE="http://localhost:$PORT"
PASS=0
FAIL=0
TS=$(date +%s)
EMAIL_A="iso-a-${TS}@test.com"
EMAIL_B="iso-b-${TS}@test.com"
PASSWORD="TestPass123!"
COOKIE_A="/tmp/nexscope_iso_a_${TS}.txt"
COOKIE_B="/tmp/nexscope_iso_b_${TS}.txt"

cleanup() {
  rm -f "$COOKIE_A" "$COOKIE_B" \
        /tmp/iso_a_niches /tmp/iso_b_niches \
        /tmp/iso_reg_a /tmp/iso_reg_b \
        /tmp/iso_save_a /tmp/iso_save_b
}
trap cleanup EXIT

pass() { echo "[PASS] $1"; PASS=$((PASS+1)); }
fail() { echo "[FAIL] $1 — $2"; FAIL=$((FAIL+1)); }

echo "═══════════════════════════════════════════════"
echo " NexScope MULTI-USER ISOLATION — PORT $PORT"
echo " user A: $EMAIL_A"
echo " user B: $EMAIL_B"
echo "═══════════════════════════════════════════════"

# ── Step 1: Create user A (register) → cookie A ──
HTTP=$(curl -s -o /tmp/iso_reg_a -w "%{http_code}" -c "$COOKIE_A" -X POST "$BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"User A\",\"email\":\"$EMAIL_A\",\"password\":\"$PASSWORD\"}")
if [ "$HTTP" = "200" ]; then
  pass "register user A → 200 + cookie A"
else
  fail "register user A" "esperaba 200, obtuve $HTTP"
  exit 1
fi

# ── Step 2: Create user B (register) → cookie B ──
HTTP=$(curl -s -o /tmp/iso_reg_b -w "%{http_code}" -c "$COOKIE_B" -X POST "$BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"User B\",\"email\":\"$EMAIL_B\",\"password\":\"$PASSWORD\"}")
if [ "$HTTP" = "200" ]; then
  pass "register user B → 200 + cookie B"
else
  fail "register user B" "esperaba 200, obtuve $HTTP"
  exit 1
fi

# ── Step 3: User A saves niche "Nicho de A" → 200 ──
HTTP=$(curl -s -o /tmp/iso_save_a -w "%{http_code}" -b "$COOKIE_A" -X POST "$BASE/api/saved-niches" \
  -H "Content-Type: application/json" \
  -d "{\"nicheId\":\"iso-a-${TS}\",\"nicheName\":\"Nicho de A\",\"category\":\"Test\",\"nicheScore\":50}")
if [ "$HTTP" = "200" ]; then
  pass "user A guarda 'Nicho de A' → 200"
else
  fail "user A guarda 'Nicho de A'" "esperaba 200, obtuve $HTTP"
fi

# ── Step 4: User B saves niche "Nicho de B" → 200 ──
HTTP=$(curl -s -o /tmp/iso_save_b -w "%{http_code}" -b "$COOKIE_B" -X POST "$BASE/api/saved-niches" \
  -H "Content-Type: application/json" \
  -d "{\"nicheId\":\"iso-b-${TS}\",\"nicheName\":\"Nicho de B\",\"category\":\"Test\",\"nicheScore\":50}")
if [ "$HTTP" = "200" ]; then
  pass "user B guarda 'Nicho de B' → 200"
else
  fail "user B guarda 'Nicho de B'" "esperaba 200, obtuve $HTTP"
fi

# ── Step 5: User A lists niches → only "Nicho de A", NOT "Nicho de B" ──
HTTP=$(curl -s -o /tmp/iso_a_niches -w "%{http_code}" -b "$COOKIE_A" "$BASE/api/saved-niches")
if [ "$HTTP" = "200" ]; then
  pass "user A GET /api/saved-niches → 200"
else
  fail "user A GET /api/saved-niches" "esperaba 200, obtuve $HTTP"
fi

# Parse and verify isolation
python3 - "$TS" <<'PY'
import json, sys
ts = sys.argv[1]
with open('/tmp/iso_a_niches') as f:
    data = json.load(f)
niches = data.get('niches', [])
names = [n.get('nicheName','') for n in niches]
has_A  = any('Nicho de A' in n for n in names)
has_B  = any('Nicho de B' in n for n in names)
if has_A and not has_B:
    print("[PASS] user A ve solo 'Nicho de A', no ve 'Nicho de B'")
    sys.exit(0)
else:
    print(f"[FAIL] aislamiento user A — has_A={has_A} has_B={has_B} names={names}")
    sys.exit(1)
PY
RC=$?
if [ "$RC" = "0" ]; then PASS=$((PASS+1)); else FAIL=$((FAIL+1)); fi

# ── Step 6: User B lists niches → only "Nicho de B" ──
HTTP=$(curl -s -o /tmp/iso_b_niches -w "%{http_code}" -b "$COOKIE_B" "$BASE/api/saved-niches")
if [ "$HTTP" = "200" ]; then
  pass "user B GET /api/saved-niches → 200"
else
  fail "user B GET /api/saved-niches" "esperaba 200, obtuve $HTTP"
fi

python3 - <<'PY'
import json
with open('/tmp/iso_b_niches') as f:
    data = json.load(f)
niches = data.get('niches', [])
names = [n.get('nicheName','') for n in niches]
has_A  = any('Nicho de A' in n for n in names)
has_B  = any('Nicho de B' in n for n in names)
if has_B and not has_A:
    print("[PASS] user B ve solo 'Nicho de B', no ve 'Nicho de A'")
    sys.exit(0)
else:
    print(f"[FAIL] aislamiento user B — has_A={has_A} has_B={has_B} names={names}")
    sys.exit(1)
PY
RC=$?
if [ "$RC" = "0" ]; then PASS=$((PASS+1)); else FAIL=$((FAIL+1)); fi

# ── Step 7: Cross-check: User A's cookie cannot delete User B's niche ──
HTTP=$(curl -s -o /dev/null -w "%{http_code}" -b "$COOKIE_A" -X DELETE \
  "$BASE/api/saved-niches?nicheId=iso-b-${TS}")
# DELETE returns 200 either way (deleteMany on 0 rows is still OK), but the
# important thing is that user B's niche is still there afterwards.
HTTP_RECHECK=$(curl -s -o /tmp/iso_b_recheck -w "%{http_code}" -b "$COOKIE_B" "$BASE/api/saved-niches")
STILL_B=$(python3 -c "import json; d=json.load(open('/tmp/iso_b_recheck')); print(any('Nicho de B' in n.get('nicheName','') for n in d.get('niches',[])))" 2>/dev/null || echo "False")
if [ "$STILL_B" = "True" ]; then
  pass "user B aún ve 'Nicho de B' tras intento de borrado cross-user"
else
  fail "cross-user delete protection" "el nicho de B ya no existe para B"
fi

# ── Step 8: Cleanup — logout both ──
curl -s -o /dev/null -b "$COOKIE_A" -c "$COOKIE_A" -X POST "$BASE/api/auth/logout"
curl -s -o /dev/null -b "$COOKIE_B" -c "$COOKIE_B" -X POST "$BASE/api/auth/logout"
pass "logout de ambos usuarios (cleanup)"

echo ""
echo "═══════════════════════════════════════════════"
echo " Resultado: $PASS pass / $FAIL fail"
echo "═══════════════════════════════════════════════"

if [ "$FAIL" -gt 0 ]; then exit 1; fi
exit 0
