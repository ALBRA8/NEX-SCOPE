@echo off
cd /d "%~dp0\.."
if not exist ".env.local" (
    if exist ".env.example" copy ".env.example" ".env.local" >nul
)
set PORT=3000
set NODE_ENV=development
start "" "http://localhost:3000"
call npm run dev > .server_log.txt 2>&1
