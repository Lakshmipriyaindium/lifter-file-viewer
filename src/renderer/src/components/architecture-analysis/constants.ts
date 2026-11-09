import { AlertTriangle, CheckCircle2, XCircle, type LucideIcon } from 'lucide-react';
import type { ChecklistFilter } from './types';

interface StatusStyle { label: string; icon: LucideIcon; badge: string; icon_cls: string; bar: string }
type Palette = Omit<StatusStyle, 'label' | 'icon'>;

const GREEN: Palette = { badge: 'bg-green-50 text-green-700 border-green-200', icon_cls: 'text-green-600', bar: 'bg-green-500' };
const AMBER: Palette = { badge: 'bg-amber-50 text-amber-700 border-amber-200', icon_cls: 'text-amber-500', bar: 'bg-amber-500' };
const RED: Palette = { badge: 'bg-red-50 text-red-600 border-red-200', icon_cls: 'text-red-500', bar: 'bg-red-500' };
const BLUE: Palette = { badge: 'bg-blue-50 text-blue-700 border-blue-200', icon_cls: 'text-blue-500', bar: 'bg-blue-500' };

export const STATUS_STYLES: Record<string, StatusStyle> = {
  pass: { label: 'PASS', icon: CheckCircle2, ...GREEN },
  warning: { label: 'WARNING', icon: AlertTriangle, ...AMBER },
  fail: { label: 'FAIL', icon: XCircle, ...RED },
  healthy: { label: 'HEALTHY', icon: CheckCircle2, ...GREEN },
  critical: { label: 'CRITICAL', icon: XCircle, ...RED },
  high: { label: 'HIGH', icon: XCircle, ...RED },
  medium: { label: 'MEDIUM', icon: AlertTriangle, ...AMBER },
  low: { label: 'LOW', icon: AlertTriangle, ...BLUE },
};

export const getStatusStyle = (s?: string): StatusStyle =>
  STATUS_STYLES[s?.toLowerCase() ?? ''] ?? STATUS_STYLES.warning;

export const CHECKLIST_FILTERS: { key: ChecklistFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'fail', label: 'Failed' },
  { key: 'warning', label: 'Warnings' },
  { key: 'pass', label: 'Passed' },
];

export const CHECKLIST_PREVIEW_COUNT = 8;
export const READINESS_SCROLL_MAX_H = 'max-h-[520px]';
export const DIAGRAM_HEIGHT = 'h-[520px]';
export const SCORE_THRESHOLDS = { good: 70, fair: 40 };
