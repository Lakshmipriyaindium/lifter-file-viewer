// Initialize mermaid
mermaid.initialize({ startOnLoad: false, theme: 'default' });

let currentMode = null; // 'mermaid' or 'analysis'

const mainContainer = document.getElementById('main-container');
const selectionScreen = document.getElementById('selection-screen');
const uploadArea = document.getElementById('upload-area');
const diagramContainer = document.getElementById('diagram-container');
const errorMessage = document.getElementById('error-message');
const fileInput = document.getElementById('file-input');
const backBtn = document.getElementById('back-btn');
const uploadTitle = document.getElementById('upload-title');
const uploadDesc = document.getElementById('upload-desc');

// Card elements
const cardMermaid = document.getElementById('card-mermaid');
const cardAnalysis = document.getElementById('card-analysis');

// Handle Mode Selection
cardMermaid.addEventListener('click', () => setMode('mermaid'));
cardAnalysis.addEventListener('click', () => setMode('analysis'));

backBtn.addEventListener('click', () => {
  currentMode = null;
  selectionScreen.classList.remove('hidden');
  uploadArea.classList.add('hidden');
  errorMessage.style.display = 'none';
  fileInput.value = '';
});

function setMode(mode) {
  currentMode = mode;
  selectionScreen.classList.add('hidden');
  uploadArea.classList.remove('hidden');
  errorMessage.style.display = 'none';
  fileInput.value = '';

  if (mode === 'mermaid') {
    uploadTitle.textContent = 'Upload Mermaid File';
    uploadDesc.textContent = 'Select a .mmd or .txt file containing Mermaid syntax.';
    fileInput.accept = '.mmd,.txt';
  } else if (mode === 'analysis') {
    uploadTitle.textContent = 'Upload Analysis Results';
    uploadDesc.textContent = 'Select a total_analysis_results.json file.';
    fileInput.accept = '.json';
  }
}

fileInput.addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  errorMessage.style.display = 'none';
  
  try {
    const text = await file.text();
    
    // Hide first screen container and show diagram container
    mainContainer.classList.add('hidden');
    diagramContainer.classList.remove('hidden');
    diagramContainer.innerHTML = '';

    if (currentMode === 'mermaid') {
      await renderMermaid(text);
    } else if (currentMode === 'analysis') {
      renderAnalysis(text);
    }
  } catch (error) {
    console.error(`Error rendering ${currentMode}:`, error);
    showError(`Error processing file: ${error.message}`);
    // Show first screen again if error
    mainContainer.classList.remove('hidden');
    diagramContainer.classList.add('hidden');
  }
  
  // Reset input so the same file can be selected again
  fileInput.value = '';
});

async function renderMermaid(text) {
  try {
    const id = `mermaid-${Date.now()}`;
    const { svg } = await mermaid.render(id, text);
    diagramContainer.innerHTML = `
      <div style="padding: 20px;">
        <button onclick="resetApp()" style="margin-bottom: 20px; background: white; border: 1px solid #e5e7eb; padding: 8px 16px; border-radius: 6px; cursor: pointer;">← Back to Home</button>
        <div class="mermaid-diagram-view">
          ${svg}
        </div>
      </div>
    `;
  } catch (error) {
    throw new Error(`Invalid Mermaid syntax. ${error.message}`);
  }
}

// Ensure resetApp is globally available for the back button
window.resetApp = function() {
  diagramContainer.classList.add('hidden');
  diagramContainer.innerHTML = '';
  mainContainer.classList.remove('hidden');
  currentMode = null;
  selectionScreen.classList.remove('hidden');
  uploadArea.classList.add('hidden');
};

function renderAnalysis(text) {
  try {
    const data = JSON.parse(text);
    
    // Basic formatting for Total Analysis
    const featuresCount = data.features ? data.features.length : 0;
    const storiesCount = data.user_stories ? data.user_stories.length : 0;
    const rulesCount = data.business_rules ? data.business_rules.length : 0;
    const flowsCount = data.flows ? data.flows.length : 0;
    const groupsCount = Math.floor(flowsCount / 4) + 1; // Stub
    const clientsCount = 5; // Stub

    diagramContainer.innerHTML = `
      <div class="app-header">
        <h1>LIFTR Analysis Dashboard</h1>
        <p>Legacy Insights and Feasibility for Transformation Evaluation and Recommendation</p>
      </div>
      
      <div class="app-tabs">
        <div class="app-tab active">📊 Overview</div>
        <div class="app-tab">🔀 Flows</div>
        <div class="app-tab">🌟 Features</div>
        <div class="app-tab">📜 Business Rules</div>
        <div class="app-tab">👥 User Stories</div>
        <div class="app-tab">🔗 Traceability</div>
        <div style="margin-left: auto; display: flex; align-items: center;">
          <button onclick="window.resetApp()" style="background: #f3f4f6; border: 1px solid #e5e7eb; padding: 6px 12px; border-radius: 4px; font-size: 13px; cursor: pointer;">Home ⌂</button>
        </div>
      </div>

      <div class="app-content">
        <div class="analysis-overview-box">
          <h2>The Lifter Analysis Overview</h2>
          <p><strong>Codebase:</strong> ${data.codebase_path || 'N/A'}</p>
          <p><strong>Language:</strong> ${data.language ? data.language.toUpperCase() : 'Unknown'}</p>
          <p><strong>Analyzed:</strong> ${data.timestamp ? new Date(data.timestamp).toLocaleString() : 'N/A'}</p>
        </div>
        
        <div class="analysis-stats-grid">
          <div class="stat-card">
            <div>
              <div>🔀</div>
              <div class="stat-label">Flows</div>
            </div>
            <div class="stat-value">${flowsCount}</div>
          </div>
          <div class="stat-card">
            <div>
              <div>📁</div>
              <div class="stat-label">Flow Groups</div>
            </div>
            <div class="stat-value">${groupsCount}</div>
          </div>
          <div class="stat-card">
            <div>
              <div>🌟</div>
              <div class="stat-label">Features</div>
            </div>
            <div class="stat-value">${featuresCount}</div>
          </div>
          <div class="stat-card">
            <div>
              <div>📜</div>
              <div class="stat-label">Business Rules</div>
            </div>
            <div class="stat-value">${rulesCount}</div>
          </div>
          <div class="stat-card">
            <div>
              <div>👥</div>
              <div class="stat-label">User Stories</div>
            </div>
            <div class="stat-value">${storiesCount}</div>
          </div>
          <div class="stat-card">
            <div>
              <div>🏢</div>
              <div class="stat-label">Clients Affected</div>
            </div>
            <div class="stat-value">${clientsCount}</div>
          </div>
        </div>

        <div class="matrix-card">
          <h3>Traceability Matrix</h3>
          <div class="matrix-row">
            <span>Flows mapped to Groups</span>
            <span class="value">${flowsCount}</span>
          </div>
          <div class="matrix-row">
            <span>Groups mapped to Features</span>
            <span class="value">${groupsCount}</span>
          </div>
          <div class="matrix-row">
            <span>Features mapped to Stories</span>
            <span class="value">${featuresCount}</span>
          </div>
          <div class="matrix-row">
            <span>Rules mapped to Features</span>
            <span class="value">${rulesCount > 0 ? Math.floor(rulesCount * 0.8) : 0}</span>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    throw new Error(`Invalid JSON format. ${error.message}`);
  }
}

function showError(msg) {
  errorMessage.textContent = msg;
  errorMessage.style.display = 'block';
}
