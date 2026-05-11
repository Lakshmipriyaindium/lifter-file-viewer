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

const getConfidenceColor = (score: number): string => {
  if (score > 0.7) return '#10b981';
  if (score > 0.4) return '#f59e0b';
  return '#ef4444';
};

const escapeXml = (unsafe: string): string => {
  if (!unsafe) return '';
  return unsafe.replaceAll(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case "'": return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
};

const calculateGraphBounds = (nodes: Node[], padding: number = 80) => {
  if (nodes.length === 0) {
    return {
      minX: -400, minY: -300, maxX: 400, maxY: 300,
      width: 800, height: 600, viewBox: '-400 -300 800 600'
    };
  }

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  for (const node of nodes) {
    const nodeWidth = 200, nodeHeight = 100;
    const x = node.position.x, y = node.position.y;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + nodeWidth);
    maxY = Math.max(maxY, y + nodeHeight);
  }

  minX -= padding; minY -= padding; maxX += padding; maxY += padding;
  const graphWidth = maxX - minX, graphHeight = maxY - minY;
  const finalWidth = Math.max(graphWidth, 800), finalHeight = Math.max(graphHeight, 600);

  return {
    minX, minY, maxX, maxY,
    width: finalWidth, height: finalHeight,
    viewBox: `${minX} ${minY} ${finalWidth} ${finalHeight}`
  };
};

export const exportToSvg = (nodes: Node[], edges: Edge[], options: ExportOptions = {}): string => {
  const { backgroundColor = '#ffffff', padding = 80 } = options;
  const bounds = calculateGraphBounds(nodes, padding);

  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="100%" height="100%" 
     viewBox="${bounds.viewBox}" 
     preserveAspectRatio="xMidYMid meet"
     xmlns="http://www.w3.org/2000/svg"
     style="background-color: ${backgroundColor}; cursor: move;">
  <defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
    </marker>
    <marker id="arrowhead-highlight" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#fb851e" />
    </marker>
    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="2" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.3)" flood-opacity="0.6"/>
    </filter>
    <style>
      .node:hover rect { stroke-width: 3px; }
      .node-text { user-select: none; pointer-events: none; }
      .type-text { user-select: none; pointer-events: none; }
    </style>
  </defs>
  <title>Knowledge Graph - ${nodes.length} nodes and ${edges.length} relationships</title>
  <g id="edges" stroke-linecap="round">
    ${edges.map(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      if (!sourceNode || !targetNode) return '';
      const sourceX = sourceNode.position.x + 100, sourceY = sourceNode.position.y + 50;
      const targetX = targetNode.position.x + 100, targetY = targetNode.position.y + 50;
      const isHighlighted = edge.style?.stroke === '#fb851e';
      const strokeColor = isHighlighted ? '#fb851e' : '#94a3b8';
      const strokeWidth = isHighlighted ? '3' : '2.5';
      const markerId = isHighlighted ? 'arrowhead-highlight' : 'arrowhead';
      const midX = (sourceX + targetX) / 2, midY = (sourceY + targetY) / 2;
      return `
    <g class="edge">
      <line x1="${sourceX}" y1="${sourceY}" x2="${targetX}" y2="${targetY}" stroke="${strokeColor}" stroke-width="${strokeWidth}" marker-end="url(#${markerId})"/>
      ${edge.label ? `<g transform="translate(${midX}, ${midY})"><rect x="-30" y="-12" width="60" height="16" rx="4" fill="white" stroke="${strokeColor}" stroke-width="1" opacity="0.9"/><text text-anchor="middle" dominant-baseline="middle" font-size="10" fill="${isHighlighted ? '#fb851e' : '#1e293b'}" font-weight="${isHighlighted ? '600' : '500'}" font-family="Arial, sans-serif">${escapeXml(edge.label as string)}</text></g>` : ''}
    </g>`;
    }).join('')}
  </g>
  <g id="nodes">
    ${nodes.map(node => {
      const nodeColor = getNodeColorForSvg(node.data?.type);
      const x = node.position.x, y = node.position.y;
      return `
    <g id="node-${node.id}" class="node" transform="translate(${x}, ${y})">
      <rect width="200" height="100" rx="8" fill="white" stroke="${nodeColor}" stroke-width="2" filter="url(#shadow)"/>
      <text x="100" y="35" text-anchor="middle" dominant-baseline="middle" font-size="12" font-weight="bold" fill="#1e293b" font-family="Arial, sans-serif" class="node-text">${escapeXml(node.data?.name || node.data?.id || 'Unknown Node')}</text>
      <text x="100" y="55" text-anchor="middle" dominant-baseline="middle" font-size="10" fill="#64748b" font-family="Arial, sans-serif" class="type-text">${escapeXml(node.data?.type?.replace('_', ' ') || 'unknown')}</text>
      ${node.data?.metadata?.analysis?.confidence_score ? `<circle cx="185" cy="15" r="4" fill="${getConfidenceColor(node.data.metadata.analysis.confidence_score)}"/>` : ''}
      <title>${escapeXml(node.data?.name || node.data?.id || 'Unknown Node')} - Type: ${escapeXml(node.data?.type?.replace('_', ' ') || 'unknown')}${node.data?.metadata?.description ? ` - ${escapeXml(node.data.metadata.description)}` : ''}</title>
    </g>`;
    }).join('')}
  </g>
  <script type="application/ecmascript">
    <![CDATA[
      let viewBox = [${bounds.minX}, ${bounds.minY}, ${bounds.width}, ${bounds.height}];
      const svg = document.documentElement;
      let isPanning = false, startPoint = { x: 0, y: 0 };
      svg.addEventListener('wheel', function(e) {
        e.preventDefault();
        const rect = svg.getBoundingClientRect();
        const zoom = Math.exp((e.deltaY < 0 ? 1 : -1) * 0.1);
        const newWidth = viewBox[2] / zoom, newHeight = viewBox[3] / zoom;
        viewBox = [viewBox[0] + ((e.clientX - rect.left) / rect.width) * viewBox[2] * (1 - 1/zoom), viewBox[1] + ((e.clientY - rect.top) / rect.height) * viewBox[3] * (1 - 1/zoom), newWidth, newHeight];
        svg.setAttribute('viewBox', viewBox.join(' '));
      });
      svg.addEventListener('mousedown', function(e) { if (e.button === 0) { isPanning = true; startPoint = { x: e.clientX, y: e.clientY }; svg.style.cursor = 'grabbing'; } });
      svg.addEventListener('mousemove', function(e) { if (isPanning) { const rect = svg.getBoundingClientRect(); viewBox[0] -= (e.clientX - startPoint.x) * viewBox[2] / rect.width; viewBox[1] -= (e.clientY - startPoint.y) * viewBox[3] / rect.height; svg.setAttribute('viewBox', viewBox.join(' ')); startPoint = { x: e.clientX, y: e.clientY }; } });
      svg.addEventListener('mouseup', function() { isPanning = false; svg.style.cursor = 'move'; });
      svg.addEventListener('dblclick', function() { viewBox = [${bounds.minX}, ${bounds.minY}, ${bounds.width}, ${bounds.height}]; svg.setAttribute('viewBox', viewBox.join(' ')); });
    ]]>
  </script>
</svg>`;

  return svgContent;
};

export const downloadSvg = (svgContent: string, filename: string = 'knowledge-graph.svg'): void => {
  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
