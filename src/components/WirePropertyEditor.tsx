import React from 'react';
import type { Wire, Connector, ReferenceLine, WireGauge, LayerFolder } from '../types/harness';
import { STANDARD_WIRE_COLORS, STANDARD_GAUGES } from '../utils/wirePresets';
import { polylineLength, pixelsToReal, formatMeasurement } from '../utils/geometry';
import { Trash2, Copy, Tag, Zap, Shield, Link, Layers, X, Sparkles, Folder, Plus } from 'lucide-react';

interface WirePropertyEditorProps {
  wire: Wire | null;
  connectors: Connector[];
  folders?: LayerFolder[];
  refLine: ReferenceLine;
  onUpdate: (updatedWire: Wire) => void;
  onDelete: (wireId: string) => void;
  onDuplicate: (wireId: string) => void;
  onClose: () => void;
  onAddFolder?: (name?: string) => void;
  onDeleteFolder?: (folderId: string, deleteChildren?: boolean) => void;
}

export const WirePropertyEditor: React.FC<WirePropertyEditorProps> = ({
  wire,
  connectors,
  folders,
  refLine,
  onUpdate,
  onDelete,
  onDuplicate,
  onClose,
  onAddFolder,
  onDeleteFolder,
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
    <aside className="w-72 sm:w-80 bg-slate-900 border-l border-slate-800 flex flex-col h-full shadow-2xl overflow-y-auto shrink-0 z-20 animate-in slide-in-from-right-4 duration-150">
      {/* Header */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 sticky top-0 z-10 backdrop-blur-sm">
        <div className="flex items-center space-x-2 min-w-0">
          <div
            className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-sm shrink-0"
            style={{
              background: wire.color.stripe
                ? `repeating-linear-gradient(45deg, ${wire.color.primary}, ${wire.color.primary} 4px, ${wire.color.stripe} 4px, ${wire.color.stripe} 8px)`
                : wire.color.primary,
            }}
          />
          <h2 className="font-semibold text-slate-100 text-xs truncate">
            {wire.id} Inspector
          </h2>
        </div>
        <div className="flex items-center space-x-0.5 shrink-0">
          <button
            onClick={() => onDuplicate(wire.id)}
            title="Duplicate Wire"
            className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(wire.id)}
            title="Delete Wire"
            className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            title="Close Inspector"
            className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Length Summary Card */}
      <div className="p-3 bg-slate-950/70 border border-slate-800/80 m-2.5 rounded-xl">
        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-0.5">
          Total Cut Length
        </span>
        <div className="flex items-baseline space-x-1.5">
          <span className="text-xl font-bold font-mono text-emerald-400">
            {formatMeasurement(totalCut, refLine.unit)}
          </span>
          {refLine.calibrated && (
            <span className="text-[11px] text-slate-400">
              ({totalCut.toFixed(1)} {refLine.unit})
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800/60 text-xs">
          <div>
            <span className="text-slate-500 block text-[10px]">Route Path</span>
            <span className="font-mono text-slate-300 text-[11px]">{formatMeasurement(measured, refLine.unit)}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">Added Slack</span>
            <span className="font-mono text-amber-300 text-[11px]">
              +{formatMeasurement(slackFixed, refLine.unit)}{slackPct > 0 ? ` (${slackPct}%)` : ''}
            </span>
          </div>
        </div>
      </div>

      <div className="p-3 space-y-3.5 text-xs flex-1">
        {/* Name / Signal Label */}
        <div className="space-y-1">
          <label className="font-medium text-slate-300 flex items-center space-x-1.5 text-[11px]">
            <Tag className="w-3 h-3 text-slate-400" />
            <span>Wire ID / Signal Name</span>
          </label>
          <input
            type="text"
            value={wire.name}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-sky-400"
          />
        </div>

        {/* Color Palette Selection */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label className="font-medium text-slate-300 text-[11px]">Color Code</label>
            <span className="text-[10px] text-slate-400 truncate max-w-[140px] text-right">
              {wire.color.name}
            </span>
          </div>
          <div className="grid grid-cols-5 gap-1 max-h-28 overflow-y-auto p-1 bg-slate-950/60 rounded-lg border border-slate-800">
            {STANDARD_WIRE_COLORS.map((col, idx) => (
              <button
                key={idx}
                type="button"
                title={col.name}
                onClick={() => handleFieldChange('color', col)}
                className={`h-6 rounded border flex items-center justify-center transition relative overflow-hidden ${
                  wire.color.name === col.name
                    ? 'border-sky-400 ring-2 ring-sky-400/30'
                    : 'border-slate-700 hover:border-slate-500'
                }`}
                style={{
                  background: col.stripe
                    ? `repeating-linear-gradient(45deg, ${col.primary}, ${col.primary} 3px, ${col.stripe} 3px, ${col.stripe} 6px)`
                    : col.primary,
                }}
              />
            ))}
          </div>
        </div>

        {/* Gauge & Sleeving */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="font-medium text-slate-300 flex items-center space-x-1 text-[11px]">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Gauge (AWG)</span>
            </label>
            <select
              value={wire.gauge}
              onChange={(e) => handleFieldChange('gauge', e.target.value as WireGauge)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-100 text-xs focus:outline-none focus:border-sky-400"
            >
              {STANDARD_GAUGES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-medium text-slate-300 flex items-center space-x-1 text-[11px]">
              <Shield className="w-3 h-3 text-indigo-400" />
              <span>Sleeving</span>
            </label>
            <select
              value={wire.sleeving || 'None'}
              onChange={(e) => handleFieldChange('sleeving', e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-100 text-xs focus:outline-none focus:border-sky-400 truncate"
            >
              <option value="None">None</option>
              <option value="Heatshrink">Heatshrink</option>
              <option value="Split Loom">Split Loom</option>
              <option value="Braided Mesh">Braided</option>
              <option value="Spiral Wrap">Spiral</option>
            </select>
          </div>
        </div>

        {/* Routing Style (Straight vs Fillet Curved) */}
        <div className="space-y-1">
          <label className="font-medium text-slate-300 flex items-center space-x-1 text-[11px]">
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span>Path Routing Style</span>
          </label>
          <div className="grid grid-cols-2 gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
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

        {/* Manufacturing Slack & Stripping */}
        <div className="space-y-1.5 pt-1.5 border-t border-slate-800">
          <span className="font-medium text-slate-300 block text-[11px]">
            Manufacturing Slack &amp; Allowance
          </span>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-slate-400 block mb-0.5">Fixed ({refLine.unit})</span>
              <input
                type="number"
                step="any"
                min="0"
                value={wire.slackAllowance ?? 0}
                onChange={(e) => handleFieldChange('slackAllowance', parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-slate-100 font-mono text-xs focus:outline-none focus:border-sky-400"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block mb-0.5">Loop Extra %</span>
              <input
                type="number"
                step="1"
                min="0"
                max="100"
                value={wire.slackPercent ?? 0}
                onChange={(e) => handleFieldChange('slackPercent', parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-slate-100 font-mono text-xs focus:outline-none focus:border-sky-400"
              />
            </div>
          </div>
        </div>

        {/* Connector Pinout Assignments */}
        <div className="space-y-1.5 pt-1.5 border-t border-slate-800">
          <span className="font-medium text-slate-300 flex items-center space-x-1 text-[11px]">
            <Link className="w-3 h-3 text-slate-400" />
            <span>Termination Endpoints</span>
          </span>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 block">From Connector</span>
              <select
                value={wire.fromConnectorId || ''}
                onChange={(e) => handleFieldChange('fromConnectorId', e.target.value || undefined)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-1.5 py-1 text-slate-100 text-xs focus:outline-none focus:border-sky-400 truncate"
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
                placeholder="Pin #"
                value={wire.fromPin || ''}
                onChange={(e) => handleFieldChange('fromPin', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-slate-100 text-xs focus:outline-none focus:border-sky-400"
              />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 block">To Connector</span>
              <select
                value={wire.toConnectorId || ''}
                onChange={(e) => handleFieldChange('toConnectorId', e.target.value || undefined)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-1.5 py-1 text-slate-100 text-xs focus:outline-none focus:border-sky-400 truncate"
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
                placeholder="Pin #"
                value={wire.toPin || ''}
                onChange={(e) => handleFieldChange('toPin', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-slate-100 text-xs focus:outline-none focus:border-sky-400"
              />
            </div>
          </div>
        </div>

        {/* Harness Folder / Bundle Group & Notes */}
        <div className="space-y-2 pt-1.5 border-t border-slate-800 pb-2">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="font-medium text-slate-300 flex items-center space-x-1 text-[11px]">
                <Folder className="w-3 h-3 text-sky-400" />
                <span>Layer Folder Group</span>
              </label>
              {onAddFolder && (
                <button
                  type="button"
                  onClick={() => onAddFolder()}
                  className="text-[10px] text-sky-400 hover:text-sky-300 flex items-center space-x-0.5"
                >
                  <Plus className="w-3 h-3" />
                  <span>New Folder</span>
                </button>
              )}
              <div className="flex items-center space-x-2">
                {wire.folderId && onDeleteFolder && (
                  <button
                    type="button"
                    onClick={() => {
                      const fId = wire.folderId;
                      if (!fId) return;
                      const f = folders?.find((item) => item.id === fId);
                      if (window.confirm(`Delete folder "${f?.name || ''}" and ungroup wires?`)) {
                        onDeleteFolder(fId, false);
                      }
                    }}
                    className="text-[10px] text-red-400 hover:text-red-300 flex items-center space-x-0.5"
                    title="Delete current folder group"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                )}
                {onAddFolder && (
                  <button
                    type="button"
                    onClick={() => onAddFolder()}
                    className="text-[10px] text-sky-400 hover:text-sky-300 flex items-center space-x-0.5"
                  >
                    <Plus className="w-3 h-3" />
                    <span>New Folder</span>
                  </button>
                )}
              </div>
            </div>

            <select
              value={wire.folderId || ''}
              onChange={(e) => {
                const fId = e.target.value || undefined;
                const fName = folders?.find((f) => f.id === fId)?.name;
                onUpdate({
                  ...wire,
                  folderId: fId,
                  bundleGroup: fName || wire.bundleGroup,
                });
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-slate-100 text-xs focus:outline-none focus:border-sky-400"
            >
              <option value="">(Ungrouped / Root)</option>
              {folders?.map((f) => (
                <option key={f.id} value={f.id}>
                  📁 {f.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-medium text-slate-300 flex items-center space-x-1 text-[11px]">
              <Layers className="w-3 h-3 text-slate-400" />
              <span>Bundle Tag Label</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Main Trunk"
              value={wire.bundleGroup || ''}
              onChange={(e) => handleFieldChange('bundleGroup', e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-slate-100 text-xs focus:outline-none focus:border-sky-400"
            />
          </div>

          <div className="space-y-1">
            <label className="font-medium text-slate-300 block text-[11px]">Notes</label>
            <textarea
              rows={2}
              placeholder="Notes..."
              value={wire.notes || ''}
              onChange={(e) => handleFieldChange('notes', e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-slate-100 text-xs focus:outline-none focus:border-sky-400"
            />
          </div>
        </div>
      </div>
    </aside>
  );
};
