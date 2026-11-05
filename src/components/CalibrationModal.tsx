import React, { useState } from 'react';
import { Ruler, Check, X, Info } from 'lucide-react';
import { Unit } from '../types/harness';

interface CalibrationModalProps {
  isOpen: boolean;
  pixelDistance: number;
  initialDistance: number;
  initialUnit: Unit;
  onSave: (distance: number, unit: Unit) => void;
  onCancel: () => void;
}

export const CalibrationModal: React.FC<CalibrationModalProps> = ({
  isOpen,
  pixelDistance,
  initialDistance,
  initialUnit,
  onSave,
  onCancel,
}) => {
  const [distInput, setDistInput] = useState<string>(
    initialDistance > 0 ? initialDistance.toString() : '100'
  );
  const [unit, setUnit] = useState<Unit>(initialUnit || 'mm');

  if (!isOpen) return null;

  const numericDist = parseFloat(distInput) || 0;
  const pixelsPerUnit = numericDist > 0 ? pixelDistance / numericDist : 0;
  const unitsPerPixel = numericDist > 0 ? numericDist / pixelDistance : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numericDist > 0) {
      onSave(numericDist, unit);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center space-x-2.5 text-amber-400">
            <Ruler className="w-5 h-5" />
            <h3 className="font-semibold text-slate-100 text-lg">Calibrate Reference Scale</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-200 flex items-start space-x-2.5">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <div>
              You marked a reference distance of{' '}
              <span className="font-mono font-semibold text-amber-300">
                {pixelDistance.toFixed(1)} pixels
              </span>{' '}
              on the photo. Enter the known physical length between those two points.
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Real-World Distance</label>
            <div className="flex space-x-2">
              <input
                type="number"
                step="any"
                min="0.001"
                required
                autoFocus
                value={distInput}
                onChange={(e) => setDistInput(e.target.value)}
                placeholder="e.g. 150"
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-slate-100 font-mono text-sm focus:outline-none focus:border-amber-400"
              />
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as Unit)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-medium text-sm focus:outline-none focus:border-amber-400"
              >
                <option value="mm">mm (Millimeters)</option>
                <option value="cm">cm (Centimeters)</option>
                <option value="m">m (Meters)</option>
                <option value="in">in (Inches)</option>
                <option value="ft">ft (Feet)</option>
              </select>
            </div>
          </div>

          {numericDist > 0 && (
            <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400 block">Scale Resolution</span>
                <span className="font-mono font-medium text-slate-200">
                  {pixelsPerUnit.toFixed(2)} px/{unit}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Pixel Factor</span>
                <span className="font-mono font-medium text-slate-200">
                  1 px = {unitsPerPixel.toFixed(4)} {unit}
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2.5 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={numericDist <= 0}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-amber-500 hover:bg-amber-400 text-slate-950 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg shadow-amber-500/20"
            >
              <Check className="w-4 h-4" />
              <span>Apply Scale</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

