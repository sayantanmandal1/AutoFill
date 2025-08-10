#!/bin/bash

# Git Setup Script for Job Application Autofill Extension
# This script helps you initialize and push your extension to GitHub

echo "🚀 Setting up Git repository for Job Application Autofill Extension"
echo "=================================================================="

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    echo "   Visit: https://git-scm.com/downloads"
    exit 1
fi

# Check if we're already in a git repository
if [ -d ".git" ]; then
    echo "📁 Git repository already exists."
    read -p "Do you want to continue? This will add new files to the existing repo. (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Aborted."
        exit 1
    fi
else
    echo "📁 Initializing new Git repository..."
    git init
fi

# Add all files to git
echo "📝 Adding files to Git..."
git add .

# Check git status
echo "📊 Current Git status:"
git status --short

# Commit the files
echo ""
read -p "📝 Enter commit message (or press Enter for default): " commit_message
if [ -z "$commit_message" ]; then
    commit_message="Initial commit: Job Application Autofill Extension v1.0.0

- Complete Chrome extension with autofill functionality
- Support for Chrome, Brave, and Edge browsers
- Multiple profiles and custom fields support
- Password protection and security features
- Comprehensive test suite (97 tests)
- Cross-browser compatibility validated
- Production-ready with full documentation"
fi

git commit -m "$commit_message"

echo ""
echo "✅ Files committed successfully!"
echo ""

# Check if remote origin exists
if git remote get-url origin &> /dev/null; then
    echo "🔗 Remote origin already configured:"
    git remote -v
    echo ""
    read -p "Do you want to push to the existing remote? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🚀 Pushing to existing remote..."
        git push -u origin main 2>/dev/null || git push -u origin master 2>/dev/null || {
            echo "❌ Push failed. You may need to create the main/master branch first."
            echo "   Try: git push -u origin HEAD"
        }
    fi
else
    echo "🔗 No remote repository configured."
    echo ""
    echo "To push to GitHub:"
    echo "1. Create a new repository on GitHub"
    echo "2. Copy the repository URL"
    echo "3. Run one of these commands:"
    echo ""
    echo "   For HTTPS:"
    echo "   git remote add origin https://github.com/sayantanmandal1/AutoFill.git"
    echo ""
    echo "   For SSH:"
    echo "   git remote add origin git@github.com:yourusername/job-application-autofill.git"
    echo ""
    echo "4. Then push with:"
    echo "   git push -u origin main"
    echo ""
    
    read -p "Do you want to add a remote now? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter your GitHub repository URL: " repo_url
        if [ ! -z "$repo_url" ]; then
            git remote add origin "$repo_url"
            echo "✅ Remote added successfully!"
            echo ""
            read -p "Push to GitHub now? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                echo "🚀 Pushing to GitHub..."
                git push -u origin main 2>/dev/null || git push -u origin master 2>/dev/null || {
                    echo "❌ Push failed. You may need to:"
                    echo "   1. Verify the repository URL is correct"
                    echo "   2. Check your GitHub authentication"
                    echo "   3. Ensure the repository exists on GitHub"
                }
            fi
        fi
    fi
fi

echo ""
echo "🎉 Git setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Verify your repository on GitHub"
echo "   2. Update the README.md with your actual GitHub username"
echo "   3. Consider creating a release for v1.0.0"
echo "   4. Set up GitHub Pages for documentation (optional)"
echo ""
echo "📚 Useful Git commands:"
echo "   git status          - Check repository status"
echo "   git add .           - Add all changes"
echo "   git commit -m 'msg' - Commit with message"
echo "   git push            - Push to remote repository"
echo "   git pull            - Pull latest changes"
echo ""
echo "🔗 Your repository should be available at:"
echo "   https://github.com/yourusername/autofill"
echo ""
echo "Happy coding! 🚀"