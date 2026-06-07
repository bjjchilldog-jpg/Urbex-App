@echo off
color 0a
title Urbex App Admin Tool
echo Starte Urbex Admin Tool...
PowerShell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Admin.ps1"
