@echo off
setlocal

cd /d "%~dp0"

set "PYTHON_EXE="

where py >nul 2>nul
if %ERRORLEVEL% EQU 0 (
  py -3.12 --version >nul 2>nul
  if %ERRORLEVEL% EQU 0 set "PYTHON_EXE=py -3.12"
)

if "%PYTHON_EXE%"=="" (
  if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" (
    set "PYTHON_EXE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
  )
)

if "%PYTHON_EXE%"=="" (
  set "PYTHON_EXE=python"
)

if not exist ".venv\Scripts\python.exe" (
  %PYTHON_EXE% -m venv .venv
)

".venv\Scripts\python.exe" -m pip install --upgrade pip
".venv\Scripts\python.exe" -m pip install -r requirements.txt
".venv\Scripts\python.exe" -m uvicorn main:app --host 0.0.0.0 --port 8000
