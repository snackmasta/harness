export type Unit = 'mm' | 'cm' | 'm' | 'in' | 'ft';

export interface Point {
  x: number;
  y: number;
}

export interface ReferenceLine {
  p1: Point;
  p2: Point;
  realDistance: number; // in chosen unit
  unit: Unit;
  calibrated: boolean;
  visible?: boolean;
}

export type WireGauge =
  | '12 AWG'
  | '14 AWG'
  | '16 AWG'
  | '18 AWG'
  | '20 AWG'
  | '22 AWG'
  | '24 AWG'
  | '26 AWG'
  | '28 AWG'
  | '0.5 mm²'
  | '0.75 mm²'
  | '1.0 mm²'
  | '1.5 mm²'
  | '2.5 mm²'
  | 'Coaxial'
  | 'Custom';

export type WireType = 'Single Core' | 'Twisted Pair' | 'Shielded' | 'Ribbon' | 'Power Cable' | 'Ground Strap';

export interface WireColor {
  name: string;
  primary: string; // hex color
  stripe?: string;  // optional second stripe color
}

export interface ConnectorPin {
  pinNumber: string | number;
  label?: string;
  wireId?: string;
}

export interface Connector {
  id: string;
  name: string;
  type: string; // e.g. "DT06-4S", "Molex 43025-0400", "JST-XH 3P"
  position: Point;
  pinCount: number;
  color?: string;
  visible?: boolean;
  locked?: boolean;
}

export interface Wire {
  id: string;
  name: string; // e.g. "W01 - PWR_12V"
  points: Point[]; // polyline vertices in canvas pixel coordinates
  color: WireColor;
  gauge: WireGauge;
  wireType: WireType;
  slackAllowance: number; // additional extra length (in current unit) for crimping/stripping
  slackPercent: number; // additional % slack (e.g. 5%)
  fromConnectorId?: string;
  fromPin?: string;
  toConnectorId?: string;
  toPin?: string;
  sleeving?: 'None' | 'Heatshrink' | 'Split Loom' | 'Braided Mesh' | 'Spiral Wrap';
  bundleGroup?: string;
  folderId?: string; // Photoshop-style folder / bundle group
  routingStyle?: 'straight' | 'rounded'; // straight segments or smoothed bends
  notes?: string;
  visible?: boolean;
  locked?: boolean;
}

export interface LayerFolder {
  id: string;
  name: string;
  color?: string;
  visible?: boolean;
  locked?: boolean;
  expanded?: boolean;
}

export interface QuickDimension {
  id: string;
  p1: Point;
  p2: Point;
  label?: string;
  visible?: boolean;
}

export type ToolMode =
  | 'select'
  | 'calibrate'
  | 'draw_wire'
  | 'dimension'
  | 'add_connector'
  | 'pan';

export interface CanvasTransform {
  x: number;
  y: number;
  scale: number;
}

export interface HarnessProject {
  version: string;
  name: string;
  imageSrc: string | null;
  imageDimensions: { width: number; height: number };
  referenceLine: ReferenceLine;
  wires: Wire[];
  folders?: LayerFolder[];
  connectors: Connector[];
  dimensions: QuickDimension[];
  createdAt: string;
  updatedAt: string;
}

