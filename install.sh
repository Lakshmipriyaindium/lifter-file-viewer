#!/usr/bin/env bash
set -euo pipefail

# Lifter-File-Viewer - macOS/Linux setup and dev launcher

echo "Launching automated dev setup..."

echo "=================================================="
echo "   Lifter-File-Viewer  -  macOS/Linux Dev Launcher"
echo "   Electron + Vite + React + TypeScript App       "
echo "=================================================="

# Step 1: System checks
echo
echo "--- Checking system requirements ---"

OS_NAME="$(uname -s)"

# Ensure common paths are in PATH
for p in /opt/homebrew/bin /usr/local/bin; do
  if [[ -d "$p" ]] && [[ ":$PATH:" != *":$p:"* ]]; then
    export PATH="$p:$PATH"
  fi
done

# Load nvm if present but not yet loaded
if ! command -v node >/dev/null 2>&1 && [[ -s "${NVM_DIR:-$HOME/.nvm}/nvm.sh" ]]; then
  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  # shellcheck source=/dev/null
  \. "$NVM_DIR/nvm.sh" 2>/dev/null || true
fi

print_install_hint() {
  local tool="$1"

  if [[ "$OS_NAME" == "Darwin" ]]; then
    if command -v brew >/dev/null 2>&1; then
      echo "Install with Homebrew: brew install $tool"
    else
      echo "Install Homebrew first from https://brew.sh/, then install $tool (or install Node.js from https://nodejs.org/)"
    fi
  elif [[ "$OS_NAME" == "Linux" ]]; then
    echo "Install $tool using your Linux package manager (apt, dnf, yum, pacman, etc.) or from https://nodejs.org/"
  else
    echo "Install $tool manually for your OS."
  fi
}

install_tool() {
  local tool="$1"
  echo "Attempting automated installation for: $tool ..."

  if [[ "$OS_NAME" == "Darwin" ]]; then
    if command -v brew >/dev/null 2>&1; then
      local brew_pkg="$tool"
      if [[ "$tool" == "npm" ]]; then
        brew_pkg="node"
      fi
      echo "Installing $brew_pkg using Homebrew..."
      brew install "$brew_pkg" || return 1
      hash -r 2>/dev/null || true
      return 0
    else
      echo "Homebrew is not installed. Cannot auto-install $tool."
      return 1
    fi
  elif [[ "$OS_NAME" == "Linux" ]]; then
    local pkg="$tool"
    if [[ "$tool" == "node" ]]; then
      pkg="nodejs"
    fi
    if command -v apt-get >/dev/null 2>&1; then
      echo "Installing $pkg via apt-get..."
      if [[ ${EUID:-$(id -u)} -eq 0 ]]; then
        apt-get update && apt-get install -y "$pkg"
      elif command -v sudo >/dev/null 2>&1; then
        sudo apt-get update && sudo apt-get install -y "$pkg"
      else
        return 1
      fi
    elif command -v dnf >/dev/null 2>&1; then
      echo "Installing $pkg via dnf..."
      if [[ ${EUID:-$(id -u)} -eq 0 ]]; then
        dnf install -y "$pkg"
      elif command -v sudo >/dev/null 2>&1; then
        sudo dnf install -y "$pkg"
      else
        return 1
      fi
    elif command -v pacman >/dev/null 2>&1; then
      echo "Installing $pkg via pacman..."
      if [[ ${EUID:-$(id -u)} -eq 0 ]]; then
        pacman -Sy --noconfirm "$pkg"
      elif command -v sudo >/dev/null 2>&1; then
        sudo pacman -Sy --noconfirm "$pkg"
      else
        return 1
      fi
    else
      return 1
    fi
    hash -r 2>/dev/null || true
    return 0
  fi
  return 1
}

# Check Git
if ! command -v git >/dev/null 2>&1; then
  echo "Git not found."
  if ! install_tool "git" || ! command -v git >/dev/null 2>&1; then
    echo "ERROR: git not found."
    print_install_hint "git"
    exit 1
  fi
fi
echo "OK: git found: $(git --version)"

# Check Node.js
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js not found."
  if ! install_tool "node" || ! command -v node >/dev/null 2>&1; then
    echo "ERROR: node not found."
    print_install_hint "node"
    exit 1
  fi
fi
echo "OK: node found: $(node -v)"

# Check npm
if ! command -v npm >/dev/null 2>&1; then
  echo "npm not found."
  if ! install_tool "npm" || ! command -v npm >/dev/null 2>&1; then
    echo "ERROR: npm not found."
    print_install_hint "npm"
    exit 1
  fi
fi
echo "OK: npm found: $(npm -v)"

# Step 2: Resolve source directory / clone if needed
echo
echo "--- Locating project source ---"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_URL="https://github.com/Lakshmipriyaindium/lifter-file-viewer.git"
REPO_DIR_NAME="Lifter-File-Viewer"
PROJECT_DIR="$SCRIPT_DIR"

if [[ ! -f "$SCRIPT_DIR/package.json" ]]; then
  TARGET_CLONE_DIR="$SCRIPT_DIR/$REPO_DIR_NAME"
  if [[ -d "$TARGET_CLONE_DIR" ]]; then
    echo "Found existing directory at: $TARGET_CLONE_DIR"
    echo "Deleting existing clone for a fresh setup..."
    rm -rf "$TARGET_CLONE_DIR"
    echo "OK: previous directory removed."
  fi

  PROJECT_DIR="$TARGET_CLONE_DIR"
  echo "Attempting fresh git clone..."
  if git clone "$REPO_URL" "$PROJECT_DIR"; then
    echo "OK: repository cloned successfully."
  else
    echo
    echo "ERROR: could not clone the repository."
    echo "This usually means you do not have access to the private GitHub repo."
    echo
    echo "Ask the project team to share the project as a ZIP file, then extract it next to this script."
    exit 1
  fi
else
  echo "OK: project source found alongside this script: $PROJECT_DIR"
fi

# Step 3: Install dependencies
echo
echo "--- Installing npm dependencies ---"
cd "$PROJECT_DIR"
echo "Running: npm install ..."
npm install
echo "OK: npm dependencies installed."

# Step 4: Launch Electron dev mode only
echo
echo "--- Launching Electron dev mode ---"

PACKAGE_JSON_PATH="$PROJECT_DIR/package.json"
if [[ ! -f "$PACKAGE_JSON_PATH" ]]; then
  echo "ERROR: package.json not found in $PROJECT_DIR"
  exit 1
fi

DEV_SCRIPT="$(node -e '
const fs = require("fs");
const packageJsonPath = process.argv[1];
const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
const scripts = pkg.scripts || {};
const candidates = ["electron:dev", "dev:electron", "start", "dev"];
const found = candidates.find((name) => Object.prototype.hasOwnProperty.call(scripts, name));
if (found) process.stdout.write(found);
' "$PACKAGE_JSON_PATH")"

if [[ -z "$DEV_SCRIPT" ]]; then
  echo "ERROR: no Electron dev script found. Expected one of: electron:dev, dev:electron, start, dev"
  exit 1
fi

echo "OK: using npm script: $DEV_SCRIPT"
echo "Running: npm run $DEV_SCRIPT"
echo "Press Ctrl+C to stop the development app."

npm run "$DEV_SCRIPT"
