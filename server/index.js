const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const HIDDEN_NAMES = new Set(['.DS_Store', '__MACOSX', 'Thumbs.db', 'desktop.ini', '.Spotlight-V100', '.Trashes']);
const isHidden = (name) => name.startsWith('.') || HIDDEN_NAMES.has(name);

// API to scan a directory
app.get('/api/directory', (req, res) => {
  const dirPath = req.query.path;
  
  if (!dirPath || !fs.existsSync(dirPath)) {
    return res.status(400).json({ error: 'Invalid or missing path' });
  }

  try {
    const items = fs.readdirSync(dirPath).filter(name => !isHidden(name));
    const nodes = items.map(item => {
      const fullPath = path.join(dirPath, item);
      let isDirectory = false;
      let size = 0;
      
      try {
        const stats = fs.statSync(fullPath);
        isDirectory = stats.isDirectory();
        size = stats.size;
      } catch (e) {
        console.error('Error reading stats for', fullPath, e);
      }
      
      return {
        name: item,
        path: fullPath,
        isDirectory,
        size
      };
    });
    
    // Sort nodes: directories first, then alphabetical
    nodes.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });
    
    res.json({ nodes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API to read file content
app.get('/api/file', (req, res) => {
  const filePath = req.query.path;
  const preview = req.query.preview === 'true';
  
  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(400).json({ error: 'Invalid or missing file path' });
  }

  try {
    if (preview) {
      const PREVIEW_LIMIT = 2 * 1024 * 1024; // 2MB
      const buffer = Buffer.alloc(PREVIEW_LIMIT);
      const fd = fs.openSync(filePath, 'r');
      const bytesRead = fs.readSync(fd, buffer, 0, PREVIEW_LIMIT, 0);
      fs.closeSync(fd);
      res.send(buffer.toString('utf-8', 0, bytesRead));
    } else {
      const content = fs.readFileSync(filePath, 'utf-8');
      res.send(content);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API to get file stats
app.get('/api/stat', (req, res) => {
  const filePath = req.query.path;
  
  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(400).json({ error: 'Invalid or missing file path' });
  }

  try {
    const stats = fs.statSync(filePath);
    res.json({
      size: stats.size,
      isDirectory: stats.isDirectory()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Optionally serve the built frontend
app.use(express.static(path.join(__dirname, '../dist')));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
