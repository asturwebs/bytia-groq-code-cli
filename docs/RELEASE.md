# Release Automation

This project uses [semantic-release](https://github.com/semantic-release/semantic-release) for fully automated versioning, changelog generation, npm publishing, and GitHub releases.

## 🚀 Automated Release Process

Every commit to the `main` branch triggers the release automation:

1. **CI Pipeline**: Tests run and project builds
2. **Semantic Analysis**: Commits are analyzed for version impact
3. **Version Calculation**: New version determined by commit types
4. **Changelog Generation**: `CHANGELOG.md` updated automatically
5. **NPM Publishing**: Package published to npm registry
6. **GitHub Release**: Release created with generated notes
7. **Git Tagging**: Version tag pushed back to repository

## How It Works

1. **Commit Format**: Use [Conventional Commits](https://conventionalcommits.org/) format:
   - `feat:` - New features (minor version bump)
   - `fix:` - Bug fixes (patch version bump)
   - `perf:` - Performance improvements (patch version bump)
   - `BREAKING CHANGE:` - Breaking changes (major version bump)
   - `docs:` - Documentation changes (patch version bump for README scope)

2. **Automatic Releases**: When you push to the `main` branch:
   - CI runs tests and builds the project
   - semantic-release analyzes commits since last release
   - If releasable changes are found:
     - Version is automatically bumped in `package.json`
     - `CHANGELOG.md` is updated
     - npm package is published
     - GitHub release is created with release notes
     - Changes are committed back to the repository

## Manual Release

You can trigger a release manually using GitHub Actions:
1. Go to Actions tab in GitHub
2. Select "Release" workflow  
3. Click "Run workflow" on the main branch

## Local Testing

Test what would be released without actually releasing:

```bash
npm run release:dry-run
```

## Required Secrets

For the release process to work, ensure these secrets are set in GitHub:

- `GITHUB_TOKEN`: Automatically provided by GitHub Actions
- `NPM_TOKEN`: Your npm authentication token for publishing

## Commit Examples

```bash
# Patch release (1.0.0 -> 1.0.1)
git commit -m "fix: resolve cli argument parsing issue"

# Minor release (1.0.0 -> 1.1.0)  
git commit -m "feat: add new command for code generation"

# Major release (1.0.0 -> 2.0.0)
git commit -m "feat: redesign cli interface

BREAKING CHANGE: command structure has changed"
```
