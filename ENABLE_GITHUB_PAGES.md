# How to Enable GitHub Pages

The documentation deployment workflow requires GitHub Pages to be enabled for this repository.

## Steps to Enable GitHub Pages:

1. **Go to Repository Settings**
   - Navigate to your repository on GitHub
   - Click the "Settings" tab

2. **Find the Pages Section**
   - Scroll down to the "Pages" section in the left sidebar
   - Or scroll down to find "Pages" in the main settings area

3. **Configure Pages Source**
   - Under "Source", select **"GitHub Actions"**
   - This allows the workflow to deploy documentation automatically

4. **Save Settings**
   - The settings should save automatically
   - You may see a message about Pages being enabled

5. **Re-run the Documentation Workflow**
   - Go to the "Actions" tab
   - Find the "Deploy Documentation Website" workflow
   - Click "Re-run jobs" or trigger it by pushing to the master branch

## What This Enables:

- ✅ Automatic documentation deployment
- ✅ Public documentation website at `https://[username].github.io/[repository-name]`
- ✅ Updates whenever documentation files change

## Troubleshooting:

If you still get errors after enabling Pages:
- Wait a few minutes for GitHub to process the settings
- Make sure the repository is public (or you have GitHub Pro for private repo Pages)
- Check that the workflow has the correct permissions

---

**Note**: This is a one-time setup. Once enabled, documentation will deploy automatically on every push to the master branch that changes documentation files.