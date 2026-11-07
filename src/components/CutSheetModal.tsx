import React, { useState } from 'react';
import { HarnessProject } from '../types/harness';
import { generateCutSheetCsv, downloadFile, computeSpoolSummary } from '../utils/export';
import { polylineLength, pixelsToReal, formatMeasurement } from '../utils/geometry';
import { X, Download, Copy, Printer, Search, FileSpreadsheet, Check } from 'lucide-react';

interface CutSheetModalProps {
  isOpen: boolean;
  project: HarnessProject;
  onClose: () => void;
}

export const CutSheetModal: React.FC<CutSheetModalProps> = ({
  isOpen,
  project,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'cutsheet' | 'spools'>('cutsheet');

  if (!isOpen) return null;

  const ref = project.referenceLine;
  const spoolSummary = computeSpoolSummary(project.wires, ref);

  const filteredWires = project.wires.filter(
    (w) =>
      w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.gauge.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.color.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalAllLength = project.wires.reduce((acc, w) => {
    const rawPx = polylineLength(w.points);
    const measured = pixelsToReal(rawPx, ref);
    const slack = (w.slackAllowance || 0);
    const pct = (w.slackPercent || 0);
    return acc + (measured + slack) * (1 + pct / 100);
  }, 0);

  const handleExportCsv = () => {
    const csv = generateCutSheetCsv(project);
    downloadFile(csv, `${project.name.toLowerCase().replace(/\s+/g, '_')}_cutsheet.csv`, 'text/csv');
  };

  const handleCopyTsv = () => {
    const headers = ['Wire ID', 'Signal', 'Gauge', 'Color', 'From', 'To', `Measured (${ref.unit})`, `Cut Length (${ref.unit})`, 'Sleeve'];
    const rows = project.wires.map((w) => {
      const rawPx = polylineLength(w.points);
      const measured = pixelsToReal(rawPx, ref);
      const cut = (measured + (w.slackAllowance || 0)) * (1 + (w.slackPercent || 0) / 100);
      const fromConn = project.connectors.find((c) => c.id === w.fromConnectorId)?.name || '-';
      const toConn = project.connectors.find((c) => c.id === w.toConnectorId)?.name || '-';
      return [w.id, w.name, w.gauge, w.color.name, `${fromConn}:${w.fromPin || '-'}`, `${toConn}:${w.toPin || '-'}`, measured.toFixed(1), cut.toFixed(1), w.sleeving || 'None'].join('\t');
    });
    navigator.clipboard.writeText([headers.join('\t'), ...rows].join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-sky-500/10 text-sky-400 rounded-lg">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Harness Cut Sheet &amp; BOM</h2>
              <p className="text-xs text-slate-400">
                {project.name} &bull; {project.wires.length} wires planned &bull; Total length:{' '}
                <span className="text-emerald-400 font-medium">
                  {formatMeasurement(totalAllLength, ref.unit)}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyTsv}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition border border-slate-700"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy TSV (Excel)'}</span>
            </button>
            <button
              onClick={handleExportCsv}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-sky-600 hover:bg-sky-500 text-white transition shadow-lg shadow-sky-600/20"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              title="Print Cut Sheet"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab & Search Bar */}
        <div className="px-6 py-3 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('cutsheet')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === 'cutsheet'
                  ? 'bg-sky-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Wire Schedule ({project.wires.length})
            </button>
            <button
              onClick={() => setActiveTab('spools')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === 'spools'
                  ? 'bg-sky-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Spool Inventory Breakdown ({spoolSummary.length})
            </button>
          </div>

          {activeTab === 'cutsheet' && (
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Filter wires..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 focus:outline-none focus:border-sky-400"
              />
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-auto p-4 sm:p-6">
          {activeTab === 'cutsheet' ? (
            project.wires.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <FileSpreadsheet className="w-12 h-12 mx-auto stroke-1 mb-2 opacity-50" />
                <p className="text-sm">No cables drawn yet.</p>
                <p className="text-xs text-slate-600 mt-1">
                  Select the "Draw Cable" tool on canvas to lay out wire paths and measure their lengths.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-800">
                <table className="w-full min-w-[700px] text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400 text-[11px] uppercase tracking-wider bg-slate-900/90 sticky top-0">
                      <th className="py-2.5 px-3">Wire ID</th>
                      <th className="py-2.5 px-3">Function / Signal</th>
                      <th className="py-2.5 px-3">Color</th>
                      <th className="py-2.5 px-3">Gauge</th>
                      <th className="py-2.5 px-3">From Term</th>
                      <th className="py-2.5 px-3">To Term</th>
                      <th className="py-2.5 px-3 text-right">Measured</th>
                      <th className="py-2.5 px-3 text-right">Slack</th>
                      <th className="py-2.5 px-3 text-right font-semibold text-emerald-400">Total Cut</th>
                      <th className="py-2.5 px-3">Sleeve</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-950/40">
                  {filteredWires.map((wire) => {
                    const rawPx = polylineLength(wire.points);
                    const measured = pixelsToReal(rawPx, ref);
                    const slack = wire.slackAllowance || 0;
                    const pct = wire.slackPercent || 0;
                    const cutLength = (measured + slack) * (1 + pct / 100);

                    const fromConn = project.connectors.find((c) => c.id === wire.fromConnectorId);
                    const toConn = project.connectors.find((c) => c.id === wire.toConnectorId);

                    return (
                      <tr key={wire.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-2 px-3 font-mono font-semibold text-sky-400">{wire.id}</td>
                        <td className="py-2 px-3 text-slate-200 font-medium">{wire.name}</td>
                        <td className="py-2 px-3">
                          <div className="flex items-center space-x-1.5">
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-white/30 shrink-0 shadow-sm"
                              style={{
                                background: wire.color.stripe
                                  ? `repeating-linear-gradient(45deg, ${wire.color.primary}, ${wire.color.primary} 3px, ${wire.color.stripe} 3px, ${wire.color.stripe} 6px)`
                                  : wire.color.primary,
                              }}
                            />
                            <span className="text-slate-300 truncate max-w-[120px]">{wire.color.name}</span>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-slate-300 font-mono">{wire.gauge}</td>
                        <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">
                          {fromConn ? `${fromConn.name}:${wire.fromPin || '-'}` : '-'}
                        </td>
                        <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">
                          {toConn ? `${toConn.name}:${wire.toPin || '-'}` : '-'}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-400">
                          {formatMeasurement(measured, ref.unit)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-amber-400/80">
                          +{formatMeasurement(slack, ref.unit)}{pct > 0 ? ` (${pct}%)` : ''}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400">
                          {formatMeasurement(cutLength, ref.unit)}
                        </td>
                        <td className="py-2 px-3 text-slate-400 text-[11px]">{wire.sleeving || 'None'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
          ) : (
            /* Spool Summary View */
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {spoolSummary.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <span
                          className="w-5 h-5 rounded-full border border-white/40 shadow-sm shrink-0"
                          style={{
                            background: item.stripeColor
                              ? `repeating-linear-gradient(45deg, ${item.primaryColor}, ${item.primaryColor} 4px, ${item.stripeColor} 4px, ${item.stripeColor} 8px)`
                              : item.primaryColor,
                          }}
                        />
                        <div>
                          <h4 className="font-semibold text-slate-200 text-sm">{item.gauge}</h4>
                          <span className="text-[11px] text-slate-400 block">{item.colorName}</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[11px] font-mono text-slate-300">
                        {item.wireCount} {item.wireCount === 1 ? 'wire' : 'wires'}
                      </span>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-baseline justify-between">
                      <span className="text-xs text-slate-400">Total Required:</span>
                      <span className="font-mono text-base font-bold text-emerald-400">
                        {formatMeasurement(item.totalCutLength, ref.unit)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

