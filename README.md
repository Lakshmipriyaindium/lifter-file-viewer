# Lifter File Viewer

Lifter File Viewer is a desktop application built on Electron, React, Vite, and TypeScript. It offers rich visualizations for Total Analysis, Business Rules, Flow Graphs, Knowledge Graphs, Mermaid diagrams, PlantUML, User Stories, Business Processes, and more.

---

## 🚀 Quick Start & Installation

You can download and run the application immediately without cloning the repository or using installation helper scripts that require root/administrator privileges.

### 🍎 macOS Installation (DMG)

Run the following one-liner command in your terminal. It will download the latest `.dmg`, mount it, install the app directly into your user-space `~/Applications` folder (**no `sudo` required**), unmount the installer, remove macOS Gatekeeper quarantine, and launch the app.

```bash
curl -fsSL $(curl -fsSL https://api.github.com/repos/Lakshmipriyaindium/lifter-file-viewer/releases/latest | grep -o '"browser_download_url": *"[^"]*\.dmg"' | head -1 | grep -o 'https://[^"]*') -o Lifter-File-Viewer.dmg && \
hdiutil attach Lifter-File-Viewer.dmg -nobrowse -mountpoint /tmp/lifter-mount && \
mkdir -p ~/Applications && \
cp -R /tmp/lifter-mount/*.app ~/Applications/ && \
hdiutil detach /tmp/lifter-mount && \
(xattr -d com.apple.quarantine ~/Applications/Lifter-File-Viewer.app 2>/dev/null || xattr -c ~/Applications/Lifter-File-Viewer.app 2>/dev/null || true) && \
open ~/Applications/Lifter-File-Viewer.app && \
rm Lifter-File-Viewer.dmg
```

### 🪟 Windows Installation (EXE)

Run the following command in **PowerShell** to download the latest portable `.exe` and run it instantly without requiring administrator permissions:

```powershell
$release = Invoke-RestMethod -Uri "https://api.github.com/repos/Lakshmipriyaindium/lifter-file-viewer/releases/latest"; $asset = $release.assets | Where-Object { $_.name -like "*.exe" } | Select-Object -First 1; Invoke-WebRequest -Uri $asset.browser_download_url -OutFile "$env:USERPROFILE\Downloads\Lifter-File-Viewer.exe"; Start-Process "$env:USERPROFILE\Downloads\Lifter-File-Viewer.exe"
```

---

## 📦 Direct Downloads

If you prefer downloading the files manually from your browser:

- **macOS (DMG):** Visit the [GitHub Releases Page](https://github.com/Lakshmipriyaindium/lifter-file-viewer/releases/latest) and download the latest `.dmg` file.
- **Windows (Portable EXE):** Visit the [GitHub Releases Page](https://github.com/Lakshmipriyaindium/lifter-file-viewer/releases/latest) and download the latest `.exe` file.

---

## 🛠️ Developer Setup & Local Execution

If you want to run the project from source or make modifications, follow these steps:

### Prerequisites
- Node.js (v16 or higher)
- npm (v8 or higher)

### Setup Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/Lakshmipriyaindium/lifter-file-viewer.git
   cd lifter-file-viewer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the application in development mode:
   ```bash
   npm start
   ```

4. Build the application for distribution:
   ```bash
   # Builds production files and creates distributables in dist_electron/
   npm run dist
   ```



download install.sh 
run bash path/to/install.sh