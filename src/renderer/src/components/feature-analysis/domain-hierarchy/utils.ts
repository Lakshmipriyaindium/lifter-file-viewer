import dagre from 'dagre';
import { Node, Edge } from 'reactflow';
import * as htmlToImage from 'html-to-image';
import { L1Domain, L2Capability, L3Feature, DomainTreeNodeData } from './types';
import {
  TREE_ROOT_WIDTH,
  TREE_NODE_WIDTH,
  TREE_NODE_HEIGHT,
  TREE_EDGE_STYLE,
  TREE_EDGE_MARKER,
  DAGRE_GRAPH_CONFIG,
  TREEMAP_CONFIG
} from './constants';

export const normalizeData = (data: any): L1Domain[] => {
  if (Array.isArray(data)) {
    return data;
  }

  if (data && data.domains) {
    const normalized: L1Domain[] = [];
    let domainId = 1;
    for (const [domainName, domainObj] of Object.entries(data.domains) as any) {
      const l2Capabilities: L2Capability[] = [];
      let capId = 1;

      const featuresList = domainObj.features || [];
      for (const featureName of featuresList) {
        const featureData = data.business_features_l1?.[featureName];
        const l3Features: L3Feature[] = [];

        if (featureData && featureData.functions_l2) {
          featureData.functions_l2.forEach((funcName: string, fIdx: number) => {
            l3Features.push({
              id: `l3-${domainId}-${capId}-${fIdx + 1}`,
              name: funcName,
              description: `Mapped from functions_l2 in ${featureName}`
            });
          });
        }

        l2Capabilities.push({
          id: `l2-${domainId}-${capId}`,
          name: featureName,
          description: featureData
            ? `Mapped from business_features_l1 with ${featureData.file_count || 0} files`
            : '',
          l3Features: l3Features
        });
        capId++;
      }

      normalized.push({
        id: `l1-${domainId}`,
        name: domainName,
        description: `Mapped from domains with ${domainObj.file_count || 0} files and ${domainObj.total_lines || 0} lines of code.`,
        l2Capabilities: l2Capabilities
      });
      domainId++;
    }
    return normalized;
  }

  return [];
};

export const getDomainCapabilities = (domain: L1Domain): L2Capability[] => {
  return domain.l2Capabilities || domain.l2_capabilities || domain.capabilities || [];
};

export const getDomainDescription = (domain: L1Domain): string => {
  return domain.description || domain.purpose || domain.executive_summary || '';
};

// Tree Graph standalone helpers
export const createTreeEdge = (source: string, target: string): Edge => ({
  id: `${source}->${target}`,
  source,
  target,
  type: 'smoothstep',
  style: TREE_EDGE_STYLE,
  markerEnd: TREE_EDGE_MARKER
});

export const createTreeNode = (
  data: Omit<DomainTreeNodeData, 'isSelected'>
): Node<DomainTreeNodeData> => ({
  id: data.id,
  type: 'domainNode',
  position: { x: 0, y: 0 },
  data: { ...data, isSelected: false }
});

export const getLayoutedTreeElements = (
  nodes: Node<DomainTreeNodeData>[],
  edges: Edge[]
) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ ...DAGRE_GRAPH_CONFIG });

  nodes.forEach((node) => {
    const width = node.data.type === 'root' ? TREE_ROOT_WIDTH : TREE_NODE_WIDTH;
    dagreGraph.setNode(node.id, { width, height: TREE_NODE_HEIGHT });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  return {
    nodes: nodes.map((node) => {
      const pos = dagreGraph.node(node.id);
      const width = node.data.type === 'root' ? TREE_ROOT_WIDTH : TREE_NODE_WIDTH;
      return {
        ...node,
        position: {
          x: pos.x - width / 2,
          y: pos.y - TREE_NODE_HEIGHT / 2
        }
      };
    }),
    edges
  };
};

// Treemap standalone helpers
export const getTreemapFontSizes = (width: number, height: number) => ({
  fontSize: Math.max(Math.min(width / 10, height / 5, 14), 10),
  metricFontSize: Math.max(Math.min(width / 14, height / 8, 11), 8)
});

export const truncateTreemapLabel = (name: string, width: number): string => {
  if (width < 100 && name.length > 10) {
    return `${name.substring(0, 8)}...`;
  }
  return name;
};

export const exportElementAsPng = async (
  element: HTMLElement,
  filenamePrefix: string
): Promise<void> => {
  const dataUrl = await htmlToImage.toPng(element, TREEMAP_CONFIG.exportOptions);
  const link = document.createElement('a');
  link.download = `${filenamePrefix}-${new Date().toISOString().split('T')[0]}.png`;
  link.href = dataUrl;
  link.click();
};
