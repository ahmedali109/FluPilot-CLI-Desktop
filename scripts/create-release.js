#!/usr/bin/env node

/**
 * GitHub Release Creation Script
 * This script helps create releases on GitHub with built binaries
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const packageJson = require('../package.json');

const GITHUB_REPO = 'ahmedali109/FluPilot-CLI-Desktop';

function runCommand(command, description) {
  console.log(`\n🔄 ${description}...`);
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: 'inherit' });
    console.log(`✅ ${description} completed`);
    return output;
  } catch (error) {
    console.error(`❌ Failed to ${description.toLowerCase()}`);
    console.error(error.message);
    process.exit(1);
  }
}

function checkGitStatus() {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    if (status.trim()) {
      console.log('⚠️  Warning: You have uncommitted changes:');
      console.log(status);
      console.log('Please commit your changes before creating a release.');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error checking git status:', error.message);
    process.exit(1);
  }
}

function getCurrentVersion() {
  return packageJson.version;
}

function updateVersion(newVersion) {
  console.log(
    `\n🔄 Updating version from ${packageJson.version} to ${newVersion}...`
  );

  // Update package.json
  packageJson.version = newVersion;
  fs.writeFileSync(
    path.join(__dirname, '../package.json'),
    JSON.stringify(packageJson, null, 2) + '\n'
  );

  console.log('✅ Version updated in package.json');
}

function buildApplication() {
  console.log('\n🔄 Building application for all platforms...');

  // Install dependencies first
  runCommand('npm install', 'Install dependencies');

  // Build for all platforms
  runCommand('npm run build-mac', 'Build for macOS');
  runCommand('npm run build-win', 'Build for Windows');
  runCommand('npm run build-linux', 'Build for Linux');

  console.log('✅ All builds completed');
}

function commitAndTag(version) {
  runCommand('git add .', 'Stage changes');
  runCommand(
    `git commit -m "Release v${version}"`,
    `Commit release v${version}`
  );
  runCommand(
    `git tag -a v${version} -m "Release v${version}"`,
    `Create tag v${version}`
  );
  runCommand('git push origin main', 'Push to main branch');
  runCommand(`git push origin v${version}`, 'Push tag');
}

function getDistFiles() {
  const distDir = path.join(__dirname, '../dist');
  if (!fs.existsSync(distDir)) {
    console.error(
      '❌ No dist directory found. Please build the application first.'
    );
    process.exit(1);
  }

  const files = fs.readdirSync(distDir);
  return files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return (
      ['.dmg', '.exe', '.appimage', '.deb', '.rpm'].includes(ext) ||
      file.includes('Setup') ||
      file.includes('Installer')
    );
  });
}

function createGitHubRelease(version, releaseNotes) {
  const distFiles = getDistFiles();

  if (distFiles.length === 0) {
    console.log('⚠️  No distribution files found in dist/ directory');
    console.log('Creating release without binary attachments...');
  }

  console.log(`\n🔄 Creating GitHub release v${version}...`);

  // Check if gh CLI is installed
  try {
    execSync('gh --version', { stdio: 'ignore' });
  } catch (error) {
    console.error('❌ GitHub CLI (gh) is not installed.');
    console.error('Please install it from: https://cli.github.com/');
    console.error('After installation, run: gh auth login');
    process.exit(1);
  }

  let releaseCommand = `gh release create v${version} --title "Release v${version}" --notes "${releaseNotes}"`;

  // Add distribution files to release
  if (distFiles.length > 0) {
    const fileArgs = distFiles.map(file => `"dist/${file}"`).join(' ');
    releaseCommand += ` ${fileArgs}`;
  }

  runCommand(releaseCommand, 'Create GitHub release');

  console.log(`\n🎉 Release v${version} created successfully!`);
  console.log(
    `📝 View release: https://github.com/${GITHUB_REPO}/releases/tag/v${version}`
  );
}

function main() {
  console.log('🚀 FluPilot CLI Release Creator\n');

  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node create-release.js <version> [release-notes]');
    console.log(
      'Example: node create-release.js 1.0.1 "Bug fixes and improvements"'
    );
    console.log('\nCurrent version:', getCurrentVersion());
    process.exit(1);
  }

  const newVersion = args[0];
  const releaseNotes = args[1] || `Release v${newVersion}`;

  // Validate version format (basic semantic versioning)
  if (!/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(newVersion)) {
    console.error(
      '❌ Invalid version format. Use semantic versioning (e.g., 1.0.1)'
    );
    process.exit(1);
  }

  console.log(`📦 Creating release v${newVersion}`);
  console.log(`📝 Release notes: ${releaseNotes}`);
  console.log();

  // Check git status
  checkGitStatus();

  // Update version
  updateVersion(newVersion);

  // Build application
  buildApplication();

  // Commit and tag
  commitAndTag(newVersion);

  // Create GitHub release
  createGitHubRelease(newVersion, releaseNotes);

  console.log('\n✨ Release process completed successfully!');
}

if (require.main === module) {
  main();
}

module.exports = {
  createGitHubRelease,
  buildApplication,
  getCurrentVersion,
};
