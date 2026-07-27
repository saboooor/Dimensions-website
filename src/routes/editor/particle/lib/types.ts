export interface ParticleColor {
  r: number;
  g: number;
  b: number;
}

export interface ParticlePoint {
  x: number;
  y: number;
  z: number;
}

export interface ParticleConfig {
  type: string;
  color: ParticleColor;
  size: number;
}

export interface ShapeConfig {
  type: string;
  params: Record<string, any>;
}

export interface PositionConfig {
  x: number;
  y: number;
  z: number;
}

export interface AnimationConfig {
  rotate: boolean;
  rotateSpeed: number;
  float: boolean;
}

export interface LayerData {
  id?: string;
  name: string;
  enabled: boolean;
  section: string;
  particle: ParticleConfig;
  shape: ShapeConfig;
  position: PositionConfig;
  animation: AnimationConfig;
}

export interface PresetDefinition {
  description: string;
  icon: string;
  accentColor: string;
  frequency: number;
  layers: LayerData[];
}
