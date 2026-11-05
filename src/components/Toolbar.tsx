import React from 'react';
import { ToolMode } from '../types/harness';
import {
  MousePointer,
  Ruler,
  Cable,
  ArrowRightLeft,
  Cpu,
  Hand,
  Check,
  Undo2,
  Redo2,
  Maximize2,
} from 'lucide-react';

interface ToolbarProps {
  currentMode: ToolMode;
  onSelectMode: (mode: ToolMode) => void;
  isDrawingWire: boolean;
  drawingWirePointsCount: number;
  onFinishWire: () => void;
  onCancelDrawing: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onFitToScreen: () => void;
  isCalibrated: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  currentMode,
  onSelectMode,
  isDrawingWire,
  drawingWirePointsCount,
  onFinishWire,
  onCancelDrawing,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onFitToScreen,
  isCalibrated,
}) => {
  const tools = [
    {
      id: 'select' as ToolMode,
      name: 'Select / Edit (V)',
      icon: MousePointer,
      description: 'Select wires, drag bend vertices, edit properties',
    },
    {
      id: 'calibrate' as ToolMode,
      name: 'Calibrate Scale (C)',
      icon: Ruler,
      highlight: !isCalibrated,
      description: 'Set reference scale line for accurate real-world measurements',
    },
    {
      id: 'draw_wire' as ToolMode,
      name: 'Draw Cable Path (W)',
      icon: Cable,
      description: 'Draw multi-point cable route with live length measurements',
    },
    {
      id: 'dimension' as ToolMode,
      name: 'Quick Dimension (D)',
      icon: ArrowRightLeft,
      description: 'Measure clearance or distance between two points',
    },
    {
      id: 'add_connector' as ToolMode,
      name: 'Add Connector (N)',
      icon: Cpu,
      description: 'Place connector terminals and harness breakouts',
    },
    {
      id: 'pan' as ToolMode,
      name: 'Pan Canvas (H)',
      icon: Hand,
      description: 'Pan across the harness plan (or drag with spacebar)',
    },
  ];

  return (
    <div className="absolute top-4 left-4 z-20 flex flex-col space-y-2 pointer-events-auto">
      {/* Primary Tool Buttons */}
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-1.5 shadow-xl flex flex-col space-y-1">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isActive = currentMode === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => onSelectMode(tool.id)}
              title={`${tool.name} - ${tool.description}`}
              className={`p-2.5 rounded-lg transition relative flex items-center justify-center group ${
                isActive
                  ? 'bg-sky-500 text-slate-950 font-bold shadow-md shadow-sky-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              } ${tool.highlight && !isActive ? 'ring-2 ring-amber-400 animate-pulse' : ''}`}
            >
              <Icon className="w-5 h-5" />
              {/* Tooltip */}
              <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 text-slate-100 text-xs rounded-md shadow-xl border border-slate-700 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition z-30">
                <span className="font-semibold block">{tool.name}</span>
                <span className="text-[10px] text-slate-400">{tool.description}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Undo / Redo / Fit */}
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-1 shadow-xl flex flex-col space-y-1">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <Redo2 className="w-4 h-4" />
        </button>
        <button
          onClick={onFitToScreen}
          title="Fit View to Screen"
          className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* When actively drawing a wire */}
      {isDrawingWire && (
        <div className="bg-sky-950/90 border border-sky-500/50 rounded-xl p-3 shadow-2xl backdrop-blur-md animate-in slide-in-from-left duration-150 w-52">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-sky-300 flex items-center space-x-1.5">
              <Cable className="w-3.5 h-3.5" />
              <span>Routing Wire</span>
            </span>
            <span className="text-[10px] bg-sky-900/60 px-1.5 py-0.5 rounded text-sky-200 font-mono">
              {drawingWirePointsCount} pts
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-snug mb-2.5">
            Click to place bends. Double-click or press Enter to finish.
          </p>
          <div className="flex space-x-1.5">
            <button
              onClick={onFinishWire}
              disabled={drawingWirePointsCount < 2}
              className="flex-1 flex items-center justify-center space-x-1 py-1.5 px-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-emerald-500/20"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Finish</span>
            </button>
            <button
              onClick={onCancelDrawing}
              className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

