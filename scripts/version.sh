#!/bin/bash

# Version management script
# Usage: ./scripts/version.sh [major|minor|patch|current]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PACKAGE_JSON="$PROJECT_ROOT/event-app_v2/package.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to get current version
get_current_version() {
    node -p "require('$PACKAGE_JSON').version" 2>/dev/null || echo "0.0.0"
}

# Function to increment version
increment_version() {
    local current_version="$1"
    local bump_type="$2"

    # Parse version
    IFS='.' read -r major minor patch <<< "$current_version"

    case $bump_type in
        major)
            new_version="$((major + 1)).0.0"
            ;;
        minor)
            new_version="$major.$((minor + 1)).0"
            ;;
        patch)
            new_version="$major.$minor.$((patch + 1))"
            ;;
        *)
            echo -e "${RED}Error: Invalid bump type '$bump_type'. Use: major, minor, or patch${NC}"
            exit 1
            ;;
    esac

    echo "$new_version"
}

# Function to update package.json
update_package_json() {
    local new_version="$1"

    # Update package.json
    sed -i.bak "s/\"version\": \"[^\"]*\"/\"version\": \"$new_version\"/" "$PACKAGE_JSON"
    rm "${PACKAGE_JSON}.bak"

    echo -e "${GREEN}✓ Updated package.json to version $new_version${NC}"
}

# Function to create git commit and tag
create_git_release() {
    local new_version="$1"
    local new_tag="v$new_version"

    # Check if git repo is clean
    if [ -n "$(git status --porcelain)" ]; then
        echo -e "${YELLOW}Warning: Working directory is not clean. Uncommitted changes:${NC}"
        git status --short
        echo -e "${YELLOW}Please commit or stash changes before running this script.${NC}"
        exit 1
    fi

    # Commit version change
    git add "$PACKAGE_JSON"
    git commit -m "chore: bump version to $new_version" || true

    # Create and push tag
    git tag "$new_tag"
    git push origin "$new_tag"

    echo -e "${GREEN}✓ Created and pushed tag: $new_tag${NC}"

    # Optional: Create GitHub release
    if command -v gh &> /dev/null; then
        echo -e "${BLUE}Creating GitHub release...${NC}"
        gh release create "$new_tag" \
            --title "Release $new_tag" \
            --notes "Version $new_version

Auto-generated release.

**Changes:**
- Version bump to $new_version
- Build: $(date +%Y%m%d_%H%M%S)" \
            --latest || echo -e "${YELLOW}GitHub release creation failed. You can create it manually.${NC}"
    fi
}

# Main logic
main() {
    local command="${1:-current}"

    case $command in
        current)
            current_version=$(get_current_version)
            echo -e "${BLUE}Current version: $current_version${NC}"
            ;;
        major|minor|patch)
            current_version=$(get_current_version)
            new_version=$(increment_version "$current_version" "$command")

            echo -e "${BLUE}Current version: $current_version${NC}"
            echo -e "${GREEN}New version: $new_version${NC}"
            echo -e "${YELLOW}Bump type: $command${NC}"

            read -p "Continue? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                echo "Aborted."
                exit 0
            fi

            update_package_json "$new_version"
            create_git_release "$new_version"
            ;;
        *)
            echo -e "${RED}Usage: $0 [major|minor|patch|current]${NC}"
            echo ""
            echo "Commands:"
            echo "  current  Show current version"
            echo "  major    Increment major version (X.0.0)"
            echo "  minor    Increment minor version (x.X.0)"
            echo "  patch    Increment patch version (x.x.X)"
            echo ""
            echo "Examples:"
            echo "  $0 current    # Show current version"
            echo "  $0 patch      # 1.2.3 → 1.2.4"
            echo "  $0 minor      # 1.2.3 → 1.3.0"
            echo "  $0 major      # 1.2.3 → 2.0.0"
            exit 1
            ;;
    esac
}

main "$@"