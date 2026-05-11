#!/bin/bash

set -euo pipefail
IFS=$'\n\t'

# ============================================================
# Lifter-File-Viewer — Developer Setup Script
# Supports macOS and Linux (Debian/Ubuntu/Arch/Fedora)
#
# One-liner usage (no prior git clone needed):
#   bash <(curl -fsSL https://raw.githubusercontent.com/IndiumSoftware-AppEngineering/Lifter-File-Viewer/main/install.sh)
#
# Or if you already downloaded this file:
#   bash install.sh
# ============================================================

# ── Colours ─────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'  # No Colour

# ── Helpers ──────────────────────────────────────────────────
error()   { echo -e "${RED}${BOLD}✖  Error: $1${NC}" >&2; exit 1; }
warn()    { echo -e "${YELLOW}⚠  Warning: $1${NC}" >&2; }
success() { echo -e "${GREEN}✔  $1${NC}"; }
info()    { echo -e "${CYAN}➜  $1${NC}"; }
step()    { echo -e "\n${BOLD}━━━  $1  ━━━${NC}"; }

# ── Banner ───────────────────────────────────────────────────
echo ""
echo -e "${CYAN}${BOLD}"
echo "  ╔════════════════════════════════════════════════╗"
echo "  ║        Lifter-File-Viewer  ·  Installer        ║"
echo "  ║   Electron + Vite + React + TypeScript App     ║"
echo "  ╚════════════════════════════════════════════════╝"
echo -e "${NC}"

# ── Detect OS ────────────────────────────────────────────────
OS="$(uname -s)"
case "$OS" in
    Darwin) OS_NAME="macOS" ;;
    Linux)  OS_NAME="Linux"  ;;
    *)      error "Unsupported operating system: $OS" ;;
esac
success "Detected OS: $OS_NAME"

# ── Track install user (needed for MDM/root chown at the end) ─
INSTALL_USER=""

# ── Ensure HOME is set (MDM / JAMF environments) ─────────────
if [ -z "${HOME:-}" ]; then
    if command -v scutil >/dev/null 2>&1; then
        CURRENT_USER=$( /usr/sbin/scutil <<< "show State:/Users/ConsoleUser" \
            | awk '/Name :/ { print $3 }' || true )
        if [ -n "${CURRENT_USER:-}" ] \
            && [ "$CURRENT_USER" != "loginwindow" ] \
            && [ "$CURRENT_USER" != "_mbsetupuser" ]; then
            export HOME=$( /usr/bin/dscl . -read "/Users/$CURRENT_USER" \
                NFSHomeDirectory | awk '{print $2}' )
            INSTALL_USER="$CURRENT_USER"
        else
            error "No console user is logged in. Deferring installation."
        fi
    elif id -un >/dev/null 2>&1; then
        INSTALL_USER="$(id -un)"
        export HOME=$(getent passwd "$INSTALL_USER" | cut -d: -f6)
        if [ -z "$HOME" ]; then export HOME="/root"; fi
    else
        export HOME="/root"
    fi
fi

# ── Ensure SHELL is set (also may be unbound in JAMF) ────────
if [ -z "${SHELL:-}" ]; then
    if command -v zsh >/dev/null 2>&1; then
        SHELL="$(command -v zsh)"
    elif command -v bash >/dev/null 2>&1; then
        SHELL="$(command -v bash)"
    else
        SHELL="/bin/sh"
    fi
    export SHELL
fi

# ── Repository details ───────────────────────────────────────
REPO_URL="https://github.com/Lakshmipriyaindium/lifter-file-viewer.git"
REPO_DIR_NAME="Lifter-File-Viewer"

# ── Minimum required versions ────────────────────────────────
MIN_NODE_MAJOR=18
MIN_NPM_MAJOR=9

# ============================================================
# Function: detect_all_shells
# Returns "shell_name|config_file" lines for every shell that
# has an existing config file (bash, zsh, fish).
# Falls back to $SHELL detection if no config files are found.
# ============================================================
detect_all_shells() {
    local shells=""

    # bash — prefer .bashrc over .bash_profile
    if [ -f "$HOME/.bashrc" ]; then
        shells="${shells}bash|$HOME/.bashrc\n"
    elif [ -f "$HOME/.bash_profile" ]; then
        shells="${shells}bash|$HOME/.bash_profile\n"
    fi

    # zsh
    if [ -f "$HOME/.zshrc" ]; then
        shells="${shells}zsh|$HOME/.zshrc\n"
    fi

    # fish
    if [ -f "$HOME/.config/fish/config.fish" ]; then
        shells="${shells}fish|$HOME/.config/fish/config.fish\n"
    fi

    # Fallback: no config found — use $SHELL to decide which one to create
    if [ -z "$shells" ]; then
        local login_shell=""
        if [ -n "${SHELL:-}" ]; then
            login_shell=$(basename "$SHELL")
        fi
        case "$login_shell" in
            fish) shells="fish|$HOME/.config/fish/config.fish" ;;
            zsh)  shells="zsh|$HOME/.zshrc" ;;
            bash|*) shells="bash|$HOME/.bashrc" ;;
        esac
    fi

    # Remove trailing blank lines and print
    printf '%b' "$shells" | sed '/^$/d'
}

# ============================================================
# STEP 1 — Check for required system tools
# ============================================================
step "Checking system requirements"

# git
if ! command -v git >/dev/null 2>&1; then
    error "Git is not installed.\n  macOS : xcode-select --install\n  Ubuntu: sudo apt install git"
fi
GIT_VERSION=$(git --version | awk '{print $3}')
success "Git found: $GIT_VERSION"

# curl
if ! command -v curl >/dev/null 2>&1; then
    error "curl is not installed.\n  Ubuntu: sudo apt install curl"
fi
success "curl found: $(curl --version | head -1 | awk '{print $2}')"

# ============================================================
# STEP 2 — Locate or clone the project source code
# ============================================================
step "Locating project source"

# ── Resolve the directory that contains this script ──────────
if [ -n "${BASH_SOURCE[0]:-}" ] && [ "${BASH_SOURCE[0]}" != "bash" ]; then
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
else
    SCRIPT_DIR="$(pwd)"   # curl | bash fallback
fi

# ── Priority 1: source bundled INSIDE the same folder as install.sh ──
#    (User shared a zip/folder containing install.sh + project files)
if [ -f "$SCRIPT_DIR/package.json" ]; then
    PROJECT_DIR="$SCRIPT_DIR"
    success "Project source found alongside this script: $PROJECT_DIR"
    success "No git clone needed — using bundled source."

# ── Priority 2: source in a sub-folder next to install.sh ────
#    (e.g. install.sh is one level above Lifter-File-Viewer/)
elif [ -f "$SCRIPT_DIR/$REPO_DIR_NAME/package.json" ]; then
    PROJECT_DIR="$SCRIPT_DIR/$REPO_DIR_NAME"
    success "Project source found at: $PROJECT_DIR"
    success "No git clone needed — using bundled source."

# ── Priority 3: already cloned (running install.sh again) ────
elif [ -d "$SCRIPT_DIR/$REPO_DIR_NAME/.git" ]; then
    PROJECT_DIR="$SCRIPT_DIR/$REPO_DIR_NAME"
    info "Repository already cloned at: $PROJECT_DIR"
    info "Pulling latest changes …"
    git -C "$PROJECT_DIR" pull --ff-only \
        || warn "Could not pull latest changes (local modifications exist). Continuing."
    success "Repository is up to date."

# ── Priority 4: try git clone (public repo or user has access) ─
else
    PROJECT_DIR="$SCRIPT_DIR/$REPO_DIR_NAME"
    info "Project source not found locally. Attempting git clone …"
    if git clone "$REPO_URL" "$PROJECT_DIR" 2>/dev/null; then
        success "Repository cloned successfully."
    else
        echo ""
        echo -e "${RED}${BOLD}✖  Could not clone the repository.${NC}" >&2
        echo -e "${YELLOW}   This usually means you do not have access to the private GitHub repo." >&2
        echo "" >&2
        echo -e "   Please ask the project team to share the project as a ZIP file." >&2
        echo -e "   Then extract it so your folder looks like this:" >&2
        echo "" >&2
        echo -e "     📁 Lifter-File-Viewer-setup/"  >&2
        echo -e "       ├── install.sh          ← this script" >&2
        echo -e "       ├── package.json" >&2
        echo -e "       ├── src/" >&2
        echo -e "       └── ... (other project files)" >&2
        echo "" >&2
        echo -e "   Then run:  bash install.sh" >&2
        echo -e "${NC}" >&2
        exit 1
    fi
fi

# ============================================================
# STEP 3 — Node.js
# ============================================================
step "Checking Node.js"

install_node_macos() {
    info "Attempting to install Node.js via Homebrew …"
    if ! command -v brew >/dev/null 2>&1; then
        info "Homebrew not found — installing Homebrew first …"
        /bin/bash -c "$(curl -fsSL \
            https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" \
            || error "Homebrew installation failed. Please install Node.js manually: https://nodejs.org"
        # Add Homebrew to PATH for Apple Silicon Macs
        if [ -f "/opt/homebrew/bin/brew" ]; then
            eval "$(/opt/homebrew/bin/brew shellenv)"
        fi
    fi
    brew install node || error "Failed to install Node.js via Homebrew."
}

install_node_linux() {
    info "Installing Node.js via NodeSource (LTS) …"
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - \
        || error "NodeSource setup failed."
    sudo apt-get install -y nodejs \
        || error "apt-get install nodejs failed."
}

if ! command -v node >/dev/null 2>&1; then
    warn "Node.js not found. Installing …"
    if [ "$OS_NAME" = "macOS" ]; then
        install_node_macos
    else
        install_node_linux
    fi
fi

NODE_VERSION=$(node --version)          # e.g. v20.12.0
NODE_MAJOR=$(echo "$NODE_VERSION" | sed 's/v//' | cut -d. -f1)

if [ "$NODE_MAJOR" -lt "$MIN_NODE_MAJOR" ]; then
    error "Node.js $NODE_VERSION is too old. Minimum required: v${MIN_NODE_MAJOR}.\n  Please upgrade: https://nodejs.org/en/download"
fi
success "Node.js found: $NODE_VERSION"

# ============================================================
# STEP 4 — npm
# ============================================================
step "Checking npm"

if ! command -v npm >/dev/null 2>&1; then
    error "npm is not installed. It should ship with Node.js."
fi

NPM_VERSION=$(npm --version)
NPM_MAJOR=$(echo "$NPM_VERSION" | cut -d. -f1)

if [ "$NPM_MAJOR" -lt "$MIN_NPM_MAJOR" ]; then
    warn "npm $NPM_VERSION is old (minimum $MIN_NPM_MAJOR). Upgrading …"
    npm install -g npm@latest || warn "Failed to upgrade npm. Continuing anyway."
fi
success "npm found: $(npm --version)"

# ============================================================
# STEP 5 — macOS-specific: Xcode Command-Line Tools
# ============================================================
if [ "$OS_NAME" = "macOS" ]; then
    step "Checking Xcode Command-Line Tools (macOS)"
    if ! xcode-select -p >/dev/null 2>&1; then
        info "Installing Xcode Command-Line Tools (required for native modules) …"
        xcode-select --install 2>/dev/null || true
        echo ""
        echo -e "${YELLOW}  A dialog box may have appeared asking you to install Xcode tools."
        echo -e "  Please complete that installation, then re-run this script.${NC}"
        exit 0
    fi
    success "Xcode Command-Line Tools are installed."
fi

# ============================================================
# STEP 6 — Verify project structure
# ============================================================
step "Verifying project structure"

if [ ! -f "$PROJECT_DIR/package.json" ]; then
    error "package.json not found in $PROJECT_DIR.\n  Please run this script from the project root."
fi

APP_NAME=$(node -p "require('$PROJECT_DIR/package.json').name" 2>/dev/null || echo "lifter-file-viewer")
APP_VERSION=$(node -p "require('$PROJECT_DIR/package.json').version" 2>/dev/null || echo "unknown")
success "Project: $APP_NAME  v$APP_VERSION"

# ============================================================
# STEP 7 — Install npm dependencies
# ============================================================
step "Installing npm dependencies"

cd "$PROJECT_DIR"

info "Running: npm install …"
npm install || error "npm install failed. Check the error above."

success "All npm dependencies installed."

# ============================================================
# STEP 8 — macOS: Remove ALL security/quarantine restrictions
# Mirrors what setup.command does, extended to the full
# Electron.app bundle + all helper binaries.
# ============================================================
if [ "$OS_NAME" = "macOS" ]; then
    step "Removing macOS security restrictions (quarantine)"

    # 1. Find and fully strip quarantine from Electron.app bundle
    ELECTRON_APP_DIR=$(find "$PROJECT_DIR/node_modules/electron" \
        -name "*.app" -maxdepth 4 2>/dev/null | head -1 || true)
    if [ -n "$ELECTRON_APP_DIR" ]; then
        info "Removing quarantine from Electron.app …"
        sudo xattr -c "$ELECTRON_APP_DIR" 2>/dev/null || \
            xattr -c "$ELECTRON_APP_DIR" 2>/dev/null || true
        sudo find "$ELECTRON_APP_DIR" -exec xattr -c {} + 2>/dev/null || true
        success "Quarantine removed from Electron.app"
    fi

    # 2. Remove quarantine from the electron CLI binary in node_modules/.bin
    ELECTRON_BIN=$(find "$PROJECT_DIR/node_modules/.bin" \
        -name "electron" 2>/dev/null | head -1 || true)
    if [ -n "$ELECTRON_BIN" ]; then
        xattr -d com.apple.quarantine "$ELECTRON_BIN" 2>/dev/null || true
        success "Quarantine removed from electron CLI binary."
    fi

    # 3. Sweep the entire node_modules/electron directory
    #    (catches crashpad, Electron Helper EH/NP, etc.)
    if [ -d "$PROJECT_DIR/node_modules/electron" ]; then
        find "$PROJECT_DIR/node_modules/electron" \
            -exec xattr -d com.apple.quarantine {} + 2>/dev/null || true
        success "Quarantine removed from all Electron helper binaries."
    fi
fi

# ============================================================
# STEP 9 — Verify key binaries are accessible
# ============================================================
step "Verifying installed binaries"

check_bin() {
    local name="$1"
    local path="$PROJECT_DIR/node_modules/.bin/$name"
    if [ -f "$path" ]; then
        success "$name binary found."
    else
        warn "$name binary not found in node_modules/.bin. Some features may not work."
    fi
}

check_bin "electron"
check_bin "vite"
check_bin "tsc"
check_bin "concurrently"

# ============================================================
# STEP 10 — Update shell PATH in all detected shell configs
# Detects bash / zsh / fish configs and injects the project's
# node_modules/.bin into PATH — same pattern as the sample.
# ============================================================
step "Updating shell configurations"

SHELLS_CONFIGURED=""
SHELLS_ALREADY_CONFIGURED=""
CREATED_SHELL_PATHS=""

while IFS='|' read -r shell_name config_file; do
    [ -z "$shell_name" ] && continue

    # Build the shell-appropriate PATH export line
    if [ "$shell_name" = "fish" ]; then
        path_cmd="set -gx PATH \"$PROJECT_DIR/node_modules/.bin\" \$PATH"
        # Create fish config directory if it doesn't exist
        config_dir="$(dirname "$config_file")"
        if [ ! -d "$config_dir" ]; then
            mkdir -p "$config_dir"
            CREATED_SHELL_PATHS="${CREATED_SHELL_PATHS}${config_dir}\n"
        fi
    else
        path_cmd="export PATH=\"$PROJECT_DIR/node_modules/.bin:\$PATH\""
    fi

    # Create config file if it doesn't exist yet
    if [ ! -f "$config_file" ]; then
        CREATED_SHELL_PATHS="${CREATED_SHELL_PATHS}${config_file}\n"
    fi
    touch "$config_file"

    # Append only if not already present
    if ! grep -qsF "$PROJECT_DIR/node_modules/.bin" "$config_file"; then
        {
            echo ""
            echo "# Added by Lifter-File-Viewer installer on $(date)"
            echo "$path_cmd"
        } >> "$config_file"
        SHELLS_CONFIGURED="${SHELLS_CONFIGURED}${shell_name}|${config_file}\n"
    else
        SHELLS_ALREADY_CONFIGURED="${SHELLS_ALREADY_CONFIGURED}${shell_name}|${config_file}\n"
    fi
done <<< "$(detect_all_shells)"

# Report newly configured shells
if [ -n "$SHELLS_CONFIGURED" ]; then
    echo ""
    echo "Updated shell configurations:"
    printf '%b' "$SHELLS_CONFIGURED" | while IFS='|' read -r shell_name config_file; do
        [ -z "$shell_name" ] && continue
        success "  ✓ $config_file"
    done
    echo ""
    echo "To apply changes to your current terminal session:"
    printf '%b' "$SHELLS_CONFIGURED" | while IFS='|' read -r shell_name config_file; do
        [ -z "$shell_name" ] && continue
        echo "  - source $config_file"
    done
fi

# Report shells already configured
if [ -n "$SHELLS_ALREADY_CONFIGURED" ]; then
    echo ""
    echo "Already configured (no changes needed):"
    printf '%b' "$SHELLS_ALREADY_CONFIGURED" | while IFS='|' read -r shell_name config_file; do
        [ -z "$shell_name" ] && continue
        echo "  ✓ $config_file"
    done
fi

# Fallback: no shell config found at all
if [ -z "$SHELLS_CONFIGURED" ] && [ -z "$SHELLS_ALREADY_CONFIGURED" ]; then
    echo ""
    warn "Could not detect any shell config files."
    echo "  Please add this line to your shell config manually and restart:"
    echo "  export PATH=\"$PROJECT_DIR/node_modules/.bin:\$PATH\""
fi

# ============================================================
# STEP 11 — Fix file ownership when running as root/MDM
# (e.g. JAMF deploys as root for another user)
# ============================================================
if [ "$(id -u)" = "0" ] && [ -n "$INSTALL_USER" ]; then
    step "Fixing file ownership (running as root for user: $INSTALL_USER)"
    chown -R "$INSTALL_USER" "$PROJECT_DIR" 2>/dev/null || true
    if [ -n "$CREATED_SHELL_PATHS" ]; then
        printf '%b' "$CREATED_SHELL_PATHS" | while IFS= read -r created_path; do
            [ -z "$created_path" ] && continue
            chown "$INSTALL_USER" "$created_path" 2>/dev/null || true
        done
    fi
    success "File ownership corrected."
fi

# ============================================================
# STEP 12 — Build the distributable application
# Runs: npm run dist → creates the real installable app
#   macOS : dist_electron/Lifter-File-Viewer-<version>.dmg
#   Linux : dist_electron/Lifter-File-Viewer-<version>.AppImage
# ============================================================
step "Building the application"

info "Running: npm run dist (this may take a few minutes) …"
npm run dist || error "Build failed. Check the output above for details."

success "Application built successfully."

# ============================================================
# STEP 13 — Install the built app onto this system
# ============================================================
step "Installing the application"

APP_INSTALL_NAME="Lifter-File-Viewer"
DIST_DIR="$PROJECT_DIR/dist_electron"

if [ "$OS_NAME" = "macOS" ]; then
    # ── Find the generated .dmg ───────────────────────────────
    DMG_FILE=$(find "$DIST_DIR" -name "*.dmg" -maxdepth 2 2>/dev/null | head -1 || true)

    if [ -z "$DMG_FILE" ]; then
        error "No .dmg found in $DIST_DIR. Build may have failed silently."
    fi
    info "Found installer: $DMG_FILE"

    # ── Mount the DMG ─────────────────────────────────────────
    info "Mounting DMG …"
    MOUNT_POINT=$(mktemp -d)
    hdiutil attach "$DMG_FILE" -mountpoint "$MOUNT_POINT" -nobrowse -quiet \
        || error "Failed to mount $DMG_FILE"

    # ── Copy .app to /Applications ────────────────────────────
    FOUND_APP=$(find "$MOUNT_POINT" -name "*.app" -maxdepth 2 2>/dev/null | head -1 || true)
    if [ -z "$FOUND_APP" ]; then
        hdiutil detach "$MOUNT_POINT" -quiet 2>/dev/null || true
        error "No .app found inside the DMG."
    fi

    INSTALL_PATH="/Applications/$(basename "$FOUND_APP")"
    info "Installing to $INSTALL_PATH …"

    # Remove previous version if it exists
    if [ -d "$INSTALL_PATH" ]; then
        info "Removing previous installation …"
        rm -rf "$INSTALL_PATH"
    fi

    cp -R "$FOUND_APP" "/Applications/" \
        || error "Failed to copy app to /Applications. Try running with sudo."
    success "App copied to $INSTALL_PATH"

    # ── Unmount the DMG ───────────────────────────────────────
    hdiutil detach "$MOUNT_POINT" -quiet 2>/dev/null || true
    rm -rf "$MOUNT_POINT" 2>/dev/null || true

    # ── Remove quarantine from the installed .app ─────────────
    info "Removing macOS quarantine from installed app …"
    sudo xattr -c "$INSTALL_PATH" 2>/dev/null || \
        xattr -c "$INSTALL_PATH" 2>/dev/null || true
    sudo find "$INSTALL_PATH" -exec xattr -c {} + 2>/dev/null || true
    success "Security restrictions removed from $INSTALL_PATH"

    success "✅  Lifter-File-Viewer is now installed in /Applications!"

    # ── Launch the installed app ──────────────────────────────
    info "Launching Lifter-File-Viewer …"
    open "$INSTALL_PATH"

elif [ "$OS_NAME" = "Linux" ]; then
    # ── Find the generated AppImage ───────────────────────────
    APPIMAGE=$(find "$DIST_DIR" -name "*.AppImage" -maxdepth 2 2>/dev/null | head -1 || true)

    if [ -z "$APPIMAGE" ]; then
        error "No .AppImage found in $DIST_DIR. Build may have failed silently."
    fi
    info "Found installer: $APPIMAGE"

    # Copy AppImage to ~/Applications and make it executable
    mkdir -p "$HOME/Applications"
    DEST="$HOME/Applications/Lifter-File-Viewer.AppImage"
    cp "$APPIMAGE" "$DEST"
    chmod +x "$DEST"
    success "AppImage installed to $DEST"

    # Create a desktop shortcut
    DESKTOP_FILE="$HOME/.local/share/applications/lifter-file-viewer.desktop"
    mkdir -p "$(dirname "$DESKTOP_FILE")"
    cat > "$DESKTOP_FILE" <<EOF
[Desktop Entry]
Name=Lifter-File-Viewer
Exec=$DEST
Icon=$PROJECT_DIR/build/icon.png
Type=Application
Categories=Utility;
EOF
    success "Desktop shortcut created."

    # Launch
    info "Launching Lifter-File-Viewer …"
    nohup "$DEST" >/dev/null 2>&1 &
    success "✅  Lifter-File-Viewer launched!"
fi

# ============================================================
# STEP 14 — Done
# ============================================================
step "Installation Complete 🎉"

echo ""
echo -e "${GREEN}${BOLD}  Lifter-File-Viewer has been installed and launched!${NC}"
echo ""
if [ "$OS_NAME" = "macOS" ]; then
    echo -e "  ${BOLD}Find it in:${NC}  /Applications/Lifter-File-Viewer.app"
    echo -e "  ${BOLD}Open it anytime via:${NC}  Spotlight (⌘ Space) → Lifter-File-Viewer"
else
    echo -e "  ${BOLD}Find it in:${NC}  ~/Applications/Lifter-File-Viewer.AppImage"
fi
echo ""
echo -e "${YELLOW}Close and reopen your terminal to apply any PATH changes.${NC}"
echo ""
