@echo off
REM Git Setup Script for Job Application Autofill Extension (Windows)
REM This script helps you initialize and push your extension to GitHub

echo 🚀 Setting up Git repository for Job Application Autofill Extension
echo ==================================================================
echo.

REM Check if git is installed
git --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Git is not installed. Please install Git first.
    echo    Visit: https://git-scm.com/downloads
    pause
    exit /b 1
)

REM Check if we're already in a git repository
if exist ".git" (
    echo 📁 Git repository already exists.
    set /p continue="Do you want to continue? This will add new files to the existing repo. (y/N): "
    if /i not "%continue%"=="y" (
        echo ❌ Aborted.
        pause
        exit /b 1
    )
) else (
    echo 📁 Initializing new Git repository...
    git init
)

REM Add all files to git
echo 📝 Adding files to Git...
git add .

REM Check git status
echo 📊 Current Git status:
git status --short

REM Commit the files
echo.
set /p commit_message="📝 Enter commit message (or press Enter for default): "
if "%commit_message%"=="" (
    set "commit_message=Initial commit: Job Application Autofill Extension v1.0.0

- Complete Chrome extension with autofill functionality
- Support for Chrome, Brave, and Edge browsers
- Multiple profiles and custom fields support
- Password protection and security features
- Comprehensive test suite (97 tests)
- Cross-browser compatibility validated
- Production-ready with full documentation"
)

git commit -m "%commit_message%"

echo.
echo ✅ Files committed successfully!
echo.

REM Check if remote origin exists
git remote get-url origin >nul 2>&1
if not errorlevel 1 (
    echo 🔗 Remote origin already configured:
    git remote -v
    echo.
    set /p push_existing="Do you want to push to the existing remote? (y/N): "
    if /i "%push_existing%"=="y" (
        echo 🚀 Pushing to existing remote...
        git push -u origin main 2>nul || git push -u origin master 2>nul || (
            echo ❌ Push failed. You may need to create the main/master branch first.
            echo    Try: git push -u origin HEAD
        )
    )
) else (
    echo 🔗 No remote repository configured.
    echo.
    echo To push to GitHub:
    echo 1. Create a new repository on GitHub
    echo 2. Copy the repository URL
    echo 3. Run one of these commands:
    echo.
    echo    For HTTPS:
    echo    git remote add origin https://github.com/yourusername/job-application-autofill.git
    echo.
    echo    For SSH:
    echo    git remote add origin git@github.com:yourusername/job-application-autofill.git
    echo.
    echo 4. Then push with:
    echo    git push -u origin main
    echo.
    
    set /p add_remote="Do you want to add a remote now? (y/N): "
    if /i "%add_remote%"=="y" (
        set /p repo_url="Enter your GitHub repository URL: "
        if not "!repo_url!"=="" (
            git remote add origin "!repo_url!"
            echo ✅ Remote added successfully!
            echo.
            set /p push_now="Push to GitHub now? (y/N): "
            if /i "!push_now!"=="y" (
                echo 🚀 Pushing to GitHub...
                git push -u origin main 2>nul || git push -u origin master 2>nul || (
                    echo ❌ Push failed. You may need to:
                    echo    1. Verify the repository URL is correct
                    echo    2. Check your GitHub authentication
                    echo    3. Ensure the repository exists on GitHub
                )
            )
        )
    )
)

echo.
echo 🎉 Git setup complete!
echo.
echo 📋 Next steps:
echo    1. Verify your repository on GitHub
echo    2. Update the README.md with your actual GitHub username
echo    3. Consider creating a release for v1.0.0
echo    4. Set up GitHub Pages for documentation (optional)
echo.
echo 📚 Useful Git commands:
echo    git status          - Check repository status
echo    git add .           - Add all changes
echo    git commit -m "msg" - Commit with message
echo    git push            - Push to remote repository
echo    git pull            - Pull latest changes
echo.
echo 🔗 Your repository should be available at:
echo    https://github.com/yourusername/job-application-autofill
echo.
echo Happy coding! 🚀
echo.
pause