@echo off
cd /d "%~dp0"
echo Spoustim kalkulacku dopravy Kostelec...
py -3 server.py 8080
if errorlevel 1 (
  echo.
  echo Nepodarilo se spustit na portu 8080. Zkousim port 8081...
  py -3 server.py 8081
)
pause
