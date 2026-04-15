@echo off
REM Git Push Script for FieldBooking Project

echo.
echo ============================================
echo.   GIT PUSH SETUP - FieldBooking
echo.
echo ============================================
echo.

REM Navigate to project
cd /d "C:\Users\AChin\Desktop\BlockChain\FieldBooking"

REM Check if git is installed
git --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Git is not installed or not in PATH
    echo Please install Git from: https://git-scm.com/download/win
    pause
    exit /b 1
)

echo [OK] Git is installed

REM Initialize git if not already done
if not exist .git (
    echo [INFO] Initializing Git repository...
    git init
    echo [OK] Git repository initialized
) else (
    echo [OK] Git repository already exists
)

REM Configure git user (optional, only if needed)
echo.
echo [INFO] Configuring Git user...
for /f "delims=" %%i in ('git config --global user.name') do set gitname=%%i
if "%gitname%"=="" (
    echo Please enter your Git username:
    set /p gitname=
    git config --global user.name "%gitname%"
    echo [OK] Git username set to: %gitname%
) else (
    echo [OK] Git username already set: %gitname%
)

REM Add all files
echo.
echo [INFO] Adding all files...
git add .
echo [OK] Files added

REM Commit
echo.
echo [INFO] Creating initial commit...
git commit -m "Initial commit: FieldBooking - Blockchain-based field booking system with Smart Contract and React Frontend"
if errorlevel 1 (
    echo [WARNING] Commit failed - files may already be committed or staged
)
echo [OK] Commit completed

REM Set main branch
echo.
echo [INFO] Setting main branch...
git branch -M main
echo [OK] Branch set to main

REM Add remote
echo.
echo [INFO] Setting up GitHub remote...
echo GitHub Repository URL needed!
echo Example: https://github.com/AchinSouthSide/BLOCKCHAIN.git
echo.
set /p github_url="Enter your GitHub repository URL: "

if "%github_url%"=="" (
    echo [ERROR] No URL provided
    pause
    exit /b 1
)

REM Check if remote already exists
git remote get-url origin >nul 2>&1
if errorlevel 0 (
    echo [INFO] Remote already exists, updating...
    git remote set-url origin %github_url%
) else (
    echo [INFO] Adding new remote...
    git remote add origin %github_url%
)

echo [OK] Remote configured: %github_url%

REM Push to GitHub
echo.
echo [INFO] Pushing to GitHub...
echo You may be prompted to enter your GitHub credentials.
echo.
git push -u origin main

if errorlevel 1 (
    echo [ERROR] Push failed!
    echo Please check:
    echo - GitHub URL is correct
    echo - You have internet connection
    echo - GitHub credentials are correct
    pause
    exit /b 1
)

echo.
echo ============================================
echo [SUCCESS] Project pushed to GitHub!
echo.
echo Repository URL: %github_url%
echo.
echo View on GitHub: %github_url%
echo ============================================
echo.
pause
