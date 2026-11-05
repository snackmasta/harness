/**
 * Pre-rendered SVG sample harness boards encoded as Data URIs
 * Enables immediate testing and demoing without requiring user photo upload.
 */

export interface SampleImage {
  id: string;
  name: string;
  description: string;
  dataUrl: string;
  width: number;
  height: number;
  defaultRef: {
    p1: { x: number; y: number };
    p2: { x: number; y: number };
    realDistance: number;
    unit: 'mm';
  };
}

// 1. Automotive Harness Formboard with 200mm Scale Bar and Peg Grid
function createFormboardSvg(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">
    <defs>
      <!-- Formboard Grid -->
      <pattern id="smallGrid" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#2a3342" stroke-width="0.75" />
      </pattern>
      <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
        <rect width="100" height="100" fill="url(#smallGrid)" />
        <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#3b485d" stroke-width="1.5" />
      </pattern>
      <radialGradient id="pegGrad" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stop-color="#94a3b8" />
        <stop offset="70%" stop-color="#475569" />
        <stop offset="100%" stop-color="#1e293b" />
      </radialGradient>
      <linearGradient id="connectorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#334155" />
        <stop offset="100%" stop-color="#0f172a" />
      </linearGradient>
    </defs>

    <!-- Background Formboard Board -->
    <rect width="1600" height="1000" fill="#131923" />
    <rect width="1600" height="1000" fill="url(#grid)" opacity="0.85" />
    <rect x="20" y="20" width="1560" height="960" fill="none" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="10 6" opacity="0.3" />

    <!-- Title Block (CAD Style) -->
    <g transform="translate(1180, 840)">
      <rect width="380" height="120" fill="#0f172a" stroke="#38bdf8" stroke-width="1.5" rx="4" />
      <text x="20" y="30" fill="#38bdf8" font-family="sans-serif" font-size="14" font-weight="bold">HARNESS FORMBOARD #FB-2026-A1</text>
      <text x="20" y="52" fill="#94a3b8" font-family="sans-serif" font-size="11">PROJECT: CHASSIS &amp; POWERTRAIN HARNESS</text>
      <text x="20" y="70" fill="#94a3b8" font-family="sans-serif" font-size="11">SCALE: 1:1 CALIBRATED NAILBOARD</text>
      <text x="20" y="88" fill="#64748b" font-family="sans-serif" font-size="10">NAIL PITCH: 50.0 mm | TOLERANCE: ± 3 mm</text>
      <rect x="260" y="20" width="100" height="80" fill="#1e293b" rx="2" stroke="#475569" />
      <text x="275" y="65" fill="#10b981" font-family="monospace" font-size="12" font-weight="bold">REV C.4</text>
    </g>

    <!-- CALIBRATION SCALE BAR: Exactly 400 pixels = 200 mm (i.e. 2 px = 1 mm) -->
    <g id="calibration-target" transform="translate(100, 100)">
      <rect x="-10" y="-15" width="420" height="50" fill="#1e293b" rx="6" stroke="#fbbf24" stroke-width="1.5" opacity="0.95" />
      <line x1="0" y1="10" x2="400" y2="10" stroke="#fbbf24" stroke-width="3" />
      <circle cx="0" cy="10" r="5" fill="#ef4444" stroke="#ffffff" stroke-width="1.5" />
      <circle cx="400" cy="10" r="5" fill="#ef4444" stroke="#ffffff" stroke-width="1.5" />
      <!-- Tick Marks -->
      <line x1="0" y1="0" x2="0" y2="20" stroke="#fbbf24" stroke-width="2.5" />
      <line x1="100" y1="4" x2="100" y2="16" stroke="#fbbf24" stroke-width="1.5" />
      <line x1="200" y1="2" x2="200" y2="18" stroke="#fbbf24" stroke-width="2" />
      <line x1="300" y1="4" x2="300" y2="16" stroke="#fbbf24" stroke-width="1.5" />
      <line x1="400" y1="0" x2="400" y2="20" stroke="#fbbf24" stroke-width="2.5" />
      <text x="200" y="-1" fill="#fbbf24" font-family="monospace" font-size="13" font-weight="bold" text-anchor="middle">
        REFERENCE CALIBRATION BAR: 200 mm
      </text>
    </g>

    <!-- CONNECTORS & TERMINAL FIXTURES -->
    <!-- J1: Main ECU 12-pin Connector -->
    <g transform="translate(160, 440)">
      <rect x="-50" y="-40" width="100" height="80" rx="8" fill="url(#connectorGrad)" stroke="#38bdf8" stroke-width="2" />
      <rect x="-40" y="-30" width="80" height="60" rx="4" fill="#0284c7" fill-opacity="0.2" stroke="#0284c7" />
      <!-- Pins -->
      <circle cx="-25" cy="-15" r="4" fill="#fbbf24" />
      <circle cx="0" cy="-15" r="4" fill="#fbbf24" />
      <circle cx="25" cy="-15" r="4" fill="#fbbf24" />
      <circle cx="-25" cy="0" r="4" fill="#fbbf24" />
      <circle cx="0" cy="0" r="4" fill="#fbbf24" />
      <circle cx="25" cy="0" r="4" fill="#fbbf24" />
      <circle cx="-25" cy="15" r="4" fill="#fbbf24" />
      <circle cx="0" cy="15" r="4" fill="#fbbf24" />
      <circle cx="25" cy="15" r="4" fill="#fbbf24" />
      <text x="0" y="58" fill="#38bdf8" font-family="monospace" font-size="12" font-weight="bold" text-anchor="middle">J1 - ECU MAIN (12P)</text>
    </g>

    <!-- J2: Battery / Power Distribution Block -->
    <g transform="translate(160, 780)">
      <rect x="-45" y="-35" width="90" height="70" rx="6" fill="url(#connectorGrad)" stroke="#ef4444" stroke-width="2" />
      <circle cx="-20" cy="0" r="9" fill="#ef4444" stroke="#fee2e2" stroke-width="1.5" />
      <text x="-20" y="4" fill="#ffffff" font-family="sans-serif" font-size="11" font-weight="bold" text-anchor="middle">+</text>
      <circle cx="20" cy="0" r="9" fill="#0f172a" stroke="#94a3b8" stroke-width="1.5" />
      <text x="20" y="4" fill="#ffffff" font-family="sans-serif" font-size="11" font-weight="bold" text-anchor="middle">-</text>
      <text x="0" y="52" fill="#ef4444" font-family="monospace" font-size="12" font-weight="bold" text-anchor="middle">P1 - 12V BATT/GND</text>
    </g>

    <!-- J3: Front Left Sensor Deutsch DT04 -->
    <g transform="translate(1360, 240)">
      <rect x="-35" y="-30" width="70" height="60" rx="6" fill="url(#connectorGrad)" stroke="#10b981" stroke-width="2" />
      <circle cx="-12" cy="0" r="5" fill="#fbbf24" />
      <circle cx="12" cy="0" r="5" fill="#fbbf24" />
      <text x="0" y="48" fill="#10b981" font-family="monospace" font-size="12" font-weight="bold" text-anchor="middle">S1 - CAN/WSS (2P)</text>
    </g>

    <!-- J4: Front Right Actuator Deutsch DT06-4S -->
    <g transform="translate(1360, 680)">
      <rect x="-40" y="-35" width="80" height="70" rx="6" fill="url(#connectorGrad)" stroke="#a855f7" stroke-width="2" />
      <circle cx="-15" cy="-12" r="4.5" fill="#fbbf24" />
      <circle cx="15" cy="-12" r="4.5" fill="#fbbf24" />
      <circle cx="-15" cy="12" r="4.5" fill="#fbbf24" />
      <circle cx="15" cy="12" r="4.5" fill="#fbbf24" />
      <text x="0" y="52" fill="#a855f7" font-family="monospace" font-size="12" font-weight="bold" text-anchor="middle">A1 - ACTUATOR (4P)</text>
    </g>

    <!-- J5: Cabin Gateway J1939 Port -->
    <g transform="translate(860, 880)">
      <rect x="-35" y="-25" width="70" height="50" rx="4" fill="url(#connectorGrad)" stroke="#f59e0b" stroke-width="2" />
      <circle cx="-15" cy="0" r="4" fill="#fbbf24" />
      <circle cx="0" cy="0" r="4" fill="#fbbf24" />
      <circle cx="15" cy="0" r="4" fill="#fbbf24" />
      <text x="0" y="42" fill="#f59e0b" font-family="monospace" font-size="11" font-weight="bold" text-anchor="middle">GW - J1939 BUS</text>
    </g>

    <!-- HARNESS PEGS (Nailboard Guide Pins for cable routing) -->
    <!-- Main trunk pegs -->
    <g fill="url(#pegGrad)" stroke="#0f172a" stroke-width="1.5">
      <circle cx="360" cy="440" r="7" />
      <circle cx="360" cy="580" r="7" />
      <circle cx="560" cy="500" r="7" />
      <circle cx="760" cy="500" r="7" />
      <circle cx="960" cy="500" r="7" />
      <circle cx="1060" cy="380" r="7" />
      <circle cx="1200" cy="240" r="7" />
      <circle cx="1060" cy="620" r="7" />
      <circle cx="1200" cy="680" r="7" />
      <circle cx="860" cy="740" r="7" />
      <circle cx="860" cy="560" r="7" />
    </g>

    <!-- Peg Fork Guides (CAD markings for wire bundle routing) -->
    <g stroke="#64748b" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.6">
      <path d="M 360 440 L 560 500 L 960 500" fill="none" />
      <path d="M 360 780 L 360 580 L 560 500" fill="none" />
      <path d="M 960 500 L 1060 380 L 1200 240 L 1360 240" fill="none" />
      <path d="M 960 500 L 1060 620 L 1200 680 L 1360 680" fill="none" />
      <path d="M 760 500 L 860 740 L 860 880" fill="none" />
    </g>

    <!-- Routing Branch Labels -->
    <text x="660" y="480" fill="#64748b" font-family="monospace" font-size="11">MAIN TRUNK ROUTE (Ø 16mm LOOM)</text>
    <text x="1080" y="340" fill="#64748b" font-family="monospace" font-size="11">BRANCH 1 (WSS SENSOR)</text>
    <text x="1080" y="660" fill="#64748b" font-family="monospace" font-size="11">BRANCH 2 (ACTUATOR)</text>
    <text x="750" y="680" fill="#64748b" font-family="monospace" font-size="11">BRANCH 3 (GW BUS)</text>

  </svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

// 2. Drone Frame Power & Signal Layout with 100mm Scale
function createDroneFrameSvg(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="900" viewBox="0 0 1400 900">
    <rect width="1400" height="900" fill="#090d16" />
    <!-- Carbon fiber weave simulation -->
    <defs>
      <pattern id="carbon" width="16" height="16" patternUnits="userSpaceOnUse">
        <rect width="8" height="8" fill="#131c2e" />
        <rect x="8" width="8" height="8" fill="#1c283f" />
        <rect y="8" width="8" height="8" fill="#1c283f" />
        <rect x="8" y="8" width="8" height="8" fill="#131c2e" />
      </pattern>
    </defs>
    <rect width="1400" height="900" fill="url(#carbon)" opacity="0.4" />

    <!-- Scale Reference: 300px = 100mm (3px = 1mm) -->
    <g transform="translate(80, 70)">
      <rect x="-10" y="-12" width="320" height="42" fill="#1e293b" rx="4" stroke="#38bdf8" stroke-width="1.5" />
      <line x1="0" y1="10" x2="300" y2="10" stroke="#38bdf8" stroke-width="3" />
      <circle cx="0" cy="10" r="5" fill="#38bdf8" />
      <circle cx="300" cy="10" r="5" fill="#38bdf8" />
      <line x1="0" y1="0" x2="0" y2="20" stroke="#38bdf8" stroke-width="2" />
      <line x1="300" y1="0" x2="300" y2="20" stroke="#38bdf8" stroke-width="2" />
      <text x="150" y="-2" fill="#38bdf8" font-family="monospace" font-size="12" font-weight="bold" text-anchor="middle">
        100 mm SCALE RULER
      </text>
    </g>

    <!-- Drone Arms (4 arms X-frame) -->
    <g stroke="#334155" stroke-width="38" stroke-linecap="round" opacity="0.6">
      <line x1="700" y1="450" x2="250" y2="180" />
      <line x1="700" y1="450" x2="1150" y2="180" />
      <line x1="700" y1="450" x2="250" y2="720" />
      <line x1="700" y1="450" x2="1150" y2="720" />
    </g>

    <!-- Center Plate -->
    <rect x="580" y="330" width="240" height="240" rx="30" fill="#1e293b" stroke="#64748b" stroke-width="3" />
    
    <!-- Flight Controller Stack -->
    <rect x="630" y="380" width="140" height="140" rx="10" fill="#0f172a" stroke="#10b981" stroke-width="2" />
    <text x="700" y="445" fill="#10b981" font-family="monospace" font-size="13" font-weight="bold" text-anchor="middle">FC STACK</text>
    <text x="700" y="465" fill="#64748b" font-family="monospace" font-size="10" text-anchor="middle">F722 + 4in1 ESC</text>

    <!-- Motor Mounts -->
    <g fill="#1e293b" stroke="#f59e0b" stroke-width="2">
      <!-- M1 (Front Right) -->
      <circle cx="1150" cy="180" r="45" />
      <text x="1150" y="185" fill="#f59e0b" font-family="monospace" font-size="12" font-weight="bold" text-anchor="middle">MOTOR 1</text>

      <!-- M2 (Front Left) -->
      <circle cx="250" cy="180" r="45" />
      <text x="250" y="185" fill="#f59e0b" font-family="monospace" font-size="12" font-weight="bold" text-anchor="middle">MOTOR 2</text>

      <!-- M3 (Rear Left) -->
      <circle cx="250" cy="720" r="45" />
      <text x="250" y="725" fill="#f59e0b" font-family="monospace" font-size="12" font-weight="bold" text-anchor="middle">MOTOR 3</text>

      <!-- M4 (Rear Right) -->
      <circle cx="1150" cy="720" r="45" />
      <text x="1150" y="725" fill="#f59e0b" font-family="monospace" font-size="12" font-weight="bold" text-anchor="middle">MOTOR 4</text>
    </g>

    <!-- XT60 Power Lead Pad -->
    <rect x="660" y="620" width="80" height="40" rx="6" fill="#ef4444" stroke="#ffffff" stroke-width="1.5" />
    <text x="700" y="645" fill="#ffffff" font-family="monospace" font-size="11" font-weight="bold" text-anchor="middle">XT60 LiPo</text>
    <line x1="700" y1="570" x2="700" y2="620" stroke="#ef4444" stroke-width="4" stroke-dasharray="4 2" />

    <!-- FPV Camera Mount (Front) -->
    <rect x="665" y="220" width="70" height="50" rx="4" fill="#334155" stroke="#38bdf8" stroke-width="2" />
    <circle cx="700" cy="245" r="14" fill="#0284c7" />
    <text x="700" y="290" fill="#38bdf8" font-family="monospace" font-size="11" font-weight="bold" text-anchor="middle">FPV CAM</text>
  </svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

// 3. Electrical Control Panel / Enclosure CAD Blueprint
function createIndustrialCabinetSvg(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200">
    <rect width="1200" height="1200" fill="#0b1329" />
    <!-- Grid -->
    <defs>
      <pattern id="panelGrid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#192a56" stroke-width="1" />
      </pattern>
    </defs>
    <rect width="1200" height="1200" fill="url(#panelGrid)" />

    <!-- Cabinet Enclosure Border -->
    <rect x="60" y="60" width="1080" height="1080" fill="none" stroke="#487eb0" stroke-width="4" rx="8" />

    <!-- Calibration Reference Bar (Exactly 300 mm = 300 px) -->
    <g transform="translate(100, 100)">
      <rect x="-10" y="-12" width="320" height="44" fill="#1e272e" rx="4" stroke="#e056fd" stroke-width="2" />
      <line x1="0" y1="10" x2="300" y2="10" stroke="#e056fd" stroke-width="3" />
      <circle cx="0" cy="10" r="5" fill="#e056fd" />
      <circle cx="300" cy="10" r="5" fill="#e056fd" />
      <line x1="0" y1="0" x2="0" y2="20" stroke="#e056fd" stroke-width="2" />
      <line x1="300" y1="0" x2="300" y2="20" stroke="#e056fd" stroke-width="2" />
      <text x="150" y="-1" fill="#e056fd" font-family="monospace" font-size="12" font-weight="bold" text-anchor="middle">
        CABINET DIN GAUGE: 300 mm
      </text>
    </g>

    <!-- Top DIN Rail -->
    <rect x="120" y="240" width="960" height="40" fill="#353b48" stroke="#718093" stroke-width="2" />
    <!-- 24V PSU -->
    <rect x="180" y="190" width="160" height="140" fill="#2f3640" stroke="#4cd137" stroke-width="2" rx="4" />
    <text x="260" y="260" fill="#4cd137" font-family="monospace" font-size="13" font-weight="bold" text-anchor="middle">PSU 24V 10A</text>

    <!-- PLC Module -->
    <rect x="400" y="180" width="280" height="160" fill="#2f3640" stroke="#00a8ff" stroke-width="2" rx="4" />
    <text x="540" y="255" fill="#00a8ff" font-family="monospace" font-size="14" font-weight="bold" text-anchor="middle">PLC CONTROLLER</text>
    <text x="540" y="280" fill="#718093" font-family="monospace" font-size="11" text-anchor="middle">DI/DO + AI/AO</text>

    <!-- Relay Modules -->
    <rect x="740" y="200" width="220" height="120" fill="#2f3640" stroke="#fbc531" stroke-width="2" rx="4" />
    <text x="850" y="265" fill="#fbc531" font-family="monospace" font-size="13" font-weight="bold" text-anchor="middle">RELAY BANK (8CH)</text>

    <!-- Wire Duct (Slotted Cable Trunking) Top & Vertical & Bottom -->
    <rect x="120" y="380" width="960" height="60" fill="#1e272e" stroke="#718093" stroke-dasharray="8 4" stroke-width="1.5" />
    <text x="600" y="415" fill="#718093" font-family="monospace" font-size="11" text-anchor="middle">PANDUIT CABLE DUCT (HORIZONTAL)</text>

    <!-- Bottom DIN Rail with Terminal Blocks -->
    <rect x="120" y="800" width="960" height="40" fill="#353b48" stroke="#718093" stroke-width="2" />
    <rect x="200" y="770" width="500" height="100" fill="#2f3640" stroke="#e1b12c" stroke-width="2" rx="4" />
    <text x="450" y="825" fill="#e1b12c" font-family="monospace" font-size="13" font-weight="bold" text-anchor="middle">TB1 FIELD TERMINAL STRIP (1-40)</text>

    <!-- Field Cable Entry Glands (Bottom) -->
    <g fill="#718093" stroke="#2f3640" stroke-width="2">
      <circle cx="300" cy="1080" r="24" />
      <circle cx="450" cy="1080" r="24" />
      <circle cx="600" cy="1080" r="24" />
      <circle cx="750" cy="1080" r="24" />
      <circle cx="900" cy="1080" r="24" />
    </g>
    <text x="600" y="1125" fill="#718093" font-family="monospace" font-size="12" text-anchor="middle">CABLE GLAND ENTRY POINTS (M20 / M25)</text>
  </svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

export const SAMPLE_PROJECTS: SampleImage[] = [
  {
    id: 'formboard-a1',
    name: 'Automotive Formboard (Nailboard CAD)',
    description: '1600x1000 formboard with guide pegs, ECU connector, and a 200 mm reference bar.',
    dataUrl: createFormboardSvg(),
    width: 1600,
    height: 1000,
    defaultRef: {
      p1: { x: 100, y: 110 },
      p2: { x: 500, y: 110 },
      realDistance: 200,
      unit: 'mm',
    },
  },
  {
    id: 'drone-frame',
    name: 'Quadcopter Drone Wiring Frame',
    description: '1400x900 carbon frame with 4 ESC motor mounts and 100 mm scale ruler.',
    dataUrl: createDroneFrameSvg(),
    width: 1400,
    height: 900,
    defaultRef: {
      p1: { x: 80, y: 80 },
      p2: { x: 380, y: 80 },
      realDistance: 100,
      unit: 'mm',
    },
  },
  {
    id: 'industrial-panel',
    name: 'Industrial Control Panel Enclosure',
    description: '1200x1200 DIN-rail cabinet with PLC, 24V PSU, and 300 mm reference gauge.',
    dataUrl: createIndustrialCabinetSvg(),
    width: 1200,
    height: 1200,
    defaultRef: {
      p1: { x: 100, y: 110 },
      p2: { x: 400, y: 110 },
      realDistance: 300,
      unit: 'mm',
    },
  },
];

