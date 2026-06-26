#!/bin/bash
# E2E persistence test for NexScope
# Tests: register → login → save niche → reload → save channel → save chat msg → save plan → list all → delete

BASE=http://localhost:3000
COOKIES=/tmp/nexscope_cookies.txt
rm -f $COOKIES

RAND=$(date +%s)
EMAIL="test_persist_${RAND}@nexscope.app"
PASS="TestPass123!"
NAME="Test Persist"

echo "═══════════════════════════════════════════════"
echo "1. REGISTER new user: $EMAIL"
echo "═══════════════════════════════════════════════"
REGISTER_RES=$(curl -s -c $COOKIES -X POST $BASE/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"$NAME\",\"email\":\"$EMAIL\",\"password\":\"$PASS\"}")
echo "$REGISTER_RES" | head -c 300
echo ""
echo "Cookies after register:"
cat $COOKIES | grep nexscope_token | head -1 | awk '{print "  token cookie set (" $6 " bytes)"}'

echo ""
echo "═══════════════════════════════════════════════"
echo "2. GET /api/auth/me (verify session)"
echo "═══════════════════════════════════════════════"
ME_RES=$(curl -s -b $COOKIES $BASE/api/auth/me)
echo "$ME_RES" | head -c 300

echo ""
echo ""
echo "═══════════════════════════════════════════════"
echo "3. POST /api/saved-niches (save 2 niches)"
echo "═══════════════════════════════════════════════"
curl -s -b $COOKIES -X POST $BASE/api/saved-niches \
  -H "Content-Type: application/json" \
  -d '{"nicheId":"yt-fintech-001","nicheName":"Finanzas Personales","category":"Finanzas","nicheScore":87}' | head -c 200
echo ""
curl -s -b $COOKIES -X POST $BASE/api/saved-niches \
  -H "Content-Type: application/json" \
  -d '{"nicheId":"yt-ai-002","nicheName":"IA Tools","category":"Tecnología","nicheScore":92}' | head -c 200

echo ""
echo ""
echo "═══════════════════════════════════════════════"
echo "4. GET /api/saved-niches (should list 2)"
echo "═══════════════════════════════════════════════"
curl -s -b $COOKIES $BASE/api/saved-niches | python3 -m json.tool 2>/dev/null || curl -s -b $COOKIES $BASE/api/saved-niches

echo ""
echo "═══════════════════════════════════════════════"
echo "5. POST /api/saved-channels (save 1 channel)"
echo "═══════════════════════════════════════════════"
curl -s -b $COOKIES -X POST $BASE/api/saved-channels \
  -H "Content-Type: application/json" \
  -d '{"channelId":"UC_x5XG1OV2P6uZZ5FSM9Ttw","channelName":"Google Developers","subscribers":2500000}' | head -c 200

echo ""
echo ""
echo "═══════════════════════════════════════════════"
echo "6. GET /api/saved-channels (should list 1)"
echo "═══════════════════════════════════════════════"
curl -s -b $COOKIES $BASE/api/saved-channels | python3 -m json.tool 2>/dev/null || curl -s -b $COOKIES $BASE/api/saved-channels

echo ""
echo "═══════════════════════════════════════════════"
echo "7. POST /api/chat-messages (save 3 messages)"
echo "═══════════════════════════════════════════════"
for i in 1 2 3; do
  role=$([ $i -eq 1 ] && echo "user" || ([ $i -eq 2 ] && echo "assistant" || echo "user"))
  content="Test message $i"
  curl -s -b $COOKIES -X POST $BASE/api/chat-messages \
    -H "Content-Type: application/json" \
    -d "{\"role\":\"$role\",\"content\":\"$content\"}" | head -c 150
  echo ""
done

echo ""
echo "═══════════════════════════════════════════════"
echo "8. GET /api/chat-messages (should list 3)"
echo "═══════════════════════════════════════════════"
curl -s -b $COOKIES $BASE/api/chat-messages | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Messages count: {len(d[\"messages\"])}'); [print(f'  - {m[\"role\"]}: {m[\"content\"]}') for m in d['messages']]"

echo ""
echo "═══════════════════════════════════════════════"
echo "9. POST /api/content-plans (save 1 plan)"
echo "═══════════════════════════════════════════════"
PLAN_DATA='[{"title":"Video 1","description":"desc","keywords":["k"],"estimatedViews":15000,"difficulty":"fácil","format":"Tutorial","week":1}]'
curl -s -b $COOKIES -X POST $BASE/api/content-plans \
  -H "Content-Type: application/json" \
  -d "{\"niche\":\"Finanzas Personales\",\"audience\":\"Adultos 25-45\",\"planData\":$PLAN_DATA}" | head -c 250

echo ""
echo ""
echo "═══════════════════════════════════════════════"
echo "10. GET /api/content-plans (should list 1)"
echo "═══════════════════════════════════════════════"
curl -s -b $COOKIES $BASE/api/content-plans | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Plans count: {len(d[\"plans\"])}'); [print(f'  - {p[\"niche\"]} ({p[\"audience\"]})') for p in d['plans']]"

echo ""
echo "═══════════════════════════════════════════════"
echo "11. DELETE niche yt-ai-002 (should remove 1)"
echo "═══════════════════════════════════════════════"
curl -s -b $COOKIES -X DELETE "$BASE/api/saved-niches?nicheId=yt-ai-002"

echo ""
echo ""
echo "═══════════════════════════════════════════════"
echo "12. GET /api/saved-niches (should now list 1)"
echo "═══════════════════════════════════════════════"
curl -s -b $COOKIES $BASE/api/saved-niches | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Niches count: {len(d[\"niches\"])}'); [print(f'  - {n[\"nicheName\"]}') for n in d['niches']]"

echo ""
echo "═══════════════════════════════════════════════"
echo "13. TEST AUTH GATE: clear cookies, try GET niches"
echo "═══════════════════════════════════════════════"
UNAUTH_RES=$(curl -s -X GET $BASE/api/saved-niches)
echo "Unauthenticated response: $UNAUTH_RES"

echo ""
echo "═══════════════════════════════════════════════"
echo "14. LOGOUT"
echo "═══════════════════════════════════════════════"
curl -s -b $COOKIES -X POST $BASE/api/auth/logout
echo ""
echo ""
echo "═══════════════════════════════════════════════"
echo "ALL TESTS COMPLETED"
echo "═══════════════════════════════════════════════"
