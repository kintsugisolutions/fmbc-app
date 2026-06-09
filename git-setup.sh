#!/bin/bash
cd "/Users/sehaj/Documents/FMBC Assets/fmbc-app"
git init
git add -A
git commit -m "initial commit: FMBC app with audit fixes, OG image, domain update"
git branch -M main
git remote add origin https://github.com/kintsugisolutions/fmbc-app.git
git push -u origin main
