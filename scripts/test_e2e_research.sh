#!/bin/bash
# NexScope — Agentic research E2E + MCP protocol test
# Run: ./scripts/test_e2e_research.sh [PORT]
#
# Verifies:
#   1. Single-tool agent loop: tool_call → tool_result → message
#   2. Multi-tool agent loop: 2 tool_calls + final message
#   3. State persisted (saved niche visible via REST)
#   4. MCP tools/list returns non-empty tools array
#   5. MCP resources/list returns non-empty resources array
set -e

PORT="${1:-3100}"
BASE="http://localhost:$PORT"
PASS=0
FAIL=0
TS=$(date +%s)
EMAIL="e2e-${TS}@test.com"
PASSWORD="TestPass123!"
COOKIE="/tmp/nexscope_e2e_${TS}.txt"

cleanup() {
  rm -f "$COOKIE" \
        /tmp/e2e_reg /tmp/e2e_stream1 /tmp/e2e_stream2 \
        /tmp/e2e_niches /tmp/e2e_mcp_tools /tmp/e2e_mcp_res
}
trap cleanup EXIT

pass() { echo "[PASS] $1"; PASS=$((PASS+1)); }
fail() { echo "[FAIL] $1 — $2"; FAIL=$((FAIL+1)); }

echo "═══════════════════════════════════════════════"
echo " NexScope E2E RESEARCH + MCP — PORT $PORT"
echo " email: $EMAIL"
echo "═══════════════════════════════════════════════"

# ── Register + login ──
HTTP=$(curl -s -o /tmp/e2e_reg -w "%{http_code}" -c "$COOKIE" -X POST "$BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"E2E Test\",\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
if [ "$HTTP" = "200" ]; then
  pass "register + login (cookie seteada)"
else
  fail "register" "esperaba 200, obtuve $HTTP"
  exit 1
fi

echo ""
echo "── 1) Agente single-tool: '¿qué nichos tengo guardados?' ──"
# Stream the SSE response (-N no buffer). Cap at 120s — agent calls can take 30+ s.
HTTP=$(curl -s -N -o /tmp/e2e_stream1 -w "%{http_code}" --max-time 120 \
  -b "$COOKIE" -X POST "$BASE/api/agent" \
  -H "Content-Type: application/json" \
  -d '{"message":"¿qué nichos tengo guardados?"}')
if [ "$HTTP" = "200" ]; then
  pass "SSE stream single-tool → HTTP 200"
else
  fail "SSE stream single-tool HTTP" "esperaba 200, obtuve $HTTP"
fi

# Parse SSE events. Each line is `data: {json}\n\n`. Extract events with python3.
python3 - /tmp/e2e_stream1 <<'PY'
import json, sys
path = sys.argv[1]
events = []
with open(path) as f:
    for line in f:
        line = line.strip()
        if not line.startswith('data:'):
            continue
        payload = line[5:].strip()
        if not payload:
            continue
        try:
            ev = json.loads(payload)
            events.append(ev)
        except Exception:
            pass

types = [e.get('type','?') for e in events]
has_tool_call = any(t == 'tool_call' for t in types)
has_tool_result = any(t == 'tool_result' for t in types)
has_message = any(t == 'message' for t in types)

print(f"    eventos recibidos: {len(events)}  tipos: {types}")

# Check for list_saved_niches tool call specifically
list_call = any(
    e.get('type') == 'tool_call' and e.get('name') == 'list_saved_niches'
    for e in events
)
list_ok = any(
    e.get('type') == 'tool_result' and e.get('name') == 'list_saved_niches' and e.get('ok') is True
    for e in events
)

ok = True
if not has_tool_call:
    print("[FAIL] no se recibió ningún evento tool_call")
    ok = False
elif not list_call:
    print("[FAIL] no se llamó a la herramienta list_saved_niches")
    ok = False
if not has_tool_result:
    print("[FAIL] no se recibió ningún evento tool_result")
    ok = False
elif not list_ok:
    print("[FAIL] tool_result de list_saved_niches no fue ok:true")
    ok = False
if not has_message:
    print("[FAIL] no se recibió ningún evento message final")
    ok = False

if ok:
    print("[PASS] single-tool: tool_call(list_saved_niches) → tool_result ok → message")
    sys.exit(0)
sys.exit(1)
PY
RC=$?
if [ "$RC" = "0" ]; then PASS=$((PASS+1)); else FAIL=$((FAIL+1)); fi

echo ""
echo "── 2) Agente multi-tool: 'Guárdame el nicho Prueba E2E y genera 5 keywords' ──"
HTTP=$(curl -s -N -o /tmp/e2e_stream2 -w "%{http_code}" --max-time 180 \
  -b "$COOKIE" -X POST "$BASE/api/agent" \
  -H "Content-Type: application/json" \
  -d "{\"message\":\"Guárdame el nicho 'Prueba E2E' y genera 5 keywords\"}")
if [ "$HTTP" = "200" ]; then
  pass "SSE stream multi-tool → HTTP 200"
else
  fail "SSE stream multi-tool HTTP" "esperaba 200, obtuve $HTTP"
fi

python3 - /tmp/e2e_stream2 <<'PY'
import json, sys
path = sys.argv[1]
events = []
with open(path) as f:
    for line in f:
        line = line.strip()
        if not line.startswith('data:'):
            continue
        payload = line[5:].strip()
        if not payload:
            continue
        try:
            ev = json.loads(payload)
            events.append(ev)
        except Exception:
            pass

types = [e.get('type','?') for e in events]
tool_calls = [e for e in events if e.get('type') == 'tool_call']
tool_names = [e.get('name','?') for e in tool_calls]
has_save   = any(n == 'save_niche' for n in tool_names)
has_gen_kw = any(n == 'generate_keywords' for n in tool_names)
has_message = any(t == 'message' for t in types)

print(f"    eventos: {len(events)}  tool_calls: {tool_names}")

ok = True
if len(tool_calls) < 2:
    print(f"[FAIL] esperaba >=2 tool_calls, obtuve {len(tool_calls)}")
    ok = False
if not has_save:
    print("[FAIL] no se llamó a save_niche")
    ok = False
if not has_gen_kw:
    print("[FAIL] no se llamó a generate_keywords")
    ok = False
if not has_message:
    print("[FAIL] no se recibió message final")
    ok = False

if ok:
    print(f"[PASS] multi-tool: save_niche + generate_keywords + message final ({len(tool_calls)} tool_calls)")
    sys.exit(0)
sys.exit(1)
PY
RC=$?
if [ "$RC" = "0" ]; then PASS=$((PASS+1)); else FAIL=$((FAIL+1)); fi

echo ""
echo "── 3) GET /api/saved-niches → debe contener 'Prueba E2E' ──"
HTTP=$(curl -s -o /tmp/e2e_niches -w "%{http_code}" -b "$COOKIE" "$BASE/api/saved-niches")
if [ "$HTTP" = "200" ]; then
  HAS=$(python3 -c "
import json
d = json.load(open('/tmp/e2e_niches'))
names = [n.get('nicheName','') for n in d.get('niches',[])]
print('FOUND' if any('Prueba E2E' in n for n in names) else 'NOT_FOUND')
" 2>/dev/null || echo "ERROR")
  if [ "$HAS" = "FOUND" ]; then
    pass "GET /api/saved-niches contiene 'Prueba E2E'"
  else
    fail "nicho persistido" "no se encontró 'Prueba E2E' (status=$HAS)"
  fi
else
  fail "GET /api/saved-niches HTTP" "esperaba 200, obtuve $HTTP"
fi

echo ""
echo "── 4) MCP tools/list → result.tools array no vacío ──"
HTTP=$(curl -s -o /tmp/e2e_mcp_tools -w "%{http_code}" --max-time 30 \
  -b "$COOKIE" -X POST "$BASE/api/mcp" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}')
if [ "$HTTP" = "200" ]; then
  TCOUNT=$(python3 -c "
import json
d = json.load(open('/tmp/e2e_mcp_tools'))
print(len(d.get('result',{}).get('tools',[])))
" 2>/dev/null || echo "0")
  if [ "$TCOUNT" -gt 0 ] 2>/dev/null; then
    pass "MCP tools/list → $TCOUNT tools"
  else
    fail "MCP tools/list" "tools array vacío o inválido (count=$TCOUNT)"
  fi
else
  fail "MCP tools/list HTTP" "esperaba 200, obtuve $HTTP"
fi

echo "── 5) MCP resources/list → result.resources array no vacío ──"
HTTP=$(curl -s -o /tmp/e2e_mcp_res -w "%{http_code}" --max-time 30 \
  -b "$COOKIE" -X POST "$BASE/api/mcp" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"resources/list"}')
if [ "$HTTP" = "200" ]; then
  RCOUNT=$(python3 -c "
import json
d = json.load(open('/tmp/e2e_mcp_res'))
print(len(d.get('result',{}).get('resources',[])))
" 2>/dev/null || echo "0")
  if [ "$RCOUNT" -gt 0 ] 2>/dev/null; then
    pass "MCP resources/list → $RCOUNT resources"
  else
    fail "MCP resources/list" "resources array vacío o inválido (count=$RCOUNT)"
  fi
else
  fail "MCP resources/list HTTP" "esperaba 200, obtuve $HTTP"
fi

# ── Cleanup: logout ──
curl -s -o /dev/null -b "$COOKIE" -c "$COOKIE" -X POST "$BASE/api/auth/logout"

echo ""
echo "═══════════════════════════════════════════════"
echo " Resultado: $PASS pass / $FAIL fail"
echo "═══════════════════════════════════════════════"

if [ "$FAIL" -gt 0 ]; then exit 1; fi
exit 0
