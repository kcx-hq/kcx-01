import type { ComponentType } from "react";
import type {
  ResourceGrouping as CoreResourceGrouping,
  ResourceInventoryProps as CoreResourceInventoryProps,
  ResourceInventoryViewProps as CoreResourceInventoryViewProps,
  ResourceItem as CoreResourceItem,
  ResourceTab as CoreResourceTab,
} from "../../../core-dashboard/resources/types";

export type ResourceInventoryProps = CoreResourceInventoryProps;
export type ResourceInventoryViewProps = CoreResourceInventoryViewProps;
export type ResourceTab = CoreResourceTab;
export type ResourceGrouping = CoreResourceGrouping;
export type ResourceItem = CoreResourceItem;

export type StatPillTone = "mint" | "gray" | "green";

export interface EmptyStateProps {
  title: string;
  subtitle: string;
}

export interface StatPillProps {
  icon: ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  tone?: StatPillTone;
}

export type ToneMap = Record<StatPillTone, string>;
