import React, { useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Sliders,
  Eye,
  EyeOff,
  Hash,
  Ruler,
  SunMedium,
  RotateCcw,
} from 'lucide-react';

interface ViewControlsProps {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  bgOpacity: number;
  setBgOpacity: (val: number) => void;
  bgInvert: boolean;
  setBgInvert: (val: boolean) => void;
  showLabels: boolean;
  setShowLabels: (val: boolean) => void;
  showGrid: boolean;
  setShowGrid: (val: boolean) => void;
  showPhoto: boolean;
  setShowPhoto: (val: boolean) => void;
}

export const ViewControls: React.FC<ViewControlsProps> = ({
  scale,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  bgOpacity,
  setBgOpacity,
  bgInvert,
  setBgInvert,
  showLabels,
  setShowLabels,
  showGrid,
  setShowGrid,
  showPhoto,
  setShowPhoto,
}) => {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="absolute bottom-4 right-4 z-20 flex flex-col items-end space-y-2 pointer-events-auto">
      {/* Expanded Adjustments Panel */}
      {showSettings && (
        <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl p-3.5 shadow-2xl w-64 text-xs space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="font-semibold text-slate-200">Display Adjustments</span>
            <button
              onClick={() => {
                setBgOpacity(1);
                setBgInvert(false);
              }}
              className="text-[10px] text-slate-400 hover:text-sky-400 flex items-center space-x-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          {/* Photo Opacity */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Photo Opacity</span>
              <span className="font-mono text-slate-200">{Math.round(bgOpacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="1"
              step="0.05"
              value={bgOpacity}
              onChange={(e) => setBgOpacity(parseFloat(e.target.value))}
              className="w-full accent-sky-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Invert Blueprint / Photo */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-300 flex items-center space-x-1.5">
              <SunMedium className="w-3.5 h-3.5 text-amber-400" />
              <span>Invert Photo (Blueprint)</span>
            </span>
            <input
              type="checkbox"
              checked={bgInvert}
              onChange={(e) => setBgInvert(e.target.checked)}
              className="accent-sky-500 rounded cursor-pointer w-4 h-4"
            />
          </div>

          {/* Toggle Labels */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-300 flex items-center space-x-1.5">
              <Ruler className="w-3.5 h-3.5 text-sky-400" />
              <span>Show Wire Length Labels</span>
            </span>
            <input
              type="checkbox"
              checked={showLabels}
              onChange={(e) => setShowLabels(e.target.checked)}
              className="accent-sky-500 rounded cursor-pointer w-4 h-4"
            />
          </div>

          {/* Toggle CAD Grid */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-300 flex items-center space-x-1.5">
              <Hash className="w-3.5 h-3.5 text-slate-400" />
              <span>Background Canvas Grid</span>
            </span>
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(e) => setShowGrid(e.target.checked)}
              className="accent-sky-500 rounded cursor-pointer w-4 h-4"
            />
          </div>
        </div>
      )}

      {/* Floating View Control Pill */}
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-1 shadow-xl flex items-center space-x-1">
        <button
          onClick={() => setShowPhoto(!showPhoto)}
          title={showPhoto ? 'Hide Background Photo' : 'Show Background Photo'}
          className={`p-2 rounded-lg transition ${
            showPhoto ? 'text-slate-300 hover:text-white hover:bg-slate-800' : 'text-amber-400 bg-amber-500/10'
          }`}
        >
          {showPhoto ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>

        <button
          onClick={() => setShowSettings(!showSettings)}
          title="Display Adjustments"
          className={`p-2 rounded-lg transition ${
            showSettings ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-slate-800" />

        <button
          onClick={onZoomOut}
          title="Zoom Out"
          className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <button
          onClick={onResetZoom}
          title="Reset Zoom to 100%"
          className="px-2 py-1 text-xs font-mono font-semibold text-slate-200 hover:bg-slate-800 rounded transition"
        >
          {Math.round(scale * 100)}%
        </button>

        <button
          onClick={onZoomIn}
          title="Zoom In"
          className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

