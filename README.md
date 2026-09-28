# Lifter File Viewer - Setup Launchers

This folder contains cross-platform launcher scripts for running Lifter File Viewer in development mode only.


## Files

- [install.bat](install.bat): Windows launcher
- [install.sh](install.sh): macOS/Linux launcher

## What These Scripts Do

Both scripts follow the same flow:

1. Check required tools (`git`, `node`, `npm`) and attempt automated installation if missing (via `winget` on Windows, or Homebrew/package manager on macOS & Linux).
2. If already cloned, remove old clone and re-clone fresh from repository (or use source in current folder if present).
3. Run `npm install`.
4. Start Electron development mode (no packaging/export).

## Prerequisites

- Git (auto-installed if package manager is available)
- Node.js (auto-installed if package manager is available)
- npm

## Run on Windows

1. Open Command Prompt or PowerShell.
2. Go to this folder.
3. Run:

```bat
install.bat
```

## Run on macOS/Linux

1. Open Terminal.
2. Go to this folder.
3. Make the script executable (first time only):

```bash
chmod +x install.sh
```

4. Run:

```bash
./install.sh
```

## Dev Script Selection

The launchers auto-select the first script found in `package.json` in this order:

1. `electron:dev`
2. `dev:electron`
3. `start`
4. `dev`

If none of these scripts exist, the launcher exits with an error.

## Stop the App

Press `Ctrl+C` in the terminal running the launcher.

## Notes

- Windows launcher is Windows-only.
- macOS/Linux launcher is for Unix-like shells.
- You may see non-fatal Electron GPU warnings depending on machine/driver setup.
