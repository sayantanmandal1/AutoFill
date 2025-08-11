#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Automated Changelog Generator
 * Generates changelogs from git commits with semantic versioning support
 */
class ChangelogGenerator {
  constructor() {
    this.changelogPath = path.resolve('CHANGELOG.md');
    this.manifestPath = path.resolve('manifest.json');
    this.packagePath = path.resolve('package.json');
  }

  /**
   * Parse commit message for conventional commit format
   * @param {string} commit - Commit message
   * @returns {Object} Parsed commit information
   */
  parseCommit(commit) {
    // Conventional commit format: type(scope): description
    const conventionalRegex = /^(\w+)(\(.+\))?: (.+)$/;
    const match = commit.match(conventionalRegex);

    if (match) {
      const [, type, scope, description] = match;
      return {
        type: type.toLowerCase(),
        scope: scope ? scope.slice(1, -1) : null,
        description,
        isConventional: true
      };
    }

    // Fallback for non-conventional commits
    return {
      type: 'other',
      scope: null,
      description: commit,
      isConventional: false
    };
  }

  /**
   * Categorize commits by type
   * @param {Array} commits - Array of commit objects
   * @returns {Object} Categorized commits
   */
  categorizeCommits(commits) {
    const categories = {
      breaking: [],
      feat: [],
      fix: [],
      docs: [],
      style: [],
      refactor: [],
      perf: [],
      test: [],
      build: [],
      ci: [],
      chore: [],
      other: []
    };

    commits.forEach(commit => {
      const parsed = this.parseCommit(commit.message);
      
      // Check for breaking changes
      if (commit.message.includes('BREAKING CHANGE') || 
          commit.message.includes('!:') ||
          parsed.type === 'breaking') {
        categories.breaking.push({ ...commit, parsed });
      } else if (categories[parsed.type]) {
        categories[parsed.type].push({ ...commit, parsed });
      } else {
        categories.other.push({ ...commit, parsed });
      }
    });

    return categories;
  }

  /**
   * Get commits between two references
   * @param {string} fromRef - Starting reference (tag, commit, etc.)
   * @param {string} toRef - Ending reference (defaults to HEAD)
   * @returns {Array} Array of commit objects
   */
  getCommitsBetween(fromRef = null, toRef = 'HEAD') {
    try {
      let gitCommand;
      if (fromRef) {
        gitCommand = `git log ${fromRef}..${toRef} --oneline --pretty=format:"%H|%s|%an|%ad" --date=short`;
      } else {
        // Get all commits if no starting reference
        gitCommand = `git log ${toRef} --oneline --pretty=format:"%H|%s|%an|%ad" --date=short`;
      }

      const output = execSync(gitCommand, { encoding: 'utf8' }).trim();
      
      if (!output) {
        return [];
      }

      return output.split('\n').map(line => {
        const [hash, message, author, date] = line.split('|');
        return {
          hash: hash.substring(0, 7),
          message: message.trim(),
          author: author.trim(),
          date: date.trim()
        };
      });
    } catch (error) {
      console.warn('⚠️ Failed to get commits:', error.message);
      return [];
    }
  }

  /**
   * Get the latest git tag
   * @returns {string|null} Latest tag or null if none exists
   */
  getLatestTag() {
    try {
      const tag = execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim();
      return tag;
    } catch (error) {
      return null;
    }
  }

  /**
   * Determine next version based on commit types
   * @param {Object} categorizedCommits - Categorized commits
   * @param {string} currentVersion - Current version
   * @returns {string} Next version
   */
  determineNextVersion(categorizedCommits, currentVersion) {
    const [major, minor, patch] = currentVersion.replace(/^v/, '').split('.').map(Number);

    // Breaking changes = major version bump
    if (categorizedCommits.breaking.length > 0) {
      return `${major + 1}.0.0`;
    }

    // New features = minor version bump
    if (categorizedCommits.feat.length > 0) {
      return `${major}.${minor + 1}.0`;
    }

    // Bug fixes or other changes = patch version bump
    if (categorizedCommits.fix.length > 0 || 
        categorizedCommits.perf.length > 0 ||
        categorizedCommits.other.length > 0) {
      return `${major}.${minor}.${patch + 1}`;
    }

    // Only docs, style, test, build, ci, chore = patch version bump
    return `${major}.${minor}.${patch + 1}`;
  }

  /**
   * Format commits for changelog
   * @param {Array} commits - Array of commits
   * @param {string} categoryTitle - Category title
   * @returns {string} Formatted changelog section
   */
  formatCommitsSection(commits, categoryTitle) {
    if (commits.length === 0) return '';

    let section = `### ${categoryTitle}\n\n`;
    
    commits.forEach(commit => {
      const scope = commit.parsed.scope ? `**${commit.parsed.scope}**: ` : '';
      section += `- ${scope}${commit.parsed.description} ([${commit.hash}](../../commit/${commit.hash}))\n`;
    });

    return section + '\n';
  }

  /**
   * Generate changelog content
   * @param {string} version - Version being released
   * @param {Object} categorizedCommits - Categorized commits
   * @param {string} date - Release date
   * @returns {string} Formatted changelog content
   */
  generateChangelogContent(version, categorizedCommits, date) {
    let content = `## [${version}] - ${date}\n\n`;

    // Add breaking changes first (most important)
    if (categorizedCommits.breaking.length > 0) {
      content += this.formatCommitsSection(categorizedCommits.breaking, '💥 Breaking Changes');
    }

    // Add new features
    if (categorizedCommits.feat.length > 0) {
      content += this.formatCommitsSection(categorizedCommits.feat, '✨ Features');
    }

    // Add bug fixes
    if (categorizedCommits.fix.length > 0) {
      content += this.formatCommitsSection(categorizedCommits.fix, '🐛 Bug Fixes');
    }

    // Add performance improvements
    if (categorizedCommits.perf.length > 0) {
      content += this.formatCommitsSection(categorizedCommits.perf, '⚡ Performance');
    }

    // Add refactoring
    if (categorizedCommits.refactor.length > 0) {
      content += this.formatCommitsSection(categorizedCommits.refactor, '♻️ Refactoring');
    }

    // Add documentation
    if (categorizedCommits.docs.length > 0) {
      content += this.formatCommitsSection(categorizedCommits.docs, '📚 Documentation');
    }

    // Add styling
    if (categorizedCommits.style.length > 0) {
      content += this.formatCommitsSection(categorizedCommits.style, '💄 Styling');
    }

    // Add tests
    if (categorizedCommits.test.length > 0) {
      content += this.formatCommitsSection(categorizedCommits.test, '🧪 Tests');
    }

    // Add build/CI changes
    if (categorizedCommits.build.length > 0 || categorizedCommits.ci.length > 0) {
      const buildCommits = [...categorizedCommits.build, ...categorizedCommits.ci];
      content += this.formatCommitsSection(buildCommits, '🔧 Build & CI');
    }

    // Add chore/maintenance
    if (categorizedCommits.chore.length > 0) {
      content += this.formatCommitsSection(categorizedCommits.chore, '🧹 Maintenance');
    }

    // Add other changes
    if (categorizedCommits.other.length > 0) {
      content += this.formatCommitsSection(categorizedCommits.other, '📦 Other Changes');
    }

    return content;
  }

  /**
   * Update CHANGELOG.md file with new version
   * @param {string} version - Version being released
   * @param {string} changelogContent - New changelog content
   */
  updateChangelogFile(version, changelogContent) {
    console.log(`📝 Updating CHANGELOG.md for version ${version}`);

    let existingContent = '';
    if (fs.existsSync(this.changelogPath)) {
      existingContent = fs.readFileSync(this.changelogPath, 'utf8');
    } else {
      // Create new changelog file
      existingContent = `# Changelog

All notable changes to the Job Application Autofill Extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

`;
    }

    // Find where to insert the new entry
    const lines = existingContent.split('\n');
    const firstVersionIndex = lines.findIndex(line => line.match(/^## \[/));
    
    if (firstVersionIndex === -1) {
      // No existing versions, add after header
      const headerEndIndex = lines.findIndex(line => line.trim() === '') + 1;
      const newContent = [
        ...lines.slice(0, headerEndIndex),
        changelogContent,
        ...lines.slice(headerEndIndex)
      ].join('\n');
      
      fs.writeFileSync(this.changelogPath, newContent);
    } else {
      // Insert before first existing version
      const newContent = [
        ...lines.slice(0, firstVersionIndex),
        changelogContent,
        ...lines.slice(firstVersionIndex)
      ].join('\n');
      
      fs.writeFileSync(this.changelogPath, newContent);
    }

    console.log('✅ CHANGELOG.md updated successfully');
  }

  /**
   * Generate changelog for a specific version
   * @param {Object} options - Generation options
   * @returns {Object} Generation result
   */
  async generateChangelog(options = {}) {
    const {
      version = null,
      fromTag = null,
      toRef = 'HEAD',
      autoVersion = false,
      dryRun = false
    } = options;

    console.log('🔄 Generating automated changelog...');

    try {
      // Get commits
      const startRef = fromTag || this.getLatestTag();
      const commits = this.getCommitsBetween(startRef, toRef);

      if (commits.length === 0) {
        console.log('⚠️ No commits found for changelog generation');
        return { success: false, message: 'No commits found' };
      }

      console.log(`📊 Found ${commits.length} commits to process`);

      // Categorize commits
      const categorizedCommits = this.categorizeCommits(commits);

      // Determine version
      let releaseVersion = version;
      if (autoVersion && !version) {
        const currentVersion = startRef || '0.0.0';
        releaseVersion = this.determineNextVersion(categorizedCommits, currentVersion);
        console.log(`🔢 Auto-determined version: ${releaseVersion}`);
      }

      if (!releaseVersion) {
        throw new Error('Version must be specified or autoVersion must be enabled');
      }

      // Generate changelog content
      const date = new Date().toISOString().split('T')[0];
      const changelogContent = this.generateChangelogContent(releaseVersion, categorizedCommits, date);

      if (dryRun) {
        console.log('🔍 Dry run - changelog content:');
        console.log(changelogContent);
        return { success: true, content: changelogContent, version: releaseVersion };
      }

      // Update changelog file
      this.updateChangelogFile(releaseVersion, changelogContent);

      console.log(`🎉 Changelog generated successfully for version ${releaseVersion}`);

      return {
        success: true,
        version: releaseVersion,
        commitsProcessed: commits.length,
        categorizedCommits,
        changelogPath: this.changelogPath
      };

    } catch (error) {
      console.error(`❌ Changelog generation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate release notes for GitHub releases
   * @param {Object} categorizedCommits - Categorized commits
   * @returns {string} Release notes content
   */
  generateReleaseNotes(categorizedCommits) {
    let notes = '';

    // Add summary
    const totalCommits = Object.values(categorizedCommits).reduce((sum, commits) => sum + commits.length, 0);
    notes += `This release includes ${totalCommits} changes:\n\n`;

    // Add highlights
    if (categorizedCommits.breaking.length > 0) {
      notes += `⚠️ **${categorizedCommits.breaking.length} Breaking Changes** - Please review upgrade notes\n`;
    }
    if (categorizedCommits.feat.length > 0) {
      notes += `✨ **${categorizedCommits.feat.length} New Features**\n`;
    }
    if (categorizedCommits.fix.length > 0) {
      notes += `🐛 **${categorizedCommits.fix.length} Bug Fixes**\n`;
    }

    notes += '\n---\n\n';
    notes += 'See [CHANGELOG.md](./CHANGELOG.md) for detailed changes.\n';

    return notes;
  }
}

// CLI interface
function parseArgs() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'generate':
      const version = args.find(arg => arg.startsWith('--version='))?.split('=')[1];
      const fromTag = args.find(arg => arg.startsWith('--from='))?.split('=')[1];
      const autoVersion = args.includes('--auto-version');
      const dryRun = args.includes('--dry-run');

      const generator = new ChangelogGenerator();
      generator.generateChangelog({
        version,
        fromTag,
        autoVersion,
        dryRun
      }).catch(error => {
        console.error(error.message);
        process.exit(1);
      });
      break;

    case 'release-notes':
      const notesVersion = args.find(arg => arg.startsWith('--version='))?.split('=')[1];
      const notesFromTag = args.find(arg => arg.startsWith('--from='))?.split('=')[1];
      
      const notesGenerator = new ChangelogGenerator();
      const startRef = notesFromTag || notesGenerator.getLatestTag();
      const commits = notesGenerator.getCommitsBetween(startRef);
      const categorized = notesGenerator.categorizeCommits(commits);
      const releaseNotes = notesGenerator.generateReleaseNotes(categorized);
      
      console.log(releaseNotes);
      break;

    default:
      console.log(`
Automated Changelog Generator

Usage: node changelog-generator.js <command> [options]

Commands:
  generate                   Generate changelog from commits
  release-notes             Generate release notes for GitHub

Options:
  --version=<version>       Specify version (e.g., --version=1.2.3)
  --from=<tag>              Start from specific tag (e.g., --from=v1.0.0)
  --auto-version            Automatically determine version from commits
  --dry-run                 Show what would be generated without writing

Examples:
  node changelog-generator.js generate --version=1.2.3
  node changelog-generator.js generate --auto-version --from=v1.0.0
  node changelog-generator.js generate --dry-run --auto-version
  node changelog-generator.js release-notes --version=1.2.3
      `);
      break;
  }
}

// Run CLI if called directly
if (require.main === module) {
  parseArgs();
}

module.exports = ChangelogGenerator;