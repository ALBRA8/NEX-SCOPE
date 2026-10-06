#!/bin/bash
# NexScope — Auth E2E tests
# Run: ./scripts/test_auth.sh [PORT]
# Verifies register / login / me / logout flows against a running Next.js server.
set -e

PORT="${1:-3100}"
BASE="http://localhost:$PORT"
PASS=0
FAIL=0
TS=$(date +%s)
EMAIL="auth-test-${TS}@test.com"
PASSWORD="TestPass123!"
COOKIE="/tmp/nexscope_auth_${TS}.txt"

cleanup() {
  rm -f "$COOKIE" /tmp/auth_body1 /tmp/auth_body2 /tmp/auth_body3 \
        /tmp/auth_body4 /tmp/auth_body6 /tmp/auth_body_logout
}
trap cleanup EXIT

pass() { echo "[PASS] $1"; PASS=$((PASS+1)); }
fail() { echo "[FAIL] $1 — $2"; FAIL=$((FAIL+1)); }

echo "═══════════════════════════════════════════════"
echo " NexScope AUTH E2E — PORT $PORT"
echo " email: $EMAIL"
echo "═══════════════════════════════════════════════"

# ── Check 1: Register with body missing email → 400 ──
HTTP=$(curl -s -o /tmp/auth_body1 -w "%{http_code}" -X POST "$BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"name":"NoEmail","password":"TestPass123!"}')
if [ "$HTTP" = "400" ]; then
  pass "register sin email → 400"
else
  fail "register sin email" "esperaba 400, obtuve $HTTP"
fi

# ── Check 2: Register with valid email → 200 + user.id ──
HTTP=$(curl -s -o /tmp/auth_body2 -w "%{http_code}" -c "$COOKIE" -X POST "$BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Auth Test\",\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
if [ "$HTTP" = "200" ]; then
  ID=$(python3 -c "import json; d=json.load(open('/tmp/auth_body2')); print(d.get('user',{}).get('id',''))" 2>/dev/null || echo "")
  if [ -n "$ID" ]; then
    pass "register válido → 200 + user.id"
  else
    fail "register válido user.id" "respuesta sin user.id"
  fi
else
  fail "register válido" "esperaba 200, obtuve $HTTP"
fi

# ── Check 3: Duplicate register (same email) → 400 or 409 ──
HTTP=$(curl -s -o /tmp/auth_body3 -w "%{http_code}" -X POST "$BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Auth Test\",\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
if [ "$HTTP" = "400" ] || [ "$HTTP" = "409" ]; then
  pass "register duplicado → $HTTP"
else
  fail "register duplicado" "esperaba 400/409, obtuve $HTTP"
fi

# ── Check 4: Login with correct credentials → 200 + cookie set ──
HTTP=$(curl -s -o /tmp/auth_body4 -w "%{http_code}" -c "$COOKIE" -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
if [ "$HTTP" = "200" ]; then
  if grep -q "nexscope_token" "$COOKIE" 2>/dev/null; then
    pass "login correcto → 200 + cookie seteada"
  else
    fail "login cookie" "nexscope_token no aparece en cookie jar"
  fi
else
  fail "login correcto" "esperaba 200, obtuve $HTTP"
fi

# ── Check 5: Login with wrong password → 401 ──
HTTP=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"WrongPassword99\"}")
if [ "$HTTP" = "401" ]; then
  pass "login password incorrecto → 401"
else
  fail "login password incorrecto" "esperaba 401, obtuve $HTTP"
fi

# ── Check 6: GET /api/auth/me with cookie → 200 + authenticated:true ──
HTTP=$(curl -s -o /tmp/auth_body6 -w "%{http_code}" -b "$COOKIE" "$BASE/api/auth/me")
if [ "$HTTP" = "200" ]; then
  AUTH=$(python3 -c "import json; d=json.load(open('/tmp/auth_body6')); print(d.get('authenticated', False))" 2>/dev/null || echo "False")
  if [ "$AUTH" = "True" ]; then
    pass "/api/auth/me con cookie → 200 authenticated:true"
  else
    fail "/api/auth/me authenticated" "authenticated=$AUTH"
  fi
else
  fail "/api/auth/me con cookie" "esperaba 200, obtuve $HTTP"
fi

# ── Check 7: GET /api/auth/me without cookie → 401 ──
HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/auth/me")
if [ "$HTTP" = "401" ]; then
  pass "/api/auth/me sin cookie → 401"
else
  fail "/api/auth/me sin cookie" "esperaba 401, obtuve $HTTP"
fi

# ── Check 8: POST /api/auth/logout → 200 ──
# IMPORTANT: pass -c so curl updates the cookie jar with the Set-Cookie:maxAge=0
# that the server sends to delete the cookie.
HTTP=$(curl -s -o /tmp/auth_body_logout -w "%{http_code}" -b "$COOKIE" -c "$COOKIE" \
  -X POST "$BASE/api/auth/logout")
if [ "$HTTP" = "200" ]; then
  pass "/api/auth/logout → 200"
else
  fail "/api/auth/logout" "esperaba 200, obtuve $HTTP"
fi

# ── Check 9: GET /api/auth/me after logout → 401 ──
HTTP=$(curl -s -o /dev/null -w "%{http_code}" -b "$COOKIE" "$BASE/api/auth/me")
if [ "$HTTP" = "401" ]; then
  pass "/api/auth/me post-logout → 401"
else
  fail "/api/auth/me post-logout" "esperaba 401, obtuve $HTTP"
fi

echo ""
echo "═══════════════════════════════════════════════"
echo " Resultado: $PASS pass / $FAIL fail"
echo "═══════════════════════════════════════════════"

if [ "$FAIL" -gt 0 ]; then exit 1; fi
exit 0
