export interface AddonOption {
  name?: string;
  type?: "text" | "number" | "boolean" | "select" | "color" | string;
  label?: string;
  default?: any;
  options?: string[];
  list?: string[];
  min?: number;
  max?: number;
  step?: number;
}

export interface AddonDefinition {
  name: string;
  description?: string;
  options?: Record<string, AddonOption> | AddonOption[];
  enabled?: boolean;
}

export interface BlockConfig {
  block: string;
  color?: { r: number; g: number; b: number };
}

export interface PortalSettings {
  displayname: string;
  particle: string;
  block: string;
  insideBlock: string;
  lightLevel: number;
}
