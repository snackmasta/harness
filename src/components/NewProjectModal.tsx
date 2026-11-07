import React, { useState, useRef } from 'react';
import {
  FilePlus,
  Upload,
  Grid,
  Sparkles,
  X,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { Unit } from '../types/harness';
import { SAMPLE_PROJECTS } from '../utils/sampleImages';

interface NewProjectModalProps {
  isOpen: boolean;
  hasUnsavedChanges: boolean;
  onClose: () => void;
  onCreateBlank: (name: string, unit: Unit, width: number, height: number) => void;
  onCreateFromPhoto: (name: string, unit: Unit, file: File) => void;
  onCreateFromTemplate: (templateId: string) => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  hasUnsavedChanges,
  onClose,
  onCreateBlank,
  onCreateFromPhoto,
  onCreateFromTemplate,
}) => {
  const [projectName, setProjectName] = useState('New Harness Project');
  const [unit, setUnit] = useState<Unit>('mm');
  const [activeTab, setActiveTab] = useState<'photo' | 'blank' | 'template'>('photo');

  // Photo tab state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Blank board state
  const [canvasWidth, setCanvasWidth] = useState(1600);
  const [canvasHeight, setCanvasHeight] = useState(1000);

  // Template state
  const [selectedTemplateId, setSelectedTemplateId] = useState(SAMPLE_PROJECTS[0].id);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      // Auto-set name from filename
      setProjectName(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleCreate = () => {
    if (activeTab === 'photo' && selectedFile) {
      onCreateFromPhoto(projectName || 'Untitled Harness', unit, selectedFile);
      onClose();
    } else if (activeTab === 'blank') {
      onCreateBlank(projectName || 'Untitled Harness', unit, canvasWidth, canvasHeight);
      onClose();
    } else if (activeTab === 'template') {
      onCreateFromTemplate(selectedTemplateId);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
              <FilePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base">Create New Harness Plan</h3>
              <p className="text-xs text-slate-400">Start from a photo, a blank formboard, or a sample</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning if current project will be replaced */}
        {hasUnsavedChanges && (
          <div className="mx-6 mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-center space-x-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>
              Creating a new file will reset the current workspace. Ensure you have exported or saved your current project if needed.
            </span>
          </div>
        )}

        <div className="p-6 space-y-5">
          {/* Project Name & Unit */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Project / Harness Name</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g. Engine Bay Wiring Harness"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-slate-100 text-xs font-medium focus:outline-none focus:border-sky-400"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Default Unit</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as Unit)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs font-medium focus:outline-none focus:border-sky-400"
              >
                <option value="mm">mm (Millimeters)</option>
                <option value="cm">cm (Centimeters)</option>
                <option value="m">m (Meters)</option>
                <option value="in">in (Inches)</option>
                <option value="ft">ft (Feet)</option>
              </select>
            </div>
          </div>

          {/* Source Tabs */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-300 block">Workspace Starting Point</label>
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('photo')}
                className={`py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center space-x-1.5 transition ${
                  activeTab === 'photo'
                    ? 'bg-sky-500 text-slate-950 font-bold shadow-md shadow-sky-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Photo</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('blank')}
                className={`py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center space-x-1.5 transition ${
                  activeTab === 'blank'
                    ? 'bg-sky-500 text-slate-950 font-bold shadow-md shadow-sky-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Blank Board</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('template')}
                className={`py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center space-x-1.5 transition ${
                  activeTab === 'template'
                    ? 'bg-sky-500 text-slate-950 font-bold shadow-md shadow-sky-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Sample Boards</span>
              </button>
            </div>
          </div>

          {/* TAB 1: Photo Upload */}
          {activeTab === 'photo' && (
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.svg"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
                  selectedFile
                    ? 'border-sky-500 bg-sky-950/20'
                    : 'border-slate-700 hover:border-slate-500 bg-slate-950/50'
                }`}
              >
                <Upload className="w-8 h-8 text-sky-400 mx-auto mb-2" />
                {selectedFile ? (
                  <div>
                    <span className="font-semibold text-slate-100 text-xs block">{selectedFile.name}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      {(selectedFile.size / 1024).toFixed(0)} KB &bull; Click to change photo
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="font-medium text-slate-300 text-xs block">
                      Click to browse or drop photo here
                    </span>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Supports JPG, PNG, WEBP, SVG &bull; Formboards, chassis, nailboards
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Blank Formboard */}
          {activeTab === 'blank' && (
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="text-xs text-slate-400">
                Create a clean digital formboard with a millimeter CAD grid. You can calibrate scale directly.
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[11px] text-slate-400">Canvas Width (pixels)</span>
                  <input
                    type="number"
                    value={canvasWidth}
                    onChange={(e) => setCanvasWidth(parseInt(e.target.value) || 1200)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-sky-400"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] text-slate-400">Canvas Height (pixels)</span>
                  <input
                    type="number"
                    value={canvasHeight}
                    onChange={(e) => setCanvasHeight(parseInt(e.target.value) || 800)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-sky-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Sample Templates */}
          {activeTab === 'template' && (
            <div className="space-y-2">
              {SAMPLE_PROJECTS.map((sample) => (
                <div
                  key={sample.id}
                  onClick={() => setSelectedTemplateId(sample.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                    selectedTemplateId === sample.id
                      ? 'border-sky-500 bg-sky-950/30'
                      : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <h4 className="font-semibold text-slate-200 text-xs">{sample.name}</h4>
                    <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{sample.description}</p>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      selectedTemplateId === sample.id ? 'border-sky-400 bg-sky-400' : 'border-slate-700'
                    }`}
                  >
                    {selectedTemplateId === sample.id && <Check className="w-3 h-3 text-slate-950 stroke-[3]" />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end space-x-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={activeTab === 'photo' && !selectedFile}
            onClick={handleCreate}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-sky-500 hover:bg-sky-400 text-slate-950 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-sky-500/20"
          >
            <Check className="w-4 h-4" />
            <span>Create Plan</span>
          </button>
        </div>
      </div>
    </div>
  );
};

