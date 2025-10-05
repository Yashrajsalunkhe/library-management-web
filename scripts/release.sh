#!/bin/bash

# Library Management System - Release Build Script
# This script creates production-ready releases with proper versioning

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }
print_header() { echo -e "${PURPLE}[RELEASE]${NC} $1"; }

print_header "🚀 Library Management System - Release Builder"

# Parse command line arguments
VERSION_TYPE="patch"
SKIP_TESTS=false
SKIP_BUILD=false
DRY_RUN=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --version-type)
            VERSION_TYPE="$2"
            shift 2
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --version-type TYPE    Version bump type (patch|minor|major) [default: patch]"
            echo "  --skip-tests          Skip running tests"
            echo "  --skip-build          Skip building applications"
            echo "  --dry-run             Show what would be done without actually doing it"
            echo "  -h, --help            Show this help message"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
print_status "Current version: $CURRENT_VERSION"

# Calculate new version
if [ "$DRY_RUN" = true ]; then
    NEW_VERSION="$CURRENT_VERSION-dryrun"
    print_warning "DRY RUN MODE - No actual changes will be made"
else
    NEW_VERSION=$(npm version $VERSION_TYPE --no-git-tag-version | sed 's/^v//')
    print_status "New version: $NEW_VERSION"
fi

# Validate that we're on the main branch (optional)
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
if [ "$CURRENT_BRANCH" != "master" ] && [ "$CURRENT_BRANCH" != "main" ] && [ "$DRY_RUN" = false ]; then
    print_warning "Not on main/master branch (currently on: $CURRENT_BRANCH)"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Release cancelled"
        exit 1
    fi
fi

# Check for uncommitted changes
if [ "$DRY_RUN" = false ]; then
    if ! git diff-index --quiet HEAD --; then
        print_error "There are uncommitted changes. Please commit or stash them first."
        exit 1
    fi
fi

# Run tests (if not skipped)
if [ "$SKIP_TESTS" = false ]; then
    print_status "Running tests..."
    if command -v npm run test:ci &> /dev/null; then
        npm run test:ci
    else
        print_warning "No test:ci script found, skipping tests"
    fi
fi

# Clean and install dependencies
print_status "Installing dependencies..."
if [ "$DRY_RUN" = false ]; then
    npm run clean || true
    npm ci
fi

# Build applications (if not skipped)
if [ "$SKIP_BUILD" = false ]; then
    print_status "Building applications..."
    if [ "$DRY_RUN" = false ]; then
        # Build React app
        npm run build
        
        # Build Electron apps
        npm run dist:all
    else
        print_status "Would build React app and Electron applications"
    fi
fi

# Create release notes
RELEASE_NOTES_FILE="RELEASE_NOTES_$NEW_VERSION.md"
if [ "$DRY_RUN" = false ]; then
    print_status "Generating release notes..."
    cat > $RELEASE_NOTES_FILE << EOF
# Library Management System v$NEW_VERSION

## Release Date
$(date '+%Y-%m-%d')

## Changes in this version

### New Features
- [Add new features here]

### Improvements
- [Add improvements here]

### Bug Fixes
- [Add bug fixes here]

### Technical Changes
- Updated to version $NEW_VERSION
- Built with Electron $(npx electron --version)
- Built with Node.js $(node --version)

## Installation

### Windows
- Download and run \`Library-Management-System-$NEW_VERSION-Setup.exe\`
- For portable version: Download \`Library-Management-System-$NEW_VERSION-portable.exe\`

### macOS
- Download and mount \`Library-Management-System-$NEW_VERSION.dmg\`
- Drag the application to Applications folder

### Linux
- Ubuntu/Debian: Download \`library-management-system_${NEW_VERSION}_amd64.deb\`
- AppImage: Download \`Library-Management-System-$NEW_VERSION.AppImage\`

## System Requirements
- Windows 10 or later (64-bit recommended)
- macOS 10.15 or later
- Ubuntu 18.04 or later / equivalent Linux distribution
- 4GB RAM minimum, 8GB recommended
- 1GB free disk space

## Support
For issues and support, please visit: https://github.com/Yashrajsalunkhe/library-management/issues
EOF
fi

# Display build summary
print_header "Build Summary"
print_status "Version: $CURRENT_VERSION → $NEW_VERSION"
print_status "Branch: $CURRENT_BRANCH"
print_status "Build date: $(date)"

if [ -d "dist-electron" ] && [ "$SKIP_BUILD" = false ] && [ "$DRY_RUN" = false ]; then
    print_status "Generated files:"
    find dist-electron -name "*.exe" -o -name "*.dmg" -o -name "*.AppImage" -o -name "*.deb" | while read file; do
        size=$(du -h "$file" | cut -f1)
        echo "  📦 $(basename "$file") ($size)"
    done
    
    # Calculate total size
    total_size=$(du -sh dist-electron 2>/dev/null | cut -f1 || echo "unknown")
    print_status "Total build size: $total_size"
fi

# Git operations
if [ "$DRY_RUN" = false ]; then
    print_status "Creating git tag..."
    git add package.json package-lock.json 2>/dev/null || true
    git commit -m "Bump version to $NEW_VERSION" || true
    git tag -a "v$NEW_VERSION" -m "Release version $NEW_VERSION"
    
    print_success "🎉 Release v$NEW_VERSION created successfully!"
    print_status "Don't forget to:"
    echo "  1. Push changes: git push origin $CURRENT_BRANCH"
    echo "  2. Push tags: git push origin v$NEW_VERSION"
    echo "  3. Create GitHub release with generated files"
    echo "  4. Update release notes in $RELEASE_NOTES_FILE"
else
    print_success "🎭 Dry run completed successfully!"
    print_status "In a real run, this would:"
    echo "  1. Bump version from $CURRENT_VERSION to calculated new version"
    echo "  2. Build all platform applications"
    echo "  3. Create git tag"
    echo "  4. Generate release notes"
fi