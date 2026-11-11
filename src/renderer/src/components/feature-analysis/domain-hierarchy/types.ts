export interface UserStoryCap {
  story_id: string;
  title: string;
  epic: string;
  narrative: string;
}

export interface L3Feature {
  id: string;
  name: string;
  description?: string;
  entryPointId?: string;
  feature_id?: string;
  userStories?: UserStoryCap[];
}

export interface Step {
  node_id: string;
  step_title: string;
  node_type: string;
  step_number: number;
  description?: string;
  business_rules?: string[];
}

export interface L2Capability {
  id: string;
  name: string;
  description?: string;
  keyPhases?: string[];
  criticalBusinessRules?: string[];
  businessValue?: string;
  clientVariations?: any[];
  l3Features?: L3Feature[];
  steps?: Step[];
}

export interface L1Domain {
  id: string;
  name: string;
  description?: string;
  purpose?: string;
  executive_summary?: string;
  l2Capabilities?: L2Capability[];
  l2_capabilities?: L2Capability[];
  capabilities?: L2Capability[];
  steps?: Step[];
}

// Treemap types
export interface CustomContentProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  value?: number;
  fill?: string;
  itemType?: 'Domain' | 'Capability' | 'Feature';
  capsCount?: number;
  featsCount?: number;
  storiesCount?: number;
}

export interface TreemapTooltipPayload {
  name?: string;
  fill?: string;
  itemType?: string;
  capsCount?: number;
  featsCount?: number;
  storiesCount?: number;
  description?: string;
}

export interface TreemapTooltipProps {
  active?: boolean;
  payload?: Array<{ payload?: TreemapTooltipPayload }>;
}

// Tree view types
export type TreeNodeType = 'root' | 'l1' | 'l2' | 'l3';

export interface SelectedNodeInfo {
  id: string;
  name: string;
  description?: string;
  type: TreeNodeType;
  parentName?: string;
}

export interface DomainTreeNodeData {
  id: string;
  name: string;
  description?: string;
  type: TreeNodeType;
  parentName?: string;
  isExpanded: boolean;
  hasChildren: boolean;
  isSelected: boolean;
  onToggle: (id: string) => void;
  onSelect: (info: SelectedNodeInfo) => void;
}

// Hierarchy view types
export type HierarchySelectedItem =
  | { type: 'l1'; data: L1Domain; parent?: undefined }
  | { type: 'l2'; data: L2Capability; parent?: L1Domain }
  | { type: 'l3'; data: L3Feature; parent?: L2Capability };

export type ViewType = 'hierarchy' | 'tile' | 'tree';

// Component Props
export interface CapabilityModelViewerProps {
  data: any;
}

export interface TileViewProps {
  data: L1Domain[];
}

export interface HierarchySplitViewProps {
  data: L1Domain[];
}

export interface HierarchyDetailPanelProps {
  selectedItem: HierarchySelectedItem | null;
}

export interface TreeViewProps {
  data: L1Domain[];
}

export interface TreeGraphProps {
  data: L1Domain[];
  expandedNodes: Set<string>;
  selectedNode: SelectedNodeInfo | null;
  onToggleNode: (id: string) => void;
  onSelectNode: (info: SelectedNodeInfo) => void;
  onCloseSidebar: () => void;
}

export interface NodeDetailSidebarProps {
  selectedNode: SelectedNodeInfo | null;
  onClose: () => void;
}
