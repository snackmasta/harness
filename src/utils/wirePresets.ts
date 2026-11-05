import { WireColor, WireGauge } from '../types/harness';

export const STANDARD_WIRE_COLORS: WireColor[] = [
  { name: 'Red (+12V/VCC)', primary: '#ef4444' },
  { name: 'Black (GND/0V)', primary: '#1e293b' },
  { name: 'White (Signal/CAN-H)', primary: '#f8fafc' },
  { name: 'Blue (CAN-L/Bus)', primary: '#3b82f6' },
  { name: 'Green (Sensors)', primary: '#22c55e' },
  { name: 'Yellow (Power/Aux)', primary: '#eab308' },
  { name: 'Orange (Serial/Data)', primary: '#f97316' },
  { name: 'Brown (Ground/Ref)', primary: '#854d0e' },
  { name: 'Violet (Ignition/PWM)', primary: '#a855f7' },
  { name: 'Gray (Shield/Drain)', primary: '#64748b' },
  { name: 'Pink (Special)', primary: '#ec4899' },
  { name: 'Green / Yellow Stripe (Earth/PE)', primary: '#22c55e', stripe: '#eab308' },
  { name: 'White / Blue Stripe (CAN Low)', primary: '#f8fafc', stripe: '#3b82f6' },
  { name: 'Red / Black Stripe (Switched Power)', primary: '#ef4444', stripe: '#1e293b' },
  { name: 'Black / White Stripe (Ground Return)', primary: '#1e293b', stripe: '#f8fafc' },
];

export const STANDARD_GAUGES: WireGauge[] = [
  '12 AWG',
  '14 AWG',
  '16 AWG',
  '18 AWG',
  '20 AWG',
  '22 AWG',
  '24 AWG',
  '26 AWG',
  '28 AWG',
  '0.5 mm²',
  '0.75 mm²',
  '1.0 mm²',
  '1.5 mm²',
  '2.5 mm²',
  'Coaxial',
  'Custom',
];

export function getStrokeWidthForGauge(gauge: WireGauge): number {
  switch (gauge) {
    case '12 AWG':
    case '2.5 mm²':
      return 6;
    case '14 AWG':
    case '1.5 mm²':
      return 5;
    case '16 AWG':
    case '1.0 mm²':
      return 4.2;
    case '18 AWG':
    case '0.75 mm²':
      return 3.6;
    case '20 AWG':
    case '0.5 mm²':
      return 3.0;
    case '22 AWG':
      return 2.4;
    case '24 AWG':
      return 2.0;
    case '26 AWG':
    case '28 AWG':
      return 1.6;
    case 'Coaxial':
      return 4.5;
    default:
      return 3;
  }
}

