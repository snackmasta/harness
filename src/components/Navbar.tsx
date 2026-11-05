import React, { useRef, useState } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Ruler,
  FileSpreadsheet,
  Download,
  FolderOpen,
  Save,
  FileDown,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { Unit, ReferenceLine, HarnessProject } from '../types/harness';
import { SAMPLE_PROJECTS, SampleImage } from '../utils/sampleImages';
import { downloadFile } from '../utils/export';

interface NavbarProps {
  project: HarnessProject;
  onUpdateProjectName: (name: string) => void;
  onUnitChange: (unit: Unit) => void;
  onUploadImage: (file: File) => void;
  onSelectSample: (sample: SampleImage) => void;
  onOpenCalibration: () => void;
  onOpenCutSheet: () => void;
  onExportPng: () => void;
  onExportCsv: () => void;
  onLoadProjectJson: (loaded: HarnessProject) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  project,
  onUpdateProjectName,
  onUnitChange,
  onUploadImage,
  onSelectSample,
  onOpenCalibration,
  onOpenCutSheet,
  onExportPng,
  onExportCsv,
  onLoadProjectJson,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showSamplesMenu, setShowSamplesMenu] = useState(false);

  const ref = project.referenceLine;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUploadImage(e.target.files[0]);
    }
  };

  const handleJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed && parsed.wires && parsed.referenceLine) {
            onLoadProjectJson(parsed);
          } else {
            alert('Invalid harness project file.');
          }
        } catch (err) {
          alert('Failed to parse project JSON.');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSaveJson = () => {
    const jsonStr = JSON.stringify(project, null, 2);
    downloadFile(
      jsonStr,
      `${project.name.toLowerCase().replace(/\s+/g, '_')}_project.harness.json`,
      'application/json'
    );
  };

  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between z-30 select-none">
      {/* Brand & Project Name */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <svg
              className="w-5 h-5 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 20h16" />
              <path d="M4 14h16" />
              <path d="M4 8h16" />
              <circle cx="8" cy="8" r="2" fill="#ef4444" stroke="none" />
              <circle cx="16" cy="14" r="2" fill="#10b981" stroke="none" />
              <circle cx="12" cy="20" r="2" fill="#f59e0b" stroke="none" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white flex items-center space-x-1.5">
              <span>HarnessScale</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 bg-sky-500/10 text-sky-400 border border-sky-500/30 rounded">
                CAD Plan
              </span>
            </h1>
          </div>
        </div>

        <div className="h-5 w-[1px] bg-slate-800" />

        {/* Project Name editable */}
        <input
          type="text"
          value={project.name}
          onChange={(e) => onUpdateProjectName(e.target.value)}
          className="bg-transparent hover:bg-slate-800/60 focus:bg-slate-950 border border-transparent focus:border-slate-700 rounded-md px-2 py-1 text-xs font-semibold text-slate-200 focus:outline-none transition w-44"
          placeholder="Harness Project Name"
        />
      </div>

      {/* Middle: Calibration Status Pill & Unit Selector */}
      <div className="flex items-center space-x-3">
        {/* Scale Status Indicator Pill */}
        <button
          onClick={onOpenCalibration}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium transition border ${
            ref.calibrated
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
              : 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25 animate-pulse'
          }`}
          title="Click to recalibrate reference line scale"
        >
          <Ruler className="w-3.5 h-3.5" />
          <span>
            {ref.calibrated
              ? `Scale: ${ref.realDistance} ${ref.unit} calibrated`
              : 'Scale Uncalibrated - Set Reference'}
          </span>
        </button>

        {/* Unit Selector */}
        <div className="flex items-center space-x-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs">
          {(['mm', 'cm', 'm', 'in', 'ft'] as Unit[]).map((u) => (
            <button
              key={u}
              onClick={() => onUnitChange(u)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition ${
                ref.unit === u
                  ? 'bg-sky-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      {/* Right: Upload Photo, Samples, Cut Sheet, Export */}
      <div className="flex items-center space-x-2">
        {/* Hidden inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.svg"
          onChange={handleFileChange}
          className="hidden"
        />
        <input
          ref={jsonInputRef}
          type="file"
          accept=".json"
          onChange={handleJsonUpload}
          className="hidden"
        />

        {/* Upload Photo Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
        >
          <Upload className="w-3.5 h-3.5 text-sky-400" />
          <span>Upload Photo</span>
        </button>

        {/* Sample Templates Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowSamplesMenu(!showSamplesMenu)}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          >
            <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
            <span>Templates</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showSamplesMenu && (
            <div
              className="absolute right-0 mt-1.5 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 z-50 text-xs animate-in fade-in zoom-in-95"
              onMouseLeave={() => setShowSamplesMenu(false)}
            >
              <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Sample Formboard &amp; Blueprints
              </div>
              {SAMPLE_PROJECTS.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => {
                    onSelectSample(sample);
                    setShowSamplesMenu(false);
                  }}
                  className="w-full text-left p-2 rounded-lg hover:bg-slate-800 transition flex flex-col group"
                >
                  <span className="font-semibold text-slate-200 group-hover:text-sky-300">
                    {sample.name}
                  </span>
                  <span className="text-[10px] text-slate-400 line-clamp-1">
                    {sample.description}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cut Sheet / BOM Modal Button */}
        <button
          onClick={onOpenCutSheet}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-lg shadow-emerald-600/20"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Cut Sheet</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full bg-emerald-950/60 text-emerald-200 text-[10px] font-mono">
            {project.wires.length}
          </span>
        </button>

        {/* Export / Save Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-sky-600 hover:bg-sky-500 text-white transition shadow-lg shadow-sky-600/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
            <ChevronDown className="w-3 h-3 text-sky-200" />
          </button>

          {showExportMenu && (
            <div
              className="absolute right-0 mt-1.5 w-52 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 z-50 text-xs animate-in fade-in zoom-in-95 space-y-1"
              onMouseLeave={() => setShowExportMenu(false)}
            >
              <button
                onClick={() => {
                  onExportPng();
                  setShowExportMenu(false);
                }}
                className="w-full flex items-center space-x-2 px-2.5 py-2 rounded-lg hover:bg-slate-800 text-slate-200 transition text-left"
              >
                <FileDown className="w-4 h-4 text-sky-400" />
                <div>
                  <span className="font-medium block">Export Image (PNG)</span>
                  <span className="text-[10px] text-slate-400">High-res plan with title block</span>
                </div>
              </button>

              <button
                onClick={() => {
                  onExportCsv();
                  setShowExportMenu(false);
                }}
                className="w-full flex items-center space-x-2 px-2.5 py-2 rounded-lg hover:bg-slate-800 text-slate-200 transition text-left"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="font-medium block">Export BOM (CSV)</span>
                  <span className="text-[10px] text-slate-400">Cut lengths, gauges, colors</span>
                </div>
              </button>

              <div className="h-[1px] bg-slate-800 my-1" />

              <button
                onClick={() => {
                  handleSaveJson();
                  setShowExportMenu(false);
                }}
                className="w-full flex items-center space-x-2 px-2.5 py-2 rounded-lg hover:bg-slate-800 text-slate-200 transition text-left"
              >
                <Save className="w-4 h-4 text-indigo-400" />
                <div>
                  <span className="font-medium block">Save Project (.json)</span>
                  <span className="text-[10px] text-slate-400">Complete project backup</span>
                </div>
              </button>

              <button
                onClick={() => {
                  jsonInputRef.current?.click();
                  setShowExportMenu(false);
                }}
                className="w-full flex items-center space-x-2 px-2.5 py-2 rounded-lg hover:bg-slate-800 text-slate-200 transition text-left"
              >
                <FolderOpen className="w-4 h-4 text-amber-400" />
                <div>
                  <span className="font-medium block">Load Project (.json)</span>
                  <span className="text-[10px] text-slate-400">Open saved harness project</span>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

