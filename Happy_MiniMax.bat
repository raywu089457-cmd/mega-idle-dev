@echo off
chcp 65001 >nul
cmd /k "cd /d C:\Users\ray\.openclaw\game-studios\projects\mega-idle-dev && set ANTHROPIC_BASE_URL=http://localhost:3456 && happy --claude-env ANTHROPIC_BASE_URL=http://localhost:3456"
