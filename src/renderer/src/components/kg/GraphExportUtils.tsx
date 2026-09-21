import { Node, Edge } from 'reactflow';

export interface ExportOptions {
  backgroundColor?: string;
  padding?: number;
  scale?: number;
}

// Get node color for SVG
const getNodeColorForSvg = (type?: string): string => {
  switch (type) {
    case 'struct': return '#3b82f6';
    case 'function': return '#8b5cf6';
    case 'module': return '#06b6d4';
    case 'database_query': return '#10b981';
    case 'database_table': return '#059669';
    case 'component': return '#f59e0b';
    case 'report': return '#ef4444';
    case 'main_entry': return '#fb851e';
    case 'property': return '#64748b';
    case 'application': return '#fb851e';
    default: return '#64748b';
  }
};

// Get confidence color
const getConfidenceColor = (score: number): string => {
  if (score > 0.7) {
    return '#10b981';
  }
  if (score > 0.4) {
    return '#f59e0b';
  }
  return '#ef4444';
};

// Helper function to escape XML special characters
const escapeXml = (unsafe: string): string => {
  if (!unsafe) return '';
  return unsafe.replaceAll(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
};

// Calculate the bounding box of all nodes with proper scaling
const calculateGraphBounds = (nodes: Node[], padding: number = 80) => {
  if (nodes.length === 0) {
    return { 
      minX: -400, 
      minY: -300, 
      maxX: 400, 
      maxY: 300, 
      width: 800, 
      height: 600,
      viewBox: '-400 -300 800 600'
    };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const node of nodes) {
    const nodeWidth = 200;
    const nodeHeight = 100;
    const x = node.position.x;
    const y = node.position.y;
    
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + nodeWidth);
    maxY = Math.max(maxY, y + nodeHeight);
  }

  // Add padding
  minX -= padding;
  minY -= padding;
  maxX += padding;
  maxY += padding;

  const graphWidth = maxX - minX;
  const graphHeight = maxY - minY;

  // Ensure minimum dimensions
  const finalWidth = Math.max(graphWidth, 800);
  const finalHeight = Math.max(graphHeight, 600);

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: finalWidth,
    height: finalHeight,
    viewBox: `${minX} ${minY} ${finalWidth} ${finalHeight}`
  };
};

// Function to convert the graph to SVG with zoom capability
export const exportToSvg = (
  nodes: Node[],
  edges: Edge[],
  options: ExportOptions = {}
): string => {
  const {
    backgroundColor = '#ffffff',
    padding = 80
  } = options;

  const bounds = calculateGraphBounds(nodes, padding);
  
  // Create SVG content with zoom-friendly structure
  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="100%" height="100%" 
     viewBox="${bounds.viewBox}" 
     preserveAspectRatio="xMidYMid meet"
     xmlns="http://www.w3.org/2000/svg"
     style="background-color: ${backgroundColor}; cursor: move;">
  <defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="7" 
            refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
    </marker>
    <marker id="arrowhead-highlight" markerWidth="10" markerHeight="7" 
            refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#fb851e" />
    </marker>
    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="2" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.3)" flood-opacity="0.6"/>
    </filter>
    
    <!-- Zoom and pan styles -->
    <style>
      .node:hover rect {
        stroke-width: 3px;
        filter: url(#shadow) brightness(1.1);
      }
      .edge:hover line {
        stroke-width: 4px;
      }
      .node-text {
        user-select: none;
        pointer-events: none;
      }
      .type-text {
        user-select: none;
        pointer-events: none;
      }
    </style>
  </defs>
  
  <!-- Title for accessibility -->
  <title>Knowledge Graph - ${nodes.length} nodes and ${edges.length} relationships</title>
  
  <!-- Description for accessibility -->
  <desc>
    Interactive knowledge graph visualization showing ${nodes.length} entities and ${edges.length} connections. 
    You can zoom and pan this SVG to explore different parts of the graph.
  </desc>

  <!-- Edges Group -->
  <g id="edges" stroke-linecap="round">
    ${edges.map(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      
      if (!sourceNode || !targetNode) return '';
      
      const sourceX = sourceNode.position.x + 100;
      const sourceY = sourceNode.position.y + 50;
      const targetX = targetNode.position.x + 100;
      const targetY = targetNode.position.y + 50;
      
      const isHighlighted = edge.style?.stroke === '#fb851e';
      const strokeColor = isHighlighted ? '#fb851e' : '#94a3b8';
      const strokeWidth = isHighlighted ? '3' : '2.5';
      const markerId = isHighlighted ? 'arrowhead-highlight' : 'arrowhead';
      
      // Calculate edge path with slight curve for better visibility
      const midX = (sourceX + targetX) / 2;
      const midY = (sourceY + targetY) / 2;

      const textFillColor = isHighlighted ? "#fb851e" : "#1e293b";
      const textFontWeight = isHighlighted ? "600" : "500";
      
      return `
    <g class="edge">
      <line 
        x1="${sourceX}" y1="${sourceY}" 
        x2="${targetX}" y2="${targetY}" 
        stroke="${strokeColor}" 
        stroke-width="${strokeWidth}"
        marker-end="url(#${markerId})"
      />
      ${edge.label ? `
      <g transform="translate(${midX}, ${midY})">
        <rect 
          x="-30" y="-12" 
          width="60" height="16" 
          rx="4" 
          fill="white" 
          stroke="${strokeColor}" 
          stroke-width="1"
          opacity="0.9"
        />
        <text 
          text-anchor="middle" 
          dominant-baseline="middle"
          font-size="10" 
          fill="${textFillColor}" 
          font-weight="${textFontWeight}"
          font-family="Arial, sans-serif"
        >
          ${escapeXml(edge.label as string)}
        </text>
      </g>` : ''}
    </g>`;
    }).join('')}
  </g>
  
  <!-- Nodes Group -->
  <g id="nodes">
    ${nodes.map(node => {
      const nodeColor = getNodeColorForSvg(node.data?.type);
      const x = node.position.x;
      const y = node.position.y;
      const nodeId = `node-${node.id}`;
      
      return `
    <g id="${nodeId}" class="node" transform="translate(${x}, ${y})">
      <rect 
        width="200" 
        height="100" 
        rx="8" 
        fill="white" 
        stroke="${nodeColor}" 
        stroke-width="2" 
        filter="url(#shadow)"
      />
      <text 
        x="100" 
        y="35" 
        text-anchor="middle" 
        dominant-baseline="middle"
        font-size="12" 
        font-weight="bold" 
        fill="#1e293b" 
        font-family="Arial, sans-serif"
        class="node-text"
      >
        ${escapeXml(node.data?.name || node.data?.id || 'Unknown Node')}
      </text>
      <text 
        x="100" 
        y="55" 
        text-anchor="middle" 
        dominant-baseline="middle"
        font-size="10" 
        fill="#64748b" 
        font-family="Arial, sans-serif"
        class="type-text"
      >
        ${escapeXml(node.data?.type?.replace('_', ' ') || 'unknown')}
      </text>
      ${node.data?.metadata?.analysis?.confidence_score ? `
      <circle 
        cx="185" 
        cy="15" 
        r="4" 
        fill="${getConfidenceColor(node.data.metadata.analysis.confidence_score)}" 
      />` : ''}
      
      <!-- Node tooltip area -->
      <title>
        ${escapeXml(node.data?.name || node.data?.id || 'Unknown Node')}
        - Type: ${escapeXml(node.data?.type?.replace('_', ' ') || 'unknown')}
        ${node.data?.metadata?.description ? ` - ${escapeXml(node.data.metadata.description)}` : ''}
      </title>
    </g>`;
    }).join('')}
  </g>

  <!-- Interactive Script for Zoom and Pan -->
  <script type="application/ecmascript">
    <![CDATA[
      let scale = 1;
      let viewBox = [${bounds.minX}, ${bounds.minY}, ${bounds.width}, ${bounds.height}];
      const svg = document.documentElement;
      let isPanning = false;
      let startPoint = { x: 0, y: 0 };
      let endPoint = { x: 0, y: 0 };

      // Mouse wheel zoom
      svg.addEventListener('wheel', function(e) {
        e.preventDefault();
        const rect = svg.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const zoomIntensity = 0.1;
        const wheel = e.deltaY < 0 ? 1 : -1;
        const zoom = Math.exp(wheel * zoomIntensity);
        
        // Calculate new viewBox
        const newWidth = viewBox[2] / zoom;
        const newHeight = viewBox[3] / zoom;
        const newX = viewBox[0] + (mouseX / rect.width) * viewBox[2] * (1 - 1/zoom);
        const newY = viewBox[1] + (mouseY / rect.height) * viewBox[3] * (1 - 1/zoom);
        
        viewBox = [newX, newY, newWidth, newHeight];
        svg.setAttribute('viewBox', viewBox.join(' '));
        scale *= zoom;
      });

      // Mouse panning
      svg.addEventListener('mousedown', function(e) {
        if (e.button === 0) { // Left mouse button
          isPanning = true;
          startPoint = { x: e.clientX, y: e.clientY };
          svg.style.cursor = 'grabbing';
        }
      });

      svg.addEventListener('mousemove', function(e) {
        if (isPanning) {
          endPoint = { x: e.clientX, y: e.clientY };
          const dx = (endPoint.x - startPoint.x) * viewBox[2] / rect.width;
          const dy = (endPoint.y - startPoint.y) * viewBox[3] / rect.height;
          
          viewBox[0] -= dx;
          viewBox[1] -= dy;
          svg.setAttribute('viewBox', viewBox.join(' '));
          
          startPoint = endPoint;
        }
      });

      svg.addEventListener('mouseup', function() {
        isPanning = false;
        svg.style.cursor = 'move';
      });

      svg.addEventListener('mouseleave', function() {
        isPanning = false;
        svg.style.cursor = 'move';
      });

      // Double click to reset view
      svg.addEventListener('dblclick', function() {
        viewBox = [${bounds.minX}, ${bounds.minY}, ${bounds.width}, ${bounds.height}];
        svg.setAttribute('viewBox', viewBox.join(' '));
        scale = 1;
      });

      // Touch support for mobile devices
      let touchStartDistance = 0;
      
      svg.addEventListener('touchstart', function(e) {
        if (e.touches.length === 2) {
          touchStartDistance = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          );
        } else if (e.touches.length === 1) {
          isPanning = true;
          startPoint = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        e.preventDefault();
      });

      svg.addEventListener('touchmove', function(e) {
        if (e.touches.length === 2 && touchStartDistance !== 0) {
          // Pinch to zoom
          const touchDistance = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          );
          const zoom = touchDistance / touchStartDistance;
          
          const rect = svg.getBoundingClientRect();
          const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
          const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
          
          const newWidth = viewBox[2] / zoom;
          const newHeight = viewBox[3] / zoom;
          const newX = viewBox[0] + (centerX / rect.width) * viewBox[2] * (1 - 1/zoom);
          const newY = viewBox[1] + (centerY / rect.height) * viewBox[3] * (1 - 1/zoom);
          
          viewBox = [newX, newY, newWidth, newHeight];
          svg.setAttribute('viewBox', viewBox.join(' '));
          touchStartDistance = touchDistance;
        } else if (e.touches.length === 1 && isPanning) {
          // Pan with one finger
          endPoint = { x: e.touches[0].clientX, y: e.touches[0].clientY };
          const rect = svg.getBoundingClientRect();
          const dx = (endPoint.x - startPoint.x) * viewBox[2] / rect.width;
          const dy = (endPoint.y - startPoint.y) * viewBox[3] / rect.height;
          
          viewBox[0] -= dx;
          viewBox[1] -= dy;
          svg.setAttribute('viewBox', viewBox.join(' '));
          startPoint = endPoint;
        }
        e.preventDefault();
      });

      svg.addEventListener('touchend', function() {
        isPanning = false;
        touchStartDistance = 0;
      });
    ]]>
  </script>

  <!-- Zoom controls -->
  <g id="zoom-controls" transform="translate(${bounds.minX + 20}, ${bounds.minY + 20})">
    <rect x="0" y="0" width="100" height="80" rx="8" fill="white" fill-opacity="0.8" stroke="#e2e8f0" stroke-width="1"/>
    <g font-family="Arial, sans-serif" font-size="12" text-anchor="middle">
      <text x="50" y="20" fill="#64748b">Use:</text>
      <text x="50" y="35" fill="#64748b">• Wheel to Zoom</text>
      <text x="50" y="50" fill="#64748b">• Drag to Pan</text>
      <text x="50" y="65" fill="#64748b">• Double-click Reset</text>
    </g>
  </g>
</svg>`;

  return svgContent;
};

// Download SVG file
export const downloadSvg = (svgContent: string, filename: string = 'knowledge-graph.svg'): void => {
  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};