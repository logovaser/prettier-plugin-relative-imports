@echo off
REM Quick setup and test script for the Prettier plugin (Windows)

echo =========================================
echo Prettier Plugin Setup ^& Test
echo =========================================
echo.

set PLUGIN_DIR=%cd%
set TARGET_PROJECT=D:\W\Upriver\webapp-next
set TARGET_FILE=app\[lang]\(app)\(no-header)\agent\task-list-item.tsx

echo Step 1: Link plugin locally
echo -------------------------------------
call npm link
echo.

echo Step 2: Navigate to target project
echo -------------------------------------
cd /d "%TARGET_PROJECT%"
if errorlevel 1 (
    echo ERROR: Could not navigate to %TARGET_PROJECT%
    exit /b 1
)

echo Step 3: Link plugin to target project
echo -------------------------------------
call npm link prettier-plugin-relative-imports
echo.

echo Step 4: Create .prettierrc configuration
echo -------------------------------------
(
echo {
echo   "plugins": ["prettier-plugin-relative-imports"],
echo   "absolutePathPrefix": "@/",
echo   "maxRelativePathDepth": 1,
echo   "semi": true,
echo   "singleQuote": false,
echo   "trailingComma": "all"
echo }
) > .prettierrc.test.json
echo Created .prettierrc.test.json
echo.

echo Step 5: Show current import
echo -------------------------------------
echo Current content of line 5:
powershell -Command "Get-Content '%TARGET_FILE%' | Select-Object -Skip 4 -First 1"
echo.

echo Step 6: Test Prettier
echo -------------------------------------
echo.
echo To format the file, run:
echo   cd %TARGET_PROJECT%
echo   npx prettier --config .prettierrc.test.json --write "%TARGET_FILE%"
echo.
echo Or to preview without modifying:
echo   npx prettier --config .prettierrc.test.json "%TARGET_FILE%"
echo.

echo =========================================
echo Setup complete!
echo =========================================
echo.
echo Run this to format the file:
echo   cd %TARGET_PROJECT% ^&^& npx prettier --config .prettierrc.test.json --write "%TARGET_FILE%"
echo.

pause

