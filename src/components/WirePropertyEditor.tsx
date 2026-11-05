import React from 'react';
import { Wire, Connector, ReferenceLine, WireGauge } from '../types/harness';
import { STANDARD_WIRE_COLORS, STANDARD_GAUGES } from '../utils/wirePresets';
import { polylineLength, pixelsToReal, formatMeasurement } from '../utils/geometry';
import { Trash2, Copy, Tag, Zap, Shield, Link, Layers, X, Sparkles } from 'lucide-react';

interface WirePropertyEditorProps {
  wire: Wire | null;
  connectors: Connector[];
  refLine: ReferenceLine;
  onUpdate: (updatedWire: Wire) => void;
  onDelete: (wireId: string) => void;
  onDuplicate: (wireId: string) => void;
  onClose: () => void;
}

export const WirePropertyEditor: React.FC<WirePropertyEditorProps> = ({
  wire,
  connectors,
  refLine,
  onUpdate,
  onDelete,
  onDuplicate,
  onClose,
}) => {
  if (!wire) return null;

  const rawPx = polylineLength(wire.points);
  const measured = pixelsToReal(rawPx, refLine);
  const slackFixed = wire.slackAllowance || 0;
  const slackPct = wire.slackPercent || 0;
  const totalCut = (measured + slackFixed) * (1 + slackPct / 100);

  const handleFieldChange = <K extends keyof Wire>(key: K, value: Wire[K]) => {
    onUpdate({
      ...wire,
      [key]: value,
    });
  };

  return (
    <aside className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col h-full shadow-2xl overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 sticky top-0 z-10 backdrop-blur-sm">
        <div className="flex items-center space-x-2">
          <div
            className="w-4 h-4 rounded-full border border-white/40 shadow-sm"
            style={{
              background: wire.color.stripe
                ? `repeating-linear-gradient(45deg, ${wire.color.primary}, ${wire.color.primary} 6px, ${wire.color.stripe} 6px, ${wire.color.stripe} 12px)`
                : wire.color.primary,
            }}
          />
          <h2 className="font-semibold text-slate-100 text-sm">Cable Inspector</h2>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onDuplicate(wire.id)}
            title="Duplicate Wire"
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(wire.id)}
            title="Delete Wire"
            className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Length Summary Badge */}
      <div className="p-4 bg-slate-950/70 border-b border-slate-800/80 m-3 rounded-xl border">
        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
          Total Cut Length
        </span>
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-bold font-mono text-emerald-400">
            {formatMeasurement(totalCut, refLine.unit)}
          </span>
          {refLine.calibrated && (
            <span className="text-xs text-slate-400">
              ({totalCut.toFixed(1)} {refLine.unit})
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800/60 text-xs">
          <div>
            <span className="text-slate-500 block text-[10px]">Path Measured</span>
            <span className="font-mono text-slate-300">{formatMeasurement(measured, refLine.unit)}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">Added Slack</span>
            <span className="font-mono text-amber-300">
              +{formatMeasurement(slackFixed, refLine.unit)}{slackPct > 0 ? ` (${slackPct}%)` : ''}
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 text-xs flex-1">
        {/* Name / Signal Label */}
        <div className="space-y-1">
          <label className="font-medium text-slate-300 flex items-center space-x-1.5">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            <span>Wire Name / Signal</span>
          </label>
          <input
            type="text"
            value={wire.name}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono focus:outline-none focus:border-sky-400"
          />
        </div>

        {/* Color Palette Selection */}
        <div className="space-y-1.5">
          <label className="font-medium text-slate-300 block">Wire Color Code</label>
          <div className="grid grid-cols-5 gap-1.5 max-h-36 overflow-y-auto p-1 bg-slate-950/60 rounded-lg border border-slate-800">
            {STANDARD_WIRE_COLORS.map((col, idx) => (
              <button
                key={idx}
                type="button"
                title={col.name}
                onClick={() => handleFieldChange('color', col)}
                className={`h-7 rounded-md border flex items-center justify-center transition relative overflow-hidden ${
                  wire.color.name === col.name
                    ? 'border-sky-400 ring-2 ring-sky-400/30'
                    : 'border-slate-700 hover:border-slate-500'
                }`}
                style={{
                  background: col.stripe
                    ? `repeating-linear-gradient(45deg, ${col.primary}, ${col.primary} 4px, ${col.stripe} 4px, ${col.stripe} 8px)`
                    : col.primary,
                }}
              />
            ))}
          </div>
          <span className="text-[11px] text-slate-400 block truncate">
            Selected: <span className="text-slate-200 font-medium">{wire.color.name}</span>
          </span>
        </div>

        {/* Gauge & Wire Type */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="font-medium text-slate-300 flex items-center space-x-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Gauge (AWG)</span>
            </label>
            <select
              value={wire.gauge}
              onChange={(e) => handleFieldChange('gauge', e.target.value as WireGauge)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 text-xs focus:outline-none focus:border-sky-400"
            >
              {STANDARD_GAUGES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-medium text-slate-300 flex items-center space-x-1">
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              <span>Sleeving</span>
            </label>
            <select
              value={wire.sleeving || 'None'}
              onChange={(e) => handleFieldChange('sleeving', e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 text-xs focus:outline-none focus:border-sky-400"
            >
              <option value="None">None (Bare Wire)</option>
              <option value="Heatshrink">Heatshrink</option>
              <option value="Split Loom">Split Loom (Corrugated)</option>
              <option value="Braided Mesh">Braided Mesh</option>
              <option value="Spiral Wrap">Spiral Wrap</option>
            </select>
          </div>
        </div>

        {/* Routing Style (Straight vs Fillet Curved) */}
        <div className="space-y-1">
          <label className="font-medium text-slate-300 flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Path Routing Style</span>
          </label>
          <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => handleFieldChange('routingStyle', 'straight')}
              className={`py-1 rounded text-xs transition ${
                wire.routingStyle !== 'rounded'
                  ? 'bg-slate-800 text-sky-400 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Straight CAD
            </button>
            <button
              type="button"
              onClick={() => handleFieldChange('routingStyle', 'rounded')}
              className={`py-1 rounded text-xs transition ${
                wire.routingStyle === 'rounded'
                  ? 'bg-slate-800 text-sky-400 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Formboard Bends
            </button>
          </div>
        </div>

        {/* Slack & Allowance */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <span className="font-medium text-slate-300 block">Manufacturing Slack / Stripping</span>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[11px] text-slate-400 block mb-0.5">Fixed ({refLine.unit})</span>
              <input
                type="number"
                step="any"
                min="0"
                value={wire.slackAllowance ?? 0}
                onChange={(e) => handleFieldChange('slackAllowance', parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-100 font-mono text-xs focus:outline-none focus:border-sky-400"
              />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block mb-0.5">Service Loop %</span>
              <input
                type="number"
                step="1"
                min="0"
                max="100"
                value={wire.slackPercent ?? 0}
                onChange={(e) => handleFieldChange('slackPercent', parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-100 font-mono text-xs focus:outline-none focus:border-sky-400"
              />
            </div>
          </div>
        </div>

        {/* Connector Pinout Assignments */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <span className="font-medium text-slate-300 flex items-center space-x-1.5">
            <Link className="w-3.5 h-3.5 text-slate-400" />
            <span>Termination Endpoints</span>
          </span>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <span className="text-[11px] text-slate-400 block">From Connector</span>
              <select
                value={wire.fromConnectorId || ''}
                onChange={(e) => handleFieldChange('fromConnectorId', e.target.value || undefined)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-slate-100 text-xs focus:outline-none focus:border-sky-400 truncate"
              >
                <option value="">(None / Loose)</option>
                {connectors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Pin (e.g. 1)"
                value={wire.fromPin || ''}
                onChange={(e) => handleFieldChange('fromPin', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-slate-100 text-xs focus:outline-none focus:border-sky-400"
              />
            </div>

            <div className="space-y-1">
              <span className="text-[11px] text-slate-400 block">To Connector</span>
              <select
                value={wire.toConnectorId || ''}
                onChange={(e) => handleFieldChange('toConnectorId', e.target.value || undefined)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-slate-100 text-xs focus:outline-none focus:border-sky-400 truncate"
              >
                <option value="">(None / Loose)</option>
                {connectors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Pin (e.g. 2)"
                value={wire.toPin || ''}
                onChange={(e) => handleFieldChange('toPin', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-slate-100 text-xs focus:outline-none focus:border-sky-400"
              />
            </div>
          </div>
        </div>

        {/* Bundle Group & Notes */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <div className="space-y-1">
            <label className="font-medium text-slate-300 flex items-center space-x-1">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>Harness Bundle Group</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Main Trunk, Front Branch"
              value={wire.bundleGroup || ''}
              onChange={(e) => handleFieldChange('bundleGroup', e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-100 text-xs focus:outline-none focus:border-sky-400"
            />
          </div>

          <div className="space-y-1">
            <label className="font-medium text-slate-300 block">Notes & Specifications</label>
            <textarea
              rows={2}
              placeholder="e.g. Gold-plated terminal, twisted with W02..."
              value={wire.notes || ''}
              onChange={(e) => handleFieldChange('notes', e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-100 text-xs focus:outline-none focus:border-sky-400"
            />
          </div>
        </div>
      </div>
    </aside>
  );
};

