#!/bin/bash
cd /home/z/my-project/.next/standalone
while true; do
  node server.js
  echo "Server crashed, restarting..." >> /home/z/my-project/crash.log
  sleep 2
done
