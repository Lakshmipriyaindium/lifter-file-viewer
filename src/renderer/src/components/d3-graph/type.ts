export interface NodeData {
  id: string;
  name: string;
  type: string;
  language: string;
  module_name?: string;
  score: number;
  module?: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface LinkData {
  source: string;
  target: string;
  type: string;
  value: number;
  score: number;
}

export interface GraphData {
  nodes: NodeData[];
  links: LinkData[];
}

export interface D3NodeChartConfig {
  node: {
    radius: number;
    enlargedRadius: number;
    nameOffsetX: number;
    nameOffsetY: number;
    nameFontSize: string;
    nameFontColor: string;
  };
  link: {
    defaultStrokeWidth: number;
    strokeColor: string;
    thicknessScaleFactor: number;
    dashedThreshold: number;
    dashArray: string;
    linkDistance: number;
  };
  zoom: {
    scaleExtent: [number, number];
    zoomFactor: number;
    translation: number;
  };
  drag: {
    alphaTarget: number;
  };
  force: {
    chargeStrength: number;
  };
  backgroundColor: string;
}

export interface ForceDirectedGraphProps {
  data: GraphData;
  config?: D3NodeChartConfig;
  setOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  setSelectedNode: (nodeId: string) => void;
}

export interface ForceDirectedD3ToolTip {
  x: number;
  y: number;
  content: string;
}
