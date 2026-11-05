import { HarnessProject, Wire, ReferenceLine } from '../types/harness';
import { polylineLength, pixelsToReal, formatMeasurement } from './geometry';

/**
 * Generate CSV Cut Sheet for production
 */
export function generateCutSheetCsv(project: HarnessProject): string {
  const ref = project.referenceLine;
  const headers = [
    'Wire ID',
    'Signal / Function',
    'Gauge',
    'Color',
    'From Connector',
    'From Pin',
    'To Connector',
    'To Pin',
    `Measured Length (${ref.unit})`,
    `Slack Allowance (${ref.unit})`,
    'Slack %',
    `Total Cut Length (${ref.unit})`,
    'Sleeving / Conduit',
    'Bundle Group',
    'Notes',
  ];

  const rows = project.wires.map((wire) => {
    const rawPx = polylineLength(wire.points);
    const measured = pixelsToReal(rawPx, ref);
    const slackFixed = wire.slackAllowance || 0;
    const slackPct = wire.slackPercent || 0;
    const cutLength = (measured + slackFixed) * (1 + slackPct / 100);

    const fromConn = project.connectors.find((c) => c.id === wire.fromConnectorId)?.name || wire.fromConnectorId || '-';
    const toConn = project.connectors.find((c) => c.id === wire.toConnectorId)?.name || wire.toConnectorId || '-';

    return [
      `"${wire.id}"`,
      `"${wire.name}"`,
      `"${wire.gauge}"`,
      `"${wire.color.name}"`,
      `"${fromConn}"`,
      `"${wire.fromPin || '-'}"`,
      `"${toConn}"`,
      `"${wire.toPin || '-'}"`,
      measured.toFixed(1),
      slackFixed.toFixed(1),
      `${slackPct}%`,
      cutLength.toFixed(1),
      `"${wire.sleeving || 'None'}"`,
      `"${wire.bundleGroup || '-'}"`,
      `"${(wire.notes || '').replace(/"/g, '""')}"`,
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}

/**
 * Trigger browser file download
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Compute Spool Summary (total length needed per gauge & color)
 */
export interface SpoolSummaryItem {
  gauge: string;
  colorName: string;
  primaryColor: string;
  stripeColor?: string;
  wireCount: number;
  totalMeasured: number;
  totalCutLength: number;
  unit: string;
}

export function computeSpoolSummary(wires: Wire[], ref: ReferenceLine): SpoolSummaryItem[] {
  const map = new Map<string, SpoolSummaryItem>();

  for (const wire of wires) {
    const rawPx = polylineLength(wire.points);
    const measured = pixelsToReal(rawPx, ref);
    const slackFixed = wire.slackAllowance || 0;
    const slackPct = wire.slackPercent || 0;
    const cutLength = (measured + slackFixed) * (1 + slackPct / 100);

    const key = `${wire.gauge}__${wire.color.name}`;
    if (!map.has(key)) {
      map.set(key, {
        gauge: wire.gauge,
        colorName: wire.color.name,
        primaryColor: wire.color.primary,
        stripeColor: wire.color.stripe,
        wireCount: 0,
        totalMeasured: 0,
        totalCutLength: 0,
        unit: ref.unit,
      });
    }

    const item = map.get(key)!;
    item.wireCount += 1;
    item.totalMeasured += measured;
    item.totalCutLength += cutLength;
  }

  return Array.from(map.values()).sort((a, b) => a.gauge.localeCompare(b.gauge));
}

/**
 * Export SVG canvas overlay with photo as high-res PNG
 */
export async function exportPlanAsImage(
  svgElement: SVGSVGElement,
  bgImgSrc: string | null,
  width: number,
  height: number,
  projectName: string,
  ref: ReferenceLine
): Promise<void> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Background dark fill
  ctx.fillStyle = '#0b1120';
  ctx.fillRect(0, 0, width, height);

  // If there is a background photo, draw it
  if (bgImgSrc) {
    await new Promise<void>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
        resolve();
      };
      img.onerror = () => resolve();
      img.src = bgImgSrc;
    });
  }

  // Serialize SVG and draw over background
  const serializer = new XMLSerializer();
  let svgString = serializer.serializeToString(svgElement);

  // Ensure xmlns
  if (!svgString.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
    svgString = svgString.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  await new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve();
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve();
    };
    img.src = url;
  });

  // Stamp title watermark at bottom right
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1.5;
  const stampW = 340;
  const stampH = 75;
  const stampX = width - stampW - 20;
  const stampY = height - stampH - 20;
  ctx.fillRect(stampX, stampY, stampW, stampH);
  ctx.strokeRect(stampX, stampY, stampW, stampH);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 14px monospace';
  ctx.fillText(projectName || 'CABLE HARNESS PLAN', stampX + 15, stampY + 24);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px monospace';
  const scaleText = ref.calibrated
    ? `CALIBRATED SCALE: ${ref.realDistance} ${ref.unit}`
    : 'UNITS: UNCALIBRATED (PIXELS)';
  ctx.fillText(scaleText, stampX + 15, stampY + 44);
  ctx.fillText(`GENERATED: ${new Date().toLocaleDateString()}`, stampX + 15, stampY + 62);

  // Trigger download
  const dataUrl = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `${projectName.toLowerCase().replace(/\s+/g, '_')}_plan.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

